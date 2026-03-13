import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [organization({ creatorRole: "admin" })],
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
});

export async function requireOrgSession(
  request: Request,
): Promise<{ userId: string; orgId: string }> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  let orgId = session.session.activeOrganizationId;

  if (!orgId) {
    const [membership] = await db
      .select({ organizationId: schema.member.organizationId })
      .from(schema.member)
      .where(eq(schema.member.userId, session.session.userId))
      .limit(1);

    orgId = membership?.organizationId ?? null;
  }

  if (!orgId) {
    throw new Response("Organization not found for user", { status: 400 });
  }

  return {
    userId: session.session.userId,
    orgId,
  };
}
