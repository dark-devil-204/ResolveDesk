"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createOrganization } from "@/lib/auth-client";
import { createOrganizationSchema } from "@/validators";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export function OrganizationCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  async function onSubmit(values: CreateOrganizationInput) {
    setLoading(true);
    setError("");

    try {
      const response = await createOrganization({
        name: values.name,
        slug: slugify(values.slug || values.name),
      });
      if (response.error) {
        setError(response.error.message ?? "Unable to create organization.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Unable to create organization. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="size-5" />
        </div>
        <CardTitle className="pt-2 text-2xl">
          Set up your organization
        </CardTitle>
        <CardDescription>
          This workspace groups your team members, tickets, and workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Support"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        const nextValue = event.target.value;
                        if (!form.getValues("slug")) {
                          form.setValue("slug", slugify(nextValue), {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="acme-support"
                      {...field}
                      onChange={(event) => {
                        field.onChange(slugify(event.target.value));
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    This will be used in invite links and organization settings.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error ? (
              <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {error}
              </p>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating organization...
                </>
              ) : (
                "Create workspace"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
