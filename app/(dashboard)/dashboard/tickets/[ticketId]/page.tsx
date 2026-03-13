"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TicketHeader } from "@/components/tickets/TicketHeader";
import { TicketConversation } from "@/components/tickets/TicketConversation";
import { TicketReplyBox } from "@/components/tickets/TicketReplyBox";
import { TicketSidebar } from "@/components/tickets/TicketSidebar";
import { TicketActivity } from "@/components/tickets/TicketActivity";
import { TicketAttachments } from "@/components/tickets/TicketAttachments";
import { TicketWatchers } from "@/components/tickets/TicketWatchers";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

type MessageItem = {
  id: string;
  author: {
    name: string;
    initials: string;
    role: "agent" | "customer";
  };
  timestamp: string;
  content: string;
  isInternal?: boolean;
  attachments?: Array<{ name: string; size: string }>;
};

type ActivityItem = {
  id: string;
  actor: { name: string; initials: string };
  action: string;
  actionLabel: string;
  timestamp: string;
};

type WatcherItem = {
  id: string;
  userId: string;
  name: string;
  initials: string;
};

type AssigneeOption = {
  id: string;
  name: string;
  initials: string;
};

type AttachmentItem = {
  id: string;
  name: string;
  size: string;
  type: string;
};

type TicketDetailsPayload = {
  ticket?: {
    id: string;
    ticketNumber: string;
    title: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: string;
    resolutionDeadline: string | null;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  customer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
  organization?: {
    id: string;
    name: string;
  } | null;
};

function normalizeStatus(value: string | null): TicketStatus {
  if (value === "open" || value === "resolved" || value === "closed") {
    return value;
  }
  return "in_progress";
}

function normalizePriority(value: string | null): TicketPriority {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "urgent"
  ) {
    return value;
  }
  return "medium";
}

