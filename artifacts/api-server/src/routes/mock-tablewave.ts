import { Router, type IRouter } from "express";
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
import { currentUser, requireSuperAdmin, requireTablewaveUser } from "../lib/tablewave-auth";
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

const makeSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// /me
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

// /dashboard
protectedRouter.get("/dashboard", async (_req, res) => {
  const user = currentUser(res);
  const scopedOrders = user.isSuperAdmin
    ? mockOrders
    : mockOrders.filter((o) => o.businessId === user.businessId);

  res.json(
    GetDashboardResponse.parse({
      businessCount: mockBusinesses.length,
      activeBusinessCount: mockBusinesses.filter((b) => b.status === "active").length,
      orderCount: scopedOrders.length,
      revenue: scopedOrders.reduce((sum, o) => sum + o.total, 0),
      pendingOrderCount: scopedOrders.filter((o) => o.status === "new" || o.status === "preparing").length,
      recentOrders: scopedOrders.slice(0, 8),
      orderTrend: [
        { label: "Mon", orders: 12, revenue: 340 },
        { label: "Tue", orders: 18, revenue: 520 },
        { label: "Wed", orders: 24, revenue: 680 },
        { label: "Thu", orders: 32, revenue: 890 },
        { label: "Fri", orders: 48, revenue: 1420 },
        { label: "Sat", orders: 62, revenue: 1840 },
        { label: "Sun", orders: 44, revenue: 1290 },
      ],
    }),
  );
});

// /businesses
protectedRouter.get("/businesses", async (_req, res) => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: Staff members cannot view or manage businesses." });
    return;
  }
  if (user.isSuperAdmin) {
    res.json(ListBusinessesResponse.parse(mockBusinesses));
    return;
  }
  const myBiz = mockBusinesses.filter((b) => b.id === user.businessId);
  res.json(ListBusinessesResponse.parse(myBiz.length ? myBiz : [mockBusinesses[0]]));
});

protectedRouter.post("/businesses", async (req, res) => {
  const user = currentUser(res);
  if (!requireSuperAdmin(user, res)) return;
  const parsed = CreateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const plan = mockPlans.find((p) => p.id === data.planId);
  const newBiz = {
    id: `biz_${Date.now()}`,
    name: data.name.trim(),
    slug: makeSlug(data.name),
    type: data.type,
    status: "active" as const,
    ownerEmail: data.ownerEmail.trim().toLowerCase(),
    planId: data.planId ?? "plan_growth",
    planName: plan?.name ?? "Growth",
    outletCount: 1,
    orderCount: 0,
    expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    createdAt: new Date().toISOString(),
  };
  mockBusinesses.unshift(newBiz);

  const ownerEmail = data.ownerEmail.trim().toLowerCase();
  vendorAccounts.set(ownerEmail, {
    email: ownerEmail,
    password: data.password || "password123",
    businessId: newBiz.id,
    businessName: newBiz.name,
    name: `${data.name} Admin`,
    role: "business_admin",
  });
  mockTeamMembers.unshift({
    id: `usr_owner_${Date.now()}`,
    email: ownerEmail,
    name: `${data.name} Admin`,
    role: "business_admin",
    status: "active",
    businessId: newBiz.id,
    businessName: newBiz.name,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(CreateBusinessResponse.parse(newBiz));
});

protectedRouter.patch("/businesses/:businessId", async (req, res) => {
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
  const found = mockBusinesses.find((b) => b.id === params.data.businessId);
  if (!found) {
    res.status(404).json({ error: "Business not found." });
    return;
  }
  if (body.data.status) found.status = body.data.status;
  if (body.data.name) found.name = body.data.name;
  if (body.data.type) found.type = body.data.type;
  if (body.data.planId !== undefined) {
    found.planId = body.data.planId || null;
    const plan = mockPlans.find((p) => p.id === body.data.planId);
    found.planName = plan ? plan.name : undefined;
  }
  if (body.data.expiresAt !== undefined) {
    found.expiresAt = body.data.expiresAt ? body.data.expiresAt.toISOString() : null;
  }
  res.json(UpdateBusinessResponse.parse(found));
});

// /plans
protectedRouter.get("/plans", async (_req, res) => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: SaaS subscription plans are restricted." });
    return;
  }
  res.json(ListPlansResponse.parse(mockPlans));
});

protectedRouter.post("/plans", async (req, res) => {
  const user = currentUser(res);
  if (!requireSuperAdmin(user, res)) return;
  const parsed = CreatePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const plan = {
    id: `plan_${Date.now()}`,
    ...parsed.data,
    active: true,
    createdAt: new Date().toISOString(),
  };
  mockPlans.push(plan);
  res.status(201).json(CreatePlanResponse.parse(plan));
});

// /team
protectedRouter.get("/team", async (_req, res) => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: Staff members cannot view or manage team members." });
    return;
  }
  res.json(ListTeamResponse.parse(mockTeamMembers));
});

