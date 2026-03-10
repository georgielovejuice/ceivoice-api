import prisma from "../lib/prisma";

// ===== COMMENTS =====

export const addComment = async (
  ticketId: number,
  userId: string,
  content: string,
  isInternal: boolean = false
) => {
  return await prisma.comment.create({
    data: {
      ticket_id: ticketId,
      user_id: userId,
      content,
      visibility: isInternal ? "PRIVATE" : "PUBLIC"
    },
    include: { user: true }
  });
};

export const getTicketComments = async (ticketId: number) => {
  return await prisma.comment.findMany({
    where: { ticket_id: ticketId },
    include: { user: true },
    orderBy: { created_at: "asc" }
  });
};

export const getPublicComments = async (ticketId: number) => {
  return await prisma.comment.findMany({
    where: { ticket_id: ticketId, visibility: "PUBLIC" },
    include: { user: true },
    orderBy: { created_at: "asc" }
  });
};

// ===== FOLLOWERS =====

export const addFollower = async (ticketId: number, userId: string) => {
  return await prisma.follower.upsert({
    where: {
      ticket_id_user_id: { ticket_id: ticketId, user_id: userId }
    },
    update: {},
    create: { ticket_id: ticketId, user_id: userId }
  });
};

export const removeFollower = async (ticketId: number, userId: string) => {
  return await prisma.follower.deleteMany({
    where: { ticket_id: ticketId, user_id: userId }
  });
};

export const getFollowers = async (ticketId: number) => {
  return await prisma.follower.findMany({
    where: { ticket_id: ticketId },
    include: { user: true }
  });
};
