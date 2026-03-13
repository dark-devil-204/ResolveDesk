import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import { getDashboardStats } from "@/services/ticket.service";
import { NextResponse } from "next/server";

export const GET = apiHandler(async (req: Request) => {
  const ctx = await requireOrgSession(req);
  const stats = await getDashboardStats(ctx);
  return NextResponse.json({ stats });
});
