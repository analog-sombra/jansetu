import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCampComplaintsDashboardAction } from "@/actions/camp";
import CampComplaintsClient from "./camp_complaints_client";

export default async function CampComplaintsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CAMP_DEO" && user.role !== "CAMP_FIELD_OFFICER") {
    redirect("/user");
  }

  const result = await getCampComplaintsDashboardAction();

  return (
    <CampComplaintsClient
      initialComplaints={result.ok ? result.complaints : []}
      initialError={result.ok ? "" : result.error}
    />
  );
}
