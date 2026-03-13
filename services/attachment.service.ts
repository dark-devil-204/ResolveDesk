import { db } from "@/db/drizzle";
import { attachment, ticket } from "@/db/schema";
import { ServiceContext } from "@/types/service-context";
import { and, eq } from "drizzle-orm";

export async function createAttachment(
  ctx: ServiceContext,
  data: {
    ticketId: string;
    messageId?: string | null;
    url: string;
    fileName: string;
  },
) {
  const result = await db
    .insert(attachment)
    .values({
      ticketId: data.ticketId,
      messageId: data.messageId,
      url: data.url,
      fileName: data.fileName,
      uploadedById: ctx.userId,
    })
    .returning();
  return result[0];
}
export async function getTicketAttachments(
  ctx: ServiceContext,
  ticketId: string,
) {
  return db
    .select()
    .from(attachment)
    .innerJoin(ticket, eq(ticket.id, attachment.ticketId))
    .where(
      and(
        eq(attachment.ticketId, ticketId),
        eq(ticket.organizationId, ctx.orgId),
      ),
    );
}

export async function deleteAttachment(
  ctx: ServiceContext,
  attachmentId: string,
) {
  return db
    .delete(attachment)
    .where(
      and(
        eq(attachment.id, attachmentId),
        eq(attachment.uploadedById, ctx.userId),
      ),
    )
    .returning();
}
