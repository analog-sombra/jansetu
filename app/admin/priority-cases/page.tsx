import { redirect } from "next/navigation";
import { getAdminPriorityCasesAction } from "@/actions/admin";
import { getAuthenticatedUser } from "@/lib/auth/session";
import PriorityCasesClient from "./priority_cases_client";

function isAdminRouteRole(role: string) {
  return role === "ADMIN" || role === "MLA" || role === "MLA_SECRETARY";
}

export default async function AdminPriorityCasesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminRouteRole(user.role)) {
    redirect("/user");
  }

  const result = await getAdminPriorityCasesAction();

  return (
    <PriorityCasesClient
      initialCases={result.ok ? result.cases : []}
      initialError={result.ok ? "" : result.error}
    />
  );
}
