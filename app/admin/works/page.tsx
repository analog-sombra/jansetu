import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getWorksListingAction } from "@/actions/mla/works";
import WorksListingClient from "./works_listing_client";

export default async function WorksListingPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const allowedRoles = ["MLA", "MLA_PA", "MLA_SECRETARY", "ADMIN", "CAMP_HEAD"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/user");
  }

  const result = await getWorksListingAction({
    page: 1,
    limit: 20,
  });

  return (
    <WorksListingClient
      initialWorks={result.ok ? result.data.items : []}
      initialTotal={result.ok ? result.data.total : 0}
      initialError={result.ok ? "" : result.error}
    />
  );
}
