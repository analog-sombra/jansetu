import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import CreateMlaPaMeetingClient from "./create_meeting_client";

function isMlaRouteRole(role: string) {
  return role === "MLA_PA" || role === "CAMP_HEAD";
}

export default async function MlaPaCreateMeetingPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!isMlaRouteRole(user.role)) {
    redirect("/user");
  }

  return <CreateMlaPaMeetingClient userRole={user.role} />;
}
