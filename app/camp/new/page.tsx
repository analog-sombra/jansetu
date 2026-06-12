import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import CampNewComplaintForm from "./camp_new_complaint_form";

export default async function CampNewComplaintPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CAMP_DEO" && user.role !== "CAMP_FIELD_OFFICER") {
    redirect("/user");
  }

  return <CampNewComplaintForm />;
}
