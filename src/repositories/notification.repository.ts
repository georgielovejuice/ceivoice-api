import prisma from "../lib/prisma";

// ===== STATUS HISTORY =====

export const createStatusHistory = async (
  ticketId: number,
  oldStatusId: number,
  newStatusId: number,
  changedById: string,
  changeReason?: string
) => {
  return await prisma.statusHistory.create({
    data: {
      ticket_id: ticketId,
      old_status_id: oldStatusId,
      new_status_id: newStatusId,
      changed_by_id: changedById,
      change_reason: changeReason
    },
    include: {
      old_status: true,
      new_status: true,
      changed_by: true
    }
  });
};

export const getStatusHistory = async (ticketId: number) => {
  return await prisma.statusHistory.findMany({
    where: { ticket_id: ticketId },
    include: { old_status: true, new_status: true, changed_by: true },
    orderBy: { changed_at: "asc" }
  });
};

// ===== NOTIFICATIONS =====

export const createNotification = async (
  ticketId: number,
  userId: string,
  type: string,
  message: string
) => {
  return await prisma.notification.create({
    data: { ticket_id: ticketId, user_id: userId, type, message }
  });
};

export const getUserNotifications = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { user_id: userId },
    include: { ticket: true },
    orderBy: { created_at: "desc" }
  });
};

export const markNotificationAsRead = async (notificationId: number) => {
  return await prisma.notification.update({
    where: { notification_id: notificationId },
    data: { is_read: true }
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  return await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true }
  });
};

export const deleteNotification = async (notificationId: number) => {
  return await prisma.notification.delete({
    where: { notification_id: notificationId }
  });
};
