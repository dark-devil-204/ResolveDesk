"use client";

import { useState } from "react";
import { Loader2, Mail, Plus, UserRound, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  authClient,
  cancelOrganizationInvitation,
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrganizationMembersPage() {
  const activeOrganizationQuery = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();

  const activeOrganization = activeOrganizationQuery.data;
  const isPending = activeOrganizationQuery.isPending;

  const members = activeOrganization?.members ?? [];
  const invitations = activeOrganization?.invitations ?? [];
  const organizationName = activeOrganization?.name ?? "Organization";
  const activeUserId = session?.user?.id;

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refreshOrganization() {
    if (typeof activeOrganizationQuery.refetch === "function") {
      await activeOrganizationQuery.refetch();
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      return;
    }

    setSubmittingInvite(true);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await inviteOrganizationMember({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: activeOrganization?.id,
      });

      if (result.error) {
        setActionError(result.error.message);
        return;
      }

      setInviteEmail("");
      setActionSuccess("Invitation sent successfully.");
      await refreshOrganization();
    } finally {
      setSubmittingInvite(false);
    }
  }

  async function handleRoleChange(
    memberId: string,
    nextRole: "member" | "admin",
  ) {
    setBusyId(memberId);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await updateOrganizationMemberRole({
        memberId,
        role: nextRole,
        organizationId: activeOrganization?.id,
      });

      if (result.error) {
        setActionError(result.error.message);
        return;
      }

      setActionSuccess("Member role updated.");
      await refreshOrganization();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveMember(memberId: string) {
    setBusyId(memberId);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await removeOrganizationMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrganization?.id,
      });

      if (result.error) {
        setActionError(result.error.message);
        return;
      }

      setActionSuccess("Member removed.");
      await refreshOrganization();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    setBusyId(invitationId);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await cancelOrganizationInvitation({
        invitationId,
        organizationId: activeOrganization?.id,
      });

      if (result.error) {
        setActionError(result.error.message);
        return;
      }

      setActionSuccess("Invitation canceled.");
      await refreshOrganization();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage members for {organizationName}.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="teammate@company.com"
            className="sm:w-60"
          />
          <Select
            value={inviteRole}
            onValueChange={(value) =>
              setInviteRole(value as "member" | "admin")
            }
          >
            <SelectTrigger className="sm:w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={submittingInvite}>
            {submittingInvite ? (
              <>
                <Loader2 className="animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <Plus />
                Invite member
              </>
            )}
          </Button>
        </div>
      </section>

      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {actionSuccess ? (
        <p className="rounded-md border border-green-300/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          {actionSuccess}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Team directory</CardTitle>
          <CardDescription>
            Members loaded from Better Auth organization client state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isPending ? (
            <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              Loading members...
            </p>
          ) : null}

          {!isPending && members.length === 0 ? (
            <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              No members found in the active organization.
            </p>
          ) : null}

          {members.map((member) => (
            <div
              key={`${member.userId}-${member.id}`}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <UserRound className="size-4" />
                </span>
                <div>
                  <p className="font-medium">{member.user?.name ?? "Member"}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.user?.email ?? "-"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={member.role.includes("admin") ? "admin" : "member"}
                  onValueChange={(value) =>
                    void handleRoleChange(
                      member.id,
                      value as "member" | "admin",
                    )
                  }
                  disabled={
                    busyId === member.id || member.userId === activeUserId
                  }
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" asChild className="gap-1">
                  <a href={`mailto:${member.user?.email ?? ""}`}>
                    <Mail className="size-4" />
                    Message
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-destructive"
                  onClick={() => void handleRemoveMember(member.id)}
                  disabled={
                    busyId === member.id || member.userId === activeUserId
                  }
                >
                  <XCircle className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>
            Invitations currently awaiting acceptance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {invitations.length === 0 ? (
            <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              No pending invitations.
            </p>
          ) : null}

          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{invitation.email}</p>
                <p className="text-xs text-muted-foreground">
                  Role: {invitation.role} • Status: {invitation.status}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-destructive"
                onClick={() => void handleCancelInvitation(invitation.id)}
                disabled={busyId === invitation.id}
              >
                {busyId === invitation.id ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  <>
                    <XCircle className="size-4" />
                    Cancel invite
                  </>
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
