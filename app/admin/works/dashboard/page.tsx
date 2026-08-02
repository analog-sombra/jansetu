import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getWorksDashboardAction } from "@/actions/mla/works";
import WorksDashboardClient from "./works_dashboard_client";

export default async function WorksDashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const allowedRoles = ["MLA", "MLA_PA", "MLA_SECRETARY", "ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/user");
  }

  const result = await getWorksDashboardAction();

  return (
    <WorksDashboardClient
      dashboardData={result.ok ? result.data : null}
      error={result.ok ? "" : result.error}
    />
  );
}
