import { apiHandler } from "@/lib/api-handler";
import { requireOrgSession } from "@/lib/auth";
import {
  addWatcher,
  getWatchers,
  removeWatcher,
} from "@/services/watcher.service";
import { addWatcherSchema } from "@/validators";
import { NextResponse } from "next/server";
import { z } from "zod";

export const GET = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(req);
    const { id } = await context.params;
    const watchers = await getWatchers(ctx, id);
    return NextResponse.json({ watchers });
  },
);
export const POST = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(req);
    const { id } = await context.params;
    const body = addWatcherSchema.parse(await req.json());
    const watcher = await addWatcher(ctx, id, body.userId);
    return NextResponse.json({ watcher }, { status: 201 });
  },
);

export const DELETE = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const ctx = await requireOrgSession(req);
    const { id } = await context.params;
    const body = (await req.json()) as { userId?: unknown };
    const userId = z.string().min(1).parse(body.userId);
    await removeWatcher(ctx, id, userId);
    return NextResponse.json({ success: true });
  },
);
