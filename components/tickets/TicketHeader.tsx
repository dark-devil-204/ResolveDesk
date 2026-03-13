"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface TicketHeaderProps {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: { name: string; initials: string };
  organization: string;
  createdAt: string;
}

export function TicketHeader({
  id,
  title,
  status,
  priority,
  assignee,
  organization,
  createdAt,
}: TicketHeaderProps) {
  const statusColor = {
    open: "info" as const,
    in_progress: "warning" as const,
    resolved: "success" as const,
    closed: "outline" as const,
  };

  const priorityColor = {
    urgent: "urgent" as const,
    high: "warning" as const,
    medium: "info" as const,
    low: "low" as const,
  };

  const statusBadge = statusColor[status];
  const priorityBadge = priorityColor[priority];

  return (
    <div className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-bold text-muted-foreground">
                {id}
              </p>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Badge variant={statusBadge}>
                {status === "in_progress"
                  ? "In Progress"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              <Badge variant={priorityBadge}>{priority}</Badge>
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {assignee.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  Assigned to{" "}
                  <span className="font-medium">{assignee.name}</span>
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>
                Organization:{" "}
                <span className="font-medium text-foreground">
                  {organization}
                </span>
              </span>
              <span>•</span>
              <span>Created {createdAt}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Change status</DropdownMenuItem>
              <DropdownMenuItem>Change priority</DropdownMenuItem>
              <DropdownMenuItem>Reassign</DropdownMenuItem>
              <DropdownMenuItem>Delete ticket</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
