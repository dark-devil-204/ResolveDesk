import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import { deleteMessage } from "@/services/ticketMessage.service";
import { NextResponse } from "next/server";

export const DELETE = apiHandler(
  async (req: Request, context: { params: Promise<{ messageId: string }> }) => {
    const ctx = await requireOrgSession(req);
    const { messageId } = await context.params;
    const message = await deleteMessage(ctx, messageId);
    return NextResponse.json({ message });
  },
);
