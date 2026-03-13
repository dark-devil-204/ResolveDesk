"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { createTicketSchema } from "@/validators";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";
type CreateTicketInput = z.infer<typeof createTicketSchema>;

type TicketRow = {
  id: string;
  ticketNumber: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToId: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  firstResponseDeadline?: string | null;
  resolutionDeadline?: string | null;
  createdAt: string;
};

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

const statusTabs: Array<{ id: TicketStatus; label: string }> = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

const priorityColor = {
  urgent: "urgent",
  high: "warning",
  medium: "info",
  low: "low",
};

const statusColor = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "secondary",
};

function formatRelativeDate(dateLike: string) {
  const date = new Date(dateLike);
  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h ago`;
  }

  return `${Math.floor(diffMs / day)}d ago`;
}

function formatSlaRemaining(
  firstResponseDeadline?: string | null,
  resolutionDeadline?: string | null,
) {
  const deadline = firstResponseDeadline ?? resolutionDeadline;

  if (!deadline) {
    return null;
  }

  const target = new Date(deadline).getTime();
  if (Number.isNaN(target)) {
    return null;
  }

  const diff = target - Date.now();

  if (diff <= 0) {
    return "SLA overdue";
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `SLA ${days}d ${hours}h remaining`;
  }

  if (hours > 0) {
    return `SLA ${hours}h ${minutes}m remaining`;
  }

  return `SLA ${minutes}m remaining`;
}

function TicketsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-60 w-full lg:col-span-2" />
        <Skeleton className="h-60 w-full" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<TicketStatus>("in_progress");
  const [priority, setPriority] = useState<TicketPriority>("low");
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 5;

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const searchRef = useRef(searchText);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "1") {
      setCreateOpen(true);
    }
  }, []);

  useEffect(() => {
    searchRef.current = searchText;
  }, [searchText]);

  const createTicketForm = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        status,
        priority,
        sort,
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (searchRef.current.trim()) {
        params.set("q", searchRef.current.trim());
      }

      const [ticketsResponse, statsResponse] = await Promise.all([
        fetch(`/api/tickets?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/tickets/stats", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (!ticketsResponse.ok || !statsResponse.ok) {
        throw new Error("Unable to load tickets.");
      }

      const data = (await ticketsResponse.json()) as {
        tickets?: TicketRow[];
        total?: number;
      };
      const statsPayload = (await statsResponse.json()) as {
        stats?: DashboardStats;
      };

      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
      setStats(statsPayload.stats ?? null);
    } catch {
      setError("Unable to load tickets right now.");
    } finally {
      setLoading(false);
    }
  }, [page, priority, sort, status]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, priority, sort]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    await loadTickets();
  }

  async function handleCreateTicket(values: CreateTicketInput) {
    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: values.title,
          description: values.description?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Unable to create ticket.");
      }

      setCreateOpen(false);
      createTicketForm.reset();
      await loadTickets();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create ticket.";

      setError(message);
    } finally {
      setCreating(false);
    }
  }

  const tabCounts = useMemo(() => {
    const counts: Record<TicketStatus, number> = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    for (const ticket of tickets) {
      counts[ticket.status] += 1;
    }

    return counts;
  }, [tickets]);

  const chartData = useMemo(
    () => [
      {
        name: "Open",
        value: stats?.statusCounts.open ?? tabCounts.open,
        fill: "var(--status-open)",
      },
      {
        name: "In progress",
        value: stats?.statusCounts.in_progress ?? tabCounts.in_progress,
        fill: "var(--status-in-progress)",
      },
      {
        name: "Resolved",
        value: stats?.statusCounts.resolved ?? tabCounts.resolved,
        fill: "var(--status-resolved)",
      },
      {
        name: "Closed",
        value: stats?.statusCounts.closed ?? tabCounts.closed,
        fill: "var(--status-closed)",
      },
    ],
    [stats, tabCounts],
  );

  const urgentCount = useMemo(
    () => tickets.filter((ticket) => ticket.priority === "urgent").length,
    [tickets],
  );

  return (
    <div className="space-y-6">
      <motion.section
        className="rounded-2xl border bg-[linear-gradient(130deg,hsl(var(--card))_20%,hsl(var(--muted))_120%)] p-6"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" />
              Product-grade ticket management
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Tickets Command Center
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage queue state, priorities, and assignment flow in one place.
            </p>
          </div>
          <Dialog
            open={createOpen}
            onOpenChange={(nextOpen) => {
              setCreateOpen(nextOpen);
              if (!nextOpen) {
                createTicketForm.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Ticket</DialogTitle>
                <DialogDescription>
                  Submit a new support issue to your current organization.
                </DialogDescription>
              </DialogHeader>

              <Form {...createTicketForm}>
                <form
                  onSubmit={createTicketForm.handleSubmit(handleCreateTicket)}
                  className="space-y-4"
                >
                  <FormField
                    control={createTicketForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe the issue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createTicketForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Optional details for the support team"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Ticket"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.section>

      {loading ? <TicketsSkeleton /> : null}

      {!loading ? (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Queue status analytics
                  <TrendingUp className="size-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Live distribution by ticket status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
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
                        cursor={{ fill: "var(--muted)", fillOpacity: 0.24 }}
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
                        {chartData.map((entry) => (
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
                <CardTitle>Key metrics</CardTitle>
                <CardDescription>Snapshot from current filters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Open</p>
                  <p className="text-2xl font-semibold">
                    {stats?.statusCounts.open ?? tabCounts.open}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">In progress</p>
                  <p className="text-2xl font-semibold">
                    {stats?.statusCounts.in_progress ?? tabCounts.in_progress}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Urgent</p>
                  <p className="text-2xl font-semibold">{urgentCount}</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Support queue</CardTitle>
              <CardDescription>
                Filter and inspect tickets with quick actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 pb-2">
                {statusTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={tab.id === status ? "default" : "outline"}
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => setStatus(tab.id)}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "ml-2 inline-block min-w-5 rounded-full px-1.5 py-0 text-xs font-semibold",
                        tab.id === status
                          ? "bg-primary-foreground/30"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {stats?.statusCounts[tab.id] ?? tabCounts[tab.id]}
                    </span>
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as TicketPriority)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={sort}
                    onValueChange={(value) =>
                      setSort(value as "createdAt" | "updatedAt")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Newest</SelectItem>
                      <SelectItem value="updatedAt">
                        Recently Updated
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search tickets by title"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </form>
              </div>

              {error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="space-y-2">
                {tickets.length === 0 ? (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    No tickets found for the selected filters.
                  </div>
                ) : null}

                {tickets.map((ticket, idx) => {
                  const slaRemaining = formatSlaRemaining(
                    ticket.firstResponseDeadline,
                    ticket.resolutionDeadline,
                  );

                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.02 }}
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
                        className="flex rounded-lg border p-3 text-left transition-all duration-200 hover:border-primary/50 hover:bg-muted/40"
                      >
                        <div className="flex w-full items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-muted-foreground">
                                {ticket.ticketNumber}
                              </span>
                              <Badge
                                variant={
                                  priorityColor[
                                    ticket.priority as keyof typeof priorityColor
                                  ] as
                                    | "destructive"
                                    | "warning"
                                    | "info"
                                    | "low"
                                    | "urgent"
                                }
                                className="text-xs"
                              >
                                {ticket.priority}
                              </Badge>
                              <Badge
                                variant={
                                  statusColor[
                                    ticket.status as keyof typeof statusColor
                                  ] as
                                    | "info"
                                    | "warning"
                                    | "success"
                                    | "secondary"
                                }
                                className="text-xs"
                              >
                                {ticket.status === "in_progress"
                                  ? "In Progress"
                                  : ticket.status.charAt(0).toUpperCase() +
                                    ticket.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="mt-2 font-medium leading-tight">
                              {ticket.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {formatRelativeDate(ticket.createdAt)}
                              </span>
                              {slaRemaining ? (
                                <Badge
                                  variant={
                                    slaRemaining === "SLA overdue"
                                      ? "destructive"
                                      : "warning"
                                  }
                                  className="text-[11px]"
                                >
                                  {slaRemaining}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(ticket.assigneeName ?? "UN")
                                  .split(" ")
                                  .map((part) => part[0] ?? "")
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="hidden text-sm font-medium text-foreground sm:inline">
                              {ticket.assigneeName ?? "Unassigned"}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
                return (
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <p className="text-xs text-muted-foreground">
                      Page {page} of {totalPages} &mdash; {total} ticket
                      {total !== 1 ? "s" : ""}
                    </p>
                    <PaginationBar
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages = buildPageNumbers(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }}
            aria-disabled={page === 1}
            className={cn(page === 1 && "pointer-events-none opacity-50")}
          />
        </PaginationItem>

        {pages.map((entry, idx) =>
          entry === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <PaginationLink
                href="#"
                isActive={entry === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(entry);
                }}
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onPageChange(page + 1);
            }}
            aria-disabled={page === totalPages}
            className={cn(
              page === totalPages && "pointer-events-none opacity-50",
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/** Returns page numbers and "ellipsis" markers for the pagination bar */
function buildPageNumbers(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const result: Array<number | "ellipsis"> = [1];

  if (current > 3) result.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) result.push(i);

  if (current < total - 2) result.push("ellipsis");

  result.push(total);
  return result;
}
