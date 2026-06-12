# Category Seeding Script

This document explains how to seed the database with predefined categories and subcategories.

## Overview

The seed script (`seed-categories.ts`) populates the database with complaint categories and their associated subcategories based on the definitions in `lib/constants.ts`.

## Categories & Subcategories

The script will create the following categories with their subcategories:

### 1. Road (7 subcategories)
- Pothole
- Road Damage
- Missing Signage
- Streetlight Not Working
- Road Debris
- Accident Site
- Other

### 2. Water (7 subcategories)
- No Water Supply
- Low Pressure
- Water Leakage
- Water Quality Issue
- Pipeline Damage
- Water Contamination
- Other

### 3. Electricity (7 subcategories)
- Power Cut
- Power Fluctuation
- Broken Pole
- Damaged Wire
- Illegal Connection
- Meter Issue
- Other

### 4. Sanitation (7 subcategories)
- Garbage Not Collected
- Open Defecation
- Dirty Public Area
- Drain Clogged
- Sweeping Not Done
- Public Toilet Issue
- Other

### 5. Health (7 subcategories)
- Disease Outbreak
- Lack of Vaccination
- Hospital Issue
- Ambulance Service
- Health Center Issue
- Medical Staff Issue
- Other

### 6. Public Safety (7 subcategories)
- Crime Report
- Unsafe Area
- Traffic Violation
- Police Response Issue
- Security Concern
- Fire Risk
- Other

### 7. Other (1 subcategory)
- General Complaint

**Total: 7 categories and 43 subcategories**

## Usage

### First Time Seeding

```bash
pnpm seed:categories
```

If the database is empty, this will create all categories and subcategories.

### Force Re-seed (Delete & Recreate)

```bash
pnpm seed:categories --force
```

⚠️ **Warning:** This will delete ALL existing categories and subcategories before recreating them. Use with caution in production!

## What the Script Does

1. **Checks for existing data**: If categories already exist, it will skip seeding (unless `--force` is used)
2. **Clears existing data** (with `--force` flag): Deletes all categories and subcategories
3. **Creates categories**: Iterates through `COMPLAINT_CATEGORIES` from constants
4. **Creates subcategories**: For each category, creates all associated subcategories from `SUBCATEGORIES` map
5. **Provides summary**: Shows total categories and subcategories created

## Modifying Categories

To add or modify categories and subcategories:

1. Edit `lib/constants.ts`
2. Update the `COMPLAINT_CATEGORIES` array
3. Update the `SUBCATEGORIES` object
4. Run `pnpm seed:categories --force` to apply changes

## Database Schema

The script populates these tables:
- `category`: Main complaint categories
- `subcategory`: Specific types of complaints within each category (with foreign key to category)

## Notes

- The script uses the Prisma client to interact with the database
- Subcategories are automatically deleted when their parent category is deleted (cascade delete)
- Each subcategory is unique within its category
- The script is idempotent - it can be run multiple times safely
