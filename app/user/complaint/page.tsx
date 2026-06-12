import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getMyComplaintsAction } from "@/actions/user/complaint";
import ComplaintDashboardClient from "./complaint_dashboard_client";

export default async function ComplaintPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.firstLoginComplete) {
    redirect("/user/register");
  }

  const result = await getMyComplaintsAction();

  return (
    <ComplaintDashboardClient
      initialComplaints={result.complaints}
      initialProfile={result.profile}
      initialError={result.ok ? "" : result.error}
    />
  );
}