protectedRouter.post("/team", async (req, res) => {
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
  const member = {
    id: `usr_team_${Date.now()}`,
    email: parsed.data.email,
    name: parsed.data.email.split("@")[0] ?? "Team Member",
    role: parsed.data.role,
    status: "invited" as const,
    businessId: user.businessId || "biz_demo_juniper",
    businessName: user.businessName || "The Juniper Room",
    createdAt: new Date().toISOString(),
  };
  mockTeamMembers.push(member);
  res.status(201).json(InviteTeamMemberResponse.parse(member));
});

// /outlets
protectedRouter.get("/outlets", async (_req, res) => {
  res.json(ListOutletsResponse.parse(mockOutlets));
});

protectedRouter.post("/outlets", async (req, res) => {
  const user = currentUser(res);
  const parsed = CreateOutletBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const outlet = {
    id: `out_${Date.now()}`,
    businessId: user.businessId || "biz_demo_juniper",
    name: parsed.data.name,
    slug: makeSlug(parsed.data.name),
    address: parsed.data.address || "",
    active: true,
    tableCount: parsed.data.tableCount || 12,
    createdAt: new Date().toISOString(),
  };
  mockOutlets.push(outlet);
  res.status(201).json(CreateOutletResponse.parse(outlet));
});

protectedRouter.patch("/outlets/:outletId", async (req, res) => {
  const params = UpdateOutletParams.safeParse(req.params);
  const body = UpdateOutletBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request." });
    return;
  }
  const found = mockOutlets.find((o) => o.id === params.data.outletId);
  if (!found) {
    res.status(404).json({ error: "Outlet not found." });
    return;
  }
  if (body.data.name) found.name = body.data.name;
  if (body.data.address !== undefined) found.address = body.data.address;
  if (body.data.tableCount) found.tableCount = body.data.tableCount;
  if (body.data.active !== undefined) found.active = body.data.active;
  res.json(UpdateOutletResponse.parse(found));
});

// /categories
protectedRouter.get("/categories", async (_req, res) => {
  res.json(ListCategoriesResponse.parse(mockCategories));
});

protectedRouter.post("/categories", async (req, res) => {
  const user = currentUser(res);
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const cat = {
    id: `cat_${Date.now()}`,
    businessId: user.businessId || "biz_demo_juniper",
    name: parsed.data.name,
    sortOrder: mockCategories.length + 1,
    createdAt: new Date().toISOString(),
  };
  mockCategories.push(cat);
  res.status(201).json(CreateCategoryResponse.parse(cat));
});

protectedRouter.patch("/categories/:categoryId", async (req, res) => {
  const params = UpdateCategoryParams.safeParse(req.params);
  const body = UpdateCategoryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request." });
    return;
  }
  const found = mockCategories.find((c) => c.id === params.data.categoryId);
  if (!found) {
    res.status(404).json({ error: "Category not found." });
    return;
  }
  if (body.data.name) found.name = body.data.name;
  if (body.data.sortOrder !== undefined) found.sortOrder = body.data.sortOrder;
  res.json(UpdateCategoryResponse.parse(found));
});

// /items
protectedRouter.get("/items", async (_req, res) => {
  const catMap = new Map(mockCategories.map((c) => [c.id, c.name]));
  const withCategoryName = mockItems.map((it) => ({
    ...it,
    categoryName: catMap.get(it.categoryId) || "General",
  }));
  res.json(ListItemsResponse.parse(withCategoryName));
});

protectedRouter.post("/items", async (req, res) => {
  const user = currentUser(res);
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const itm = {
    id: `item_${Date.now()}`,
    businessId: user.businessId || "biz_demo_juniper",
    categoryId: d.categoryId,
    name: d.name,
    description: d.description || "",
    price: d.price,
    imageUrl: d.imageUrl || "",
    available: d.available ?? true,
    variants: d.variants || [],
    addOns: d.addOns || [],
    createdAt: new Date().toISOString(),
  };
  mockItems.push(itm);
  const catMap = new Map(mockCategories.map((c) => [c.id, c.name]));
  const itmWithCat = {
    ...itm,
    categoryName: catMap.get(itm.categoryId) || "General",
  };
  res.status(201).json(CreateItemResponse.parse(itmWithCat));
});

protectedRouter.patch("/items/:itemId", async (req, res) => {
  const params = UpdateItemParams.safeParse(req.params);
  const body = UpdateItemBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request." });
    return;
  }
  const found = mockItems.find((i) => i.id === params.data.itemId);
  if (!found) {
    res.status(404).json({ error: "Item not found." });
    return;
  }
  const d = body.data;
  if (d.name) found.name = d.name;
  if (d.description !== undefined) found.description = d.description;
  if (d.price !== undefined) found.price = d.price;
  if (d.imageUrl !== undefined) found.imageUrl = d.imageUrl;
  if (d.available !== undefined) found.available = d.available;
  if (d.variants) found.variants = d.variants;
  if (d.addOns) found.addOns = d.addOns;
  const catMap = new Map(mockCategories.map((c) => [c.id, c.name]));
  const foundWithCat = {
    ...found,
    categoryName: catMap.get(found.categoryId) || "General",
  };
  res.json(UpdateItemResponse.parse(foundWithCat));
});

