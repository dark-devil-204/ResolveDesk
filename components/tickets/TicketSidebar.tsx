"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";

interface TicketSidebarProps {
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: { id: string | null; name: string; initials: string };
  assigneeOptions: Array<{ id: string; name: string; initials: string }>;
  category: string;
  slaTime: string;
  customer: {
    name: string;
    email: string;
    organization: string;
  };
  onStatusChange?: (
    status: "open" | "in_progress" | "resolved" | "closed",
  ) => Promise<void>;
  onPriorityChange?: (
    priority: "low" | "medium" | "high" | "urgent",
  ) => Promise<void>;
  onAssigneeChange?: (assigneeUserId: string | null) => Promise<void>;
  isUpdatingStatus?: boolean;
  isUpdatingPriority?: boolean;
  isUpdatingAssignee?: boolean;
}

export function TicketSidebar({
  status,
  priority,
  assignee,
  assigneeOptions,
  category,
  slaTime,
  customer,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  isUpdatingStatus = false,
  isUpdatingPriority = false,
  isUpdatingAssignee = false,
}: TicketSidebarProps) {
  const statusBadgeVariant =
    status === "open"
      ? "info"
      : status === "in_progress"
        ? "warning"
        : status === "resolved"
          ? "success"
          : "outline";

  const priorityBadgeVariant =
    priority === "urgent"
      ? "urgent"
      : priority === "high"
        ? "warning"
        : priority === "medium"
          ? "info"
          : "low";

  const statusLabel =
    status === "in_progress"
      ? "In Progress"
      : status.charAt(0).toUpperCase() + status.slice(1);

  const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
              Status
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between gap-2"
                  disabled={isUpdatingStatus}
                >
                  <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => onStatusChange?.("open")}>
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange?.("in_progress")}
                >
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.("resolved")}>
                  Resolved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.("closed")}>
                  Closed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
              Priority
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between gap-2"
                  disabled={isUpdatingPriority}
                >
                  <Badge variant={priorityBadgeVariant}>{priorityLabel}</Badge>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => onPriorityChange?.("low")}>
                  Low
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPriorityChange?.("medium")}>
                  Medium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPriorityChange?.("high")}>
                  High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPriorityChange?.("urgent")}>
                  Urgent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
              Assignee
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between gap-2"
                  disabled={isUpdatingAssignee}
                >
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback className="text-xs">
                        {assignee.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{assignee.name}</span>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {assigneeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => onAssigneeChange?.(option.id)}
                  >
                    {option.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => onAssigneeChange?.(null)}>
                  Unassigned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
              Category
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between gap-2"
                >
                  <span className="text-sm">{category}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Authentication</DropdownMenuItem>
                <DropdownMenuItem>API</DropdownMenuItem>
                <DropdownMenuItem>Incident</DropdownMenuItem>
                <DropdownMenuItem>Feature Request</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="border-t pt-4">
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 p-3">
              <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                SLA Time Remaining
              </p>
              <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
                {slaTime}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium">{customer.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{customer.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Organization</p>
              <p className="text-sm font-medium">{customer.organization}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
