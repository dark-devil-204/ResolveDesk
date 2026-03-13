import { z } from "zod";

export const ticketStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const ticketPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const ticketSortSchema = z.enum(["createdAt", "updatedAt"]);

export const ticketFiltersQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assignedTo: z.string().trim().optional(),
  q: z.string().trim().optional(),
  sort: ticketSortSchema.default("createdAt"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),
});

export const createMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
  isInternal: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name is required")
    .max(100, "Organization name is too long"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(120, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and dashes",
    ),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name is required")
    .max(100, "Organization name is too long"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(120, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and dashes",
    ),
});

export const addWatcherSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const publicTicketIntakeSchema = z.object({
  organizationSlug: z
    .string()
    .trim()
    .min(2, "Organization slug is required")
    .max(120, "Organization slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and dashes",
    ),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  email: z.string().email("Enter a valid email"),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(5000, "Description cannot exceed 5000 characters"),
});

export const publicTicketIntakeRequestSchema = publicTicketIntakeSchema.extend({
  turnstileToken: z.string().trim().optional(),
});
