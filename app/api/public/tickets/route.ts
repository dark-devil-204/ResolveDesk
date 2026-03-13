import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { apiHandler } from "@/lib/api-handler";
import { getClientIpAddress, verifyTurnstileToken } from "@/lib/turnstile";
import { db } from "@/db/drizzle";
import { organization, user } from "@/db/schema";
import { createTicket } from "@/services/ticket.service";
import { publicTicketIntakeRequestSchema } from "@/validators";

export const POST = apiHandler(async (request: Request) => {
  const payload = publicTicketIntakeRequestSchema.parse(await request.json());

  await verifyTurnstileToken({
    token: payload.turnstileToken,
    ip: getClientIpAddress(request),
  });

  const [org] = await db
    .select({ id: organization.id, slug: organization.slug })
    .from(organization)
    .where(eq(organization.slug, payload.organizationSlug))
    .limit(1);

  if (!org) {
    throw new Response("Organization not found", { status: 404 });
  }

  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, payload.email))
    .limit(1);

  let customerId = existingUser?.id;

  if (!customerId) {
    const [createdUser] = await db
      .insert(user)
      .values({
        id: `public_${crypto.randomUUID()}`,
        name: payload.name,
        email: payload.email,
      })
      .returning({ id: user.id });

    if (!createdUser) {
      throw new Response("Unable to create customer identity", { status: 500 });
    }

    customerId = createdUser.id;
  }

  const ticket = await createTicket({
    title: payload.title,
    description: payload.description,
    organizationId: org.id,
    createdById: customerId,
  });

  return NextResponse.json(
    {
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
      },
    },
    { status: 201 },
  );
});
