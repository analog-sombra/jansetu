import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getAdminTotalBudgetAction } from "@/actions/admin";
import MlaBudgetClient from "./budget_client";

export default async function MlaBudgetPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const allowedRoles = ["MLA", "MLA_PA", "MLA_SECRETARY", "ADMIN", "CAMP_HEAD"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/user");
  }

  const result = await getAdminTotalBudgetAction();

  return (
    <MlaBudgetClient
      initialBudgets={result.ok ? result.budgets : []}
      initialSummary={
        result.ok
          ? result.summary
          : {
              totalAllotted: 0,
              totalApproved: 0,
              totalUtilized: 0,
            }
      }
      initialError={result.ok ? "" : result.error}
    />
  );
}
