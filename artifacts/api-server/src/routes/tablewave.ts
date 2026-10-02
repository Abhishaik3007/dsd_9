import { Router, type IRouter } from "express";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  ne,
} from "drizzle-orm";
import {
  CreateBusinessBody,
  CreateBusinessResponse,
  CreateCategoryBody,
  CreateCategoryResponse,
  CreateItemBody,
  CreateItemResponse,
  CreateOutletBody,
  CreateOutletResponse,
  CreatePlanBody,
  CreatePlanResponse,
  DeleteCategoryParams,
  DeleteItemParams,
  DeleteOutletParams,
  GetAnalyticsResponse,
  GetCurrentUserResponse,
  GetDashboardResponse,
  GetStoreMenuParams,
  GetStoreMenuResponse,
  InviteTeamMemberBody,
  InviteTeamMemberResponse,
  ListBusinessesResponse,
  ListCategoriesResponse,
  ListItemsResponse,
  ListOrdersResponse,
  ListOutletsResponse,
  ListPlansResponse,
  ListTeamResponse,
  PlaceStoreOrderBody,
  PlaceStoreOrderResponse,
  UpdateBusinessBody,
  UpdateBusinessParams,
  UpdateBusinessResponse,
  UpdateCategoryBody,
  UpdateCategoryParams,
  UpdateCategoryResponse,
  UpdateItemBody,
  UpdateItemParams,
  UpdateItemResponse,
  UpdateOrderBody,
  UpdateOrderParams,
  UpdateOrderResponse,
  UpdateOutletBody,
  UpdateOutletParams,
  UpdateOutletResponse,
} from "@workspace/api-zod";
import {
  businessesTable,
  categoriesTable,
  db,
  invitationsTable,
  itemsTable,
  membershipsTable,
  ordersTable,
  outletsTable,
  plansTable,
  usersTable,
  type OrderLine,
} from "@workspace/db";
import {
  currentUser,
  requireBusinessAccess,
  requireSuperAdmin,
  requireTablewaveUser,
  type TablewaveUser,
} from "../lib/tablewave-auth";
import { vendorAccounts } from "./auth";
import {
  mockBusinesses,
  mockCategories,
  mockItems,
  mockOrders,
  mockOutlets,
  mockPlans,
  mockTeamMembers,
} from "../lib/mock-data";

const router: IRouter = Router();
const protectedRouter: IRouter = Router();
protectedRouter.use(requireTablewaveUser);

const makeSlug = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54) || "venue";

function businessIdFor(user: TablewaveUser, requested?: string): string | null {
  return user.isSuperAdmin ? requested ?? null : user.businessId;
}

function visibleBusinessFilter(user: TablewaveUser) {
  return user.isSuperAdmin || !user.businessId
    ? undefined
    : eq(businessesTable.id, user.businessId);
}

function resourceBusinessFilter(user: TablewaveUser) {
  return user.isSuperAdmin || !user.businessId
    ? undefined
    : eq(itemsTable.businessId, user.businessId);
}

async function businessView(business: typeof businessesTable.$inferSelect) {
  const [plan] = business.planId
    ? await db.select().from(plansTable).where(eq(plansTable.id, business.planId)).limit(1)
    : [];
  const [outletResult] = await db
    .select({ value: count() })
    .from(outletsTable)
    .where(eq(outletsTable.businessId, business.id));
  const [orderResult] = await db
    .select({ value: count() })
    .from(ordersTable)
    .where(eq(ordersTable.businessId, business.id));
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    type: business.type,
    status: business.status,
    ownerEmail: business.ownerEmail,
    planId: business.planId,
    planName: plan?.name ?? null,
    expiresAt: business.expiresAt?.toISOString() ?? null,
    outletCount: Number(outletResult?.value ?? 0),
    orderCount: Number(orderResult?.value ?? 0),
    createdAt: business.createdAt.toISOString(),
  };
}

async function orderViews(user: TablewaveUser, limit = 1000) {
  const joined = await db
    .select({
      order: ordersTable,
      businessName: businessesTable.name,
      outletName: outletsTable.name,
    })
    .from(ordersTable)
    .innerJoin(businessesTable, eq(ordersTable.businessId, businessesTable.id))
    .innerJoin(outletsTable, eq(ordersTable.outletId, outletsTable.id))
    .where(user.isSuperAdmin || !user.businessId
      ? undefined
      : eq(ordersTable.businessId, user.businessId))
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit);

  return joined.map(({ order, businessName, outletName }) => ({
    id: order.id,
    businessId: order.businessId,
    businessName,
    outletId: order.outletId,
    outletName,
    tableNumber: order.tableNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    total: Number(order.total),
    items: order.items,
    createdAt: order.createdAt.toISOString(),
  }));
}

