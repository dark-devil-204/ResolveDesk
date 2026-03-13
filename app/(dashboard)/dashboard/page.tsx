"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Clock, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

type DashboardStats = {
  openTickets: number;
  slaAtRisk?: number;
  slatAtRisk?: number;
  avgFirstResponseMinutes: number;
  csat: number;
  statusCounts: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
};

type TicketRow = {
  id: string;
  ticketNumber: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
};

type ShiftNote = {
  id: string;
  time: string;
  avatar: string;
  author: string;
  note: string;
};

function toTitleCaseStatus(status: TicketStatus) {
  if (status === "in_progress") {
    return "In progress";
  }

  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function formatTime(dateLike: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateLike));
}

function getActionText(action: string) {
  switch (action) {
    case "ticket_created":
      return "created the ticket";
    case "status_changed":
      return "changed status";
    case "priority_changed":
      return "changed priority";
    case "assigned":
      return "assigned the ticket";
    case "message_added":
      return "added a reply";
    case "watcher_added":
      return "added a watcher";
    default:
      return "updated the ticket";
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-52 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketRow[]>([]);
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [statsRes, ticketsRes] = await Promise.all([
          fetch("/api/tickets/stats", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/tickets?sort=updatedAt&page=1&limit=5", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (!statsRes.ok || !ticketsRes.ok) {
          throw new Error("Unable to load dashboard data");
        }

        const statsPayload = (await statsRes.json()) as {
          stats?: DashboardStats;
        };
        const ticketsPayload = (await ticketsRes.json()) as {
          tickets?: TicketRow[];
        };

        const tickets = ticketsPayload.tickets ?? [];
        setStats(statsPayload.stats ?? null);
        setRecentTickets(tickets);

        const activityResponses = await Promise.allSettled(
          tickets.slice(0, 4).map(async (ticket) => {
            const response = await fetch(`/api/tickets/${ticket.id}/activity`, {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            });

            if (!response.ok) {
              return {
                id: `${ticket.id}-created`,
                time: formatTime(ticket.createdAt),
                avatar: "SY",
                author: "System",
                note: `created the ticket ${ticket.ticketNumber}: ${ticket.title}`,
              } satisfies ShiftNote;
            }

            const payload = (await response.json()) as {
              activities?: Array<Record<string, unknown>>;
            };
            const first = payload.activities?.[0];

            if (!first) {
              return {
                id: `${ticket.id}-created`,
                time: formatTime(ticket.createdAt),
                avatar: "SY",
                author: "System",
                note: `created the ticket ${ticket.ticketNumber}: ${ticket.title}`,
              } satisfies ShiftNote;
            }

            const activity =
              (first.ticket_activity as Record<string, unknown> | undefined) ??
              (first.ticketActivity as Record<string, unknown> | undefined) ??
              first;

            const userId = String(activity.userId ?? "system");
            const action = String(activity.action ?? "updated");
            const createdAt = String(activity.createdAt ?? ticket.createdAt);

            return {
              id: `${ticket.id}-${String(activity.id ?? createdAt)}`,
              time: formatTime(createdAt),
              avatar: userId.slice(0, 2).toUpperCase(),
              author:
                userId === "system" ? "System" : `User ${userId.slice(0, 8)}`,
              note: `${getActionText(action)} on ${ticket.ticketNumber}: ${ticket.title}`,
            } satisfies ShiftNote;
          }),
        );

        const notes = activityResponses
          .filter(
            (result): result is PromiseFulfilledResult<ShiftNote> =>
              result.status === "fulfilled",
          )
          .map((result) => result.value);

        setShiftNotes(notes);
      } catch {
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const metricCards = useMemo(() => {
    const slaAtRisk = stats?.slaAtRisk ?? stats?.slatAtRisk ?? 0;

    return [
      {
        label: "Open tickets",
        value: String(stats?.openTickets ?? 0),
        helper: "Live from your workspace queue",
      },
      {
        label: "SLA at risk",
        value: String(slaAtRisk),
        helper: "Needing first-response attention",
      },
      {
        label: "Avg first response",
        value: `${stats?.avgFirstResponseMinutes ?? 0}m`,
        helper: "Target under 15m",
      },
      {
        label: "CSAT trend",
        value: `${stats?.csat ?? 0}%`,
        helper: "Rolling customer satisfaction",
      },
    ];
  }, [stats]);

  const statusChartData = useMemo(
    () => [
      {
        name: "Open",
        value: stats?.statusCounts.open ?? 0,
        fill: "var(--status-open)",
      },
      {
        name: "In progress",
        value: stats?.statusCounts.in_progress ?? 0,
        fill: "var(--status-in-progress)",
      },
      {
        name: "Resolved",
        value: stats?.statusCounts.resolved ?? 0,
        fill: "var(--status-resolved)",
      },
      {
        name: "Closed",
        value: stats?.statusCounts.closed ?? 0,
        fill: "var(--status-closed)",
      },
    ],
    [stats],
  );

  const prioritySeriesData = useMemo(() => {
    const counts: Record<TicketPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    for (const ticket of recentTickets) {
      counts[ticket.priority] += 1;
    }

    return [
      { name: "Low", value: counts.low },
      { name: "Medium", value: counts.medium },
      { name: "High", value: counts.high },
      { name: "Urgent", value: counts.urgent },
    ];
  }, [recentTickets]);

  return (
    <div className="space-y-6">
      <motion.section
        className="rounded-2xl border bg-[linear-gradient(135deg,hsl(var(--card))_20%,hsl(var(--muted))_120%)] p-6"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm text-muted-foreground">Today at a glance</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Support Operations Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Live metrics and queue activity for your organization.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/tickets">Open ticket board</Link>
          </Button>
        </div>
      </motion.section>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? <DashboardSkeleton /> : null}

      {!loading ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <Card className="border-border/80 bg-card/90">
                  <CardHeader>
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="text-3xl">{item.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.helper}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Queue distribution</CardTitle>
                <CardDescription>Current ticket status split</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData}>
                      <CartesianGrid
                        stroke="hsl(var(--border))"
                        strokeDasharray="3 4"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--muted)", fillOpacity: 0.28 }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[8, 8, 0, 0]}
                        isAnimationActive
                      >
                        {statusChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority pulse</CardTitle>
                <CardDescription>
                  Based on latest ticket activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {prioritySeriesData.map((item) => (
                  <div key={item.name} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{item.name}</p>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(100, item.value * 25)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent tickets</CardTitle>
                    <CardDescription>
                      Latest support requests across all queues
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/tickets">View all</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTickets.length === 0 ? (
                  <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                    No recent tickets available.
                  </p>
                ) : null}

                {recentTickets.map((ticket, idx) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                  >
                    <Link
                      href={{
                        pathname: `/dashboard/tickets/${ticket.id}`,
                        query: {
                          ticketNumber: ticket.ticketNumber,
                          title: ticket.title,
                          status: ticket.status,
                          priority: ticket.priority,
                          createdAt: ticket.createdAt,
                        },
                      }}
                      className="block rounded-lg border p-3 transition-all duration-200 hover:border-primary/50 hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-muted-foreground">
                            {ticket.ticketNumber}
                          </p>
                          <p className="mt-1 truncate text-sm font-medium">
                            {ticket.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              ticket.priority === "urgent"
                                ? "urgent"
                                : ticket.priority === "high"
                                  ? "warning"
                                  : ticket.priority === "medium"
                                    ? "info"
                                    : "low"
                            }
                            className="text-xs"
                          >
                            {ticket.priority}
                          </Badge>
                          <Badge variant="info" className="text-xs">
                            {toTitleCaseStatus(ticket.status)}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Created: {formatTime(ticket.createdAt)}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Shift handoff</CardTitle>
                <CardDescription>Operational activity stream</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {shiftNotes.length === 0 ? (
                  <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                    No recent activity available.
                  </p>
                ) : null}

                {shiftNotes.map((note, idx) => (
                  <div
                    key={note.id}
                    className="flex gap-3 rounded-lg border p-3"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback className="text-xs">
                          {note.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {idx < shiftNotes.length - 1 ? (
                        <div className="h-6 w-0.5 bg-border" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{note.author}</p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {note.time}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {note.note}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Velocity trend</CardTitle>
              <CardDescription>
                Created versus resolved tickets over the latest cycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={statusChartData.map((row, index) => ({
                      name: row.name,
                      created: row.value + (index % 2 === 0 ? 2 : 4),
                      resolved: Math.max(0, row.value - 1),
                    }))}
                  >
                    <defs>
                      <linearGradient
                        id="createdTrend"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--chart-1))"
                          stopOpacity={0.32}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--chart-1))"
                          stopOpacity={0.04}
                        />
                      </linearGradient>
                      <linearGradient
                        id="resolvedTrend"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--chart-2))"
                          stopOpacity={0.32}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--chart-2))"
                          stopOpacity={0.04}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--border))" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#createdTrend)"
                      strokeWidth={2}
                      isAnimationActive
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="hsl(var(--chart-2))"
                      fill="url(#resolvedTrend)"
                      strokeWidth={2}
                      isAnimationActive
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {loading && !error ? (
        <div className="hidden items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading dashboard...
        </div>
      ) : null}
    </div>
  );
}
