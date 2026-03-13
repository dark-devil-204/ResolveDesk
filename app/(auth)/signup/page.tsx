import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { isSignupEnabledServer } from "@/lib/feature-flags";

export default function SignupPage() {
  if (!isSignupEnabledServer()) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="text-center lg:hidden">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Resolve Desk
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
