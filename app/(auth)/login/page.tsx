"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ShieldCheck, Sparkles, TimerReset } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { isSignupEnabledClient } from "@/lib/feature-flags";

export default function LoginPage() {
  const signupEnabled = isSignupEnabledClient();

  return (
    <div className="space-y-6">
      <motion.div
        className="text-center lg:hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Resolve Desk
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Need support?{" "}
          <Link
            href="/submit-ticket"
            className="font-medium text-foreground hover:underline"
          >
            Submit ticket
          </Link>
        </p>
        {signupEnabled ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Need an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground hover:underline"
            >
              Sign up
            </Link>
          </p>
        ) : null}
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-2 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <div className="rounded-lg border bg-card/80 px-2 py-2">
          <Sparkles className="mx-auto size-3.5 text-primary" />
          <p className="mt-1 text-[11px] text-muted-foreground">Fast demo</p>
        </div>
        <div className="rounded-lg border bg-card/80 px-2 py-2">
          <ShieldCheck className="mx-auto size-3.5 text-primary" />
          <p className="mt-1 text-[11px] text-muted-foreground">Secure auth</p>
        </div>
        <div className="rounded-lg border bg-card/80 px-2 py-2">
          <TimerReset className="mx-auto size-3.5 text-primary" />
          <p className="mt-1 text-[11px] text-muted-foreground">Live ops</p>
        </div>
      </motion.div>

      <LoginForm />
    </div>
  );
}
