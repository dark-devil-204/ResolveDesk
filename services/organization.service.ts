import { db } from "@/db/drizzle";
import { invitation, member, organization, user } from "@/db/schema";
import { and, eq } from "drizzle-orm";

type OrgMetadata = {
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
};

function parseMetadata(raw: string | null): OrgMetadata {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as OrgMetadata;
  } catch {
    return {};
  }
}

function stringifyMetadata(metadata: OrgMetadata): string {
  return JSON.stringify(metadata);
}

export async function getMembership(organizationId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(member)
    .where(
      and(eq(member.organizationId, organizationId), eq(member.userId, userId)),
    )
    .limit(1);

  return membership ?? null;
}

export async function listUserOrganizations(userId: string) {
  const rows = await db
    .select({
      organization,
      membership: {
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
      },
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, userId));

  return rows.map(({ organization: org, membership }) => ({
    ...org,
    role: membership.role,
    memberId: membership.id,
    joinedAt: membership.createdAt,
    archived: Boolean(parseMetadata(org.metadata).archived),
  }));
}

export async function getOrganizationById(organizationId: string) {
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  return org ?? null;
}

export async function createOrganizationForUser(
  userId: string,
  data: { name: string; slug: string },
) {
  const now = new Date();

  const [createdOrganization] = await db
    .insert(organization)
    .values({
      id: crypto.randomUUID(),
      name: data.name,
      slug: data.slug,
      createdAt: now,
      metadata: null,
    })
    .returning();

  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: createdOrganization.id,
    userId,
    role: "admin",
    createdAt: now,
  });

  return createdOrganization;
}

export async function updateOrganizationProfile(
  organizationId: string,
  data: { name: string; slug: string },
) {
  const result = await db
    .update(organization)
    .set({
      name: data.name,
      slug: data.slug,
    })
    .where(eq(organization.id, organizationId))
    .returning();

  return result[0] ?? null;
}

export async function archiveOrganization(
  organizationId: string,
  userId: string,
) {
  const org = await getOrganizationById(organizationId);

  if (!org) {
    return null;
  }

  const nextMetadata: OrgMetadata = {
    ...parseMetadata(org.metadata),
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy: userId,
  };

  const result = await db
    .update(organization)
    .set({ metadata: stringifyMetadata(nextMetadata) })
    .where(eq(organization.id, organizationId))
    .returning();

  return result[0] ?? null;
}

export async function getOrganizationMembersAndInvitations(
  organizationId: string,
) {
  const [members, invitations] = await Promise.all([
    db
      .select({
        member,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(member)
      .leftJoin(user, eq(user.id, member.userId))
      .where(eq(member.organizationId, organizationId)),
    db
      .select()
      .from(invitation)
      .where(eq(invitation.organizationId, organizationId)),
  ]);

  return { members, invitations };
}
