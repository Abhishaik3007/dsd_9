// Client-side mock database and API handler for Tablewave
// Enables seamless offline/demo and static Vercel SPA deployments

export interface MockBusiness {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: 'active' | 'suspended' | 'inactive' | 'pending';
  ownerEmail: string;
  planId: string | null;
  planName?: string;
  outletCount: number;
  orderCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface MockPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  outletLimit: number;
  itemLimit: number;
  active: boolean;
  createdAt: string;
}

export interface MockTeamMember {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "business_admin" | "staff" | "pending";
  status: "active" | "invited";
  businessId: string | null;
  businessName: string | null;
  createdAt: string;
}

export interface MockOutlet {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  address: string;
  active: boolean;
  tableCount: number;
  createdAt: string;
}

export interface MockCategory {
  id: string;
  businessId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface MockItem {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  variants: { name: string; price: number }[];
  addOns: { name: string; price: number }[];
  createdAt: string;
}

export interface MockOrder {
  id: string;
  businessId: string;
  outletId: string;
  businessName: string;
  outletName: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  status: "new" | "preparing" | "ready" | "completed" | "cancelled";
  total: number;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    selectedVariant?: string;
    selectedAddOns?: string[];
  }[];
  createdAt: string;
}

const DEFAULT_PLANS: MockPlan[] = [
  { id: "plan_starter", name: "Starter", price: 29, interval: "month", outletLimit: 1, itemLimit: 40, active: true, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "plan_growth", name: "Growth", price: 79, interval: "month", outletLimit: 3, itemLimit: 120, active: true, createdAt: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: "plan_enterprise", name: "Enterprise", price: 199, interval: "month", outletLimit: 10, itemLimit: 500, active: true, createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
];

const DEFAULT_BUSINESSES: MockBusiness[] = [
  {
    id: "biz_demo_juniper",
    name: "The Juniper Room",
    slug: "juniper-room",
    type: "Restaurant",
    status: "active",
    ownerEmail: "owner@juniperroom.com",
    planId: "plan_growth",
    planName: "Growth",
    outletCount: 2,
    orderCount: 142,
    expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "biz_demo_velvet",
    name: "Velvet Lounge & Terrace",
    slug: "velvet-lounge",
    type: "Hotel",
    status: "active",
    ownerEmail: "gm@velvetterrace.com",
    planId: "plan_enterprise",
    planName: "Enterprise",
    outletCount: 1,
    orderCount: 89,
    expiresAt: new Date(Date.now() + 300 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: "biz_demo_starlight",
    name: "Starlight Picturehouse",
    slug: "starlight-cinema",
    type: "Cinema/Theatre",
    status: "active",
    ownerEmail: "bar@starlightcinema.com",
    planId: "plan_starter",
    planName: "Starter",
    outletCount: 1,
    orderCount: 64,
    expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

const DEFAULT_OUTLETS: MockOutlet[] = [
  { id: "out_juniper_dt", businessId: "biz_demo_juniper", name: "Downtown Dining Room", slug: "downtown", address: "142 Mercer St, Suite 4", active: true, tableCount: 14, createdAt: new Date().toISOString() },
  { id: "out_juniper_pt", businessId: "biz_demo_juniper", name: "Garden Patio", slug: "patio", address: "142 Mercer St, Outdoor", active: true, tableCount: 8, createdAt: new Date().toISOString() },
];

const DEFAULT_CATEGORIES: MockCategory[] = [
  { id: "cat_starters", businessId: "biz_demo_juniper", name: "Starters & Small Plates", sortOrder: 1, createdAt: new Date().toISOString() },
  { id: "cat_mains", businessId: "biz_demo_juniper", name: "Mains & Grills", sortOrder: 2, createdAt: new Date().toISOString() },
  { id: "cat_pizzas", businessId: "biz_demo_juniper", name: "Woodfired Pizzas", sortOrder: 3, createdAt: new Date().toISOString() },
  { id: "cat_drinks", businessId: "biz_demo_juniper", name: "Signature Cocktails & Wine", sortOrder: 4, createdAt: new Date().toISOString() },
  { id: "cat_desserts", businessId: "biz_demo_juniper", name: "Desserts", sortOrder: 5, createdAt: new Date().toISOString() },
];

const DEFAULT_ITEMS: MockItem[] = [
  {
    id: "item_arancini",
    businessId: "biz_demo_juniper",
    categoryId: "cat_starters",
    name: "Truffle & Wild Mushroom Arancini",
    description: "Crispy arborio risotto spheres, black truffle emulsion, 24-month parmesan crisp.",
    price: 14,
    imageUrl: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80",
    available: true,
    variants: [{ name: "3 Pieces", price: 0 }, { name: "5 Pieces", price: 6 }],
    addOns: [{ name: "Extra Truffle Aioli", price: 2.5 }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "item_ribeye",
    businessId: "biz_demo_juniper",
    categoryId: "cat_mains",
    name: "Dry-Aged Ribeye Steak (280g)",
    description: "Grass-fed Black Angus, bone marrow butter, blistered vine tomatoes, herb chimichurri.",
    price: 36,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    available: true,
    variants: [{ name: "Medium Rare", price: 0 }, { name: "Medium", price: 0 }, { name: "Well Done", price: 0 }],
    addOns: [{ name: "Truffle Fries", price: 6 }, { name: "Charred Broccolini", price: 5 }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "item_margherita",
    businessId: "biz_demo_juniper",
    categoryId: "cat_pizzas",
    name: "Margherita D.O.P.",
    description: "San Marzano tomatoes, buffalo mozzarella, fresh sweet basil, cold-pressed olive oil.",
    price: 18,
    imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80",
    available: true,
    variants: [{ name: "12 Inch", price: 0 }, { name: "16 Inch (Family)", price: 8 }],
    addOns: [{ name: "Burrata Topping", price: 5 }, { name: "Hot Honey Drizzle", price: 2 }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "item_oldfashioned",
    businessId: "biz_demo_juniper",
    categoryId: "cat_drinks",
    name: "Smoked Rosemary Old Fashioned",
    description: "Small-batch Kentucky bourbon, demerara, angostura bitters, torched fresh rosemary.",
    price: 16,
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80",
    available: true,
    variants: [],
    addOns: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "item_tiramisu",
    businessId: "biz_demo_juniper",
    categoryId: "cat_desserts",
    name: "Traditional Venetian Tiramisù",
    description: "Espresso-soaked savoiardi biscuits, whipped mascarpone zabaione, cocoa dust.",
    price: 11,
    imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
    available: true,
    variants: [],
    addOns: [],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ORDERS: MockOrder[] = [
  {
    id: "ord_101",
    businessId: "biz_demo_juniper",
    outletId: "out_juniper_dt",
    businessName: "The Juniper Room",
    outletName: "Downtown Dining Room",
    tableNumber: "4",
    customerName: "Liam Vance",
    customerPhone: "+1 (555) 234-8891",
    status: "new",
    total: 68,
    items: [
      { itemId: "item_ribeye", name: "Dry-Aged Ribeye Steak (280g)", quantity: 1, unitPrice: 36, selectedVariant: "Medium Rare", selectedAddOns: ["Truffle Fries"] },
      { itemId: "item_margherita", name: "Margherita D.O.P.", quantity: 1, unitPrice: 18, selectedVariant: "12 Inch", selectedAddOns: [] },
      { itemId: "item_oldfashioned", name: "Smoked Rosemary Old Fashioned", quantity: 1, unitPrice: 16, selectedVariant: "", selectedAddOns: [] },
    ],
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: "ord_102",
    businessId: "biz_demo_juniper",
    outletId: "out_juniper_dt",
    businessName: "The Juniper Room",
    outletName: "Downtown Dining Room",
    tableNumber: "7",
    customerName: "Sarah Jenkins",
    customerPhone: "+1 (555) 431-0922",
    status: "preparing",
    total: 39,
    items: [
      { itemId: "item_arancini", name: "Truffle & Wild Mushroom Arancini", quantity: 2, unitPrice: 14, selectedVariant: "3 Pieces", selectedAddOns: [] },
      { itemId: "item_tiramisu", name: "Traditional Venetian Tiramisù", quantity: 1, unitPrice: 11, selectedVariant: "", selectedAddOns: [] },
    ],
    createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
  },
  {
    id: "ord_103",
    businessId: "biz_demo_juniper",
    outletId: "out_juniper_pt",
    businessName: "The Juniper Room",
    outletName: "Garden Patio",
    tableNumber: "2",
    customerName: "Alex Rivera",
    customerPhone: "+1 (555) 672-1109",
    status: "ready",
    total: 54,
    items: [
      { itemId: "item_margherita", name: "Margherita D.O.P.", quantity: 2, unitPrice: 18, selectedVariant: "12 Inch", selectedAddOns: ["Burrata Topping"] },
    ],
    createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
  },
  {
    id: "ord_104",
    businessId: "biz_demo_juniper",
    outletId: "out_juniper_pt",
    businessName: "The Juniper Room",
    outletName: "Garden Patio",
    tableNumber: "5",
    customerName: "Chloe Martin",
    customerPhone: "+1 (555) 890-4432",
    status: "completed",
    total: 48,
    items: [
      { itemId: "item_oldfashioned", name: "Smoked Rosemary Old Fashioned", quantity: 3, unitPrice: 16, selectedVariant: "", selectedAddOns: [] },
    ],
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
];

const DEFAULT_TEAM: MockTeamMember[] = [
  { id: "usr_mock_superadmin", email: "admin@tablewave.com", name: "Abhishek Kumar (Super Admin)", role: "super_admin", status: "active", businessId: null, businessName: "Platform", createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "usr_mock_bizadmin", email: "manager@juniperroom.com", name: "Elena Rossi (Venue Admin)", role: "business_admin", status: "active", businessId: "biz_demo_juniper", businessName: "The Juniper Room", createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "usr_mock_staff", email: "kitchen@juniperroom.com", name: "Marco Vance (Kitchen Staff)", role: "staff", status: "active", businessId: "biz_demo_juniper", businessName: "The Juniper Room", createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "usr_mock_invitee", email: "sophie.b@juniperroom.com", name: "Sophie Blanc", role: "staff", status: "invited", businessId: "biz_demo_juniper", businessName: "The Juniper Room", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];

interface MockDb {
  businesses: MockBusiness[];
  plans: MockPlan[];
  outlets: MockOutlet[];
  categories: MockCategory[];
  items: MockItem[];
  orders: MockOrder[];
  team: MockTeamMember[];
}

const STORAGE_KEY = 'tablewave_client_db_v1';

function getDb(): MockDb {
  if (typeof window === 'undefined') {
    return {
      businesses: [...DEFAULT_BUSINESSES],
      plans: [...DEFAULT_PLANS],
      outlets: [...DEFAULT_OUTLETS],
      categories: [...DEFAULT_CATEGORIES],
      items: [...DEFAULT_ITEMS],
      orders: [...DEFAULT_ORDERS],
      team: [...DEFAULT_TEAM],
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        businesses: parsed.businesses || DEFAULT_BUSINESSES,
        plans: parsed.plans || DEFAULT_PLANS,
        outlets: parsed.outlets || DEFAULT_OUTLETS,
        categories: parsed.categories || DEFAULT_CATEGORIES,
        items: parsed.items || DEFAULT_ITEMS,
        orders: parsed.orders || DEFAULT_ORDERS,
        team: parsed.team || DEFAULT_TEAM,
      };
    }
  } catch {
    // fallback
  }
  return {
    businesses: [...DEFAULT_BUSINESSES],
    plans: [...DEFAULT_PLANS],
    outlets: [...DEFAULT_OUTLETS],
    categories: [...DEFAULT_CATEGORIES],
    items: [...DEFAULT_ITEMS],
    orders: [...DEFAULT_ORDERS],
    team: [...DEFAULT_TEAM],
  };
}

function saveDb(db: MockDb) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore quota errors
    }
  }
}

function resolveUser(token?: string | null) {
  let role = 'business_admin';
  let isSuperAdmin = false;

  if (typeof window !== 'undefined') {
    try {
      const rawUser = localStorage.getItem('tablewave_auth_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        return {
          id: u.id || 'usr_mock',
          email: u.email || 'user@tablewave.com',
          name: u.name || 'Demo User',
          role: u.role || 'business_admin',
          status: 'active',
          businessId: u.role === 'super_admin' ? null : (u.businessId || 'biz_demo_juniper'),
          businessName: u.role === 'super_admin' ? 'Platform' : (u.businessName || 'The Juniper Room'),
          isSuperAdmin: Boolean(u.isSuperAdmin || u.role === 'super_admin'),
        };
      }
    } catch {
      // ignore
    }
  }

  if (token) {
    if (token.includes('super_admin') || token.includes('superadmin')) {
      role = 'super_admin';
      isSuperAdmin = true;
    } else if (token.includes('staff')) {
      role = 'staff';
    }
  }

  return {
    id: role === 'super_admin' ? 'usr_mock_superadmin' : role === 'staff' ? 'usr_mock_staff' : 'usr_mock_bizadmin',
    email: role === 'super_admin' ? 'admin@tablewave.com' : role === 'staff' ? 'kitchen@juniperroom.com' : 'manager@juniperroom.com',
    name: role === 'super_admin' ? 'Abhishek Kumar (Super Admin)' : role === 'staff' ? 'Marco Vance (Kitchen Staff)' : 'Elena Rossi (Venue Admin)',
    role,
    status: 'active',
    businessId: isSuperAdmin ? null : 'biz_demo_juniper',
    businessName: isSuperAdmin ? 'Platform' : 'The Juniper Room',
    isSuperAdmin,
  };
}

export function handleClientMockRequest(
  url: string,
  method: string,
  body?: any,
  token?: string | null
): any {
  const cleanUrl = url.split('?')[0].replace(/\/+$/, '');
  const db = getDb();
  const user = resolveUser(token);

  // 1. /api/me
  if (cleanUrl === '/api/me' && method === 'GET') {
    return user;
  }

  // 2. /api/dashboard
  if (cleanUrl === '/api/dashboard' && method === 'GET') {
    const scopedOrders = user.isSuperAdmin
      ? db.orders
      : db.orders.filter((o) => o.businessId === (user.businessId || 'biz_demo_juniper'));

    return {
      businessCount: db.businesses.length,
      activeBusinessCount: db.businesses.filter((b) => b.status === 'active').length,
      orderCount: scopedOrders.length,
      revenue: scopedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      pendingOrderCount: scopedOrders.filter((o) => o.status === 'new' || o.status === 'preparing').length,
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
    };
  }

  // 3. /api/businesses
  if (cleanUrl === '/api/businesses') {
    if (method === 'GET') {
      if (user.isSuperAdmin) return db.businesses;
      const myBiz = db.businesses.filter((b) => b.id === user.businessId);
      return myBiz.length ? myBiz : [db.businesses[0]];
    }
    if (method === 'POST') {
      const plan = db.plans.find((p) => p.id === body?.planId);
      const newBiz: MockBusiness = {
        id: `biz_${Date.now().toString().slice(-6)}`,
        name: body?.name || 'New Venue',
        slug: (body?.name || 'venue').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        type: body?.type || 'Restaurant',
        status: 'active',
        ownerEmail: body?.ownerEmail || 'owner@venue.com',
        planId: body?.planId || 'plan_growth',
        planName: plan?.name || 'Growth',
        outletCount: 1,
        orderCount: 0,
        expiresAt: body?.expiresAt || null,
        createdAt: new Date().toISOString(),
      };
      db.businesses.unshift(newBiz);
      saveDb(db);
      return newBiz;
    }
  }

  const bizIdMatch = cleanUrl.match(/^\/api\/businesses\/([^/]+)$/);
  if (bizIdMatch && (method === 'PATCH' || method === 'PUT')) {
    const id = bizIdMatch[1];
    const biz = db.businesses.find((b) => b.id === id);
    if (biz) {
      Object.assign(biz, body);
      saveDb(db);
      return biz;
    }
    return { id, ...body };
  }

  // 4. /api/plans
  if (cleanUrl === '/api/plans') {
    if (method === 'GET') return db.plans;
    if (method === 'POST') {
      const newPlan: MockPlan = {
        id: `plan_${Date.now().toString().slice(-6)}`,
        name: body?.name || 'Standard',
        price: Number(body?.price) || 49,
        interval: body?.interval || 'month',
        outletLimit: Number(body?.outletLimit) || 2,
        itemLimit: Number(body?.itemLimit) || 80,
        active: true,
        createdAt: new Date().toISOString(),
      };
      db.plans.push(newPlan);
      saveDb(db);
      return newPlan;
    }
  }

  // 5. /api/team
  if (cleanUrl === '/api/team' && method === 'GET') {
    return db.team;
  }
  if (cleanUrl === '/api/team/invite' && method === 'POST') {
    const newMember: MockTeamMember = {
      id: `usr_inv_${Date.now().toString().slice(-6)}`,
      email: body?.email || 'teammate@venue.com',
      name: body?.email?.split('@')[0] || 'Invited Teammate',
      role: body?.role || 'staff',
      status: 'invited',
      businessId: user.businessId || 'biz_demo_juniper',
      businessName: user.businessName || 'The Juniper Room',
      createdAt: new Date().toISOString(),
    };
    db.team.push(newMember);
    saveDb(db);
    return newMember;
  }

  // 6. /api/outlets
  if (cleanUrl === '/api/outlets') {
    if (method === 'GET') {
      const bizId = user.businessId || 'biz_demo_juniper';
      return db.outlets.filter((o) => o.businessId === bizId || user.isSuperAdmin);
    }
    if (method === 'POST') {
      const newOutlet: MockOutlet = {
        id: `out_${Date.now().toString().slice(-6)}`,
        businessId: user.businessId || 'biz_demo_juniper',
        name: body?.name || 'Main Dining',
        slug: (body?.name || 'dining').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        address: body?.address || '123 Main St',
        active: true,
        tableCount: Number(body?.tableCount) || 12,
        createdAt: new Date().toISOString(),
      };
      db.outlets.push(newOutlet);
      saveDb(db);
      return newOutlet;
    }
  }

  const outletMatch = cleanUrl.match(/^\/api\/outlets\/([^/]+)$/);
  if (outletMatch) {
    const id = outletMatch[1];
    if (method === 'PATCH' || method === 'PUT') {
      const out = db.outlets.find((o) => o.id === id);
      if (out) {
        Object.assign(out, body);
        saveDb(db);
        return out;
      }
      return { id, ...body };
    }
    if (method === 'DELETE') {
      db.outlets = db.outlets.filter((o) => o.id !== id);
      saveDb(db);
      return { success: true };
    }
  }

  // 7. /api/categories
  if (cleanUrl === '/api/categories') {
    if (method === 'GET') {
      const bizId = user.businessId || 'biz_demo_juniper';
      return db.categories.filter((c) => c.businessId === bizId || user.isSuperAdmin);
    }
    if (method === 'POST') {
      const newCat: MockCategory = {
        id: `cat_${Date.now().toString().slice(-6)}`,
        businessId: user.businessId || 'biz_demo_juniper',
        name: body?.name || 'General',
        sortOrder: Number(body?.sortOrder) || db.categories.length + 1,
        createdAt: new Date().toISOString(),
      };
      db.categories.push(newCat);
      saveDb(db);
      return newCat;
    }
  }

  const catMatch = cleanUrl.match(/^\/api\/categories\/([^/]+)$/);
  if (catMatch) {
    const id = catMatch[1];
    if (method === 'PATCH' || method === 'PUT') {
      const cat = db.categories.find((c) => c.id === id);
      if (cat) {
        Object.assign(cat, body);
        saveDb(db);
        return cat;
      }
      return { id, ...body };
    }
    if (method === 'DELETE') {
      db.categories = db.categories.filter((c) => c.id !== id);
      saveDb(db);
      return { success: true };
    }
  }

  // 8. /api/items
  if (cleanUrl === '/api/items') {
    if (method === 'GET') {
      const bizId = user.businessId || 'biz_demo_juniper';
      return db.items.filter((i) => i.businessId === bizId || user.isSuperAdmin);
    }
    if (method === 'POST') {
      const newItem: MockItem = {
        id: `item_${Date.now().toString().slice(-6)}`,
        businessId: user.businessId || 'biz_demo_juniper',
        categoryId: body?.categoryId || db.categories[0]?.id || 'cat_starters',
        name: body?.name || 'New Item',
        description: body?.description || '',
        price: Number(body?.price) || 12,
        imageUrl: body?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        available: body?.available ?? true,
        variants: body?.variants || [],
        addOns: body?.addOns || [],
        createdAt: new Date().toISOString(),
      };
      db.items.push(newItem);
      saveDb(db);
      return newItem;
    }
  }

  const itemMatch = cleanUrl.match(/^\/api\/items\/([^/]+)$/);
  if (itemMatch) {
    const id = itemMatch[1];
    if (method === 'PATCH' || method === 'PUT') {
      const it = db.items.find((i) => i.id === id);
      if (it) {
        Object.assign(it, body);
        saveDb(db);
        return it;
      }
      return { id, ...body };
    }
    if (method === 'DELETE') {
      db.items = db.items.filter((i) => i.id !== id);
      saveDb(db);
      return { success: true };
    }
  }

  // 9. /api/orders
  if (cleanUrl === '/api/orders' && method === 'GET') {
    const bizId = user.businessId || 'biz_demo_juniper';
    const sorted = [...db.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return user.isSuperAdmin ? sorted : sorted.filter((o) => o.businessId === bizId);
  }

  const orderMatch = cleanUrl.match(/^\/api\/orders\/([^/]+)$/);
  if (orderMatch && (method === 'PATCH' || method === 'PUT')) {
    const id = orderMatch[1];
    const ord = db.orders.find((o) => o.id === id);
    if (ord) {
      if (body?.status) ord.status = body.status;
      saveDb(db);
      return ord;
    }
    return { id, status: body?.status || 'preparing' };
  }

  // 10. /api/analytics
  if (cleanUrl === '/api/analytics' && method === 'GET') {
    return {
      orderCount: db.orders.length,
      revenue: db.orders.reduce((sum, o) => sum + (o.total || 0), 0),
      averageOrder: 42.5,
      completedCount: db.orders.filter((o) => o.status === 'completed').length,
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
    };
  }

  // 11. /api/store/:business/:outlet/:table
  const storeMenuMatch = cleanUrl.match(/^\/api\/store\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (storeMenuMatch && method === 'GET') {
    const table = storeMenuMatch[3];
    const biz = db.businesses[0];
    const outlet = db.outlets[0];

    return {
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
      categories: db.categories.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        createdAt: c.createdAt,
      })),
      items: db.items.map((item) => ({
        id: item.id,
        businessId: item.businessId,
        categoryId: item.categoryId,
        categoryName: db.categories.find((c) => c.id === item.categoryId)?.name ?? "General",
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        available: item.available,
        variants: item.variants,
        addOns: item.addOns,
        createdAt: item.createdAt,
      })),
    };
  }

  // 12. /api/store/orders (also supports /api/store/order)
  if ((cleanUrl === '/api/store/orders' || cleanUrl === '/api/store/order') && method === 'POST') {
    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new Error('Your cart is empty. Please add items to place an order.');
    }
    const total = (body?.items || []).reduce((sum: number, item: any) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0);
    const newOrder: MockOrder = {
      id: `ord_${Date.now().toString().slice(-6)}`,
      businessId: "biz_demo_juniper",
      outletId: "out_juniper_dt",
      businessName: "The Juniper Room",
      outletName: "Downtown Dining Room",
      tableNumber: String(body?.tableNumber || "1"),
      customerName: String(body?.customerName || "Guest").trim() || "Guest",
      customerPhone: body?.customerPhone ? String(body.customerPhone).trim() : '',
      status: "new",
      total,
      items: body?.items || [],
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(newOrder);
    saveDb(db);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('tablewave:order-created', { detail: newOrder }));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('tablewave_live_orders');
          bc.postMessage({ type: 'ORDER_CREATED', order: newOrder });
          bc.close();
        }
      } catch {}
    }
    return newOrder;
  }

  return undefined;
}
