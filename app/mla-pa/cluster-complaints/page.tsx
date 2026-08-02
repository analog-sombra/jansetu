import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import MlaPaClusterComplaintsClient from "./cluster-complaints-client";

function isMlaRouteRole(role: string) {
  return role === "CAMP_HEAD";
}

export default async function MlaPaClusterComplaintsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!isMlaRouteRole(user.role)) {
    redirect("/user");
  }

  return <MlaPaClusterComplaintsClient userRole={user.role} />;
}
