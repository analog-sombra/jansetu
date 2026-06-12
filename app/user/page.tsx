import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function UserPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.firstLoginComplete) {
    redirect("/user/register");
  }

  redirect("/user/complaint");
}
