import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import CreateWorkClient from "./create_work_client";

export default async function CreateWorkPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const allowedRoles = ["MLA", "MLA_PA", "MLA_SECRETARY", "ADMIN", "CAMP_HEAD"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/user");
  }

  const [departments, wards] = await Promise.all([
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.ward.findMany({
      select: { id: true, name: true, constituency: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <CreateWorkClient departments={departments} wards={wards} />;
}
