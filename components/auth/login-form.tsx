"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertCircle,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signInWithEmail } from "@/lib/auth-client";
import { loginSchema } from "@/validators";

type LoginInput = z.infer<typeof loginSchema>;

type DemoCredential = {
  role: string;
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "";
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";
  const demoLoginEnabled =
    (process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED ?? "").toLowerCase() ===
      "true" || process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED === "1";

  const demoCredentials: DemoCredential[] = [
    {
      role: "Admin",
      email: "admin@resolvedesk.com",
      password: "Admin123!",
    },
    {
      role: "Agent",
      email: "agent@resolvedesk.com",
      password: "Agent123!",
    },
    {
      role: "Customer",
      email: "customer@resolvedesk.com",
      password: "Customer123!",
    },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    setError("");

    try {
      const response = await signInWithEmail(values.email, values.password);
      if (response.error) {
        setError(response.error.message ?? "Unable to sign in.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    if (!demoEmail || !demoPassword) {
      setError("Demo credentials are not configured.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await signInWithEmail(demoEmail, demoPassword);
      if (response.error) {
        setError(
          response.error.message ?? "Unable to sign in to demo account.",
        );
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Unable to sign in to demo account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredential(credential: DemoCredential) {
    form.setValue("email", credential.email, { shouldValidate: true });
    form.setValue("password", credential.password, { shouldValidate: true });
    setError("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="relative overflow-hidden border-border/70 bg-card/92 shadow-xl backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--status-open),var(--status-in-progress),var(--status-resolved))]" />
        <CardHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="size-3" />
            Secure Team Access
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue managing your team inbox and ticket flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.28 }}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="hello@company.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.28 }}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {error ? (
                <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {error}
                </p>
              ) : null}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.28 }}
              >
                <Button
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <KeyRound className="size-4" />
                      Sign in
                    </>
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.28 }}
                className="space-y-3"
              >
                {demoLoginEnabled ? (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="outline"
                    type="button"
                    disabled={loading}
                    onClick={handleDemoLogin}
                  >
                    <ShieldCheck className="size-4" />
                    Use demo account
                  </Button>
                ) : null}

                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs font-medium text-foreground">
                    Demo credentials
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Click any row to auto-fill login fields.
                  </p>

                  <div className="mt-2 space-y-2">
                    {demoCredentials.map((credential) => (
                      <button
                        key={credential.role}
                        type="button"
                        className="w-full rounded-md border bg-background px-2 py-2 text-left text-xs transition-colors hover:bg-muted"
                        onClick={() => fillDemoCredential(credential)}
                        disabled={loading}
                      >
                        <p className="font-medium text-foreground">
                          {credential.role}
                        </p>
                        <p className="text-muted-foreground">
                          {credential.email}
                        </p>
                        <p className="text-muted-foreground">
                          {credential.password}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              <p className="text-center text-xs text-muted-foreground">
                Not part of the support team?{" "}
                <Link
                  href="/submit-ticket"
                  className="underline underline-offset-2"
                >
                  Submit a support ticket
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
