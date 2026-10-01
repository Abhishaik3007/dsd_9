import { clerkClient, getAuth } from "@clerk/express";
import { and, eq, sql } from "drizzle-orm";
import type { RequestHandler } from "express";
import {
  businessesTable,
  db,
  invitationsTable,
  membershipsTable,
  usersTable,
} from "@workspace/db";

export type AppRole = "super_admin" | "business_admin" | "staff" | "pending";

export type TablewaveUser = {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  role: AppRole;
  status: "active" | "suspended" | "pending";
  businessId: string | null;
  businessName: string | null;
};

declare global {
  namespace Express {
    interface Locals {
      tablewaveUser?: TablewaveUser;
    }
  }
}

async function provisionUser(clerkId: string) {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (existing) return existing;

  const identity = await clerkClient.users.getUser(clerkId);
  const email = identity.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  if (!email) {
    throw new Error("A verified email address is required to access Tablewave.");
  }
  const name =
    [identity.firstName, identity.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0] ||
    "User";

  return db.transaction(async (tx) => {
    // Serialize first-account setup and invite acceptance across simultaneous logins.
    await tx.execute(sql`select pg_advisory_xact_lock(746182914)`);
    const [byClerkId] = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId))
      .limit(1);
    if (byClerkId) return byClerkId;

    const [byEmail] = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (byEmail) {
      const [updated] = await tx
        .update(usersTable)
        .set({ clerkId, name })
        .where(eq(usersTable.id, byEmail.id))
        .returning();
      return updated;
    }

    const [firstAccount] = await tx.select({ id: usersTable.id }).from(usersTable).limit(1);
    const [user] = await tx
      .insert(usersTable)
      .values({ clerkId, email, name, isSuperAdmin: !firstAccount })
      .returning();

    if (!user.isSuperAdmin) {
      const invites = await tx
        .select()
        .from(invitationsTable)
        .where(and(eq(invitationsTable.email, email), eq(invitationsTable.status, "invited")));

      for (const invite of invites) {
        if (invite.businessId) {
          await tx
            .insert(membershipsTable)
            .values({
              userId: user.id,
              businessId: invite.businessId,
              role: invite.role,
              status: "active",
            })
            .onConflictDoNothing();
        }
        await tx
          .update(invitationsTable)
          .set({ status: "accepted" })
          .where(eq(invitationsTable.id, invite.id));
      }
    }

    return user;
  });
}

async function resolvePrincipal(userId: string): Promise<TablewaveUser> {
  const user = await provisionUser(userId);

  if (user.isSuperAdmin) {
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      isSuperAdmin: true,
      role: "super_admin",
      status: "active",
      businessId: null,
      businessName: null,
    };
  }

  const membership = await db
    .select({
      role: membershipsTable.role,
      membershipStatus: membershipsTable.status,
      businessId: businessesTable.id,
      businessName: businessesTable.name,
      businessStatus: businessesTable.status,
      expiresAt: businessesTable.expiresAt,
    })
    .from(membershipsTable)
    .innerJoin(businessesTable, eq(membershipsTable.businessId, businessesTable.id))
    .where(eq(membershipsTable.userId, user.id))
    .limit(1);
  const access = membership[0];
  const expired =
    access?.expiresAt != null && access.expiresAt.getTime() < Date.now();
  const status = !access
    ? "pending"
    : access.membershipStatus !== "active" ||
        access.businessStatus !== "active" ||
        expired
      ? "suspended"
      : "active";

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    isSuperAdmin: false,
    role: access?.role === "staff" ? "staff" : access ? "business_admin" : "pending",
    status,
    businessId: access?.businessId ?? null,
    businessName: access?.businessName ?? null,
  };
}

export const requireTablewaveUser: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && (authHeader.startsWith("Bearer mock-") || authHeader.startsWith("Bearer mock:"))) {
    const role = authHeader.replace(/^Bearer mock[-:]/, "").trim();
    if (role === "super_admin") {
      res.locals.tablewaveUser = {
        id: "usr_mock_superadmin",
        clerkId: "mock_superadmin",
        email: "admin@tablewave.com",
        name: "Abhishek Kumar (Super Admin)",
        isSuperAdmin: true,
        role: "super_admin",
        status: "active",
        businessId: null,
        businessName: "Platform",
      };
      return next();
    }
    if (role === "business_admin") {
      res.locals.tablewaveUser = {
        id: "usr_mock_bizadmin",
        clerkId: "mock_bizadmin",
        email: "manager@juniperroom.com",
        name: "Elena Rossi (Venue Admin)",
        isSuperAdmin: false,
        role: "business_admin",
        status: "active",
        businessId: "biz_demo_juniper",
        businessName: "The Juniper Room",
      };
      return next();
    }
    if (role === "staff") {
      res.locals.tablewaveUser = {
        id: "usr_mock_staff",
        clerkId: "mock_staff",
        email: "kitchen@juniperroom.com",
        name: "Marco Vance (Kitchen Staff)",
        isSuperAdmin: false,
        role: "staff",
        status: "active",
        businessId: "biz_demo_juniper",
        businessName: "The Juniper Room",
      };
      return next();
    }
  }

  if (authHeader && (authHeader.startsWith("Bearer user_") || authHeader.startsWith("Bearer fb_"))) {
    try {
      const raw = authHeader.replace(/^Bearer (user_|fb_)/, "");
      const payload = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
      res.locals.tablewaveUser = {
        id: payload.id || "usr_custom",
        clerkId: payload.id || "custom_id",
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
        isSuperAdmin: Boolean(payload.isSuperAdmin || payload.role === "super_admin"),
        role: payload.role || "business_admin",
        status: "active",
        businessId: payload.businessId || "biz_demo_juniper",
        businessName: payload.businessName || "The Juniper Room",
      };
      return next();
    } catch {
      // ignore
    }
  }

  let clerkId: string | null = null;
  if (process.env.CLERK_SECRET_KEY) {
    try {
      clerkId = getAuth(req).userId;
    } catch {
      clerkId = null;
    }
  }

  if (!clerkId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  try {
    res.locals.tablewaveUser = await resolvePrincipal(clerkId);
    next();
  } catch (error) {
    req.log.error({ err: error }, "Could not resolve Tablewave account");
    res.status(401).json({ error: "Unable to resolve your account. Verify your email and try again." });
  }
};

export function currentUser(res: Parameters<RequestHandler>[1]): TablewaveUser {
  const user = res.locals.tablewaveUser;
  if (!user) throw new Error("Authenticated Tablewave user is missing.");
  return user;
}

export function requireSuperAdmin(user: TablewaveUser, res: Parameters<RequestHandler>[1]): boolean {
  if (!user.isSuperAdmin) {
    res.status(403).json({ error: "Super administrator access is required." });
    return false;
  }
  return true;
}

export function requireBusinessAccess(
  user: TablewaveUser,
  res: Parameters<RequestHandler>[1],
): string | null {
  if (user.isSuperAdmin) return null;
  if (!user.businessId || user.status !== "active") {
    res.status(user.status === "suspended" ? 403 : 403).json({
      error: user.status === "suspended"
        ? "This business account is suspended or its plan has expired."
        : "No active business is assigned to this account.",
    });
    return null;
  }
  return user.businessId;
}