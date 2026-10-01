import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(["super_admin", "business_admin", "staff"]).optional(),
});

const DemoLoginBody = z.object({
  role: z.enum(["super_admin", "business_admin", "staff"]),
});

const FirebaseLoginBody = z.object({
  idToken: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  uid: z.string().optional(),
});

function createToken(payload: Record<string, unknown>, prefix = "user_"): string {
  return prefix + Buffer.from(JSON.stringify(payload)).toString("base64");
}

router.post("/auth/demo-login", (req, res) => {
  const parsed = DemoLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const role = parsed.data.role;
  const isSuperAdmin = role === "super_admin";
  const user = {
    id: `usr_mock_${role}`,
    email: role === "super_admin" ? "admin@tablewave.com" : role === "business_admin" ? "manager@juniperroom.com" : "kitchen@juniperroom.com",
    name: role === "super_admin" ? "Abhishek Kumar (Super Admin)" : role === "business_admin" ? "Elena Rossi (Venue Admin)" : "Marco Vance (Kitchen)",
    role,
    isSuperAdmin,
    businessId: isSuperAdmin ? null : "biz_demo_juniper",
    businessName: isSuperAdmin ? "Platform" : "The Juniper Room",
    status: "active" as const,
  };
  const token = `mock-${role}`;
  res.json({ token, user });
});

export interface VendorAccount {
  email: string;
  password?: string;
  businessId: string;
  businessName: string;
  name: string;
  role: "business_admin";
}

export const vendorAccounts = new Map<string, VendorAccount>();

router.post("/auth/login", (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // If this email belongs to a vendor account created when a business was added
  const vendor = vendorAccounts.get(normalizedEmail);
  if (vendor) {
    if (vendor.password && vendor.password !== password) {
      res.status(400).json({ error: "Invalid password for this vendor account." });
      return;
    }
    const user = {
      id: `usr_${Buffer.from(normalizedEmail).toString("hex").slice(0, 12)}`,
      email: vendor.email,
      name: vendor.name,
      role: "business_admin" as const,
      isSuperAdmin: false,
      businessId: vendor.businessId,
      businessName: vendor.businessName,
      status: "active" as const,
    };
    const token = createToken(user, "user_");
    res.json({ token, user });
    return;
  }

  const isSuperAdmin = normalizedEmail.includes("admin");
  const user = {
    id: `usr_${Buffer.from(normalizedEmail).toString("hex").slice(0, 12)}`,
    email,
    name: email.split("@")[0],
    role: isSuperAdmin ? "super_admin" as const : "business_admin" as const,
    isSuperAdmin,
    businessId: isSuperAdmin ? null : "biz_demo_juniper",
    businessName: isSuperAdmin ? "Platform" : "My Venue",
    status: "active" as const,
  };
  const token = createToken(user, "user_");
  res.json({ token, user });
});

router.post("/auth/register", (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, name, role = "business_admin" } = parsed.data;
  const isSuperAdmin = role === "super_admin" || email.toLowerCase().includes("admin");
  const user = {
    id: `usr_${Buffer.from(email).toString("hex").slice(0, 12)}`,
    email,
    name: name || email.split("@")[0],
    role: isSuperAdmin ? "super_admin" as const : role,
    isSuperAdmin,
    businessId: isSuperAdmin ? null : "biz_demo_juniper",
    businessName: isSuperAdmin ? "Platform" : "My Venue",
    status: "active" as const,
  };
  const token = createToken(user, "user_");
  res.status(201).json({ token, user });
});

router.post("/auth/firebase-login", (req, res) => {
  const parsed = FirebaseLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email = "firebase_user@tablewave.com", name, uid } = parsed.data;
  const isSuperAdmin = email.toLowerCase().includes("admin");
  const user = {
    id: uid || `usr_fb_${Date.now()}`,
    email,
    name: name || email.split("@")[0],
    role: isSuperAdmin ? "super_admin" as const : "business_admin" as const,
    isSuperAdmin,
    businessId: isSuperAdmin ? null : "biz_demo_juniper",
    businessName: isSuperAdmin ? "Platform" : "Firebase Venue",
    status: "active" as const,
  };
  const token = createToken(user, "fb_");
  res.json({ token, user });
});

const ResetPasswordBody = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

router.post("/auth/reset-password", (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    return;
  }
  // In Tablewave demo/session mode, simulate successful password update
  res.json({ success: true, message: "Password updated successfully" });
});

export default router;
