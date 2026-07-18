import { ROLE } from "@prisma/client";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const AUTH_USER_ID_COOKIE = "sevamesirsa_user_id";
export const AUTH_USER_ROLE_COOKIE = "sevamesirsa_user_role";

type AuthSession = {
  userId: string;
  role: ROLE;
};

const USER_ROLES = new Set<ROLE>(Object.values(ROLE));

function parseRole(role: string | undefined): ROLE | null {
  if (!role) {
    return null;
  }

  return USER_ROLES.has(role as ROLE) ? (role as ROLE) : null;
}

export async function setAuthSession(userId: string, role: ROLE) {
  const cookieStore = await cookies();
  // const secure = process.env.NODE_ENV === "production";
  const secure = false;

  cookieStore.set(AUTH_USER_ID_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set(AUTH_USER_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_USER_ID_COOKIE);
  cookieStore.delete(AUTH_USER_ROLE_COOKIE);
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(AUTH_USER_ID_COOKIE)?.value;
  const role = parseRole(cookieStore.get(AUTH_USER_ROLE_COOKIE)?.value);

  if (!userId || !role) {
    return null;
  }

  return { userId, role };
}

export async function getAuthenticatedUser() {
  const session = await getAuthSession();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      mobile: true,
      name: true,
      address: true,
      aadhaar: true,
      voterId: true,
      role: true,
      firstLoginComplete: true,
    },
  });
}
