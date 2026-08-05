import { redirect } from "next/navigation";
import { getAdminComplaintsDashboardAction } from "@/actions/admin";
import { getAuthenticatedUser } from "@/lib/auth/session";
import AdminComplaintsClient from "./admin_complaints_client";

function isAdminRouteRole(role: string) {
  return (
    role === "ADMIN" ||
    role === "MLA" ||
    role === "MLA_SECRETARY" ||
    role === "MLA_PA" ||
    role === "CAMP_HEAD"
  );
}

export default async function AdminComplaintListPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminRouteRole(user.role)) {
    redirect("/user");
  }

  const result = await getAdminComplaintsDashboardAction();

  return (
    <AdminComplaintsClient
      initialComplaints={result.ok ? result.complaints : []}
      initialError={result.ok ? "" : result.error}
    />
  );
}
