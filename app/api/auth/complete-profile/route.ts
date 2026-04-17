import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { getSession, signSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeProfileSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = completeProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile fields" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: sanitizeHtml(parsed.data.name),
      address: sanitizeHtml(parsed.data.address),
      aadhaar: parsed.data.aadhaar ? sanitizeHtml(parsed.data.aadhaar) : null,
      voterId: sanitizeHtml(parsed.data.voterId),
      firstLoginComplete: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "PROFILE_COMPLETED",
    },
  });

  const nextToken = signSession({
    userId: user.id,
    role: user.role,
    mobile: user.mobile,
    name: user.name,
  });

  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, nextToken);
  return response;
}
