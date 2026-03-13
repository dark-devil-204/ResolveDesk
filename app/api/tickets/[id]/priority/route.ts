import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import { updateTicketPriority } from "@/services/ticket.service";
import { ticketPrioritySchema } from "@/validators";
import { NextResponse } from "next/server";

export const PATCH = apiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(request);
    const { id } = await context.params;
    const body = (await request.json()) as { priority?: unknown };
    const priority = ticketPrioritySchema.parse(body.priority);
    const updatedTicket = await updateTicketPriority(id, priority, ctx);
    return NextResponse.json({ ticket: updatedTicket }, { status: 200 });
  },
);