async function allowedBusiness(user: TablewaveUser, requested?: string) {
  const id = businessIdFor(user, requested);
  if (!id) return null;
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, id))
    .limit(1);
  if (!business || (!user.isSuperAdmin && business.id !== user.businessId)) return null;
  return business;
}

protectedRouter.get("/me", (_req, res) => {
  const user = currentUser(res);
  res.json(
    GetCurrentUserResponse.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      businessName: user.businessName,
      status: user.status,
    }),
  );
});

protectedRouter.get("/dashboard", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  const roleScope = requireBusinessAccess(user, res);
  if (!user.isSuperAdmin && !roleScope) return;

  const businesses = await db
    .select()
    .from(businessesTable)
    .where(visibleBusinessFilter(user));
  const scopedOrders = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        user.isSuperAdmin || !user.businessId
          ? undefined
          : eq(ordersTable.businessId, user.businessId),
        ne(ordersTable.status, "cancelled"),
      ),
    );
  const recentOrders = (await orderViews(user, 8));
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const orderTrend = days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const matching = scopedOrders.filter(
      (order) => order.createdAt >= day && order.createdAt < next,
    );
    return {
      label: day.toLocaleDateString("en", { weekday: "short" }),
      orders: matching.length,
      revenue: matching.reduce((sum, order) => sum + Number(order.total), 0),
    };
  });
  const pendingOrderCount = scopedOrders.filter(
    (order) => order.status === "new" || order.status === "preparing",
  ).length;
  res.json(
    GetDashboardResponse.parse({
      businessCount: businesses.length,
      activeBusinessCount: businesses.filter((business) => business.status === "active").length,
      orderCount: scopedOrders.length,
      revenue: scopedOrders.reduce((sum, order) => sum + Number(order.total), 0),
      pendingOrderCount,
      recentOrders,
      orderTrend,
    }),
  );
});

protectedRouter.get("/businesses", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: Staff members cannot view or manage businesses." });
    return;
  }
  if (!user.isSuperAdmin && !user.businessId) {
    res.status(403).json({ error: "Access denied." });
    return;
  }
  const businesses = user.isSuperAdmin
    ? await db.select().from(businessesTable).orderBy(desc(businessesTable.createdAt))
    : await db.select().from(businessesTable).where(eq(businessesTable.id, user.businessId!));
  res.json(ListBusinessesResponse.parse(await Promise.all(businesses.map(businessView))));
});

protectedRouter.post("/businesses", async (req, res): Promise<void> => {
  const user = currentUser(res);
  if (!requireSuperAdmin(user, res)) return;
  const parsed = CreateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const baseSlug = makeSlug(data.name);
  let slug = baseSlug;
  let suffix = 1;
  while ((await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.slug, slug)).limit(1)).length) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  const [defaultPlan] = data.planId
    ? await db.select().from(plansTable).where(eq(plansTable.id, data.planId)).limit(1)
    : await db.select().from(plansTable).where(eq(plansTable.active, true)).orderBy(asc(plansTable.price)).limit(1);
  if (data.planId && !defaultPlan) {
    res.status(400).json({ error: "The selected plan does not exist." });
    return;
  }
  const created = await db.transaction(async (tx) => {
    const [business] = await tx
      .insert(businessesTable)
      .values({
        name: data.name.trim(),
        slug,
        type: data.type,
        ownerEmail: data.ownerEmail.trim().toLowerCase(),
        planId: defaultPlan?.id ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status: "active",
      })
      .returning();
    await tx.insert(outletsTable).values({
      businessId: business.id,
      name: "Main outlet",
      slug: "main",
      address: "",
      tableCount: 12,
    });
    await tx.insert(categoriesTable).values([
      { businessId: business.id, name: "Starters", sortOrder: 0 },
      { businessId: business.id, name: "Mains", sortOrder: 1 },
      { businessId: business.id, name: "Drinks", sortOrder: 2 },
    ]);
    await tx.insert(invitationsTable).values({
      email: data.ownerEmail.trim().toLowerCase(),
      businessId: business.id,
      role: "business_admin",
      status: "invited",
    });
    return business;
  });

  const ownerEmail = data.ownerEmail.trim().toLowerCase();
  vendorAccounts.set(ownerEmail, {
    email: ownerEmail,
    password: data.password || "password123",
    businessId: created.id,
    businessName: created.name,
    name: `${data.name} Admin`,
    role: "business_admin",
  });

  res.status(201).json(CreateBusinessResponse.parse(await businessView(created)));
});

