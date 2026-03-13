"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, LifeBuoy } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Turnstile, { type BoundTurnstileObject } from "react-turnstile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { publicTicketIntakeSchema } from "@/validators";

type PublicTicketInput = z.infer<typeof publicTicketIntakeSchema>;

export function PublicTicketIntakeForm() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const turnstileEnabled =
    (process.env.NEXT_PUBLIC_TURNSTILE_ENABLED ?? "true").toLowerCase() !==
      "false" && Boolean(turnstileSiteKey);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    ticketNumber: string;
    status: string;
  } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<BoundTurnstileObject | null>(null);

  const form = useForm<PublicTicketInput>({
    resolver: zodResolver(publicTicketIntakeSchema),
    defaultValues: {
      organizationSlug: process.env.NEXT_PUBLIC_DEMO_ORG_SLUG ?? "",
      name: "",
      email: "",
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: PublicTicketInput) {
    if (turnstileEnabled && !turnstileToken) {
      setError("Complete the security check before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const response = await fetch("/api/public/tickets", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          turnstileToken: turnstileEnabled ? turnstileToken : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        ticket?: { ticketNumber?: string; status?: string };
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to submit ticket.");
        return;
      }

      setSuccess({
        ticketNumber: payload?.ticket?.ticketNumber ?? "TICKET",
        status: payload?.ticket?.status ?? "open",
      });
      setTurnstileToken("");
      turnstileRef.current?.reset();

      form.reset({
        organizationSlug: values.organizationSlug,
        name: values.name,
        email: values.email,
        title: "",
        description: "",
      });
    } catch {
      setError("Unable to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LifeBuoy className="size-5" />
        </div>
        <CardTitle className="pt-2 text-2xl">
          Submit A Support Request
        </CardTitle>
        <CardDescription>
          This public form creates a ticket that your support team can handle in
          the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <FormField
              control={form.control}
              name="organizationSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace slug</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-support" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input placeholder="Alex Morgan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="alex@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cannot access billing dashboard"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Include steps to reproduce, urgency, and any screenshots context."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {turnstileEnabled ? (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  Verify you are human
                </p>
                <p className="text-xs text-muted-foreground">
                  This challenge blocks automated ticket spam before it reaches
                  your queue.
                </p>
                <div className="overflow-hidden rounded-md">
                  <Turnstile
                    sitekey={turnstileSiteKey}
                    size="flexible"
                    fixedSize
                    refreshExpired="auto"
                    onLoad={(_, boundTurnstile) => {
                      turnstileRef.current = boundTurnstile;
                    }}
                    onVerify={(token, boundTurnstile) => {
                      turnstileRef.current = boundTurnstile;
                      setTurnstileToken(token);
                      setError("");
                    }}
                    onExpire={(_, boundTurnstile) => {
                      turnstileRef.current = boundTurnstile;
                      setTurnstileToken("");
                    }}
                    onError={(_, boundTurnstile) => {
                      if (boundTurnstile) {
                        turnstileRef.current = boundTurnstile;
                      }
                      setTurnstileToken("");
                      setError(
                        "Security check failed to load. Refresh and try again.",
                      );
                    }}
                  />
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="flex items-center gap-2 rounded-md border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle2 className="size-4" />
                Submitted. Reference: {success.ticketNumber} ({success.status}).
              </p>
            ) : null}

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit ticket"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Team member?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
