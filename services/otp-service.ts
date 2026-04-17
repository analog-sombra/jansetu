import bcrypt from "bcryptjs";
import { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logNotification } from "@/services/notification-service";

const OTP_VALIDITY_MINUTES = 5;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(mobile: string) {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 8);
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: {
      mobile,
      otpHash,
      expiresAt,
    },
  });

  await logNotification({
    channel: NotificationChannel.SMS,
    recipient: mobile,
    message: `Your JanSetu OTP is ${otp}. Valid for ${OTP_VALIDITY_MINUTES} minutes.`,
  });

  return { otp, expiresAt };
}

export async function verifyOtp(mobile: string, otp: string) {
  const latest = await prisma.otpCode.findFirst({
    where: {
      mobile,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return { ok: false, reason: "OTP not found or expired" };
  }

  const matches = await bcrypt.compare(otp, latest.otpHash);
  if (!matches) {
    await prisma.otpCode.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "Invalid OTP" };
  }

  await prisma.otpCode.update({
    where: { id: latest.id },
    data: { isUsed: true },
  });

  return { ok: true };
}
