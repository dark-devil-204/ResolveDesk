import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import { updateTicketStatus } from "@/services/ticket.service";
import { ticketStatusSchema } from "@/validators";
import { NextResponse } from "next/server";

export const PATCH = apiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { orgId } = await requireOrgSession(request);
    const { id } = await context.params;
    const body = (await request.json()) as { status?: unknown };
    const status = ticketStatusSchema.parse(body.status);
    const updatedTicket = await updateTicketStatus(id, status, orgId);
    return NextResponse.json({ ticket: updatedTicket }, { status: 200 });
  },
);
