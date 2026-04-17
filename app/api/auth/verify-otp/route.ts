import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, signSession } from "@/lib/auth";
import { verifyOtpSchema } from "@/lib/validators";
import { verifyOtp } from "@/services/otp-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const otpCheck = await verifyOtp(parsed.data.mobile, parsed.data.otp);
  if (!otpCheck.ok) {
    return NextResponse.json({ error: otpCheck.reason }, { status: 401 });
  }

  let user = await prisma.user.findUnique({ where: { mobile: parsed.data.mobile } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        mobile: parsed.data.mobile,
        role: UserRole.CITIZEN,
      },
    });
  }

  const token = signSession({
    userId: user.id,
    role: user.role,
    mobile: user.mobile,
    name: user.name,
  });

  const response = NextResponse.json({
    ok: true,
    role: user.role,
    firstLoginComplete: user.firstLoginComplete,
  });

  setSessionCookie(response, token);
  return response;
}
