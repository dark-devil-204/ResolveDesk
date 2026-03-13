/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db/drizzle";
import { faker } from "@faker-js/faker";
import * as schema from "@/db/schema";

import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
// Define types for our data
type User = typeof schema.user.$inferInsert;
type Organization = typeof schema.organization.$inferInsert;
type SLA = typeof schema.sla.$inferInsert;
type TicketCategory = typeof schema.ticketCategory.$inferInsert;
type Tag = typeof schema.tag.$inferInsert;
type Ticket = typeof schema.ticket.$inferInsert;
type TicketMessage = typeof schema.ticketMessage.$inferInsert;
type TicketActivity = typeof schema.ticketActivity.$inferInsert;
type TicketWatcher = typeof schema.ticketWatcher.$inferInsert;
type TicketSequence = typeof schema.ticketSequence.$inferInsert;

export async function seed() {
  console.log("🌱 Starting seeding process...");

  try {
    // Clean existing data (be careful!)
    console.log("Cleaning existing data...");
    await cleanDatabase();

    // Create demo organization
    console.log("Creating demo organization...");
    const organization = await createDemoOrganization();

    // Create demo users using Better Auth
    console.log("Creating demo users...");
    const users = await createUsers(organization.id);

    if (users.length === 0) {
      throw new Error(
        "No users were created or found. Cannot proceed with seeding.",
      );
    }
    console.log(`✅ Created/found ${users.length} users`);

    // Create demo SLA policies
    console.log("Creating SLA policies...");
    const slas = await createSLAs(organization.id);
    console.log(`✅ Created ${slas.length} SLA policies`);

    // Create ticket categories
    console.log("Creating ticket categories...");
    const categories = await createCategories(organization.id);
    console.log(`✅ Created ${categories.length} categories`);

    // Create tags
    console.log("Creating tags...");
    const tags = await createTags(organization.id);
    console.log(`✅ Created ${tags.length} tags`);

    // Create tickets with various states
    console.log("Creating tickets...");
    const tickets = await createTickets(
      organization.id,
      users,
      slas,
      categories,
      tags,
    );
    console.log(`✅ Created ${tickets.length} tickets`);

    // Create ticket sequences for organization
    console.log("Creating ticket sequence...");
    await createTicketSequence(organization.id, tickets.length);

    // Create additional activities and watchers
    console.log("Creating additional ticket data...");
    await createTicketActivities(tickets, users);
    await createTicketWatchers(tickets, users);

    console.log("\n✅ Seeding completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Demo Organization: ResolveDesk Demo Company`);
    console.log(`Created: ${users.length} users, ${tickets.length} tickets`);
    console.log("\n🔐 Demo Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin:");
    console.log("  Email: admin@resolvedesk.com");
    console.log("  Password: Admin123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Agent:");
    console.log("  Email: agent@resolvedesk.com");
    console.log("  Password: Agent123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Customer:");
    console.log("  Email: customer@resolvedesk.com");
    console.log("  Password: Customer123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
  }
}

async function cleanDatabase() {
  // Delete in reverse order of dependencies
  const tables = [
    "ticket_watcher",
    "ticket_activity",
    "attachment",
    "ticket_message",
    "ticket_tag",
    "ticket",
    "ticket_sequence",
    "tag",
    "sla",
    "ticket_category",
    "invitation",
    "member",
  ];

  for (const table of tables) {
    try {
      await db.execute(sql`DELETE FROM ${sql.identifier(table)}`);
      console.log(`Cleaned table: ${table}`);
    } catch {
      console.log(`Note: Table ${table} might not exist or is already empty`);
    }
  }

  // Don't delete users and organization as they might be needed
  console.log("✅ Database cleaned (preserved users and organization)");
}

async function createDemoOrganization(): Promise<Organization> {
  // Check if organization already exists
  const existingOrg = await db.query.organization.findFirst({
    where: eq(schema.organization.slug, "resolvedesk-demo"),
  });

  if (existingOrg) {
    console.log("Organization already exists, using existing one...");
    return existingOrg;
  }

  const organizationId = faker.string.uuid();

  const [org] = await db
    .insert(schema.organization)
    .values({
      id: organizationId,
      name: "ResolveDesk Demo Company",
      slug: "resolvedesk-demo",
      logo: faker.image.url().replace("loremflickr", "picsum"),
      createdAt: faker.date.past({ years: 1 }),
      metadata: JSON.stringify({
        industry: "Customer Support Software",
        size: "50-100 employees",
        website: "https://resolvedesk-demo.com",
      }),
    })
    .returning();

  return org;
}

async function createUsers(organizationId: string): Promise<User[]> {
  const users: User[] = [];

  // Helper function to get or create user
  async function getOrCreateUser(
    email: string,
    name: string,
    password: string,
  ): Promise<User | null> {
    try {
      // Check if user already exists in database
      const existingUser = await db.query.user.findFirst({
        where: eq(schema.user.email, email),
      });

      if (existingUser) {
        console.log(`User ${email} already exists, using existing...`);
        return existingUser;
      }

      // Create new user via Better Auth
      const newUser = await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
        },
      });

      if (newUser && newUser.user) {
        return newUser.user as User;
      }
    } catch {
      console.log(
        `Failed to create user ${email}, checking database directly...`,
      );

      // Try to find user in database as fallback
      const user = await db.query.user.findFirst({
        where: eq(schema.user.email, email),
      });

      return user || null;
    }
    return null;
  }

  // Create/fetch admin user
  const admin = await getOrCreateUser(
    "admin@resolvedesk.com",
    "Admin User",
    "Admin123!",
  );
  if (admin) {
    users.push(admin);

    // Check if membership exists
    const existingMember = await db.query.member.findFirst({
      where: (member, { and, eq }) =>
        and(
          eq(member.userId, admin.id),
          eq(member.organizationId, organizationId),
        ),
    });

    if (!existingMember) {
      await db.insert(schema.member).values({
        id: faker.string.uuid(),
        organizationId,
        userId: admin.id,
        role: "admin",
        createdAt: new Date(),
      });
    }
  }

  // Create/fetch agent user
  const agent = await getOrCreateUser(
    "agent@resolvedesk.com",
    "Support Agent",
    "Agent123!",
  );
  if (agent) {
    users.push(agent);

    const existingMember = await db.query.member.findFirst({
      where: (member, { and, eq }) =>
        and(
          eq(member.userId, agent.id),
          eq(member.organizationId, organizationId),
        ),
    });

    if (!existingMember) {
      await db.insert(schema.member).values({
        id: faker.string.uuid(),
        organizationId,
        userId: agent.id,
        role: "member",
        createdAt: new Date(),
      });
    }
  }

  // Create/fetch customer user
  const customer = await getOrCreateUser(
    "customer@resolvedesk.com",
    "Demo Customer",
    "Customer123!",
  );
  if (customer) {
    users.push(customer);

    const existingMember = await db.query.member.findFirst({
      where: (member, { and, eq }) =>
        and(
          eq(member.userId, customer.id),
          eq(member.organizationId, organizationId),
        ),
    });

    if (!existingMember) {
      await db.insert(schema.member).values({
        id: faker.string.uuid(),
        organizationId,
        userId: customer.id,
        role: "member",
        createdAt: new Date(),
      });
    }
  }

  // Get all members of the organization
  const organizationMembers = await db.query.member.findMany({
    where: eq(schema.member.organizationId, organizationId),
    with: {
      user: true,
    },
  });

  // Add all organization members to users array
  for (const member of organizationMembers) {
    if (!users.some((u) => u.id === member.user.id)) {
      users.push(member.user);
    }
  }

  // If we still don't have enough users, create some random ones
  if (users.length < 5) {
    console.log("Creating additional random users...");
    for (let i = 0; i < 10; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });

      const user = await getOrCreateUser(
        email,
        `${firstName} ${lastName}`,
        "Password123!",
      );

      if (user && !users.some((u) => u.id === user.id)) {
        users.push(user);

        // Add to organization
        const existingMember = await db.query.member.findFirst({
          where: (member, { and, eq }) =>
            and(
              eq(member.userId, user.id),
              eq(member.organizationId, organizationId),
            ),
        });

        if (!existingMember) {
          await db.insert(schema.member).values({
            id: faker.string.uuid(),
            organizationId,
            userId: user.id,
            role: "member",
            createdAt: faker.date.past({ years: 1 }),
          });
        }
      }
    }
  }

  return users;
}

