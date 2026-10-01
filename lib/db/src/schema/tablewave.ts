import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export type MenuChoice = { name: string; price: number };
export type OrderLine = {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selectedVariant: string;
  selectedAddOns: string[];
};

export const plansTable = pgTable("tablewave_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  interval: text("interval").notNull().default("month"),
  outletLimit: integer("outlet_limit").notNull().default(1),
  itemLimit: integer("item_limit").notNull().default(100),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessesTable = pgTable(
  "tablewave_businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: text("type").notNull(),
    status: text("status").notNull().default("active"),
    ownerEmail: text("owner_email").notNull(),
    planId: uuid("plan_id").references(() => plansTable.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("tablewave_business_status_idx").on(table.status)],
);

export const usersTable = pgTable("tablewave_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const membershipsTable = pgTable(
  "tablewave_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    businessId: uuid("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("business_admin"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("tablewave_memberships_user_business_unique").on(table.userId, table.businessId),
    index("tablewave_memberships_business_idx").on(table.businessId),
  ],
);

export const invitationsTable = pgTable(
  "tablewave_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    businessId: uuid("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("business_admin"),
    status: text("status").notNull().default("invited"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("tablewave_invitations_email_idx").on(table.email, table.status)],
);

export const outletsTable = pgTable(
  "tablewave_outlets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    address: text("address").notNull().default(""),
    active: boolean("active").notNull().default(true),
    tableCount: integer("table_count").notNull().default(12),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("tablewave_outlets_business_slug_unique").on(table.businessId, table.slug),
    index("tablewave_outlets_business_idx").on(table.businessId),
  ],
);

export const categoriesTable = pgTable(
  "tablewave_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("tablewave_categories_business_idx").on(table.businessId)],
);

export const itemsTable = pgTable(
  "tablewave_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
    imageUrl: text("image_url").notNull().default(""),
    available: boolean("available").notNull().default(true),
    variants: jsonb("variants").$type<MenuChoice[]>().notNull().default([]),
    addOns: jsonb("add_ons").$type<MenuChoice[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tablewave_items_business_idx").on(table.businessId),
    index("tablewave_items_category_idx").on(table.categoryId),
  ],
);

export const ordersTable = pgTable(
  "tablewave_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businessesTable.id),
    outletId: uuid("outlet_id").notNull().references(() => outletsTable.id),
    tableNumber: text("table_number").notNull(),
    customerName: text("customer_name").notNull().default("Guest"),
    customerPhone: text("customer_phone").notNull().default(""),
    status: text("status").notNull().default("new"),
    total: numeric("total", { precision: 10, scale: 2, mode: "number" }).notNull(),
    items: jsonb("items").$type<OrderLine[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tablewave_orders_business_created_idx").on(table.businessId, table.createdAt),
    index("tablewave_orders_outlet_idx").on(table.outletId),
  ],
);