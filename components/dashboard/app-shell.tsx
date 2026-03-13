"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import {
  BarChart3,
  Building2,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  authClient,
  ensureActiveOrganization,
  signOutFromSession,
} from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/organization", label: "Organization", icon: Building2 },
  { href: "/dashboard/organization/members", label: "Members", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  const activeHref = useMemo(() => {
    const sortedNavItems = [...navItems].sort(
      (a, b) => b.href.length - a.href.length,
    );

    const matchedItem = sortedNavItems.find(({ href }) => {
      if (href === "/dashboard") {
        return pathname === href;
      }

      return pathname === href || pathname.startsWith(`${href}/`);
    });

    return matchedItem?.href ?? null;
  }, [pathname]);

  return (
    <TooltipProvider>
      <nav className={cn("space-y-1", className)}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref;

          return (
            <Tooltip key={href} delayDuration={200}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:bg-muted/40",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 transition-colors duration-200",
                      active
                        ? "text-primary"
                        : "text-muted-foreground/60 group-hover:text-muted-foreground/80",
                    )}
                  />
                  <span>{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

async function handleSignOut(router: ReturnType<typeof useRouter>) {
  await signOutFromSession();
  router.push("/login");
}

export function DashboardAppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const activeOrganizationQuery = authClient.useActiveOrganization();
  const { data: activeOrganization } = activeOrganizationQuery;
  const attemptedActiveOrgBootstrap = useRef(false);

  useEffect(() => {
    if (!session?.user?.id) {
      attemptedActiveOrgBootstrap.current = false;
      return;
    }

    if (activeOrganization?.id || attemptedActiveOrgBootstrap.current) {
      return;
    }

    attemptedActiveOrgBootstrap.current = true;

    void (async () => {
      await ensureActiveOrganization();
      if (typeof activeOrganizationQuery.refetch === "function") {
        await activeOrganizationQuery.refetch();
      }
    })();
  }, [activeOrganization?.id, activeOrganizationQuery, session?.user?.id]);

  const displayName = session?.user?.name ?? "User";
  const displayEmail = session?.user?.email ?? "";
  const workspaceName = activeOrganization?.name ?? "Workspace";

  const avatarInitials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }, [displayName]);

  const ticketIdFromPath = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/tickets\/([^/]+)$/);
    return match?.[1] ?? null;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm dark:bg-background/80 dark:backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon-sm" className="lg:hidden">
                  <Menu className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-70 dark:bg-card/95">
                <SheetHeader>
                  <SheetTitle>Resolve Desk</SheetTitle>
                </SheetHeader>
                <Separator className="dark:bg-border/50" />
                <NavLinks className="mt-4 px-2" />
              </SheetContent>
            </Sheet>

            <Link
              href="/dashboard"
              className="font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors"
            >
              Resolve Desk
            </Link>
            <span className="hidden rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex dark:bg-muted/30 dark:border-border/40">
              {workspaceName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <div className="hidden gap-2 sm:flex">
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    asChild
                  >
                    <Link href="/dashboard/tickets?create=1">
                      <Plus className="size-4" />
                      <span>New Ticket</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Create a new support ticket
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    asChild={Boolean(ticketIdFromPath)}
                    disabled={!ticketIdFromPath}
                  >
                    {ticketIdFromPath ? (
                      <Link
                        href={{
                          pathname: `/dashboard/tickets/${ticketIdFromPath}`,
                          query: { compose: "internal" },
                        }}
                      >
                        <MessageSquare className="size-4" />
                        <span>Add Note</span>
                      </Link>
                    ) : (
                      <>
                        <MessageSquare className="size-4" />
                        <span>Add Note</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {ticketIdFromPath
                    ? "Open composer in internal-note mode"
                    : "Open a ticket to add an internal note"}
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator
              orientation="vertical"
              className="h-6 dark:bg-border/50"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar size="sm" className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {displayName}
                  </span>
                  <ChevronsUpDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col space-y-0.5">
                  <span>{displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {displayEmail}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="size-4 mr-2" />
                    Workspace settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => handleSignOut(router)}
                >
                  <LogOut className="size-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-6">
        <aside className="sticky top-24 hidden h-fit rounded-lg border bg-card shadow-sm lg:block dark:border-border/50 dark:bg-card/50 dark:backdrop-blur-sm">
          <div className="space-y-1 p-4">
            <div className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BarChart3 className="size-3.5 text-muted-foreground/70" />
              Operations
            </div>
            <NavLinks />
          </div>

          {/* Divider */}
          <div className="border-t dark:border-border/50" />

          {/* Bottom section with additional options - could add workspace switcher, etc. */}
          <div className="space-y-1 p-4">
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Users className="size-4" />
                  <span className="text-xs">Invite Members</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Invite team members
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
