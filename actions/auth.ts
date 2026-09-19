"use server";

import { randomInt, createHash } from "crypto";
import { ROLE } from "@prisma/client";
import prisma from "@/lib/prisma";
import { clearAuthSession, setAuthSession } from "@/lib/auth/session";
import { sendSmsOtp } from "@/lib/sms";

type SendOtpActionResult = {
  ok: boolean;
  error?: string;
  otp?: string;
};

type VerifyOtpActionResult = {
  ok: boolean;
  error?: string;
  userId?: string;
  firstLoginComplete?: boolean;
  role?: ROLE;
};

function normalizeMobile(mobile: string): string {
  return mobile.trim();
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function generateSixDigitOtp(): string {
  return String(randomInt(100_000, 1_000_000));
}

export async function sendOtpAction(
  mobileInput: string,
): Promise<SendOtpActionResult> {
  const mobile = normalizeMobile(mobileInput);

  if (!/^\d{10}$/.test(mobile)) {
    return { ok: false, error: "Please enter a valid 10-digit mobile number" };
  }

  const otp = generateSixDigitOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    // Step 1: Mark all existing unused OTPs as used
    await prisma.otp_code.updateMany({
      where: { 
        mobile, 
        isUsed: false 
      },
      data: { isUsed: true },
    });

    // Step 2: Create new OTP
    const otpRecord = await prisma.otp_code.create({
      data: {
        mobile,
        otpHash,
        expiresAt,
      },
    });

    // Step 3: Send SMS with OTP
    const smsResult = await sendSmsOtp(mobile, otp);

    // Step 4: Log SMS send attempt
    await prisma.sms_log.create({
      data: {
        mobile,
        message: `Your One-Time Password (OTP) for login is: ${otp}. This OTP is valid for 5 minutes. Do not share it with anyone.`,
        messageId: smsResult.messageId,
        status: smsResult.ok ? "SENT" : "FAILED",
        errorMsg: smsResult.error || null,
        type: "OTP",
        metadata: JSON.stringify({
          otpCodeId: otpRecord.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    if (!smsResult.ok) {
      return {
        ok: false,
        error: `Failed to send OTP via SMS: ${smsResult.error}`,
      };
    }

    return {
      ok: true,
      otp: process.env.NODE_ENV === "development" ? otp : undefined, // Only return OTP in development for testing
    };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);

    // Log the error
    await prisma.sms_log.create({
      data: {
        mobile,
        message: `OTP generation attempt for mobile: ${mobile}`,
        status: "FAILED",
        errorMsg: errorMsg,
        type: "OTP",
      },
    }).catch(() => {
      // Silently fail if logging fails
    });

    return {
      ok: false,
      error: `Failed to send OTP. Please try again.`,
    };
  }
}

export async function verifyOtpAction(
  mobileInput: string,
  otpInput: string,
): Promise<VerifyOtpActionResult> {
  const mobile = normalizeMobile(mobileInput);
  const otp = otpInput.trim();

  if (!/^\d{10}$/.test(mobile)) {
    return { ok: false, error: "Please enter a valid 10-digit mobile number" };
  }

  if (!/^\d{6}$/.test(otp)) {
    return { ok: false, error: "Please enter a valid 6-digit OTP" };
  }

  try {
    const otpRecord = await prisma.otp_code.findFirst({
      where: {
        mobile,
        isUsed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return { ok: false, error: "OTP not found. Please request a new OTP." };
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await prisma.otp_code.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      return { ok: false, error: "OTP has expired. Please request a new OTP." };
    }

    const providedHash = hashOtp(otp);
    const isMatch = providedHash === otpRecord.otpHash;

    if (!isMatch) {
      const attempts = otpRecord.attempts + 1;
      await prisma.otp_code.update({
        where: { id: otpRecord.id },
        data: {
          attempts,
          isUsed: attempts >= 5,
        },
      });
      return { ok: false, error: "Invalid OTP. Please try again." };
    }

    await prisma.otp_code.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const user = await prisma.user.upsert({
      where: { mobile },
      update: {},
      create: {
        mobile,
      },
      select: {
        id: true,
        firstLoginComplete: true,
        role: true,
      },
    });

    await setAuthSession(user.id, user.role);

    return {
      ok: true,
      userId: user.id,
      firstLoginComplete: user.firstLoginComplete,
      role: user.role,
    };
  } catch {
    return { ok: false, error: "Failed to verify OTP. Please try again." };
  }
}

export async function logoutAction() {
  await clearAuthSession();
  return { ok: true };
}
