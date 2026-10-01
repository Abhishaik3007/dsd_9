export interface MockBusiness {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
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

export const mockPlans: MockPlan[] = [
  { id: "plan_starter", name: "Starter", price: 29, interval: "month", outletLimit: 1, itemLimit: 40, active: true, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "plan_growth", name: "Growth", price: 79, interval: "month", outletLimit: 3, itemLimit: 120, active: true, createdAt: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: "plan_enterprise", name: "Enterprise", price: 199, interval: "month", outletLimit: 10, itemLimit: 500, active: true, createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
];

export const mockBusinesses: MockBusiness[] = [
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

export const mockOutlets: MockOutlet[] = [
  { id: "out_juniper_dt", businessId: "biz_demo_juniper", name: "Downtown Dining Room", slug: "downtown", address: "142 Mercer St, Suite 4", active: true, tableCount: 14, createdAt: new Date().toISOString() },
  { id: "out_juniper_pt", businessId: "biz_demo_juniper", name: "Garden Patio", slug: "patio", address: "142 Mercer St, Outdoor", active: true, tableCount: 8, createdAt: new Date().toISOString() },
];

export const mockCategories: MockCategory[] = [
  { id: "cat_starters", businessId: "biz_demo_juniper", name: "Starters & Small Plates", sortOrder: 1, createdAt: new Date().toISOString() },
  { id: "cat_mains", businessId: "biz_demo_juniper", name: "Mains & Grills", sortOrder: 2, createdAt: new Date().toISOString() },
  { id: "cat_pizzas", businessId: "biz_demo_juniper", name: "Woodfired Pizzas", sortOrder: 3, createdAt: new Date().toISOString() },
  { id: "cat_drinks", businessId: "biz_demo_juniper", name: "Signature Cocktails & Wine", sortOrder: 4, createdAt: new Date().toISOString() },
  { id: "cat_desserts", businessId: "biz_demo_juniper", name: "Desserts", sortOrder: 5, createdAt: new Date().toISOString() },
];

export const mockItems: MockItem[] = [
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

export const mockOrders: MockOrder[] = [
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

export const mockTeamMembers: MockTeamMember[] = [
  { id: "usr_mock_superadmin", email: "admin@tablewave.com", name: "Abhishek Kumar (Super Admin)", role: "super_admin", status: "active", businessId: null, businessName: "Platform", createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "usr_mock_bizadmin", email: "manager@juniperroom.com", name: "Elena Rossi (Venue Admin)", role: "business_admin", status: "active", businessId: "biz_demo_juniper", businessName: "The Juniper Room", createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "usr_mock_staff", email: "kitchen@juniperroom.com", name: "Marco Vance (Kitchen Staff)", role: "staff", status: "active", businessId: "biz_demo_juniper", businessName: "The Juniper Room", createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "usr_mock_invitee", email: "sophie.b@juniperroom.com", name: "Sophie Blanc", role: "staff", status: "invited", businessId: "biz_demo_juniper", businessName: "The Juniper Room", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];
