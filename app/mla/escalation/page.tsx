import { redirect } from "next/navigation";
import { getAdminEscalationQueueAction } from "@/actions/admin";
import { getAuthenticatedUser } from "@/lib/auth/session";
import EscalationClient from "./escalation_client";

function isAdminRouteRole(role: string) {
  return (
    role === "ADMIN" ||
    role === "MLA" ||
    role === "MLA_SECRETARY" ||
    role === "MLA_PA" ||
    role === "CAMP_HEAD"
  );
}

export default async function AdminEscalationPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminRouteRole(user.role)) {
    redirect("/user");
  }

  const result = await getAdminEscalationQueueAction();

  return (
    <EscalationClient
      initialEscalations={result.ok ? result.escalations : []}
      initialError={result.ok ? "" : result.error}
    />
  );
}
