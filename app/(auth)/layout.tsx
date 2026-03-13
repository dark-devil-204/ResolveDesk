export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,hsl(var(--primary)/0.12),transparent_35%),radial-gradient(circle_at_90%_80%,hsl(var(--chart-2)/0.14),transparent_35%)]" />

      <section className="relative hidden border-r bg-muted/25 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Resolve Desk
          </p>
          <h1 className="max-w-md text-4xl font-semibold tracking-tight">
            Build calm, predictable support operations.
          </h1>
          <p className="max-w-md text-muted-foreground">
            Login, signup, and organization onboarding templates are wired for
            Better Auth flows and ready for your API integration.
          </p>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="rounded-lg border bg-background/70 p-3">
            Team inbox visibility for all customer conversations.
          </p>
          <p className="rounded-lg border bg-background/70 p-3">
            SLA and priority-focused dashboard templates included.
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
