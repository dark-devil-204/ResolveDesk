import { db } from "@/db/drizzle";
import { ticket, ticketActivity, user } from "@/db/schema";
import { ServiceContext } from "@/types/service-context";
import { and, desc, eq } from "drizzle-orm";

export async function createActivity(
  ctx: ServiceContext,
  ticketId: string,
  action: string,
  metadata?: Record<string, unknown>,
) {
  const result = await db
    .insert(ticketActivity)
    .values({
      ticketId,
      userId: ctx.userId,
      action,
      metadata: metadata ?? {},
    })
    .returning();
  return result[0];
}

export async function getTicketActivities(
  ctx: ServiceContext,
  ticketId: string,
) {
  return db
    .select({
      ticketActivity,
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(ticketActivity)
    .innerJoin(ticket, eq(ticket.id, ticketActivity.ticketId))
    .leftJoin(user, eq(user.id, ticketActivity.userId))
    .where(
      and(
        eq(ticketActivity.ticketId, ticketId),
        eq(ticket.organizationId, ctx.orgId),
      ),
    )
    .orderBy(desc(ticketActivity.createdAt));
}

export function activityTicketCreated(ctx: ServiceContext, ticketId: string) {
  return createActivity(ctx, ticketId, "ticket_created");
}

export function activityStatusChanged(
  ctx: ServiceContext,
  ticketId: string,
  from: string,
  to: string,
) {
  return createActivity(ctx, ticketId, "status_changed", { from, to });
}

export function activityPriorityChanged(
  ctx: ServiceContext,
  ticketId: string,
  from: string,
  to: string,
) {
  return createActivity(ctx, ticketId, "priority_changed", { from, to });
}
export function activityAssigned(
  ctx: ServiceContext,
  ticketId: string,
  assignedToId: string,
) {
  return createActivity(ctx, ticketId, "assigned", { assignedToId });
}

export function activityMessageAdded(ctx: ServiceContext, ticketId: string) {
  return createActivity(ctx, ticketId, "message_added");
}

export function activityNoteAdded(ctx: ServiceContext, ticketId: string) {
  return createActivity(ctx, ticketId, "note");
}

export function activityWatcherAdded(
  ctx: ServiceContext,
  ticketId: string,
  userId: string,
) {
  return createActivity(ctx, ticketId, "watcher_added", { userId });
}
