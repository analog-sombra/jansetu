import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const departments = [
    "Public Works",
    "Water Supply",
    "Electricity",
    "Sanitation",
    "Health",
  ];

  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const departmentMap = await prisma.department.findMany({
    select: { id: true, name: true },
  });

  const officerSeed = [
    {
      name: "Rakesh Verma",
      designation: "Executive Engineer",
      email: "rakesh.verma@jansetu.local",
      phone: "9000000001",
      department: "Public Works",
    },
    {
      name: "Neha Singh",
      designation: "Assistant Engineer",
      email: "neha.singh@jansetu.local",
      phone: "9000000002",
      department: "Water Supply",
    },
    {
      name: "Amit Yadav",
      designation: "Field Officer",
      email: "amit.yadav@jansetu.local",
      phone: "9000000003",
      department: "Electricity",
    },
    {
      name: "Farah Khan",
      designation: "Health Inspector",
      email: "farah.khan@jansetu.local",
      phone: "9000000004",
      department: "Health",
    },
  ];

  for (const officer of officerSeed) {
    const dept = departmentMap.find((d) => d.name === officer.department);
    if (!dept) {
      continue;
    }

    await prisma.officer.upsert({
      where: { email: officer.email },
      update: {
        name: officer.name,
        designation: officer.designation,
        phone: officer.phone,
        departmentId: dept.id,
      },
      create: {
        name: officer.name,
        designation: officer.designation,
        email: officer.email,
        phone: officer.phone,
        departmentId: dept.id,
      },
    });
  }

  await prisma.user.upsert({
    where: { mobile: "9999999999" },
    update: {
      name: "MLA Admin",
      role: UserRole.ADMIN,
      firstLoginComplete: true,
      address: "Constituency Office",
      voterId: "ADMIN-VOTER-001",
    },
    create: {
      name: "MLA Admin",
      mobile: "9999999999",
      role: UserRole.ADMIN,
      firstLoginComplete: true,
      address: "Constituency Office",
      voterId: "ADMIN-VOTER-001",
    },
  });

  await prisma.user.upsert({
    where: { mobile: "8888888888" },
    update: {
      name: "MLA Strategic Office",
      role: UserRole.REPORT,
      firstLoginComplete: true,
      address: "Constituency War Room",
      voterId: "REPORT-VOTER-001",
    },
    create: {
      name: "MLA Strategic Office",
      mobile: "8888888888",
      role: UserRole.REPORT,
      firstLoginComplete: true,
      address: "Constituency War Room",
      voterId: "REPORT-VOTER-001",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
