import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { isSignupEnabledClient } from "@/lib/feature-flags";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [organizationClient()],
});

export async function signInWithEmail(email: string, password: string) {
  return authClient.signIn.email({
    email,
    password,
    callbackURL: "/dashboard",
  });
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}) {
  if (!isSignupEnabledClient()) {
    return {
      error: {
        message: "Signup is disabled for this demo.",
      },
    };
  }

  return authClient.signUp.email({
    ...input,
    callbackURL: "/organization/create",
  });
}

export async function signOutFromSession() {
  return authClient.signOut();
}

type AuthEndpointResult<T> = {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};

async function authEndpoint<T>(
  path: string,
  body?: Record<string, unknown>,
  method: "GET" | "POST" = "POST",
): Promise<AuthEndpointResult<T>> {
  try {
    const response = await fetch(`/api/auth${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: method === "POST" && body ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!response.ok) {
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.error === "string"
            ? payload.error
            : "Request failed";

      return {
        error: {
          message,
          code: typeof payload?.code === "string" ? payload.code : undefined,
        },
      };
    }

    return { data: payload as T };
  } catch {
    return {
      error: {
        message: "Network error. Please try again.",
      },
    };
  }
}

export async function createOrganization(input: {
  name: string;
  slug: string;
}) {
  const created = await authEndpoint<{ id: string }>("/organization/create", {
    name: input.name,
    slug: input.slug,
  });

  if (created.error || !created.data?.id) {
    return created;
  }

  await setActiveOrganization(created.data.id);
  return created;
}

export async function setActiveOrganization(organizationId: string) {
  return authEndpoint<{ status: boolean }>("/organization/set-active", {
    organizationId,
  });
}

export async function listUserOrganizations() {
  return authEndpoint<Array<{ id: string; name: string; slug: string }>>(
    "/organization/list",
    undefined,
    "GET",
  );
}

export async function ensureActiveOrganization() {
  const activeOrganization = await authEndpoint<{ id: string }>(
    "/organization/get-full-organization",
    undefined,
    "GET",
  );

  if (activeOrganization.data?.id) {
    return activeOrganization;
  }

  const organizations = await listUserOrganizations();
  const firstOrganization = organizations.data?.[0];

  if (!firstOrganization?.id) {
    return {
      error: {
        message: "No organization found for this account.",
      },
    };
  }

  return setActiveOrganization(firstOrganization.id);
}

export async function inviteOrganizationMember(input: {
  email: string;
  role: "member" | "admin";
  organizationId?: string;
}) {
  return authEndpoint<{ id: string }>("/organization/invite-member", {
    email: input.email,
    role: input.role,
    organizationId: input.organizationId,
  });
}

export async function cancelOrganizationInvitation(input: {
  invitationId: string;
  organizationId?: string;
}) {
  return authEndpoint<{ invitation: { id: string } }>(
    "/organization/cancel-invitation",
    {
      invitationId: input.invitationId,
      organizationId: input.organizationId,
    },
  );
}

export async function acceptOrganizationInvitation(invitationId: string) {
  return authEndpoint<{ invitation: { id: string }; member: { id: string } }>(
    "/organization/accept-invitation",
    { invitationId },
  );
}

export async function rejectOrganizationInvitation(invitationId: string) {
  return authEndpoint<{ invitation: { id: string } }>(
    "/organization/reject-invitation",
    { invitationId },
  );
}

export async function updateOrganizationMemberRole(input: {
  memberId: string;
  role: "member" | "admin";
  organizationId?: string;
}) {
  return authEndpoint<{ member: { id: string } }>(
    "/organization/update-member-role",
    {
      memberId: input.memberId,
      role: input.role,
      organizationId: input.organizationId,
    },
  );
}

export async function removeOrganizationMember(input: {
  memberIdOrEmail: string;
  organizationId?: string;
}) {
  return authEndpoint<{ member: { id: string } }>(
    "/organization/remove-member",
    {
      memberIdOrEmail: input.memberIdOrEmail,
      organizationId: input.organizationId,
    },
  );
}

export async function leaveActiveOrganization() {
  return authEndpoint<{ success: boolean }>("/organization/leave", {});
}
