import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId?: string;
  assignmentId?: number;
  channel: NotificationChannel;
  recipient: string;
  message: string;
};

export async function logNotification(input: NotificationInput) {
  let status: NotificationStatus = NotificationStatus.SENT;
  let error: string | undefined;

  try {
    // Mock provider hooks. Replace this with real SMS/email providers.
    console.info(`[${input.channel}] -> ${input.recipient}: ${input.message}`);
  } catch (caughtError) {
    status = NotificationStatus.FAILED;
    error = caughtError instanceof Error ? caughtError.message : "Unknown error";
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      assignmentId: input.assignmentId,
      channel: input.channel,
      recipient: input.recipient,
      message: input.message,
      status,
      error,
    },
  });
}
