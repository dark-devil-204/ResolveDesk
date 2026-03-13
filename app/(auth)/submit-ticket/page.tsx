import Link from "next/link";
import { PublicTicketIntakeForm } from "@/components/auth/public-ticket-intake-form";

export default function SubmitTicketPage() {
  return (
    <div className="space-y-6">
      <div className="text-center lg:hidden">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Resolve Desk
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Team member?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
      <PublicTicketIntakeForm />
    </div>
  );
}
