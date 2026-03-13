function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function isSignupEnabledClient() {
  return parseBoolean(process.env.NEXT_PUBLIC_ENABLE_SIGNUP, true);
}

export function isSignupEnabledServer() {
  return parseBoolean(
    process.env.ENABLE_SIGNUP ?? process.env.NEXT_PUBLIC_ENABLE_SIGNUP,
    true,
  );
}
