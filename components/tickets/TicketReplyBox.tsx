"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Send } from "lucide-react";

interface TicketReplyBoxProps {
  onSubmitReply?: (payload: {
    message: string;
    isInternal: boolean;
  }) => Promise<void>;
  submitting?: boolean;
  defaultInternal?: boolean;
}

export function TicketReplyBox({
  onSubmitReply,
  submitting = false,
  defaultInternal = false,
}: TicketReplyBoxProps) {
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(defaultInternal);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setIsInternal(defaultInternal);
  }, [defaultInternal]);

  const handleSubmit = async () => {
    if (message.trim()) {
      await onSubmitReply?.({ message: message.trim(), isInternal });
      setMessage("");
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">
          {isInternal ? "Internal Note" : "Reply"}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {isInternal ? "Internal Note" : "Public Reply"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsInternal(false)}>
              Public Reply
              <span className="ml-2 text-xs text-muted-foreground">
                Customer sees
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsInternal(true)}>
              Internal Note
              <span className="ml-2 text-xs text-muted-foreground">
                Agents only
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isInternal && (
        <Badge variant="warning" className="mb-3">
          This will only be visible to agents
        </Badge>
      )}

      <div
        className={`rounded border transition-colors ${
          isFocused ? "border-primary/50 bg-primary/5" : "border-border"
        }`}
      >
        <Textarea
          placeholder={
            isInternal
              ? "Add an internal note..."
              : "Write your reply... Markdown supported"
          }
          className="border-0 resize-none rounded-t-none focus:ring-0"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-2">
          <Paperclip className="size-4" />
          Attach file
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || submitting}
          className="gap-2"
        >
          <Send className="size-4" />
          {submitting ? "Sending..." : isInternal ? "Add Note" : "Send Reply"}
        </Button>
      </div>
    </div>
  );
}
