import prisma from "../lib/prisma";

// ===== REQUESTS =====

export const createRequest = async (email: string, message: string) => {
  return await prisma.request.create({
    data: { email, message }
  });
};

export const getRequestById = async (requestId: number) => {
  return await prisma.request.findUnique({
    where: { request_id: requestId },
    include: { ticket_requests: true }
  });
};

export const getRequestByTrackingId = async (trackingId: string) => {
  return await prisma.request.findUnique({
    where: { tracking_id: trackingId },
    include: { ticket_requests: { include: { ticket: true } } }
  });
};

// ===== TICKET-REQUEST LINKS =====

export const linkRequestToTicket = async (ticketId: number, requestId: number) => {
  return await prisma.ticketRequest.create({
    data: { ticket_id: ticketId, request_id: requestId }
  });
};

export const unlinkRequestFromTicket = async (ticketId: number, requestId: number) => {
  return await prisma.ticketRequest.delete({
    where: {
      ticket_id_request_id: { ticket_id: ticketId, request_id: requestId }
    }
  });
};

export const getTicketRequests = async (ticketId: number) => {
  return await prisma.ticketRequest.findMany({
    where: { ticket_id: ticketId },
    include: { request: true }
  });
};
