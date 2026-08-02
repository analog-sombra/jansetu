import { redirect } from "next/navigation";
import { getAdminComplaintsDashboardAction } from "@/actions/admin";
import { getAuthenticatedUser } from "@/lib/auth/session";
import AdminComplaintsClient from "./admin_complaints_client";

function isMlaRouteRole(role: string) {
  return role === "CAMP_HEAD";
}

export default async function AdminComplaintListPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!isMlaRouteRole(user.role)) {
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
