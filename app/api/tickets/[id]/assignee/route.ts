import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { member, ticket } from "@/db/schema";
import { activityAssigned } from "@/services/ticketActivity.service";

const assignTicketSchema = z.object({
  assigneeUserId: z.string().min(1).nullable(),
});

export const PATCH = apiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(request);
    const { id } = await context.params;
    const body = assignTicketSchema.parse(await request.json());

    if (body.assigneeUserId) {
      const [membership] = await db
        .select({ userId: member.userId })
        .from(member)
        .where(
          and(
            eq(member.organizationId, ctx.orgId),
            eq(member.userId, body.assigneeUserId),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new Response("Assignee must be a member of this organization", {
          status: 400,
        });
      }
    }

    const [updated] = await db
      .update(ticket)
      .set({ assignedToId: body.assigneeUserId })
      .where(and(eq(ticket.id, id), eq(ticket.organizationId, ctx.orgId)))
      .returning();

    if (!updated) {
      throw new Response("Ticket not found", { status: 404 });
    }

    if (body.assigneeUserId) {
      await activityAssigned(ctx, id, body.assigneeUserId);
    }

    return NextResponse.json({ ticket: updated });
  },
);
