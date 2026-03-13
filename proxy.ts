import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isSignupEnabledServer } from "@/lib/feature-flags";
import { getClientRateKey, limitRequest } from "@/lib/rate-limit";

function jsonTooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const rateKey = getClientRateKey(request);
    const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(
      request.method,
    );
    const isAuthApi = pathname.startsWith("/api/auth/");
    const isAuthSensitivePath =
      pathname.startsWith("/api/auth/sign-in") ||
      pathname.startsWith("/api/auth/sign-up") ||
      pathname.startsWith("/api/auth/forget-password") ||
      pathname.startsWith("/api/auth/reset-password");

    if (!isSignupEnabledServer() && pathname.startsWith("/api/auth/sign-up")) {
      return NextResponse.json(
        { error: "Signup is disabled for this demo." },
        { status: 403 },
      );
    }

    if (isWriteMethod) {
      const generic = await limitRequest("write", rateKey);
      if (!generic.allowed) {
        return jsonTooManyRequests(generic.retryAfterSeconds);
      }
    }

    if (isAuthApi) {
      const authLimit = await limitRequest("auth", rateKey);
      if (!authLimit.allowed) {
        return jsonTooManyRequests(authLimit.retryAfterSeconds);
      }
    }

    if (isAuthSensitivePath) {
      const sensitive = await limitRequest("auth-sensitive", rateKey);
      if (!sensitive.allowed) {
        return jsonTooManyRequests(sensitive.retryAfterSeconds);
      }
    }

    if (pathname === "/api/public/tickets" && request.method === "POST") {
      const intake = await limitRequest("public-intake", rateKey);
      if (!intake.allowed) {
        return jsonTooManyRequests(intake.retryAfterSeconds);
      }
    }

    return NextResponse.next();
  }

  if (!isSignupEnabledServer() && pathname === "/signup") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // THIS IS NOT SECURE!
  // This is the recommended approach to optimistically redirect users
  // We recommend handling auth checks in each page/route
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/signup"],
};