protectedRouter.patch("/businesses/:businessId", async (req, res): Promise<void> => {
  const user = currentUser(res);
  if (!requireSuperAdmin(user, res)) return;
  const params = UpdateBusinessParams.safeParse(req.params);
  const body = UpdateBusinessBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const patch = body.data;
  const values: Partial<typeof businessesTable.$inferInsert> = {
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.planId !== undefined ? { planId: patch.planId } : {}),
    ...(patch.expiresAt !== undefined
      ? { expiresAt: patch.expiresAt ? new Date(patch.expiresAt) : null }
      : {}),
  };
  const [updated] = await db
    .update(businessesTable)
    .set(values)
    .where(eq(businessesTable.id, params.data.businessId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Business not found." });
    return;
  }
  res.json(UpdateBusinessResponse.parse(await businessView(updated)));
});

protectedRouter.get("/team", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: Staff members cannot view team management." });
    return;
  }
  const businessId = user.isSuperAdmin ? undefined : requireBusinessAccess(user, res);
  if (!user.isSuperAdmin && !businessId) return;
  const members = await db
    .select({
      user: usersTable,
      membership: membershipsTable,
      businessName: businessesTable.name,
    })
    .from(membershipsTable)
    .innerJoin(usersTable, eq(membershipsTable.userId, usersTable.id))
    .innerJoin(businessesTable, eq(membershipsTable.businessId, businessesTable.id))
    .where(user.isSuperAdmin ? undefined : eq(membershipsTable.businessId, businessId!));
  const pendingInvites = await db
    .select({
      id: invitationsTable.id,
      email: invitationsTable.email,
      role: invitationsTable.role,
      status: invitationsTable.status,
      businessId: invitationsTable.businessId,
      businessName: businessesTable.name,
      createdAt: invitationsTable.createdAt,
    })
    .from(invitationsTable)
    .leftJoin(businessesTable, eq(invitationsTable.businessId, businessesTable.id))
    .where(
      and(
        eq(invitationsTable.status, "invited"),
        user.isSuperAdmin ? undefined : eq(invitationsTable.businessId, businessId!),
      ),
    );
  const team = [
    ...members.map(({ user: member, membership, businessName }) => ({
      id: membership.id,
      email: member.email,
      name: member.name,
      role: membership.role,
      status: membership.status,
      businessId: membership.businessId,
      businessName,
      createdAt: membership.createdAt.toISOString(),
    })),
    ...pendingInvites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      name: invite.email.split("@")[0] ?? invite.email,
      role: invite.role,
      status: "invited",
      businessId: invite.businessId,
      businessName: invite.businessName,
      createdAt: invite.createdAt.toISOString(),
    })),
  ];
  res.json(ListTeamResponse.parse(team));
});

protectedRouter.post("/team", async (req, res): Promise<void> => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: Staff members cannot invite team members." });
    return;
  }
  const parsed = InviteTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const businessId = businessIdFor(user, parsed.data.businessId ?? undefined);
  if (!businessId || (!user.isSuperAdmin && user.status !== "active")) {
    res.status(403).json({ error: "Choose a business you have access to." });
    return;
  }
  if (!user.isSuperAdmin && parsed.data.role !== "staff") {
    res.status(403).json({ error: "Business admins can invite staff only." });
    return;
  }
  const business = await allowedBusiness(user, businessId);
  if (!business) {
    res.status(404).json({ error: "Business not found." });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existingUser) {
    const [membership] = await db
      .insert(membershipsTable)
      .values({ userId: existingUser.id, businessId, role: parsed.data.role, status: "active" })
      .onConflictDoNothing()
      .returning();
    if (membership) {
      res.status(201).json(InviteTeamMemberResponse.parse({
        id: membership.id,
        email: existingUser.email,
        name: existingUser.name,
        role: membership.role,
        status: membership.status,
        businessId,
        businessName: business.name,
        createdAt: membership.createdAt.toISOString(),
      }));
      return;
    }
  }
  const [invite] = await db
    .insert(invitationsTable)
    .values({ email, businessId, role: parsed.data.role, status: "active" })
    .returning();
  res.status(201).json(InviteTeamMemberResponse.parse({
    id: invite.id,
    email,
    name: email.split("@")[0] ?? email,
    role: invite.role,
    status: invite.status,
    businessId,
    businessName: business.name,
    createdAt: invite.createdAt.toISOString(),
  }));
});

