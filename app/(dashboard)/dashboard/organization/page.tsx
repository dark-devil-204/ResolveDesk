"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Globe, Shield, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function OrganizationPage() {
  const router = useRouter();
  const activeOrganizationQuery = authClient.useActiveOrganization();
  const { data: activeOrganization, isPending } = activeOrganizationQuery;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setName(activeOrganization?.name ?? "");
    setSlug(activeOrganization?.slug ?? "");
  }, [activeOrganization?.name, activeOrganization?.slug]);

  async function handleSave() {
    if (!activeOrganization?.id) {
      setError("No active organization found.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/organizations/${activeOrganization.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name,
            slug,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(
          payload?.error ?? "Unable to save organization settings.",
        );
      }

      setSuccess("Organization settings updated.");
      if (typeof activeOrganizationQuery.refetch === "function") {
        await activeOrganizationQuery.refetch();
      }
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save organization settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!activeOrganization?.id) {
      setError("No active organization found.");
      return;
    }

    const confirmed = window.confirm(
      "Archive this organization? You can still keep historical data, but this marks it as archived.",
    );

    if (!confirmed) {
      return;
    }

    setArchiving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/organizations/${activeOrganization.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(payload?.error ?? "Unable to archive organization.");
      }

      setSuccess("Organization archived.");
      if (typeof activeOrganizationQuery.refetch === "function") {
        await activeOrganizationQuery.refetch();
      }
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to archive organization.",
      );
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Organization settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization profile loaded from Better Auth client state.
        </p>
      </section>

      {isPending ? (
        <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          Loading organization...
        </p>
      ) : null}

      {!isPending && !activeOrganization ? (
        <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          No active organization found for this session.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-md border border-green-300/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          {success}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace profile</CardTitle>
            <CardDescription>Public-facing organization data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="organization-slug"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domain and SSO</CardTitle>
            <CardDescription>Identity and access controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
              <Globe className="size-4" />
              verify domain: support.acme.com
            </p>
            <p className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
              <Shield className="size-4" />
              enforce email verification for new members
            </p>
            <p className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
              <Users className="size-4" />
              default role: member
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
            <CardDescription>Manage organization lifecycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || archiving || isPending || !activeOrganization}
            >
              {saving ? "Saving..." : "Save settings"}
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/organization/members">Invite members</Link>
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleArchive}
              disabled={saving || archiving || isPending || !activeOrganization}
            >
              {archiving ? "Archiving..." : "Archive organization"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
