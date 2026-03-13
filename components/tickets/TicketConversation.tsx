"use client";

import { TicketMessage } from "./TicketMessage";

interface ConversationMessage {
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

interface TicketConversationProps {
  messages: ConversationMessage[];
}

export function TicketConversation({ messages }: TicketConversationProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <TicketMessage
          key={message.id}
          id={message.id}
          author={message.author}
          timestamp={message.timestamp}
          content={message.content}
          isInternal={message.isInternal}
          attachments={message.attachments}
        />
      ))}
    </div>
  );
}