protectedRouter.get("/plans", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: Plans management is restricted." });
    return;
  }
  const rows = await db.select().from(plansTable).orderBy(asc(plansTable.price));
  res.json(ListPlansResponse.parse(rows.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    interval: plan.interval,
    outletLimit: plan.outletLimit,
    itemLimit: plan.itemLimit,
    active: plan.active,
  }))));
});

protectedRouter.post("/plans", async (req, res): Promise<void> => {
  const user = currentUser(res);
  if (!requireSuperAdmin(user, res)) return;
  const parsed = CreatePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [plan] = await db.insert(plansTable).values(parsed.data).returning();
  res.status(201).json(CreatePlanResponse.parse({
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    interval: plan.interval,
    outletLimit: plan.outletLimit,
    itemLimit: plan.itemLimit,
    active: plan.active,
  }));
});

protectedRouter.get("/outlets", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  if (!user.isSuperAdmin && !requireBusinessAccess(user, res)) return;
  const rows = await db
    .select()
    .from(outletsTable)
    .where(user.isSuperAdmin || !user.businessId
      ? undefined
      : eq(outletsTable.businessId, user.businessId))
    .orderBy(asc(outletsTable.name));
  res.json(ListOutletsResponse.parse(rows.map((outlet) => ({
    id: outlet.id,
    businessId: outlet.businessId,
    name: outlet.name,
    slug: outlet.slug,
    address: outlet.address,
    active: outlet.active,
    tableCount: outlet.tableCount,
  }))));
});

protectedRouter.post("/outlets", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const parsed = CreateOutletBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const businessId = businessIdFor(user, parsed.data.businessId);
  if (!businessId || (!user.isSuperAdmin && user.status !== "active")) {
    res.status(403).json({ error: "Choose a business you have access to." });
    return;
  }
  const business = await allowedBusiness(user, businessId);
  if (!business || business.status !== "active") {
    res.status(404).json({ error: "Active business not found." });
    return;
  }
  if (business.planId) {
    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, business.planId)).limit(1);
    const [existingCount] = await db.select({ value: count() }).from(outletsTable).where(eq(outletsTable.businessId, business.id));
    if (!user.isSuperAdmin && plan && Number(existingCount?.value ?? 0) >= plan.outletLimit) {
      res.status(409).json({ error: `This plan allows ${plan.outletLimit} outlets.` });
      return;
    }
  }
  const base = makeSlug(parsed.data.name);
  let slug = base;
  let suffix = 1;
  while ((await db.select({ id: outletsTable.id }).from(outletsTable).where(and(eq(outletsTable.businessId, business.id), eq(outletsTable.slug, slug))).limit(1)).length) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  const [outlet] = await db.insert(outletsTable).values({
    businessId: business.id,
    name: parsed.data.name.trim(),
    address: parsed.data.address,
    slug,
    tableCount: parsed.data.tableCount,
  }).returning();
  res.status(201).json(CreateOutletResponse.parse({
    id: outlet.id,
    businessId: outlet.businessId,
    name: outlet.name,
    slug: outlet.slug,
    address: outlet.address,
    active: outlet.active,
    tableCount: outlet.tableCount,
  }));
});

