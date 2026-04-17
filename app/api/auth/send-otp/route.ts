import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendOtpSchema } from "@/lib/validators";
import { createOtp } from "@/services/otp-service";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = sendOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid mobile number" },
      { status: 400 },
    );
  }

  const rate = checkRateLimit(`otp:${parsed.data.mobile}`, 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many OTP requests. Try again later." },
      { status: 429 },
    );
  }

  const result = await createOtp(parsed.data.mobile);

  return NextResponse.json({
    ok: true,
    otp: result.otp,
    expiresAt: result.expiresAt,
    message: "OTP sent via mock SMS service",
  });
}
