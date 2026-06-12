import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import UserProfileForm from "./profile_form";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.firstLoginComplete) {
    redirect("/user/register");
  }

  return (
    <UserProfileForm
      profile={{
        name: user.name ?? "",
        address: user.address ?? "",
        aadhaar: user.aadhaar ?? "",
        voterId: user.voterId ?? "",
        mobile: user.mobile,
      }}
    />
  );
}
