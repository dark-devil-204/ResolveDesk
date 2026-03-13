"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Building2,
  CircleCheckBig,
  Globe,
  Shield,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { authClient, signOutFromSession } from "@/lib/auth-client";

const capabilityCards = [
  {
    title: "Public Intake",
    description:
      "Let customers submit issues from a public form while your team handles tickets privately.",
    icon: Globe,
  },
  {
    title: "Team Workspace",
    description:
      "Role-aware dashboard, org members, assignees, and workflow controls for agents/admins.",
    icon: Users,
  },
  {
    title: "Secure Defaults",
    description:
      "Validation, auth checks, and Upstash-backed API rate limiting in proxy middleware.",
    icon: Shield,
  },
];

const kpis = [
  { label: "Avg first response", value: "11m" },
  { label: "SLA at risk", value: "3" },
  { label: "Queue visibility", value: "100%" },
  { label: "Manual triage saved", value: "42%" },
];

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await signOutFromSession();
    router.push("/login");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,var(--status-open),transparent_24%),radial-gradient(circle_at_92%_18%,var(--status-in-progress),transparent_26%),radial-gradient(circle_at_62%_82%,var(--status-resolved),transparent_24%),linear-gradient(130deg,hsl(var(--background))_15%,hsl(var(--muted))_120%)] opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.45)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.45)_1px,transparent_1px)] bg-size-[42px_42px] opacity-45" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/85 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur-sm">
            <span className="size-2 rounded-full bg-emerald-500" />
            Resolve Desk
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isPending ? (
              <Button variant="ghost" disabled>
                Checking...
              </Button>
            ) : session?.user ? (
              <>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Signed in as {session.user.name}
                </span>
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
            )}

            <Button asChild variant="outline">
              <Link href="/submit-ticket">Submit Ticket</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Badge variant="info" className="gap-1.5 px-3 py-1 text-[11px]">
              <Sparkles className="size-3.5" />
              Freelance-ready product demo
            </Badge>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Customer + Agent Experience
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.03]">
              Show clients a full support platform, not just a dashboard mock.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Public ticket intake, role-aware workspace operations, assignment,
              SLA controls, and analytics in one polished workflow.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="justify-between sm:min-w-48">
                <Link href="/login">
                  Open Team Console
                  <ArrowUpRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="sm:min-w-48"
              >
                <Link href="/submit-ticket">Try Public Intake</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {kpis.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border bg-card/80 px-4 py-3 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <Card className="border-border/70 bg-card/88 shadow-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Interactive Demo Paths</CardTitle>
                <CardDescription>
                  Let prospects test both sides of your product in 60 seconds.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs defaultValue="customer" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="customer">Customer Path</TabsTrigger>
                    <TabsTrigger value="agent">Agent Path</TabsTrigger>
                  </TabsList>

                  <TabsContent value="customer" className="space-y-3 pt-3">
                    <FlowStep
                      number="1"
                      title="Customer submits /submit-ticket"
                      detail="Validated intake form creates a real ticket with reference number."
                    />
                    <FlowStep
                      number="2"
                      title="Ticket enters organization queue"
                      detail="Status starts open and appears instantly in dashboard filters."
                    />
                    <FlowStep
                      number="3"
                      title="Team replies + resolves"
                      detail="Conversation, internal notes, watchers, and SLA tracking complete the flow."
                    />
                  </TabsContent>

                  <TabsContent value="agent" className="space-y-3 pt-3">
                    <FlowStep
                      number="1"
                      title="Use demo account to sign in"
                      detail="No friction for reviewers; they land directly in workspace operations."
                    />
                    <FlowStep
                      number="2"
                      title="Triage with queue controls"
                      detail="Update status, priority, assignment, and activity with validated APIs."
                    />
                    <FlowStep
                      number="3"
                      title="Show metrics + scale readiness"
                      detail="Upstash-backed rate limiting and role-based boundaries reassure clients."
                    />
                  </TabsContent>
                </Tabs>

                <Separator />

                {capabilityCards.map(({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-lg border bg-background/70 p-3 transition-colors hover:bg-muted/45"
                  >
                    <div className="mb-2 inline-flex rounded-md bg-primary/10 p-2 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <QuickCard
            icon={Ticket}
            title="Customer Intake"
            description="Public form creates real tickets for your org without exposing dashboard access."
            href="/submit-ticket"
            cta="Open intake"
          />
          <QuickCard
            icon={Building2}
            title="Operations View"
            description="Queue filtering, assignee controls, statuses, priorities, and conversation timeline."
            href="/dashboard"
            cta="View dashboard"
          />
          <QuickCard
            icon={ShieldCheck}
            title="Security Story"
            description="Auth gating, zod validation, and distributed rate limiting for demo-safe public launch."
            href="/login"
            cta="Try login"
          />
        </section>
      </div>
    </main>
  );
}

function FlowStep({
  number,
  title,
  detail,
}: {
  number: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-background/80 p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
          {number}
        </span>
        <p className="font-medium">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function QuickCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Card className="border-border/70 bg-card/85 backdrop-blur-sm transition-colors hover:bg-card">
      <CardHeader className="pb-2">
        <div className="mb-2 inline-flex rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button asChild variant="ghost" className="w-full justify-between">
          <Link href={href}>
            {cta}
            <CircleCheckBig className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
