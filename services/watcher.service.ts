import { db } from "@/db/drizzle";
import { ticket, ticketWatcher, user } from "@/db/schema";
import { ServiceContext } from "@/types/service-context";
import { and, eq } from "drizzle-orm";
import { activityWatcherAdded } from "./ticketActivity.service";

export async function getWatchers(ctx: ServiceContext, ticketId: string) {
  return db
    .select({
      ticketWatcher,
      watcher: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(ticketWatcher)
    .innerJoin(ticket, eq(ticket.id, ticketWatcher.ticketId))
    .leftJoin(user, eq(user.id, ticketWatcher.userId))
    .where(
      and(
        eq(ticketWatcher.ticketId, ticketId),
        eq(ticket.organizationId, ctx.orgId),
      ),
    );
}
export async function addWatcher(
  ctx: ServiceContext,
  ticketId: string,
  userId: string,
) {
  const result = await db
    .insert(ticketWatcher)
    .values({
      ticketId,
      userId,
    })
    .returning();
  await activityWatcherAdded(ctx, ticketId, userId);
  return result[0];
}
export async function removeWatcher(
  ctx: ServiceContext,
  ticketId: string,
  userId: string,
) {
  return db
    .delete(ticketWatcher)
    .where(
      and(
        eq(ticketWatcher.ticketId, ticketId),
        eq(ticketWatcher.userId, userId),
      ),
    );
}
