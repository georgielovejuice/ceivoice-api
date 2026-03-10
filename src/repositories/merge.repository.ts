import prisma from "../lib/prisma";

export const mergeTickets = async (parentTicketId: number, childTicketIds: number[]) => {
  return await prisma.$transaction(async (tx) => {
    const merged = [];

    for (const childId of childTicketIds) {
      // Move all requests from child to parent
      const childRequests = await tx.ticketRequest.findMany({ where: { ticket_id: childId } });

      for (const cr of childRequests) {
        await tx.ticketRequest.upsert({
          where: { ticket_id_request_id: { ticket_id: parentTicketId, request_id: cr.request_id } },
          create: { ticket_id: parentTicketId, request_id: cr.request_id },
          update: {}
        });
        await tx.ticketRequest.delete({
          where: { ticket_id_request_id: { ticket_id: childId, request_id: cr.request_id } }
        });
      }

      // Mark child as merged under parent
      const updated = await tx.ticket.update({
        where: { ticket_id: childId },
        data: { parent_ticket_id: parentTicketId }
      });
      merged.push(updated);

      await tx.suggestedMerge.updateMany({
        where: { suggested_parent_id: parentTicketId, suggested_child_id: childId },
        data: { is_merged: true }
      });
    }

    return merged;
  });
};

export const unmergeTicket = async (childTicketId: number) => {
  return await prisma.ticket.update({
    where: { ticket_id: childTicketId },
    data: { parent_ticket_id: null }
  });
};

export const getSuggestedMergesForTicket = async (ticketId: number) => {
  return await prisma.suggestedMerge.findMany({
    where: {
      is_merged: false,
      OR: [
        { suggested_child_id: ticketId },
        { suggested_parent_id: ticketId }
      ]
    },
    include: {
      suggested_parent: { select: { ticket_id: true, title: true, summary: true, created_at: true } },
      suggested_child:  { select: { ticket_id: true, title: true, summary: true, created_at: true } }
    }
  });
};

export const getAllSuggestedMerges = async () => {
  return await prisma.suggestedMerge.findMany({
    where: { is_merged: false },
    include: {
      suggested_parent: { select: { ticket_id: true, title: true, summary: true, status: { select: { name: true } } } },
      suggested_child:  { select: { ticket_id: true, title: true, summary: true, status: { select: { name: true } } } }
    },
    orderBy: { created_at: "desc" }
  });
};

export const markSuggestedMergeAsDone = async (parentId: number, childId: number) => {
  return await prisma.suggestedMerge.updateMany({
    where: { suggested_parent_id: parentId, suggested_child_id: childId },
    data: { is_merged: true }
  });
};

export const getTicketConfidence = async (ticketId: number) => {
  return await prisma.aiTicketConfidence.findUnique({
    where: { ticket_id: ticketId }
  });
};

export const finaliseAiMetric = async (
  ticketId: number,
  finalCategoryId: number | null,
  finalAssigneeId: string | null
) => {
  const existing = await prisma.aiTicketMetric.findUnique({ where: { ticket_id: ticketId } });

  if (!existing) {
    console.warn(`⚠️ No aiTicketMetric found for ticket #${ticketId} — skipping`);
    return;
  }

  const categoryMatch      = finalCategoryId != null && existing.suggested_category_id != null
    ? finalCategoryId === existing.suggested_category_id
    : null;
  const suggestionAccepted = finalAssigneeId != null && existing.suggested_assignee_id != null
    ? finalAssigneeId === existing.suggested_assignee_id
    : null;

  return await prisma.aiTicketMetric.update({
    where: { ticket_id: ticketId },
    data: {
      final_category_id:  finalCategoryId,
      final_assignee_id:  finalAssigneeId,
      category_match:     categoryMatch,
      suggestion_accepted: suggestionAccepted,
    }
  });
};

export const getAiAccuracyMetrics = async (dateFilter: Date | null) => {
  const where = dateFilter ? { processed_at: { gte: dateFilter } } : {};

  const [aggregate, categoryMatchCount, suggestionAcceptedCount, totalProcessed, recent] =
    await Promise.all([
      prisma.aiTicketMetric.aggregate({
        where,
        _avg:   { processing_ms: true },
        _count: { id: true }
      }),
      prisma.aiTicketMetric.count({ where: { ...where, category_match: true } }),
      prisma.aiTicketMetric.count({ where: { ...where, suggestion_accepted: true } }),
      prisma.aiTicketMetric.count({ where: { ...where, final_category_id: { not: null } } }),
      prisma.aiTicketMetric.findMany({
        where,
        orderBy: { processed_at: "desc" },
        take: 10,
        include: {
          suggested_category: { select: { name: true } },
          final_category:     { select: { name: true } },
          ticket:             { select: { title: true } }
        }
      })
    ]);

  const total = aggregate._count.id;
  const avgMs = Math.round(aggregate._avg.processing_ms ?? 0);

  return {
    total_processed:           total,
    evaluated_count:           totalProcessed,
    avg_processing_ms:         avgMs,
    avg_processing_s:          +(avgMs / 1000).toFixed(2),
    category_match_count:      categoryMatchCount,
    suggestion_accepted_count: suggestionAcceptedCount,
    category_match_pct:        totalProcessed > 0
      ? +((categoryMatchCount / totalProcessed) * 100).toFixed(1) : null,
    suggestion_accepted_pct:   totalProcessed > 0
      ? +((suggestionAcceptedCount / totalProcessed) * 100).toFixed(1) : null,
    recent
  };
};
