import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { auth } from "@/lib/auth";
import {
  getMembership,
  getOrganizationMembersAndInvitations,
} from "@/services/organization.service";

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

    const { members, invitations } =
      await getOrganizationMembersAndInvitations(organizationId);

    return NextResponse.json({ organizationId, members, invitations });
  },
);
