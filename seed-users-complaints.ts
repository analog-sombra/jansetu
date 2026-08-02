import prisma from "./lib/prisma";
import { faker } from "@faker-js/faker";
// import { COMPLAINTSTATUS } from "@prisma/client";

// const COMPLAINT_STATUSES: COMPLAINTSTATUS[] = [
//   "PENDING",
//   "IN_PROGRESS",
//   "QUERY_RAISED",
//   "RESOLVED",
//   "REJECTED",
//   "CLOSED",
// ];

const AREAS_WITH_COORDINATES = [
  { name: "Rajouri Garden", lat: 28.6455984, lng: 77.1199863 },
  { name: "Raghubir Nagar", lat: 28.6572404, lng: 77.1052302 },
  { name: "Tagore Garden", lat: 28.6477577, lng: 77.1099917 },
  { name: "Vishal Enclave", lat: 28.6510134, lng: 77.1187454 },
  { name: "Subhash Nagar", lat: 28.635848, lng: 77.1161499 },
  { name: "Shivaji Enclave", lat: 28.6564299, lng: 77.1215387 },
  { name: "Mansarovar Garden", lat: 28.6422874, lng: 77.131302 },
  { name: "Mayapuri", lat: 28.6252181, lng: 77.1228388 },
  { name: "Madipur", lat: 28.6722158, lng: 77.1218147 },
  { name: "Punjabi Bagh West", lat: 28.6705255, lng: 77.1284248 },
  { name: "Karampura", lat: 28.6696331, lng: 77.1462422 },
  { name: "Moti Nagar", lat: 28.65605, lng: 77.1395067 },
  { name: "Ramesh Nagar", lat: 28.6493006, lng: 77.1319375 },
];

const COMPLAINT_DESCRIPTIONS = [
  // Road & Infrastructure
  "The road in this area has developed multiple potholes making it dangerous for vehicles and pedestrians.",
  "Major road damage near the market affecting daily traffic and causing congestion.",
  "There has been a recent accident at this location and the road is severely damaged.",
  "Missing road signage is creating confusion for drivers and pedestrians.",
  "The streetlight near the market area has been non-functional for over a month.",
  "Multiple streetlights in the residential area are broken, creating dark spots.",
  "Road debris and broken tiles are scattered across the main road.",
  "The pavement is uneven and poses a tripping hazard for senior citizens.",
  "Dangerous pothole near school area putting children at risk.",
  "Road surface is completely deteriorated and needs urgent resurfacing.",
  "Cracks are widening on the main road causing water seepage.",
  "Roadside trees are overgrown and blocking the streetlights.",
  "Speed breakers are damaged and need replacement.",
  "Road barriers are missing, creating traffic safety issues.",

  // Water Supply
  "Water supply has been irregular in this area for the past two weeks, affecting daily routines.",
  "No water supply for the past 3 days, residents are suffering.",
  "Water pressure is extremely low, making it difficult to use water for basic needs.",
  "Water is leaking from underground pipes, causing water wastage.",
  "The water quality has deteriorated and needs to be tested immediately.",
  "Water pipeline has burst, creating a water crisis in the area.",
  "Water contamination reported, residents advised not to use tap water.",
  "Water supply is only available for 2 hours a day.",
  "Illegal water connections are affecting supply to legitimate consumers.",
  "Water meter is faulty, showing incorrect readings.",
  "Water tanker service is inefficient and unreliable.",
  "Water tank on roof is leaking, causing damage to the building.",
  "Water supply has stopped completely since yesterday.",
  "Foul smell coming from water supply indicates contamination.",

  // Electricity
  "Power cuts are happening multiple times a day, disrupting normal life.",
  "The electricity meter is faulty and needs replacement.",
  "Broken power line hanging dangerously near residential area.",
  "Illegal electrical connections are creating fire hazards.",
  "Power fluctuation is damaging electronic appliances.",
  "Electricity pole is tilted and might fall anytime.",
  "Power cable is damaged and exposed, creating safety hazard.",
  "Street lights are consuming too much electricity without proper illumination.",
  "Electricity bill is abnormally high, needs audit.",
  "Power connection is working only intermittently.",
  "Transformer is overheating and needs maintenance.",
  "Short circuit risk due to improper wiring.",
  "Electricity supply is completely disconnected to several houses.",
  "Electrical installation is outdated and unsafe.",

  // Sanitation
  "Garbage is not being collected regularly, leading to unhygienic conditions.",
  "The public toilet facility is in a very poor condition and needs immediate repair.",
  "The drainage system is clogged and causing water logging during rains.",
  "Dirty waste is piled up on the street corner creating bad odor.",
  "Public dustbin is overflowing and attractes rats and insects.",
  "Drain water is flowing on the road making it unhygienic.",
  "Street sweeping is not being done regularly.",
  "Stagnant water in the area is breeding ground for mosquitoes.",
  "Public toilet is locked and not accessible to residents.",
  "Open defecation is common in this area despite awareness campaigns.",
  "Garbage collection vehicle never comes to this location.",
  "Waste segregation is not being followed by the municipal corporation.",
  "Sanitation workers are not maintaining hygiene standards.",
  "Foul smell is unbearable due to improper waste management.",

  // Health & Safety
  "Disease outbreak reported in the area, needs immediate action.",
  "Hospital in the area lacks basic facilities and medicines.",
  "Ambulance service is not responding to emergency calls.",
  "Health center staff is unprofessional and rude.",
  "Lack of vaccination camps in the area.",
  "Medical staff is absent during critical hours.",
  "Hospital hygiene is extremely poor.",
  "No availability of emergency medical services.",

  // Public Safety
  "Crime rate in this area is increasing, need more police patrolling.",
  "Traffic violation is common, traffic police is nowhere to be seen.",
  "Police response time is too slow during emergencies.",
  "Unsafe area for women, need better security measures.",
  "Street fights and rowdy behavior is common.",
  "Fire extinguishers are not available in public buildings.",
  "Fire exit routes are blocked in the shopping area.",
];

