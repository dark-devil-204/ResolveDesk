import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import { getTicketAttachments } from "@/services/attachment.service";

export const GET = apiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(request);
    const { id } = await context.params;
    const attachments = await getTicketAttachments(ctx, id);
    return NextResponse.json({ attachments });
  },
);
