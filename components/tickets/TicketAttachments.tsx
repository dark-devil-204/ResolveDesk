"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, File } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

interface TicketAttachmentsProps {
  attachments: Attachment[];
}

export function TicketAttachments({ attachments }: TicketAttachmentsProps) {
  if (attachments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>No files attached</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>{attachments.length} file(s) attached</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <File className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  {file.size && file.size !== "-" ? (
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground uppercase">
                      {file.type}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Download className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
