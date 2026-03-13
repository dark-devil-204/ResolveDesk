"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

const PREFS_KEY = "rd_user_prefs";

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Preferences state
  const [queueView, setQueueView] = useState("my-tickets");
  const [timeZone, setTimeZone] = useState("utc");
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Sync profile name from session once loaded
  useEffect(() => {
    if (session?.user?.name) {
      setProfileName(session.user.name);
    }
  }, [session?.user?.name]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          queueView?: string;
          timeZone?: string;
        };
        if (parsed.queueView) setQueueView(parsed.queueView);
        if (parsed.timeZone) setTimeZone(parsed.timeZone);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  async function handleSaveProfile() {
    if (!profileName.trim()) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);
    const { error } = await authClient.updateUser({ name: profileName.trim() });
    if (error) {
      setProfileError(error.message ?? "Failed to save profile.");
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setProfileSaving(false);
  }

  function handleSavePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ queueView, timeZone }));
    } catch {
      // storage quota exceeded — ignore
    }
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and personal workspace preferences.
        </p>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Card className="bg-card/90">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your display name visible to teammates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                {isPending ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Input
                    id="display-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isPending ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Input
                    id="email"
                    value={session?.user?.email ?? ""}
                    readOnly
                    className="cursor-not-allowed opacity-60"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed.
                </p>
              </div>

              {profileError && (
                <p className="text-sm text-destructive">{profileError}</p>
              )}
              {profileSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Profile saved.
                </p>
              )}

              <Button
                onClick={handleSaveProfile}
                disabled={isPending || profileSaving || !profileName.trim()}
              >
                {profileSaving ? "Saving..." : "Save profile"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card className="bg-card/90">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Queue and time-zone defaults for your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Default queue view</Label>
                <Select value={queueView} onValueChange={setQueueView}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="my-tickets">My tickets</SelectItem>
                    <SelectItem value="all-open">All open tickets</SelectItem>
                    <SelectItem value="priority">Priority first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time zone</Label>
                <Select value={timeZone} onValueChange={setTimeZone}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">EST (UTC−5)</SelectItem>
                    <SelectItem value="pst">PST (UTC−8)</SelectItem>
                    <SelectItem value="cet">CET (UTC+1)</SelectItem>
                    <SelectItem value="ist">IST (UTC+5:30)</SelectItem>
                    <SelectItem value="jst">JST (UTC+9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {prefSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Preferences saved.
                </p>
              )}

              <Button variant="outline" onClick={handleSavePrefs}>
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
