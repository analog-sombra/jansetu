import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import AddComplaintForm from "./add_complaint_form";

export default async function AddComplaintPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.firstLoginComplete) {
    redirect("/user/register");
  }

  return <AddComplaintForm />;
}
