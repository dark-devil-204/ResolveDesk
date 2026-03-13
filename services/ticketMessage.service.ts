import { db } from "@/db/drizzle";
import { ticket, ticketMessage, user } from "@/db/schema";
import { ServiceContext } from "@/types/service-context";
import { and, eq } from "drizzle-orm";
import {
  activityMessageAdded,
  activityNoteAdded,
} from "./ticketActivity.service";

export async function getTicketMessages(ctx: ServiceContext, ticketId: string) {
  return db
    .select({
      ticketMessage,
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(ticketMessage)
    .innerJoin(ticket, eq(ticket.id, ticketMessage.ticketId))
    .leftJoin(user, eq(user.id, ticketMessage.senderId))
    .where(
      and(
        eq(ticketMessage.ticketId, ticketId),
        eq(ticket.organizationId, ctx.orgId),
      ),
    )
    .orderBy(ticketMessage.createdAt);
}

export async function createMessage(
  ctx: ServiceContext,
  ticketId: string,
  message: string,
) {
  const result = await db
    .insert(ticketMessage)
    .values({
      ticketId,
      senderId: ctx.userId,
      message,
      isInternal: false,
    })
    .returning();
  await activityMessageAdded(ctx, ticketId);
  return result[0];
}
export async function createInternalNote(
  ctx: ServiceContext,
  ticketId: string,
  message: string,
) {
  const result = await db
    .insert(ticketMessage)
    .values({
      ticketId,
      senderId: ctx.userId,
      message,
      isInternal: true,
    })
    .returning();

  await activityNoteAdded(ctx, ticketId);

  return result[0];
}
export async function deleteMessage(ctx: ServiceContext, messageId: string) {
  return db
    .delete(ticketMessage)
    .where(
      and(
        eq(ticketMessage.id, messageId),
        eq(ticketMessage.senderId, ctx.userId),
      ),
    );
}
