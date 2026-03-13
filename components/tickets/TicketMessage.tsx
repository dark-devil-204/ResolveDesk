"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface TicketMessageProps {
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
}

export function TicketMessage({
  author,
  timestamp,
  content,
  isInternal,
  attachments,
}: TicketMessageProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isInternal
          ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900"
          : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {author.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{author.name}</p>
              <Badge
                variant={author.role === "agent" ? "default" : "outline"}
                className="text-xs"
              >
                {author.role === "agent" ? "Agent" : "Customer"}
              </Badge>
              {isInternal && (
                <Badge variant="warning" className="text-xs">
                  Internal
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreVertical className="size-4" />
        </Button>
      </div>

      <div className="mt-3">
        <p className="text-sm leading-relaxed">{content}</p>
      </div>

      {attachments && attachments.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Attachments
          </p>
          {attachments.map((file, idx) => (
            <a
              key={idx}
              href="#"
              className="flex items-center gap-2 rounded p-2 text-sm hover:bg-muted"
            >
              <span className="font-mono text-xs text-muted-foreground">
                📎
              </span>
              <span>{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({file.size})
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