protectedRouter.patch("/outlets/:outletId", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const params = UpdateOutletParams.safeParse(req.params);
  const body = UpdateOutletBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const id = params.data.outletId;
  const [existing] = await db.select().from(outletsTable).where(eq(outletsTable.id, id)).limit(1);
  if (!existing || (!user.isSuperAdmin && existing.businessId !== user.businessId)) {
    res.status(404).json({ error: "Outlet not found." });
    return;
  }
  if (!user.isSuperAdmin && user.status !== "active") {
    res.status(403).json({ error: "This business account is not active." });
    return;
  }
  const patch = body.data;
  const [outlet] = await db.update(outletsTable).set({
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.address !== undefined ? { address: patch.address } : {}),
    ...(patch.active !== undefined ? { active: patch.active } : {}),
    ...(patch.tableCount !== undefined ? { tableCount: patch.tableCount } : {}),
  }).where(eq(outletsTable.id, id)).returning();
  res.json(UpdateOutletResponse.parse({
    id: outlet.id,
    businessId: outlet.businessId,
    name: outlet.name,
    slug: outlet.slug,
    address: outlet.address,
    active: outlet.active,
    tableCount: outlet.tableCount,
  }));
});

protectedRouter.delete("/outlets/:outletId", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const parsed = DeleteOutletParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [outlet] = await db.select().from(outletsTable).where(eq(outletsTable.id, parsed.data.outletId)).limit(1);
  if (!outlet || (!user.isSuperAdmin && outlet.businessId !== user.businessId)) {
    res.status(404).json({ error: "Outlet not found." });
    return;
  }
  const [orderCount] = await db.select({ value: count() }).from(ordersTable).where(eq(ordersTable.outletId, outlet.id));
  if (Number(orderCount?.value ?? 0) > 0) {
    res.status(409).json({ error: "This outlet has order history. Deactivate it instead of deleting it." });
    return;
  }
  await db.delete(outletsTable).where(eq(outletsTable.id, outlet.id));
  res.sendStatus(204);
});

protectedRouter.get("/categories", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  if (!user.isSuperAdmin && !requireBusinessAccess(user, res)) return;
  const rows = await db
    .select()
    .from(categoriesTable)
    .where(user.isSuperAdmin || !user.businessId
      ? undefined
      : eq(categoriesTable.businessId, user.businessId))
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
  res.json(ListCategoriesResponse.parse(rows.map((category) => ({
    id: category.id,
    businessId: category.businessId,
    name: category.name,
    sortOrder: category.sortOrder,
  }))));
});

protectedRouter.post("/categories", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const business = await allowedBusiness(user, parsed.data.businessId);
  if (!business || (!user.isSuperAdmin && user.status !== "active")) {
    res.status(403).json({ error: "Choose an active business you have access to." });
    return;
  }
  const [category] = await db.insert(categoriesTable).values({
    businessId: business.id,
    name: parsed.data.name.trim(),
    sortOrder: parsed.data.sortOrder ?? 0,
  }).returning();
  res.status(201).json(CreateCategoryResponse.parse({
    id: category.id,
    businessId: category.businessId,
    name: category.name,
    sortOrder: category.sortOrder,
  }));
});

protectedRouter.patch("/categories/:categoryId", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const params = UpdateCategoryParams.safeParse(req.params);
  const body = UpdateCategoryBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.data.categoryId)).limit(1);
  if (!existing || (!user.isSuperAdmin && existing.businessId !== user.businessId)) {
    res.status(404).json({ error: "Category not found." });
    return;
  }
  const [category] = await db.update(categoriesTable).set({
    ...(body.data.name !== undefined ? { name: body.data.name.trim() } : {}),
    ...(body.data.sortOrder !== undefined ? { sortOrder: body.data.sortOrder } : {}),
  }).where(eq(categoriesTable.id, existing.id)).returning();
  res.json(UpdateCategoryResponse.parse({
    id: category.id,
    businessId: category.businessId,
    name: category.name,
    sortOrder: category.sortOrder,
  }));
});

protectedRouter.delete("/categories/:categoryId", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const parsed = DeleteCategoryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, parsed.data.categoryId)).limit(1);
  if (!category || (!user.isSuperAdmin && category.businessId !== user.businessId)) {
    res.status(404).json({ error: "Category not found." });
    return;
  }
  const [itemCount] = await db.select({ value: count() }).from(itemsTable).where(eq(itemsTable.categoryId, category.id));
  if (Number(itemCount?.value ?? 0) > 0) {
    res.status(409).json({ error: "Move or remove the menu items in this category before deleting it." });
    return;
  }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, category.id));
  res.sendStatus(204);
});

