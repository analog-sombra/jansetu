import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getWorkDetailsAction } from "@/actions/mla/works";
import prisma from "@/lib/prisma";
import WorkDetailClient from "./work_detail_client";

interface WorkDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { id } = await params;

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const allowedRoles = ["MLA", "MLA_PA", "MLA_SECRETARY", "ADMIN","CAMP_HEAD"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/user");
  }

  const workId = parseInt(id);
  const result = await getWorkDetailsAction(workId);

  if (!result.ok) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const officers = await prisma.officer.findMany({
    select: {
      id: true,
      name: true,
      designation: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <WorkDetailClient
      work={result.data}
      officers={officers}
    />
  );
}