function generateIndianName(): string {
  const firstNames = [
    "Aarav",
    "Vivaan",
    "Arjun",
    "Rohit",
    "Rajesh",
    "Amit",
    "Sanjay",
    "Vikram",
    "Karthik",
    "Nikhil",
    "Priya",
    "Anjali",
    "Deepa",
    "Ritika",
    "Sneha",
    "Neha",
    "Pooja",
    "Divya",
    "Meera",
    "Sonia",
    "Aryan",
    "Dev",
    "Aditya",
    "Ravi",
    "Suresh",
  ];

  const lastNames = [
    "Sharma",
    "Patel",
    "Singh",
    "Kumar",
    "Verma",
    "Reddy",
    "Gupta",
    "Pandey",
    "Nair",
    "Chopra",
    "Rao",
    "Bhat",
    "Desai",
    "Iyer",
    "Bansal",
    "Malhotra",
    "Saxena",
    "Bhatt",
    "Kapoor",
    "Khanna",
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

function generateIndianMobileNumber(): string {
  const operators = ["94", "95", "96", "97", "98", "99"]; // Indian mobile prefixes
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const restOfNumber = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0");
  return operator + restOfNumber;
}

async function seedUsersAndComplaints() {
  console.log("🌱 Seeding users and complaints...\n");

  const forceReseed = process.argv.includes("--force");

  try {
    // Check existing data
    const existingUsersCount = await prisma.user.count();
    const existingComplaintsCount = await prisma.complaint.count();

    if (
      (existingUsersCount > 0 || existingComplaintsCount > 0) &&
      !forceReseed
    ) {
      console.log(`⚠️  Found existing data:`);
      console.log(`   - Users: ${existingUsersCount}`);
      console.log(`   - Complaints: ${existingComplaintsCount}`);
      console.log("\n💡 To re-seed, run: pnpm seed:users-complaints --force");
      console.log(
        "⚠️  Warning: This will delete all existing users and complaints!",
      );
      return;
    }

    if (
      (existingUsersCount > 0 || existingComplaintsCount > 0) &&
      forceReseed
    ) {
      console.log("🗑️  Deleting existing data...");
      await prisma.complaint.deleteMany({});
      await prisma.user.deleteMany({});
      console.log("✅ Existing data cleared.\n");
    }

    // Verify categories exist
    const categoriesCount = await prisma.category.count();
    if (categoriesCount === 0) {
      console.error(
        "❌ No categories found! Run 'pnpm seed:categories' first.",
      );
      process.exit(1);
    }

    // Get all categories and their subcategories
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
    });

    console.log(`✅ Found ${categories.length} categories\n`);

    // Step 1: Create 25 Users
    console.log("👥 Creating 25 users...");
    const createdUsers: Array<{ id: string; name: string }> = [];

    for (let i = 0; i < 25; i++) {
      const randomArea =
        AREAS_WITH_COORDINATES[
          Math.floor(Math.random() * AREAS_WITH_COORDINATES.length)
        ];
      const user = await prisma.user.create({
        data: {
          name: generateIndianName(),
          mobile: generateIndianMobileNumber(),
          address: `${faker.location.streetAddress()}, ${randomArea.name}`,
          locality: randomArea.name,
          role: "CITIZEN",
          firstLoginComplete: true,
        },
      });
      createdUsers.push({ id: user.id, name: user.name || "User" });

      if ((i + 1) % 5 === 0) {
        process.stdout.write(`\r👥 Creating 25 users... ${i + 1}/25`);
      }
    }
    console.log("\n✅ Created 25 users\n");

    // Step 2: Create 100 Complaints
    console.log("📝 Creating 100 complaints...");
    let complaintCount = 0;

    for (let i = 0; i < 100; i++) {
      // Select random category and subcategory
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];
      const randomSubcategory =
        randomCategory.subcategories[
          Math.floor(Math.random() * randomCategory.subcategories.length)
        ];

      // Select random user
      const randomUser =
        createdUsers[Math.floor(Math.random() * createdUsers.length)];

      // Select random area with exact coordinates
      const randomAreaCoord =
        AREAS_WITH_COORDINATES[
          Math.floor(Math.random() * AREAS_WITH_COORDINATES.length)
        ];

      // Select random status
      //   const randomStatus =
      //     COMPLAINT_STATUSES[
      //       Math.floor(Math.random() * COMPLAINT_STATUSES.length)
      //     ];

      // Use exact area coordinates with minimal random variation
      const lat = randomAreaCoord.lat + (Math.random() - 0.5) * 0.001;
      const lng = randomAreaCoord.lng + (Math.random() - 0.5) * 0.001;

      // Random priority and affected citizens
      const priority = Math.floor(Math.random() * 100);
      const affectedCitizensCount = Math.floor(Math.random() * 10) + 1;

      // Random planned completion date (7-30 days from now)
      const daysFromNow = Math.floor(Math.random() * 24) + 7;
      const plannedCompletionDate = new Date();
      plannedCompletionDate.setDate(
        plannedCompletionDate.getDate() + daysFromNow,
      );

      // Random description
      const description =
        COMPLAINT_DESCRIPTIONS[
          Math.floor(Math.random() * COMPLAINT_DESCRIPTIONS.length)
        ];

      await prisma.complaint.create({
        data: {
          userId: randomUser.id,
          categoryId: randomCategory.id,
          subcategoryId: randomSubcategory.id,
          description,
          address: `${faker.location.streetAddress()}, ${randomAreaCoord.name}`,
          status: "PENDING",
          area: randomAreaCoord.name,
          lat,
          lng,
          priority,
          affectedCitizensCount,
          plannedCompletionDate,
        },
      });

      complaintCount++;
      if (complaintCount % 10 === 0) {
        process.stdout.write(
          `\r📝 Creating 100 complaints... ${complaintCount}/100`,
        );
      }
    }
    console.log("\n✅ Created 100 complaints\n");

    // Summary
    console.log("🎉 Seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   ✅ Users created: 25");
    console.log("   ✅ Complaints created: 100");
    console.log(`\n📍 Areas covered: ${AREAS_WITH_COORDINATES.length}`);
    console.log(`📂 Categories used: ${categories.length}`);
    console.log(
      `📋 Total subcategories: ${categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)}`,
    );
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedUsersAndComplaints()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed failed:", error);
    process.exit(1);
  });