function formatDateTime(dateLike: string | Date) {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getActivityActionLabel(action: string) {
  switch (action) {
    case "ticket_created":
      return "Ticket Created";
    case "status_changed":
      return "Status Changed";
    case "priority_changed":
      return "Priority Changed";
    case "assigned":
      return "Assignment";
    case "message_added":
      return "Comment";
    case "watcher_added":
      return "Watcher Added";
    case "note":
      return "Note";
    default:
      return action
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

function formatSlaTime(deadline: string | null | undefined) {
  if (!deadline) return "-";

  const end = new Date(deadline).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return "Overdue";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function TicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id ?? null;

  const ticketId = params.ticketId;
  const ticketNumber = searchParams.get("ticketNumber") ?? ticketId;
  const title = searchParams.get("title") ?? "Ticket conversation";
  const createdAt = searchParams.get("createdAt") ?? new Date().toISOString();

  const [status, setStatus] = useState<TicketStatus>(
    normalizeStatus(searchParams.get("status")),
  );
  const [priority, setPriority] = useState<TicketPriority>(
    normalizePriority(searchParams.get("priority")),
  );

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [watchers, setWatchers] = useState<WatcherItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [ticketDetails, setTicketDetails] =
    useState<TicketDetailsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  const loadTicketData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        detailsRes,
        messagesRes,
        activitiesRes,
        watchersRes,
        attachmentsRes,
      ] = await Promise.all([
        fetch(`/api/tickets/${ticketId}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/tickets/${ticketId}/messages`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/tickets/${ticketId}/activity`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/tickets/${ticketId}/watchers`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/tickets/${ticketId}/attachments`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (
        !detailsRes.ok ||
        !messagesRes.ok ||
        !activitiesRes.ok ||
        !watchersRes.ok ||
        !attachmentsRes.ok
      ) {
        throw new Error("Unable to load ticket details.");
      }

      const detailsData = (await detailsRes.json()) as TicketDetailsPayload;
      const messagesData = (await messagesRes.json()) as {
        messages?: Array<Record<string, unknown>>;
      };
      const activityData = (await activitiesRes.json()) as {
        activities?: Array<Record<string, unknown>>;
      };
      const watchersData = (await watchersRes.json()) as {
        watchers?: Array<Record<string, unknown>>;
      };
      const attachmentsData = (await attachmentsRes.json()) as {
        attachments?: Array<Record<string, unknown>>;
      };

      setTicketDetails(detailsData);

      if (detailsData.ticket?.status) {
        setStatus(detailsData.ticket.status);
      }
      if (detailsData.ticket?.priority) {
        setPriority(detailsData.ticket.priority);
      }

      const mappedMessages = (messagesData.messages ?? []).map((item) => {
        const message =
          (item.ticket_message as Record<string, unknown> | undefined) ??
          (item.ticketMessage as Record<string, unknown> | undefined) ??
          item;

        const sender =
          (item.sender as Record<string, unknown> | undefined) ?? undefined;
        const senderName =
          typeof sender?.name === "string" ? sender.name : undefined;
        const senderId = (message.senderId as string | null) ?? null;
        const displayName =
          senderName ?? (senderId ? "Support Agent" : "Customer");

        return {
          id: String(message.id ?? crypto.randomUUID()),
          author: {
            name: displayName,
            initials: getInitials(displayName),
            role: senderId ? "agent" : "customer",
          },
          timestamp: formatDateTime(
            String(message.createdAt ?? new Date().toISOString()),
          ),
          content: String(message.message ?? ""),
          isInternal: Boolean(message.isInternal),
          attachments: [],
        } satisfies MessageItem;
      });

      const mappedActivities = (activityData.activities ?? []).map((item) => {
        const activity =
          (item.ticket_activity as Record<string, unknown> | undefined) ??
          (item.ticketActivity as Record<string, unknown> | undefined) ??
          item;

        const actor =
          (item.actor as Record<string, unknown> | undefined) ?? undefined;
        const userId = String(activity.userId ?? "system");
        const actorName =
          typeof actor?.name === "string"
            ? actor.name
            : userId === "system"
              ? "System"
              : "Support Agent";
        const action = String(activity.action ?? "updated_ticket");

        return {
          id: String(activity.id ?? crypto.randomUUID()),
          actor: {
            name: actorName,
            initials: getInitials(actorName),
          },
          action,
          actionLabel: getActivityActionLabel(action),
          timestamp: formatDateTime(
            String(activity.createdAt ?? new Date().toISOString()),
          ),
        } satisfies ActivityItem;
      });

      const mappedWatchers = (watchersData.watchers ?? []).map((item) => {
        const watcher =
          (item.watcher as Record<string, unknown> | undefined) ?? undefined;
        const watcherRecord =
          (item.ticket_watcher as Record<string, unknown> | undefined) ??
          (item.ticketWatcher as Record<string, unknown> | undefined) ??
          item;

        const name =
          typeof watcher?.name === "string" ? watcher.name : "Watcher";
        const userId = typeof watcher?.id === "string" ? watcher.id : "";

        return {
          id: String(watcherRecord.id ?? crypto.randomUUID()),
          userId,
          name,
          initials: getInitials(name),
        } satisfies WatcherItem;
      });

      const mappedAttachments = (attachmentsData.attachments ?? []).map(
        (item) => {
          const file =
            (item.attachment as Record<string, unknown> | undefined) ??
            (item.ticket_attachment as Record<string, unknown> | undefined) ??
            (item.ticketAttachment as Record<string, unknown> | undefined) ??
            item;

          const fileName = String(file.fileName ?? "attachment");
          const extension = fileName.includes(".")
            ? (fileName.split(".").pop()?.toLowerCase() ?? "file")
            : "file";

          return {
            id: String(file.id ?? crypto.randomUUID()),
            name: fileName,
            size: "-",
            type: extension,
          } satisfies AttachmentItem;
        },
      );

      setMessages(mappedMessages);
      setActivities(mappedActivities);
      setWatchers(mappedWatchers);
      setAttachments(mappedAttachments);

      const organizationId = detailsData.organization?.id;
      if (organizationId) {
        const membersRes = await fetch(
          `/api/organizations/${organizationId}/members`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (membersRes.ok) {
          const membersData = (await membersRes.json()) as {
            members?: Array<Record<string, unknown>>;
          };

          const options = (membersData.members ?? [])
            .map((entry) => {
              const user =
                (entry.user as Record<string, unknown> | undefined) ??
                undefined;

              if (
                typeof user?.id !== "string" ||
                typeof user?.name !== "string"
              ) {
                return null;
              }

              return {
                id: user.id,
                name: user.name,
                initials: getInitials(user.name),
              } satisfies AssigneeOption;
            })
            .filter((option): option is AssigneeOption => option !== null);

          setAssigneeOptions(options);
        }
      }
    } catch {
      setError("Unable to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadTicketData();
  }, [loadTicketData]);

  async function handleStatusChange(nextStatus: TicketStatus) {
    if (nextStatus === status) return;
    setUpdatingStatus(true);
    setError("");

    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setStatus(nextStatus);
      await loadTicketData();
    } catch {
      setError("Unable to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handlePriorityChange(nextPriority: TicketPriority) {
    if (nextPriority === priority) return;
    setUpdatingPriority(true);
    setError("");

    try {
      const response = await fetch(`/api/tickets/${ticketId}/priority`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ priority: nextPriority }),
      });

      if (!response.ok) {
        throw new Error("Failed to update priority");
      }

      setPriority(nextPriority);
      await loadTicketData();
    } catch {
      setError("Unable to update priority.");
    } finally {
      setUpdatingPriority(false);
    }
  }

  async function handleAssigneeChange(nextAssigneeUserId: string | null) {
    if (nextAssigneeUserId === (ticketDetails?.assignee?.id ?? null)) {
      return;
    }

    setUpdatingAssignee(true);
    setError("");

    try {
      const response = await fetch(`/api/tickets/${ticketId}/assignee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ assigneeUserId: nextAssigneeUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assignee");
      }

      await loadTicketData();
    } catch {
      setError("Unable to update assignee.");
    } finally {
      setUpdatingAssignee(false);
    }
  }

  async function handleReplySubmit(payload: {
    message: string;
    isInternal: boolean;
  }) {
    setSubmittingReply(true);
    setError("");

    try {
      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: payload.message,
          isInternal: payload.isInternal,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      await loadTicketData();
    } catch {
      setError(
        payload.isInternal
          ? "Unable to add internal note with the current API payload."
          : "Unable to send reply.",
      );
    } finally {
      setSubmittingReply(false);
    }
  }

  const headerCreatedAt = useMemo(() => formatDateTime(createdAt), [createdAt]);
  const resolvedTicketNumber =
    ticketDetails?.ticket?.ticketNumber ?? ticketNumber;
  const resolvedTitle = ticketDetails?.ticket?.title ?? title;
  const resolvedCreatedAt = useMemo(
    () => formatDateTime(ticketDetails?.ticket?.createdAt ?? createdAt),
    [ticketDetails?.ticket?.createdAt, createdAt],
  );
  const resolvedAssigneeName = ticketDetails?.assignee?.name ?? "Unassigned";
  const resolvedCategory = ticketDetails?.category?.name ?? "General";
  const resolvedSlaTime = formatSlaTime(
    ticketDetails?.ticket?.resolutionDeadline,
  );
  const resolvedCustomerName = ticketDetails?.customer?.name ?? "Customer";
  const resolvedCustomerEmail = ticketDetails?.customer?.email ?? "-";
  const resolvedOrganizationName =
    ticketDetails?.organization?.name ?? "Current organization";

  return (
    <div className="min-h-screen bg-background">
      <TicketHeader
        id={resolvedTicketNumber}
        title={resolvedTitle}
        status={status}
        priority={priority}
        assignee={{
          name: resolvedAssigneeName,
          initials: getInitials(resolvedAssigneeName),
        }}
        organization={resolvedOrganizationName}
        createdAt={resolvedCreatedAt ?? headerCreatedAt}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error ? (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading ticket details...
            </span>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main conversation area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation thread */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Conversation</h2>
              <TicketConversation messages={messages} />
            </div>

            {/* Reply composer */}
            <TicketReplyBox
              onSubmitReply={handleReplySubmit}
              submitting={submittingReply}
              defaultInternal={searchParams.get("compose") === "internal"}
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Ticket properties */}
            <TicketSidebar
              status={status}
              priority={priority}
              assignee={{
                id: ticketDetails?.assignee?.id ?? null,
                name: resolvedAssigneeName,
                initials: getInitials(resolvedAssigneeName),
              }}
              assigneeOptions={assigneeOptions}
              category={resolvedCategory}
              slaTime={resolvedSlaTime}
              customer={{
                name: resolvedCustomerName,
                email: resolvedCustomerEmail,
                organization: resolvedOrganizationName,
              }}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onAssigneeChange={handleAssigneeChange}
              isUpdatingStatus={updatingStatus}
              isUpdatingPriority={updatingPriority}
              isUpdatingAssignee={updatingAssignee}
            />

            {/* Activity timeline */}
            <TicketActivity activities={activities} />

            {/* Watchers */}
            <TicketWatchers
              watchers={watchers}
              ticketId={ticketId}
              currentUserId={currentUserId}
              onWatchersChanged={loadTicketData}
            />

            {/* Attachments */}
            <TicketAttachments attachments={attachments} />
          </div>
        </div>
      </div>
    </div>
  );
}
