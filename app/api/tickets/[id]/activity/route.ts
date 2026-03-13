import { requireOrgSession } from "@/lib/auth";
import { getTicketActivities } from "@/services/ticketActivity.service";
import { apiHandler } from "@/lib/api-handler";
import { NextResponse } from "next/server";

export const GET = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(req);
    const { id } = await context.params;
    const activities = await getTicketActivities(ctx, id);
    return NextResponse.json({ activities });
  },
);
