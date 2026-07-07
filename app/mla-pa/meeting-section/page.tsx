import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import MlaPaMeetingSectionClient from "./meeting_section_client";

function isMlaRouteRole(role: string) {
  return role === "MLA_PA" || role === "CAMP_HEAD";
}

export default async function MlaPaMeetingSectionPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!isMlaRouteRole(user.role)) {
    redirect("/user");
  }

  return <MlaPaMeetingSectionClient userRole={user.role} />;
}