// /orders
protectedRouter.get("/orders", async (_req, res) => {
  const formatted = mockOrders.map((o) => ({
    ...o,
    customerPhone: o.customerPhone || "+1 (555) 000-0000",
    items: o.items.map((it) => ({
      ...it,
      selectedVariant: it.selectedVariant || "",
      selectedAddOns: it.selectedAddOns || [],
    })),
  }));
  res.json(ListOrdersResponse.parse(formatted));
});

protectedRouter.patch("/orders/:orderId", async (req, res) => {
  const params = UpdateOrderParams.safeParse(req.params);
  const body = UpdateOrderBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request." });
    return;
  }
  const found = mockOrders.find((o) => o.id === params.data.orderId);
  if (!found) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (body.data.status) found.status = body.data.status;
  res.json(UpdateOrderResponse.parse(found));
});

// /analytics
protectedRouter.get("/analytics", async (_req, res) => {
  const user = currentUser(res);
  if (user.role === "staff") {
    res.status(403).json({ error: "Access denied: Sales analytics are restricted to business administrators." });
    return;
  }
  res.json(
    GetAnalyticsResponse.parse({
      orderCount: mockOrders.length,
      revenue: mockOrders.reduce((sum, o) => sum + o.total, 0),
      averageOrder: 42.5,
      completedCount: mockOrders.filter((o) => o.status === "completed").length,
      trend: [
        { label: "Mon", orders: 12, revenue: 340 },
        { label: "Tue", orders: 18, revenue: 520 },
        { label: "Wed", orders: 24, revenue: 680 },
        { label: "Thu", orders: 32, revenue: 890 },
        { label: "Fri", orders: 48, revenue: 1420 },
        { label: "Sat", orders: 62, revenue: 1840 },
        { label: "Sun", orders: 44, revenue: 1290 },
      ],
      topItems: [
        { name: "Dry-Aged Ribeye Steak (280g)", quantity: 46, revenue: 1656 },
        { name: "Margherita D.O.P.", quantity: 38, revenue: 684 },
        { name: "Smoked Rosemary Old Fashioned", quantity: 34, revenue: 544 },
        { name: "Truffle & Wild Mushroom Arancini", quantity: 29, revenue: 406 },
        { name: "Traditional Venetian Tiramisù", quantity: 22, revenue: 242 },
      ],
    }),
  );
});

// /store/:business/:outlet/:table
router.get("/store/:business/:outlet/:table", async (req, res) => {
  const parsed = GetStoreMenuParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { table } = parsed.data;
  const biz = mockBusinesses[0];
  const outlet = mockOutlets[0];

  res.json(
    GetStoreMenuResponse.parse({
      business: {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        type: biz.type,
        status: biz.status,
        ownerEmail: biz.ownerEmail,
        planId: biz.planId,
        planName: biz.planName ?? null,
        expiresAt: biz.expiresAt ?? null,
        outletCount: biz.outletCount,
        orderCount: biz.orderCount,
        createdAt: biz.createdAt,
      },
      outlet: {
        id: outlet.id,
        name: outlet.name,
        slug: outlet.slug,
        address: outlet.address,
        tableCount: outlet.tableCount,
        active: outlet.active,
        createdAt: outlet.createdAt,
      },
      tableNumber: table,
      categories: mockCategories.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        createdAt: c.createdAt,
      })),
      items: mockItems.map((item) => ({
        id: item.id,
        businessId: item.businessId,
        categoryId: item.categoryId,
        categoryName: mockCategories.find((c) => c.id === item.categoryId)?.name ?? "General",
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        available: item.available,
        variants: item.variants,
        addOns: item.addOns,
        createdAt: item.createdAt,
      })),
    }),
  );
});

// /store/orders (also supports /store/order)
router.post(["/store/orders", "/store/order"], async (req, res) => {
  const parsed = PlaceStoreOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const total = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const newOrder = {
    id: `ord_${Date.now().toString().slice(-6)}`,
    businessId: "biz_demo_juniper",
    outletId: "out_juniper_dt",
    businessName: "The Juniper Room",
    outletName: "Downtown Dining Room",
    tableNumber: data.tableNumber,
    customerName: data.customerName || "Guest",
    customerPhone: data.customerPhone,
    status: "new" as const,
    total,
    items: data.items,
    createdAt: new Date().toISOString(),
  };
  mockOrders.unshift(newOrder);
  res.status(201).json(PlaceStoreOrderResponse.parse(newOrder));
});

router.use(protectedRouter);
export default router;