protectedRouter.get("/items", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  if (!user.isSuperAdmin && !requireBusinessAccess(user, res)) return;
  const rows = await db
    .select({ item: itemsTable, categoryName: categoriesTable.name })
    .from(itemsTable)
    .innerJoin(categoriesTable, eq(itemsTable.categoryId, categoriesTable.id))
    .where(resourceBusinessFilter(user))
    .orderBy(asc(itemsTable.name));
  res.json(ListItemsResponse.parse(rows.map(({ item, categoryName }) => ({
    id: item.id,
    businessId: item.businessId,
    categoryId: item.categoryId,
    categoryName,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    available: item.available,
    variants: item.variants,
    addOns: item.addOns,
  }))));
});

protectedRouter.post("/items", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const business = await allowedBusiness(user, parsed.data.businessId);
  if (!business || (!user.isSuperAdmin && user.status !== "active")) {
    res.status(403).json({ error: "Choose an active business you have access to." });
    return;
  }
  const [category] = await db.select().from(categoriesTable).where(and(
    eq(categoriesTable.id, parsed.data.categoryId),
    eq(categoriesTable.businessId, business.id),
  )).limit(1);
  if (!category) {
    res.status(400).json({ error: "Choose a category in this business." });
    return;
  }
  const [plan] = business.planId
    ? await db.select().from(plansTable).where(eq(plansTable.id, business.planId)).limit(1)
    : [];
  const [itemCount] = await db.select({ value: count() }).from(itemsTable).where(eq(itemsTable.businessId, business.id));
  if (!user.isSuperAdmin && plan && Number(itemCount?.value ?? 0) >= plan.itemLimit) {
    res.status(409).json({ error: `This plan allows ${plan.itemLimit} menu items.` });
    return;
  }
  const [item] = await db.insert(itemsTable).values({
    businessId: business.id,
    categoryId: category.id,
    name: parsed.data.name.trim(),
    description: parsed.data.description ?? "",
    price: parsed.data.price,
    imageUrl: parsed.data.imageUrl ?? "",
    available: parsed.data.available ?? true,
    variants: parsed.data.variants ?? [],
    addOns: parsed.data.addOns ?? [],
  }).returning();
  res.status(201).json(CreateItemResponse.parse({
    id: item.id,
    businessId: item.businessId,
    categoryId: item.categoryId,
    categoryName: category.name,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    available: item.available,
    variants: item.variants,
    addOns: item.addOns,
  }));
});

protectedRouter.patch("/items/:itemId", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const params = UpdateItemParams.safeParse(req.params);
  const body = UpdateItemBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [existing] = await db.select().from(itemsTable).where(eq(itemsTable.id, params.data.itemId)).limit(1);
  if (!existing || (!user.isSuperAdmin && existing.businessId !== user.businessId)) {
    res.status(404).json({ error: "Menu item not found." });
    return;
  }
  if (!user.isSuperAdmin && user.status !== "active") {
    res.status(403).json({ error: "This business account is not active." });
    return;
  }
  const categoryId = body.data.categoryId ?? existing.categoryId;
  const [category] = await db.select().from(categoriesTable).where(and(
    eq(categoriesTable.id, categoryId),
    eq(categoriesTable.businessId, existing.businessId),
  )).limit(1);
  if (!category) {
    res.status(400).json({ error: "Choose a category in this business." });
    return;
  }
  const [item] = await db.update(itemsTable).set({
    ...(body.data.categoryId !== undefined ? { categoryId: body.data.categoryId } : {}),
    ...(body.data.name !== undefined ? { name: body.data.name.trim() } : {}),
    ...(body.data.description !== undefined ? { description: body.data.description } : {}),
    ...(body.data.price !== undefined ? { price: body.data.price } : {}),
    ...(body.data.imageUrl !== undefined ? { imageUrl: body.data.imageUrl } : {}),
    ...(body.data.available !== undefined ? { available: body.data.available } : {}),
    ...(body.data.variants !== undefined ? { variants: body.data.variants } : {}),
    ...(body.data.addOns !== undefined ? { addOns: body.data.addOns } : {}),
  }).where(eq(itemsTable.id, existing.id)).returning();
  res.json(UpdateItemResponse.parse({
    id: item.id,
    businessId: item.businessId,
    categoryId: item.categoryId,
    categoryName: category.name,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    available: item.available,
    variants: item.variants,
    addOns: item.addOns,
  }));
});

