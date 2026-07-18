"use server";

import { randomInt, createHash } from "crypto";
import { ROLE } from "@prisma/client";
import prisma from "@/lib/prisma";
import { clearAuthSession, setAuthSession } from "@/lib/auth/session";

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
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
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
    await prisma.$transaction([
      prisma.otp_code.updateMany({
        where: { mobile, isUsed: false },
        data: { isUsed: true },
      }),
      prisma.otp_code.create({
        data: {
          mobile,
          otpHash,
          expiresAt,
        },
      }),
    ]);

    return {
      ok: true,
      otp: otp,
    };
  } catch (e) {
    return { ok: false, error: `Failed to send OTP. Please try again. ${e}` };
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
