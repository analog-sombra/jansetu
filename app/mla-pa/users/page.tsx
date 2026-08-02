import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCampUsersAction } from "@/actions/camp";
import CampUsersClient from "./camp_users_client";

export default async function CampUsersPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CAMP_HEAD") {
    redirect("/user");
  }

  const result = await getCampUsersAction();

  return (
    <CampUsersClient
      initialUsers={result.ok ? result.users : []}
      initialError={result.ok ? "" : result.error}
    />
  );
}
