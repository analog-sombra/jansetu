import { UserRole } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth/session";

export function isMlaPaRouteRole(role: UserRole): boolean {
  return role === "MLA_PA" || role === "CAMP_HEAD";
}

export async function requireMlaPaRouteUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." } as const;
  }

  if (!isMlaPaRouteRole(user.role)) {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    } as const;
  }


  return { ok: true, user } as const;
}
