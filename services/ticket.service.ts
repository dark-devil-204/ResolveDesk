import { db } from "@/db/drizzle";
import { ticket, ticketSequence, user } from "@/db/schema";
import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import {
  activityPriorityChanged,
  activityTicketCreated,
} from "./ticketActivity.service";
import { ServiceContext } from "@/types/service-context";

export async function getTickets(orgId: string) {
  return db.select().from(ticket).where(eq(ticket.organizationId, orgId));
}

export async function getDashboardStats(ctx: ServiceContext) {
  const [openTickets] = await db
    .select({ count: count() })
    .from(ticket)
    .where(
      and(eq(ticket.organizationId, ctx.orgId), eq(ticket.status, "open")),
    );
  const [slaAtRisk] = await db
    .select({ count: count() })
    .from(ticket)
    .where(
      and(
        eq(ticket.organizationId, ctx.orgId),
        eq(ticket.status, "open"),
        sql`${ticket.firstResponseDeadline} < NOW()`,
      ),
    );
  const statusCounts = await db
    .select({
      status: ticket.status,
      count: count(),
    })
    .from(ticket)
    .where(eq(ticket.organizationId, ctx.orgId))
    .groupBy(ticket.status);
  const counts = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };
  for (const row of statusCounts) {
    counts[row.status] = Number(row.count);
  }
  return {
    openTickets: Number(openTickets.count),
    slatAtRisk: Number(slaAtRisk.count),
    avgFirstResponseMinutes: 11,
    csat: 92,
    statusCounts: counts,
  };
}

export async function getTicketById(id: string, orgId: string) {
  return db
    .select()
    .from(ticket)
    .where(and(eq(ticket.id, id), eq(ticket.organizationId, orgId)))
    .limit(1);
}
export async function getNextTicketNumber(orgId: string): Promise<number> {
  const result = await db
    .insert(ticketSequence)
    .values({
      organizationId: orgId,
      lastNumber: 1,
    })
    .onConflictDoUpdate({
      target: ticketSequence.organizationId,
      set: {
        lastNumber: sql`${ticketSequence.lastNumber} + 1`,
      },
    })
    .returning({ lastNumber: ticketSequence.lastNumber });

  if (result.length === 0) {
    throw new Error("Failed to generate ticket number");
  }

  if (result[0].lastNumber === null) {
    throw new Error("Invalid ticket sequence state");
  }

  return result[0].lastNumber;
}
export function formatTicketNumber(slug: string, number: number) {
  return `${slug.toUpperCase()}-${number.toString().padStart(4, "0")}`;
}
export async function createTicket(data: {
  title: string;
  description?: string;
  organizationId: string;
  createdById: string;
}) {
  const number = await getNextTicketNumber(data.organizationId);

  const ticketNumber = formatTicketNumber("TICKET", number);
  const result = await db
    .insert(ticket)
    .values({
      title: data.title,
      description: data.description,
      organizationId: data.organizationId,
      createdById: data.createdById,
      ticketNumber,
    })
    .returning();

  const createdTicket = result[0];

  await activityTicketCreated(
    {
      userId: data.createdById,
      orgId: data.organizationId,
    },
    createdTicket.id,
  );

  return createdTicket;
}

export function assignTicket(ticketId: string, userId: string, orgId: string) {
  return db
    .update(ticket)
    .set({ assignedToId: userId })
    .where(and(eq(ticket.id, ticketId), eq(ticket.organizationId, orgId)))
    .returning();
}
export function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "closed" | "resolved",
  orgId: string,
) {
  return db
    .update(ticket)
    .set({ status })
    .where(and(eq(ticket.id, ticketId), eq(ticket.organizationId, orgId)))
    .returning();
}
export function deleteTicket(ticketId: string, orgId: string) {
  return db
    .delete(ticket)
    .where(and(eq(ticket.id, ticketId), eq(ticket.organizationId, orgId)));
}
export async function updateTicketPriority(
  ticketId: string,
  priority: "low" | "medium" | "high" | "urgent",
  ctx: ServiceContext,
) {
  const updatedTicket = await db
    .update(ticket)
    .set({ priority })
    .where(and(eq(ticket.id, ticketId), eq(ticket.organizationId, ctx.orgId)))
    .returning();
  await activityPriorityChanged(
    ctx,
    ticketId,
    updatedTicket[0].priority,
    priority,
  );
  return updatedTicket;
}
type TicketFilters = {
  status?: "open" | "in_progress" | "closed" | "resolved";
  priority?: "low" | "medium" | "high" | "urgent";
  sort: "createdAt" | "updatedAt";
  page: number;
  limit: number;
  assignedTo?: string;
  q?: string;
};
export async function getFilteredTickets(
  ctx: ServiceContext,
  filters: TicketFilters,
) {
  const conditions = [eq(ticket.organizationId, ctx.orgId)];
  if (filters.status) {
    conditions.push(eq(ticket.status, filters.status));
  }
  if (filters.priority) {
    conditions.push(eq(ticket.priority, filters.priority));
  }

  if (filters.assignedTo) {
    conditions.push(eq(ticket.assignedToId, filters.assignedTo));
  }

  if (filters.q) {
    conditions.push(ilike(ticket.title, `%${filters.q}%`));
  }
  const sortColumn =
    filters.sort === "updatedAt" ? ticket.updatedAt : ticket.createdAt;
  const offset = (filters.page - 1) * filters.limit;

  const [totalResult, rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(ticket)
      .where(and(...conditions))
      .then((r) => Number(r[0]?.total ?? 0)),
    db
      .select({
        ticket,
        assigneeName: user.name,
        assigneeEmail: user.email,
      })
      .from(ticket)
      .leftJoin(user, eq(ticket.assignedToId, user.id))
      .where(and(...conditions))
      .orderBy(desc(sortColumn))
      .limit(filters.limit)
      .offset(offset),
  ]);

  return {
    total: totalResult,
    tickets: rows.map(({ ticket: ticketRow, assigneeName, assigneeEmail }) => ({
      ...ticketRow,
      assigneeName,
      assigneeEmail,
    })),
  };
}

export async function getTicketStatusCounts(ctx: ServiceContext) {
  const rows = await db
    .select({
      status: ticket.status,
      count: count(),
    })
    .from(ticket)
    .where(eq(ticket.organizationId, ctx.orgId))
    .groupBy(ticket.status);
  const counts = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };
  for (const row of rows) {
    counts[row.status] = Number(row.count);
  }
  return counts;
}
