import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { organization, sla, ticketCategory, user } from "@/db/schema";
import { getTicketById } from "@/services/ticket.service";

export const GET = apiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const { orgId } = await requireOrgSession(request);
    const { id } = await context.params;

    const [ticket] = await getTicketById(id, orgId);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const [assignee, customer, category, ticketSla, org] = await Promise.all([
      ticket.assignedToId
        ? db.query.user.findFirst({ where: eq(user.id, ticket.assignedToId) })
        : Promise.resolve(null),
      ticket.createdById
        ? db.query.user.findFirst({ where: eq(user.id, ticket.createdById) })
        : Promise.resolve(null),
      ticket.categoryId
        ? db.query.ticketCategory.findFirst({
            where: eq(ticketCategory.id, ticket.categoryId),
          })
        : Promise.resolve(null),
      ticket.slaId
        ? db.query.sla.findFirst({ where: eq(sla.id, ticket.slaId) })
        : Promise.resolve(null),
      db.query.organization.findFirst({ where: eq(organization.id, orgId) }),
    ]);

    return NextResponse.json({
      ticket,
      assignee: assignee
        ? {
            id: assignee.id,
            name: assignee.name,
            email: assignee.email,
          }
        : null,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            email: customer.email,
          }
        : null,
      category: category
        ? {
            id: category.id,
            name: category.name,
          }
        : null,
      sla: ticketSla
        ? {
            id: ticketSla.id,
            name: ticketSla.name,
            firstResponseTime: ticketSla.firstResponseTime,
            resolutionTime: ticketSla.resolutionTime,
          }
        : null,
      organization: org
        ? {
            id: org.id,
            name: org.name,
          }
        : null,
    });
  },
);
