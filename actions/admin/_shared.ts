import { getAuthenticatedUser } from "@/lib/auth/session";

export function isAdminRole(role: string): boolean {
  return role === "ADMIN" || role === "MLA" || role === "MLA_SECRETARY";
}

export async function requireAdminUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." } as const;
  }

  if (!isAdminRole(user.role)) {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    } as const;
  }

  return { ok: true, user } as const;
}
