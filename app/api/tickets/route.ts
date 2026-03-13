import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import { createTicket, getFilteredTickets } from "@/services/ticket.service";
import { createTicketSchema, ticketFiltersQuerySchema } from "@/validators";
import { NextResponse } from "next/server";

export const GET = apiHandler(async (req: Request) => {
  const ctx = await requireOrgSession(req);
  const { searchParams } = new URL(req.url);
  const filters = ticketFiltersQuerySchema.parse({
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    assignedTo: searchParams.get("assignedTo") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  const { tickets, total } = await getFilteredTickets(ctx, filters);
  return NextResponse.json({
    tickets,
    total,
    page: filters.page,
    limit: filters.limit,
  });
});

export const POST = apiHandler(async (request: Request) => {
  const { orgId, userId } = await requireOrgSession(request);
  const data = createTicketSchema.parse(await request.json());

  const ticket = await createTicket({
    title: data.title,
    description: data.description,
    organizationId: orgId,
    createdById: userId,
  });

  return NextResponse.json({ ticket }, { status: 201 });
});
