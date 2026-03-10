import prisma from "../lib/prisma";
import { STATUS_ID } from "../constants/ticketStatus";

export const getAllAssignees = async () => {
  return await prisma.user.findMany({
    where: { role: "ASSIGNEE" },
    include: {
      scopes: true,
      assigned_tickets: {
        where: { status_id: { notIn: [5, 6] } } // Exclude Solved and Failed
      }
    }
  });
};

export const getAllUsers = async () => {
  // Fetch users + bulk ticket-count aggregates in parallel (3 queries total,
  // not N×3) to avoid exhausting the Supabase session-mode connection pool.
  const [users, activeGroups, resolvedGroups, submittedGroups] = await Promise.all([
    prisma.user.findMany({
      include: { scopes: true },
      orderBy: { created_at: "desc" }
    }),
    prisma.ticket.groupBy({
      by: ["assignee_user_id"],
      where: { assignee_user_id: { not: null }, status_id: { notIn: [5, 6] } },
      _count: { ticket_id: true }
    }),
    prisma.ticket.groupBy({
      by: ["assignee_user_id"],
      where: { assignee_user_id: { not: null }, status_id: { in: [5, 6] } },
      _count: { ticket_id: true }
    }),
    prisma.ticket.groupBy({
      by: ["creator_user_id"],
      where: { creator_user_id: { not: null } },
      _count: { ticket_id: true }
    })
  ]);

  // Build lookup maps for O(1) join
  const activeMap    = new Map(activeGroups.map((r)    => [r.assignee_user_id, r._count.ticket_id]));
  const resolvedMap  = new Map(resolvedGroups.map((r)  => [r.assignee_user_id, r._count.ticket_id]));
  const submittedMap = new Map(submittedGroups.map((r) => [r.creator_user_id,  r._count.ticket_id]));

  return users.map((user) => ({
    ...user,
    active_ticket_count: activeMap.get(user.user_id)    ?? 0,
    resolved_count:      resolvedMap.get(user.user_id)  ?? 0,
    submitted_count:     submittedMap.get(user.user_id) ?? 0
  }));
};

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({ where: { email } });
};

export const getUserById = async (userId: string) => {
  return await prisma.user.findUnique({ where: { user_id: userId } });
};

export const updateUserRole = async (userId: string, role: string) => {
  return await prisma.user.update({
    where: { user_id: userId },
    data: { role }
  });
};
