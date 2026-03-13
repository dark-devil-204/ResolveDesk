import { apiHandler } from "@/lib/api-handler";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createOrganizationSchema } from "@/validators";
import {
  createOrganizationForUser,
  listUserOrganizations,
} from "@/services/organization.service";

export const GET = apiHandler(async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const organizations = await listUserOrganizations(session.session.userId);
  return NextResponse.json({ organizations });
});

export const POST = apiHandler(async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const data = createOrganizationSchema.parse(await request.json());
  const organization = await createOrganizationForUser(
    session.session.userId,
    data,
  );

  return NextResponse.json({ organization }, { status: 201 });
});
