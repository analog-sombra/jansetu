import { UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

const JWT_SECRET = process.env.JWT_SECRET ?? "local-dev-secret-change-me";
const EXPIRES_IN = "7d";

type SessionPayload = {
  userId: string;
  role: UserRole;
  mobile: string;
  name?: string | null;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function requireCitizen() {
  const session = await getSession();
  if (!session || session.role !== UserRole.CITIZEN) {
    return null;
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== UserRole.ADMIN) {
    return null;
  }
  return session;
}

export async function requireReport() {
  const session = await getSession();
  if (!session || session.role !== UserRole.REPORT) {
    return null;
  }
  return session;
}

function parseBooleanEnv(value: string | undefined) {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return undefined;
}

export function resolveCookieSecure(request?: Request) {
  // const override = parseBooleanEnv(process.env.AUTH_COOKIE_SECURE);
  // if (override !== undefined) {
  //   return override;
  // }

  // if (process.env.NODE_ENV !== "production") {
  //   return false;
  // }

  // const forwardedProto = request?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  // if (forwardedProto) {
  //   return forwardedProto === "https";
  // }

  // if (request) {
  //   return new URL(request.url).protocol === "https:";
  // }

  return false;
}

export function setSessionCookie(response: NextResponse, token: string, request?: Request) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: resolveCookieSecure(request),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse, request?: Request) {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: resolveCookieSecure(request),
    path: "/",
    maxAge: 0,
  });
}
