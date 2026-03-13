"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Activity {
  id: string;
  actor: { name: string; initials: string };
  action: string;
  actionLabel: string;
  timestamp: string;
}

interface TicketActivityProps {
  activities: Activity[];
}

function getActionVariant(action: string) {
  switch (action) {
    case "priority_changed":
      return "warning" as const;
    case "status_changed":
      return "info" as const;
    case "ticket_created":
      return "success" as const;
    case "assigned":
      return "secondary" as const;
    case "message_added":
      return "outline" as const;
    case "note":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export function TicketActivity({ activities }: TicketActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Changes and interactions timeline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, idx) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {activity.actor.initials}
                  </AvatarFallback>
                </Avatar>
                {idx < activities.length - 1 && (
                  <div className="mt-2 h-8 w-0.5 bg-border" />
                )}
              </div>
              <div className="flex-1 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {activity.actor.name}
                  </span>
                  <Badge variant={getActionVariant(activity.action)}>
                    {activity.actionLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
