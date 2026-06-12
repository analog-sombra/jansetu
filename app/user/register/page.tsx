import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import RegisterForm from "./register_form";

export default async function RegisterPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.firstLoginComplete) {
    redirect("/user");
  }

  return <RegisterForm />;
}
