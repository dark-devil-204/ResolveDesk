"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, EyeOff, Loader2, X } from "lucide-react";

interface Watcher {
  id: string;
  userId: string;
  name: string;
  initials: string;
}

interface TicketWatchersProps {
  watchers: Watcher[];
  ticketId: string;
  currentUserId: string | null;
  onWatchersChanged: () => void;
}

export function TicketWatchers({
  watchers,
  ticketId,
  currentUserId,
  onWatchersChanged,
}: TicketWatchersProps) {
  const [watchPending, setWatchPending] = useState(false);
  const [removePending, setRemovePending] = useState<string | null>(null);

  const isWatching = currentUserId
    ? watchers.some((w) => w.userId === currentUserId)
    : false;

  async function handleWatchToggle() {
    if (!currentUserId) return;
    setWatchPending(true);
    try {
      if (isWatching) {
        await fetch(`/api/tickets/${ticketId}/watchers`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: currentUserId }),
        });
      } else {
        await fetch(`/api/tickets/${ticketId}/watchers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: currentUserId }),
        });
      }
      onWatchersChanged();
    } finally {
      setWatchPending(false);
    }
  }

  async function handleRemove(userId: string) {
    setRemovePending(userId);
    try {
      await fetch(`/api/tickets/${ticketId}/watchers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      onWatchersChanged();
    } finally {
      setRemovePending(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Watchers</CardTitle>
            <CardDescription>
              {watchers.length === 0
                ? "No one is following this ticket"
                : `${watchers.length} follower${watchers.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          {currentUserId ? (
            <Button
              size="sm"
              variant={isWatching ? "secondary" : "outline"}
              className="gap-1.5"
              onClick={handleWatchToggle}
              disabled={watchPending}
            >
              {watchPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isWatching ? (
                <>
                  <EyeOff className="size-4" />
                  Unwatch
                </>
              ) : (
                <>
                  <Eye className="size-4" />
                  Watch
                </>
              )}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      {watchers.length > 0 ? (
        <CardContent>
          <div className="space-y-2">
            {watchers.map((watcher) => (
              <div
                key={watcher.id}
                className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {watcher.initials}
                  </AvatarFallback>
                </Avatar>
                <p className="flex-1 text-sm font-medium">{watcher.name}</p>
                {currentUserId ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleRemove(watcher.userId)}
                    disabled={removePending === watcher.userId}
                    title={`Remove ${watcher.name}`}
                  >
                    {removePending === watcher.userId ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <X className="size-3" />
                    )}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
