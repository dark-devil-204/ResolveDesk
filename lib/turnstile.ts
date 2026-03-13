type VerifyTurnstileTokenInput = {
  token?: string;
  ip?: string;
};

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

function turnstileEnabledFlag() {
  return (
    (process.env.NEXT_PUBLIC_TURNSTILE_ENABLED ?? "true").toLowerCase() !==
    "false"
  );
}

export function isTurnstileEnabledServer() {
  return (
    turnstileEnabledFlag() &&
    Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) &&
    Boolean(process.env.TURNSTILE_SECRET_KEY)
  );
}

export function getClientIpAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined
  );
}

export async function verifyTurnstileToken({
  token,
  ip,
}: VerifyTurnstileTokenInput) {
  if (!isTurnstileEnabledServer()) {
    return;
  }

  if (!token) {
    throw new Response("Complete the security check", { status: 400 });
  }

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY!,
    response: token,
  });

  if (ip) {
    body.set("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Response("Security verification unavailable", { status: 502 });
  }

  const result = (await response.json()) as TurnstileVerifyResponse;

  if (!result.success) {
    throw new Response(
      result["error-codes"]?.includes("timeout-or-duplicate")
        ? "Security check expired. Please try again."
        : "Security check failed",
      { status: 400 },
    );
  }
}
