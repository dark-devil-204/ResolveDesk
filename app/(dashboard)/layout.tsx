import { DashboardAppShell } from "@/components/dashboard/app-shell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardAppShell>{children}</DashboardAppShell>;
}
