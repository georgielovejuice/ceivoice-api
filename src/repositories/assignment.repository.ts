import prisma from "../lib/prisma";

export const assignTicket = async (ticketId: number, assigneeId: string) => {
  return await prisma.ticket.update({
    where: { ticket_id: ticketId },
    data: { assignee_user_id: assigneeId },
    include: { assignee: true, status: true }
  });
};

export const unassignTicket = async (ticketId: number) => {
  return await prisma.ticket.update({
    where: { ticket_id: ticketId },
    data: { assignee_user_id: null },
    include: { status: true }
  });
};

export const getTicketAssignees = async (ticketId: number) => {
  const ticket = await prisma.ticket.findUnique({
    where: { ticket_id: ticketId },
    include: { assignee: true }
  });

  return ticket?.assignee ? [ticket.assignee] : [];
};

export const createAssignmentHistory = async (
  ticketId: number,
  oldAssigneeId: string | null,
  newAssigneeId: string | null,
  changedById: string,
  changeReason?: string
) => {
  return await prisma.assignmentHistory.create({
    data: {
      ticket_id: ticketId,
      old_assignee_id: oldAssigneeId,
      new_assignee_id: newAssigneeId,
      changed_by_id: changedById,
      change_reason: changeReason
    },
    include: {
      old_assignee: true,
      new_assignee: true,
      changed_by: true
    }
  });
};

export const getAssignmentHistory = async (ticketId: number) => {
  return await prisma.assignmentHistory.findMany({
    where: { ticket_id: ticketId },
    include: { old_assignee: true, new_assignee: true, changed_by: true },
    orderBy: { changed_at: "asc" }
  });
};

export const assignScope = async (assigneeId: string, scopeName: string) => {
  return await prisma.assigneeScope.upsert({
    where: {
      assignee_id_scope_name: { assignee_id: assigneeId, scope_name: scopeName }
    },
    update: {},
    create: { assignee_id: assigneeId, scope_name: scopeName }
  });
};

export const getAssigneeScopes = async (assigneeId: string) => {
  return await prisma.assigneeScope.findMany({
    where: { assignee_id: assigneeId }
  });
};

export const removeScope = async (assigneeId: string, scopeName: string) => {
  return await prisma.assigneeScope.deleteMany({
    where: { assignee_id: assigneeId, scope_name: scopeName }
  });
};

export const removeScopeById = async (scopeId: number) => {
  return await prisma.assigneeScope.delete({
    where: { scope_id: scopeId }
  });
};

export const getAllScopes = async () => {
  return await prisma.scope.findMany({ orderBy: { scope_name: "asc" } });
};

export const createScope = async (scopeName: string) => {
  return await prisma.scope.create({ data: { scope_name: scopeName } });
};

export const deleteScopeFromCatalog = async (scopeId: number) => {
  return await prisma.scope.delete({ where: { scope_id: scopeId } });
};
