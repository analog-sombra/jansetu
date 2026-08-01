import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { COMPLAINTSTATUS, ROLE } from "@prisma/client";

interface ComplaintData {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_phone: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  preferred_resolution: string | null;
  order_reference: string | null;
  created_at: string;
  updated_at: string;
  business_id?: string;
  conversation_id?: string;
  resolved_at?: string | null;
  purchase_date?: string | null;
  resolution_notes?: string | null;
}

interface WebhookPayload {
  id: string;
  event: "complaint.created" | "complaint.updated";
  data: ComplaintData;
  created_at: string;
  business_id: string;
  resource_id: string;
  resource_type: "complaint";
}

// Helper function to parse description string (pipe-separated values)
// Format: category || subcategory || description || area || address || lat,long
function parseDescription(description: string): {
  category: string;
  subcategory: string;
  descriptionText: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
} {
  const parts = description.split("||").map((part) => part.trim());

  const category = parts[0] || "";
  const subcategory = parts[1] || "";
  const descriptionText = parts[2] || "";
  const area = parts[3] || "";
  const address = parts[4] || "";

  // Parse latitude and longitude from the last part
  let lat = 0;
  let lng = 0;

  if (parts[5]) {
    const coords = parts[5].split(",").map((c) => parseFloat(c.trim()));
    lat = coords[0] || 0;
    lng = coords[1] || 0;
  }

  return {
    category,
    subcategory,
    descriptionText,
    area,
    address,
    lat,
    lng,
  };
}

// Helper function to parse priority
function parsePriority(priority: string): number {
  const priorityMap: { [key: string]: number } = {
    urgent: 1,
    high: 5,
    medium: 10,
    low: 20,
  };
  return priorityMap[priority.toLowerCase()] || 10;
}

// Helper function to map external category to internal category
async function getOrCreateCategory(categoryName: string) {
  // Try to find existing category (case-insensitive)
  let category = await prisma.category.findFirst({
    where: {
      name: categoryName,
    },
  });

  // If not found, create a new one
  if (!category) {
    // First, ensure there's a department
    let department = await prisma.department.findFirst({
      where: { name: "General" },
    });

    if (!department) {
      department = await prisma.department.create({
        data: { name: "General" },
      });
    }

    category = await prisma.category.create({
      data: {
        name: categoryName,
        departmentId: department.id,
      },
    });
  }

  return category;
}

// Helper function to get or create subcategory
async function getOrCreateSubcategory(
  categoryId: number,
  subcategoryName: string,
) {
  let subcategory = await prisma.subcategory.findFirst({
    where: {
      categoryId,
      name: subcategoryName,
    },
  });

  if (!subcategory) {
    subcategory = await prisma.subcategory.create({
      data: {
        name: subcategoryName,
        categoryId,
      },
    });
  }

  return subcategory;
}

// Verify webhook signature using HMAC-SHA256
function verifyWebhookSignature(
  payload: string,
  signature: string,
  signingSecret: string,
): boolean {
  // Trim whitespace from incoming signature
  let trimmedSignature = signature.trim();

  // Remove 'sha256=' prefix if present
  if (trimmedSignature.startsWith("sha256=")) {
    trimmedSignature = trimmedSignature.substring(7);
  }

  const expectedSignature = crypto
    .createHmac("sha256", signingSecret)
    .update(payload, "utf8")
    .digest("hex");

  console.log("Expected signature length:", expectedSignature.length);
  console.log("Received signature length (trimmed):", trimmedSignature.length);
  console.log("Expected signature:", expectedSignature.substring(0, 20) + "...");
  console.log("Received signature (trimmed):", trimmedSignature.substring(0, 20) + "...");
  console.log("Full received signature:", trimmedSignature);

  // Check if lengths match before using timingSafeEqual
  if (trimmedSignature.length !== expectedSignature.length) {
    console.error("Signature length mismatch! Expected:", expectedSignature.length, "Got:", trimmedSignature.length);
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(trimmedSignature),
      Buffer.from(expectedSignature),
    );
  } catch (err) {
    console.error("TimingSafeEqual error:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const signature = request.headers.get("X-Yougant-Signature") || 
                     request.headers.get("x-yougant-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing X-Yougant-Signature header", success: false },
        { status: 401 },
      );
    }

    const signingSecret = process.env.YOUGANT_WEBHOOK_SECRET;
    if (!signingSecret) {
      return NextResponse.json(
        { error: "Webhook signing secret not configured", success: false },
        { status: 500 },
      );
    }

    try {
      if (!verifyWebhookSignature(rawBody, signature, signingSecret)) {
        console.error("Invalid webhook signature. Payload may have been tampered with.");
        return NextResponse.json(
          {
            error: "Invalid webhook signature. Payload may have been tampered with.",
            success: false,
          },
          { status: 401 },
        );
      }
    } catch (err) {
      console.error("Error verifying webhook signature:", err);
      return NextResponse.json(
        { error: "Signature verification failed", success: false },
        { status: 401 },
      );
    }

    // Parse verified payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error("Failed to parse JSON payload:", rawBody);
      return NextResponse.json(
        { error: "Invalid JSON payload", success: false },
        { status: 400 },
      );
    }

    if (!payload.data) {
      console.error("Invalid payload format. Expected 'data' object:", payload);
      return NextResponse.json(
        { error: 'Invalid payload format. Expected "data" object.' },
        { status: 400 },
      );
    }

    const createdComplaints = [];
    const errors = [];

    // Process single complaint
    let complaintData: ComplaintData | undefined;
    try {
      complaintData = payload.data;

      // Normalize phone number: if 12 digits, remove first 2 digits to make it 10 digits
      let normalizedPhone = complaintData.customer_phone;
      if (complaintData.customer_phone.length === 12) {
        normalizedPhone = complaintData.customer_phone.slice(2);
      }

      // Step 1: Check if user exists by phone, if not create new user
      let user = await prisma.user.findUnique({
        where: { mobile: normalizedPhone },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            mobile: normalizedPhone,
            name: complaintData.customer_name,
            role: ROLE.CITIZEN,
          },
        });
      }

      // Step 2: Parse description to extract all data
      const parsedData = parseDescription(complaintData.description);

      // Step 3: Get or create category
      const category = await getOrCreateCategory(parsedData.category);

      // Step 4: Get or create subcategory
      const subcategory = await getOrCreateSubcategory(
        category.id,
        parsedData.subcategory,
      );

      // Step 5: Parse priority
      const priority = parsePriority(complaintData.priority);

      // Step 6: Create complaint
      const complaint = await prisma.complaint.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          subcategoryId: subcategory.id,
          description: parsedData.descriptionText,
          address: parsedData.address,
          area: parsedData.area,
          lat: parsedData.lat,
          lng: parsedData.lng,
          status: COMPLAINTSTATUS.PENDING,
          priority: priority,
          affectedCitizensCount: 1,
        },
        include: {
          user: true,
          category: true,
          subcategory: true,
        },
      });

      createdComplaints.push({
        id: complaint.id,
        externalId: complaintData.id,
        ticketNumber: complaintData.ticket_number,
        status: "created",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push({
        ticketNumber: complaintData?.ticket_number || "unknown",
        error: errorMessage,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Processed complaint`,
        created: createdComplaints.length,
        failed: errors.length,
        createdComplaints,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Internal server error",
      },
      { status: 500 },
    );
  }
}

// Optional: Health check endpoint
export async function GET() {
  return NextResponse.json(
    {
      message: "Complaint webhook endpoint is active",
      endpoint: "/api/webhook/complaint",
      method: "POST",
    },
    { status: 200 },
  );
}
