import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  uuid,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const baseColumns = {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
};

export const sla = pgTable("sla", {
  ...baseColumns,
  name: text("name").notNull(),
  firstResponseTime: integer("first_response_time").notNull(),
  resolutionTime: integer("resolution_time").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
});
export const ticketCategory = pgTable("ticket_category", {
  ...baseColumns,
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
});
export const ticket = pgTable(
  "ticket",
  {
    ...baseColumns,
    ticketNumber: text("ticket_number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: ticketStatusEnum("status").default("open").notNull(),
    priority: ticketPriorityEnum("priority").default("medium").notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    assignedToId: text("assigned_to_id").references(() => user.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => ticketCategory.id, {
      onDelete: "set null",
    }),
    slaId: uuid("sla_id").references(() => sla.id, { onDelete: "set null" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    firstResponseDeadline: timestamp("first_response_deadline"),
    resolutionDeadline: timestamp("resolution_deadline"),
  },
  (table) => [
    index("ticket_status_idx").on(table.status),
    index("ticket_priority_idx").on(table.priority),
    index("ticket_createdById_idx").on(table.createdById),
    index("ticket_org_idx").on(table.organizationId),
    index("ticket_category_idx").on(table.categoryId),
    uniqueIndex("ticket_org_number_uidx").on(
      table.organizationId,
      table.ticketNumber,
    ),
  ],
);

export const ticketMessage = pgTable(
  "ticket_message",
  {
    ...baseColumns,
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    senderId: text("sender_id").references(() => user.id, {
      onDelete: "set null",
    }),
    message: text("message").notNull(),
    isInternal: boolean("is_internal").default(false).notNull(),
  },
  (table) => [index("ticket_message_ticketId_idx").on(table.ticketId)],
);
export const attachment = pgTable("attachment", {
  ...baseColumns,
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => ticket.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => ticketMessage.id, {
    onDelete: "cascade",
  }),
  fileName: text("file_name").notNull(),
  uploadedById: text("uploaded_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  url: text("url").notNull(),
});

export const ticketActivity = pgTable("ticket_activity", {
  ...baseColumns,

  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => ticket.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => user.id),

  action: text("action").notNull(),

  metadata: jsonb("metadata"),
});
export const ticketWatcher = pgTable(
  "ticket_watcher",
  {
    ...baseColumns,

    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id),
  },
  (table) => [
    uniqueIndex("ticket_watcher_unique").on(table.ticketId, table.userId),
  ],
);

export const ticketSequence = pgTable("ticket_sequence", {
  ...baseColumns,

  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id),

  lastNumber: integer("last_number").default(0),
});

export const tag = pgTable("tag", {
  ...baseColumns,

  name: text("name").notNull(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
});

export const ticketTag = pgTable(
  "ticket_tag",
  {
    ...baseColumns,

    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),

    tagId: uuid("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("ticket_tag_unique").on(table.ticketId, table.tagId)],
);
