import { ROLE } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth/session";

// Type for authenticated user returned from session
type AuthUser = Awaited<ReturnType<typeof getAuthenticatedUser>>;

export function isWorksManagerRole(role: ROLE): boolean {
  return ["MLA", "MLA_PA", "MLA_SECRETARY", "ADMIN", "CAMP_HEAD"].includes(
    role,
  );
}

export function isBudgetApproverRole(role: ROLE): boolean {
  return ["MLA", "MLA_PA", "MLA_SECRETARY", "ADMIN", "CAMP_HEAD"].includes(
    role,
  );
}

export async function requireWorksManagerUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again to continue." } as const;
  }

  if (!isWorksManagerRole(user.role)) {
    return {
      ok: false,
      error: "You are not authorized for this section.",
    } as const;
  }

  return { ok: true, user } as const;
}

export async function requireWorksBudgetApprover() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, error: "Please login again." } as const;
  }

  if (!isBudgetApproverRole(user.role)) {
    return {
      ok: false,
      error: "Only authorized roles can approve budgets.",
    } as const;
  }

  return { ok: true, user } as const;
}

export function checkWorkAccess(
  work: {
    created_by_user_id: string;
    created_by_user?: { role: string } | null;
  },
  user: AuthUser,
): boolean {
  if (!user) {
    return false;
  }

  // MLA: Can access own works
  // if (user.role === "MLA") {
  //   return work.created_by_user_id === user.id;
  // }

  // // MLA_PA/MLA_SECRETARY: Can access their MLA's works
  // if (["MLA_PA", "MLA_SECRETARY"].includes(user.role)) {
  //   return work.created_by_user?.role === "MLA";
  // }

  // ADMIN: Full access
  if (["MLA_PA", "MLA_SECRETARY", "ADMIN", "MLA"].includes(user.role)) {
    return true;
  }

  return false;
}

export function checkTaskAccess(
  task: {
    officer_id: number | null;
  },
  user: AuthUser,
): boolean {
  if (!user) {
    return false;
  }

  // Tasks are accessed through work ownership
  // For now, allow ADMIN access
  // Officer-specific access requires different comparison with officer table
  if (["MLA_PA", "MLA_SECRETARY", "ADMIN", "MLA"].includes(user.role)) {
    return true;
  }

  // Other roles require specific implementation
  return false;
}