protectedRouter.delete("/items/:itemId", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const parsed = DeleteItemParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, parsed.data.itemId)).limit(1);
  if (!item || (!user.isSuperAdmin && item.businessId !== user.businessId)) {
    res.status(404).json({ error: "Menu item not found." });
    return;
  }
  await db.delete(itemsTable).where(eq(itemsTable.id, item.id));
  res.sendStatus(204);
});

protectedRouter.get("/orders", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  if (!user.isSuperAdmin && !requireBusinessAccess(user, res)) return;
  res.json(ListOrdersResponse.parse(await orderViews(user)));
});

protectedRouter.patch("/orders/:orderId", async (req, res): Promise<void> => {
  const user = currentUser(res);
  const params = UpdateOrderParams.safeParse(req.params);
  const body = UpdateOrderBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.orderId)).limit(1);
  if (!existing || (!user.isSuperAdmin && existing.businessId !== user.businessId)) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  const transitions: Record<string, string[]> = {
    new: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["completed"],
    completed: [],
    cancelled: [],
  };
  if (!transitions[existing.status]?.includes(body.data.status)) {
    res.status(409).json({ error: `An order cannot move from ${existing.status} to ${body.data.status}.` });
    return;
  }
  await db.update(ordersTable).set({ status: body.data.status }).where(eq(ordersTable.id, existing.id));
  const updated = (await orderViews(user)).find((order) => order.id === existing.id);
  if (!updated) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  res.json(UpdateOrderResponse.parse(updated));
});

protectedRouter.get("/analytics", async (_req, res): Promise<void> => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: Sales analytics are restricted to business administrators." });
    return;
  }
  if (!user.isSuperAdmin && !requireBusinessAccess(user, res)) return;
  const orders = (await orderViews(user)).filter((order) => order.status !== "cancelled");
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  const itemSummary = new Map<string, { quantity: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const previous = itemSummary.get(item.name) ?? { quantity: 0, revenue: 0 };
      previous.quantity += item.quantity;
      previous.revenue += item.quantity * item.unitPrice;
      itemSummary.set(item.name, previous);
    }
  }
  const today = new Date();
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    const dayOrders = orders.filter((order) => {
      const time = new Date(order.createdAt);
      return time >= date && time < end;
    });
    return {
      label: date.toLocaleDateString("en", { weekday: "short" }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
    };
  });
  res.json(GetAnalyticsResponse.parse({
    orderCount: orders.length,
    revenue: total,
    averageOrder: orders.length ? total / orders.length : 0,
    completedCount: orders.filter((order) => order.status === "completed").length,
    trend,
    topItems: [...itemSummary.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  }));
});

router.get("/store/:business/:outlet/:table", async (req, res): Promise<void> => {
  const parsed = GetStoreMenuParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { business: businessSlug, outlet: outletSlug, table } = parsed.data;
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.slug, businessSlug)).limit(1);
  if (
    !business ||
    business.status !== "active" ||
    (business.expiresAt && business.expiresAt.getTime() < Date.now())
  ) {
    res.status(404).json({ error: "This menu is currently unavailable." });
    return;
  }
  const [outlet] = await db.select().from(outletsTable).where(and(
    eq(outletsTable.businessId, business.id),
    eq(outletsTable.slug, outletSlug),
    eq(outletsTable.active, true),
  )).limit(1);
  if (!outlet) {
    res.status(404).json({ error: "This outlet is currently unavailable." });
    return;
  }
  const categories = await db.select().from(categoriesTable)
    .where(eq(categoriesTable.businessId, business.id))
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
  const menuItems = await db
    .select({ item: itemsTable, categoryName: categoriesTable.name })
    .from(itemsTable)
    .innerJoin(categoriesTable, eq(itemsTable.categoryId, categoriesTable.id))
    .where(and(eq(itemsTable.businessId, business.id), eq(itemsTable.available, true)))
    .orderBy(asc(itemsTable.name));
  const [plan] = business.planId
    ? await db.select().from(plansTable).where(eq(plansTable.id, business.planId)).limit(1)
    : [];
  const [outletCount] = await db.select({ value: count() }).from(outletsTable).where(eq(outletsTable.businessId, business.id));
  const [orderCount] = await db.select({ value: count() }).from(ordersTable).where(eq(ordersTable.businessId, business.id));
  res.json(GetStoreMenuResponse.parse({
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      type: business.type,
      status: business.status,
      ownerEmail: business.ownerEmail,
      planId: business.planId,
      planName: plan?.name ?? null,
      expiresAt: business.expiresAt?.toISOString() ?? null,
      outletCount: Number(outletCount?.value ?? 0),
      orderCount: Number(orderCount?.value ?? 0),
      createdAt: business.createdAt.toISOString(),
    },
    outlet: {
      id: outlet.id,
      businessId: outlet.businessId,
      name: outlet.name,
      slug: outlet.slug,
      address: outlet.address,
      active: outlet.active,
      tableCount: outlet.tableCount,
    },
    tableNumber: table,
    categories: categories.map((category) => ({
      id: category.id,
      businessId: category.businessId,
      name: category.name,
      sortOrder: category.sortOrder,
    })),
    items: menuItems.map(({ item, categoryName }) => ({
      id: item.id,
      businessId: item.businessId,
      categoryId: item.categoryId,
      categoryName,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.imageUrl,
      available: item.available,
      variants: item.variants,
      addOns: item.addOns,
    })),
  }));
});

