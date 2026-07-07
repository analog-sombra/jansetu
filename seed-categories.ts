import prisma from "./lib/prisma";

const COMPLAINT_CATEGORIES = [
  "Road",
  "Water",
  "Electricity",
  "Sanitation",
  "Health",
  "Public Safety",
  "Other",
] as const;

const SUBCATEGORIES: Record<string, string[]> = {
  Road: [
    "Pothole",
    "Road Damage",
    "Missing Signage",
    "Streetlight Not Working",
    "Road Debris",
    "Accident Site",
    "Other",
  ],
  Water: [
    "No Water Supply",
    "Low Pressure",
    "Water Leakage",
    "Water Quality Issue",
    "Pipeline Damage",
    "Water Contamination",
    "Other",
  ],
  Electricity: [
    "Power Cut",
    "Power Fluctuation",
    "Broken Pole",
    "Damaged Wire",
    "Illegal Connection",
    "Meter Issue",
    "Other",
  ],
  Sanitation: [
    "Garbage Not Collected",
    "Open Defecation",
    "Dirty Public Area",
    "Drain Clogged",
    "Sweeping Not Done",
    "Public Toilet Issue",
    "Other",
  ],
  Health: [
    "Disease Outbreak",
    "Lack of Vaccination",
    "Hospital Issue",
    "Ambulance Service",
    "Health Center Issue",
    "Medical Staff Issue",
    "Other",
  ],
  "Public Safety": [
    "Crime Report",
    "Unsafe Area",
    "Traffic Violation",
    "Police Response Issue",
    "Security Concern",
    "Fire Risk",
    "Other",
  ],
  Other: ["General Complaint"],
};
async function seedCategoriesAndSubcategories() {
  console.log("🌱 Seeding categories and subcategories...");

  // Check for --force flag
  const forceReseed = process.argv.includes("--force");

  try {
    // Check if categories already exist
    const existingCount = await prisma.category.count();
    if (existingCount > 0 && !forceReseed) {
      console.log(
        `⚠️  Found ${existingCount} existing categories. Skipping seed.`,
      );
      console.log("💡 To re-seed, run: pnpm seed:categories --force");
      console.log(
        "⚠️  Warning: This will delete all existing categories and subcategories!",
      );
      return;
    }

    if (existingCount > 0 && forceReseed) {
      console.log(
        `🗑️  Deleting ${existingCount} existing categories and their subcategories...`,
      );
      await prisma.subcategory.deleteMany({});
      await prisma.category.deleteMany({});
      console.log("✅ Existing data cleared.");
    }

    let totalCategories = 0;
    let totalSubcategories = 0;

    for (const categoryName of COMPLAINT_CATEGORIES) {
      console.log(`\n📁 Creating category: ${categoryName}`);

      // Create category
      const category = await prisma.category.create({
        data: {
          name: categoryName,
          departmentId: 1,
        },
      });
      totalCategories++;
      console.log(`✅ Created category: ${category.name} (ID: ${category.id})`);

      // Get subcategories for this category
      const subcategoryNames = SUBCATEGORIES[categoryName] || [];

      if (subcategoryNames.length > 0) {
        console.log(`   📋 Adding ${subcategoryNames.length} subcategories...`);

        // Create subcategories
        for (const subcategoryName of subcategoryNames) {
          await prisma.subcategory.create({
            data: {
              name: subcategoryName,
              categoryId: category.id,
            },
          });
          totalSubcategories++;
        }

        console.log(`   ✅ Added ${subcategoryNames.length} subcategories`);
      }
    }

    console.log(`\n🎉 Seed completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Categories created: ${totalCategories}`);
    console.log(`   - Subcategories created: ${totalSubcategories}`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedCategoriesAndSubcategories()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed failed:", error);
    process.exit(1);
  });
