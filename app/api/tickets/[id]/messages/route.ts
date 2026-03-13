import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import {
  createMessage,
  createInternalNote,
  getTicketMessages,
} from "@/services/ticketMessage.service";
import { createMessageSchema } from "@/validators";
import { NextResponse } from "next/server";

export const GET = apiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(request);
    const { id } = await context.params;
    const messages = await getTicketMessages(ctx, id);
    return NextResponse.json({ messages });
  },
);

export const POST = apiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(request);
    const { id } = await context.params;
    const body = await request.json();
    const data = createMessageSchema.parse(body);

    const message = data.isInternal
      ? await createInternalNote(ctx, id, data.message)
      : await createMessage(ctx, id, data.message);

    return NextResponse.json({ message }, { status: 201 });
  },
);
