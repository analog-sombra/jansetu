import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import LoginForm from "./login_form";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    if (user.role === "CAMP_DEO" || user.role === "CAMP_FIELD_OFFICER") {
      redirect("/camp");
    }

    if (
      user.role === "ADMIN" ||
      user.role === "MLA_SECRETARY" ||
      user.role === "SYSTEM"
    ) {
      redirect("/admin");
    }
    if (user.role === "MLA") {
      redirect("/mla");
    }
    redirect(user.firstLoginComplete ? "/user" : "/user/register");
  }

  return <LoginForm />;
}