router.post("/store/orders", async (req, res): Promise<void> => {
  const parsed = PlaceStoreOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const input = parsed.data;
  if (!input.items.length || input.items.some((item) => item.quantity < 1 || item.quantity > 99)) {
    res.status(400).json({ error: "Order quantities must be between 1 and 99." });
    return;
  }
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.slug, input.businessSlug)).limit(1);
  if (!business || business.status !== "active" || (business.expiresAt && business.expiresAt.getTime() < Date.now())) {
    res.status(404).json({ error: "This menu is currently unavailable." });
    return;
  }
  const [outlet] = await db.select().from(outletsTable).where(and(
    eq(outletsTable.businessId, business.id),
    eq(outletsTable.slug, input.outletSlug),
    eq(outletsTable.active, true),
  )).limit(1);
  if (!outlet) {
    res.status(404).json({ error: "This outlet is currently unavailable." });
    return;
  }

  const itemIds = [...new Set(input.items.map((item) => item.itemId))];
  const menuRows = await db.select().from(itemsTable).where(and(
    eq(itemsTable.businessId, business.id),
    inArray(itemsTable.id, itemIds),
    eq(itemsTable.available, true),
  ));
  const menuById = new Map(menuRows.map((item) => [item.id, item]));
  const verifiedItems: OrderLine[] = [];
  for (const requested of input.items) {
    const menuItem = menuById.get(requested.itemId);
    if (!menuItem) {
      res.status(400).json({ error: "One or more selected items are unavailable." });
      return;
    }
    const variant = requested.selectedVariant
      ? menuItem.variants.find((choice) => choice.name === requested.selectedVariant)
      : undefined;
    if (requested.selectedVariant && !variant) {
      res.status(400).json({ error: `${menuItem.name} has changed. Refresh the menu and try again.` });
      return;
    }
    const selectedAddOns = requested.selectedAddOns.map((name) => {
      const match = menuItem.addOns.find((choice) => choice.name === name);
      return match ? { name: match.name, price: match.price } : null;
    });
    if (selectedAddOns.some((choice) => choice === null)) {
      res.status(400).json({ error: `${menuItem.name} has changed. Refresh the menu and try again.` });
      return;
    }
    const unitPrice =
      Number(menuItem.price) +
      (variant?.price ?? 0) +
      selectedAddOns.reduce((sum, choice) => sum + (choice?.price ?? 0), 0);
    verifiedItems.push({
      itemId: menuItem.id,
      name: menuItem.name,
      quantity: requested.quantity,
      unitPrice,
      selectedVariant: variant?.name ?? "",
      selectedAddOns: selectedAddOns.map((choice) => choice!.name),
    });
  }
  const total = verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const [order] = await db.insert(ordersTable).values({
    businessId: business.id,
    outletId: outlet.id,
    tableNumber: input.tableNumber,
    customerName: input.customerName.trim() || "Guest",
    customerPhone: input.customerPhone?.trim() ?? "",
    status: "new",
    total,
    items: verifiedItems,
  }).returning();
  res.status(201).json(PlaceStoreOrderResponse.parse({
    id: order.id,
    businessId: business.id,
    businessName: business.name,
    outletId: outlet.id,
    outletName: outlet.name,
    tableNumber: order.tableNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    total: Number(order.total),
    items: order.items,
    createdAt: order.createdAt.toISOString(),
  }));
});

router.use(protectedRouter);

export default router;