async function createSLAs(organizationId: string): Promise<SLA[]> {
  // Check if SLAs already exist
  const existingSLAs = await db.query.sla.findMany({
    where: eq(schema.sla.organizationId, organizationId),
  });

  if (existingSLAs.length > 0) {
    console.log("SLAs already exist, using existing...");
    return existingSLAs;
  }

  const slaPolicies = [
    {
      name: "Standard Support",
      firstResponseTime: 240, // 4 hours in minutes
      resolutionTime: 1440, // 24 hours in minutes
    },
    {
      name: "Premium Support",
      firstResponseTime: 60, // 1 hour in minutes
      resolutionTime: 480, // 8 hours in minutes
    },
    {
      name: "Enterprise SLA",
      firstResponseTime: 30, // 30 minutes
      resolutionTime: 240, // 4 hours in minutes
    },
    {
      name: "Basic Support",
      firstResponseTime: 480, // 8 hours in minutes
      resolutionTime: 2880, // 48 hours in minutes
    },
  ];

  const slas: SLA[] = [];
  for (const policy of slaPolicies) {
    const sla: SLA = {
      id: faker.string.uuid(),
      name: policy.name,
      firstResponseTime: policy.firstResponseTime,
      resolutionTime: policy.resolutionTime,
      organizationId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
    slas.push(sla);
    await db.insert(schema.sla).values(sla);
  }

  return slas;
}

async function createCategories(
  organizationId: string,
): Promise<TicketCategory[]> {
  // Check if categories already exist
  const existingCategories = await db.query.ticketCategory.findMany({
    where: eq(schema.ticketCategory.organizationId, organizationId),
  });

  if (existingCategories.length > 0) {
    console.log("Categories already exist, using existing...");
    return existingCategories;
  }

  const categoryNames = [
    "Technical Support",
    "Billing & Invoicing",
    "Feature Request",
    "Bug Report",
    "Account Management",
    "General Inquiry",
    "Security Issue",
    "Documentation",
    "Integration Help",
    "Training & Onboarding",
  ];

  const categories: TicketCategory[] = [];
  for (const name of categoryNames) {
    const category: TicketCategory = {
      id: faker.string.uuid(),
      name,
      organizationId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
    categories.push(category);
    await db.insert(schema.ticketCategory).values(category);
  }

  return categories;
}

async function createTags(organizationId: string): Promise<Tag[]> {
  // Check if tags already exist
  const existingTags = await db.query.tag.findMany({
    where: eq(schema.tag.organizationId, organizationId),
  });

  if (existingTags.length > 0) {
    console.log("Tags already exist, using existing...");
    return existingTags;
  }

  const tagNames = [
    "urgent",
    "high-priority",
    "low-priority",
    "bug",
    "feature",
    "question",
    "duplicate",
    "wontfix",
    "needs-review",
    "in-progress",
    "blocked",
    "customer-feedback",
    "internal",
    "documentation",
    "security",
    "performance",
    "ui/ux",
    "api",
    "mobile",
    "web",
  ];

  const tags: Tag[] = [];
  for (const name of tagNames) {
    const tag: Tag = {
      id: faker.string.uuid(),
      name,
      organizationId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
    tags.push(tag);
    await db.insert(schema.tag).values(tag);
  }

  return tags;
}

async function createTickets(
  organizationId: string,
  users: User[],
  slas: SLA[],
  categories: TicketCategory[],
  tags: Tag[],
): Promise<Ticket[]> {
  // Check if tickets already exist
  const existingTickets = await db.query.ticket.findMany({
    where: eq(schema.ticket.organizationId, organizationId),
    limit: 1,
  });

  if (existingTickets.length > 0) {
    console.log("Tickets already exist, skipping ticket creation...");
    return [];
  }

  const tickets: Ticket[] = [];
  const statuses = ["open", "in_progress", "resolved", "closed"] as const;
  const priorities = ["low", "medium", "high", "urgent"] as const;

  const agents = users.filter(
    (u) =>
      u.email?.includes("agent@") ||
      u.email?.includes("agent.") ||
      u.email === "admin@resolvedesk.com",
  );
  const customers = users.filter(
    (u) =>
      !u.email?.includes("agent@") &&
      !u.email?.includes("agent.") &&
      u.email !== "admin@resolvedesk.com",
  );

  if (agents.length === 0) {
    throw new Error("No agents found in users array");
  }

  if (customers.length === 0) {
    throw new Error("No customers found in users array");
  }

  console.log(
    `Found ${agents.length} agents and ${customers.length} customers`,
  );

  // Create 50 tickets with various states
  for (let i = 1; i <= 50; i++) {
    const status = faker.helpers.arrayElement(statuses);
    const priority = faker.helpers.arrayElement(priorities);
    const createdBy = faker.helpers.arrayElement(customers);
    const assignedTo = faker.datatype.boolean(0.7)
      ? faker.helpers.arrayElement(agents).id
      : null;
    const category = faker.helpers.arrayElement(categories);
    const sla = faker.helpers.arrayElement(slas);

    const createdAt = faker.date.past({ years: 0.5 });
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

    // Calculate deadlines based on SLA (convert minutes to milliseconds)
    const firstResponseDeadline =
      faker.datatype.boolean(0.6) && assignedTo
        ? new Date(createdAt.getTime() + sla.firstResponseTime! * 60 * 1000)
        : null;

    const resolutionDeadline = assignedTo
      ? new Date(createdAt.getTime() + sla.resolutionTime! * 60 * 1000)
      : null;

    const ticketNumber = `TK-${2024}${String(i).padStart(4, "0")}`;

    const ticket: Ticket = {
      id: faker.string.uuid(),
      ticketNumber,
      title: faker.company.catchPhrase(),
      description: faker.datatype.boolean(0.8)
        ? faker.lorem.paragraphs({ min: 1, max: 3 })
        : null,
      status,
      priority,
      createdById: createdBy.id,
      assignedToId: assignedTo,
      categoryId: category.id,
      slaId: sla.id,
      organizationId,
      firstResponseDeadline,
      resolutionDeadline,
      createdAt,
      updatedAt,
    };

    tickets.push(ticket);
    await db.insert(schema.ticket).values(ticket);

    // Create messages for the ticket
    await createTicketMessages(ticket.id!, users, assignedTo, createdBy.id!);

    // Add some tags to the ticket
    await addTagsToTicket(
      ticket.id!,
      tags,
      faker.number.int({ min: 1, max: 4 }),
    );

    // Create initial activity
    await createTicketActivity(ticket.id!, createdBy.id!, "created", {
      title: ticket.title,
      priority: ticket.priority,
    });

    if (i % 10 === 0) {
      console.log(`Created ${i} tickets...`);
    }
  }

  return tickets;
}

async function createTicketMessages(
  ticketId: string,
  users: User[],
  assignedToId: string | null,
  createdById: string,
) {
  const messageCount = faker.number.int({ min: 2, max: 8 });
  const customer = users.find((u) => u.id === createdById);
  const agent = assignedToId ? users.find((u) => u.id === assignedToId) : null;

  for (let i = 0; i < messageCount; i++) {
    const isAgentMessage = !!agent && i % 2 === 1;
    const sender = isAgentMessage ? agent : customer;

    const message: TicketMessage = {
      id: faker.string.uuid(),
      ticketId,
      senderId: sender?.id ?? createdById,
      message: faker.lorem.sentences({ min: 1, max: 4 }),
      isInternal: isAgentMessage && faker.datatype.boolean(0.2),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
    await db.insert(schema.ticketMessage).values(message);
  }
}

async function addTagsToTicket(ticketId: string, tags: Tag[], count: number) {
  const selectedTags = faker.helpers.arrayElements(tags, count);

  for (const tag of selectedTags) {
    try {
      await db.insert(schema.ticketTag).values({
        id: faker.string.uuid(),
        ticketId,
        tagId: tag.id!,
        createdAt: faker.date.recent(),
        updatedAt: faker.date.recent(),
      });
    } catch {
      // Ignore unique constraint violations
    }
  }
}

async function createTicketActivity(
  ticketId: string,
  userId: string,
  action: string,
  metadata: any,
) {
  const activity: TicketActivity = {
    id: faker.string.uuid(),
    ticketId,
    userId,
    action,
    metadata,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
  await db.insert(schema.ticketActivity).values(activity);
}

async function createTicketActivities(tickets: Ticket[], users: User[]) {
  const actions = [
    "status_change",
    "priority_change",
    "assignment",
    "comment",
    "note",
  ];

  for (const ticket of tickets) {
    const activityCount = faker.number.int({ min: 2, max: 10 });

    for (let i = 0; i < activityCount; i++) {
      const action = faker.helpers.arrayElement(actions);
      const user = faker.helpers.arrayElement(users);

      let metadata = {};
      switch (action) {
        case "status_change":
          metadata = { from: "open", to: "in_progress" };
          break;
        case "priority_change":
          metadata = { from: "medium", to: "high" };
          break;
        case "assignment":
          metadata = { assignedTo: faker.helpers.arrayElement(users).id };
          break;
      }

      await createTicketActivity(ticket.id!, user.id!, action, metadata);
    }
  }
}

async function createTicketWatchers(tickets: Ticket[], users: User[]) {
  for (const ticket of tickets) {
    const watcherCount = faker.number.int({ min: 0, max: 3 });
    const watchers = faker.helpers.arrayElements(users, watcherCount);

    for (const watcher of watchers) {
      try {
        const ticketWatcher: TicketWatcher = {
          id: faker.string.uuid(),
          ticketId: ticket.id!,
          userId: watcher.id!,
          createdAt: faker.date.recent(),
          updatedAt: faker.date.recent(),
        };
        await db.insert(schema.ticketWatcher).values(ticketWatcher);
      } catch {
        // Ignore unique constraint violations
      }
    }
  }
}

async function createTicketSequence(
  organizationId: string,
  lastNumber: number,
) {
  const ticketSequence: TicketSequence = {
    id: faker.string.uuid(),
    organizationId,
    lastNumber,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(schema.ticketSequence).values(ticketSequence);
}

// Run the seeder
const isSeedCliInvocation =
  process.argv[1]?.endsWith("scripts/seed.ts") ||
  process.argv[1]?.endsWith("scripts\\seed.ts");

if (isSeedCliInvocation) {
  seed().catch(console.error);
}
