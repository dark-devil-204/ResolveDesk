import { NextResponse } from "next/server";
import { seed } from "@/scripts/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    (process.env.DEMO_AUTO_REFRESH_ENABLED ?? "false").toLowerCase() !== "true"
  ) {
    return NextResponse.json(
      { skipped: true, message: "Demo auto refresh is disabled" },
      { status: 200 },
    );
  }

  await seed();

  return NextResponse.json({ success: true, message: "Demo data refreshed" });
}
