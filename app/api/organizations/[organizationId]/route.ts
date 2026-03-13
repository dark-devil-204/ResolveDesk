import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { auth } from "@/lib/auth";
import { updateOrganizationSchema } from "@/validators";
import {
  archiveOrganization,
  getMembership,
  getOrganizationById,
  updateOrganizationProfile,
} from "@/services/organization.service";

function canManageOrganization(role: string) {
  return role.includes("admin") || role.includes("owner");
}

export const GET = apiHandler(
  async (
    request: Request,
    context: { params: Promise<{ organizationId: string }> },
  ) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const { organizationId } = await context.params;
    const membership = await getMembership(
      organizationId,
      session.session.userId,
    );

    if (!membership) {
      throw new Response("Forbidden", { status: 403 });
    }

    const organization = await getOrganizationById(organizationId);

    if (!organization) {
      throw new Response("Not Found", { status: 404 });
    }

    return NextResponse.json({ organization, membership });
  },
);

export const PATCH = apiHandler(
  async (
    request: Request,
    context: { params: Promise<{ organizationId: string }> },
  ) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const { organizationId } = await context.params;
    const membership = await getMembership(
      organizationId,
      session.session.userId,
    );

    if (!membership) {
      throw new Response("Forbidden", { status: 403 });
    }

    if (!canManageOrganization(membership.role)) {
      throw new Response("Forbidden", { status: 403 });
    }

    const data = updateOrganizationSchema.parse(await request.json());
    const organization = await updateOrganizationProfile(organizationId, data);

    if (!organization) {
      throw new Response("Not Found", { status: 404 });
    }

    return NextResponse.json({ organization });
  },
);

export const DELETE = apiHandler(
  async (
    request: Request,
    context: { params: Promise<{ organizationId: string }> },
  ) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const { organizationId } = await context.params;
    const membership = await getMembership(
      organizationId,
      session.session.userId,
    );

    if (!membership) {
      throw new Response("Forbidden", { status: 403 });
    }

    if (!canManageOrganization(membership.role)) {
      throw new Response("Forbidden", { status: 403 });
    }

    const organization = await archiveOrganization(
      organizationId,
      session.session.userId,
    );

    if (!organization) {
      throw new Response("Not Found", { status: 404 });
    }

    return NextResponse.json({ organization });
  },
);
