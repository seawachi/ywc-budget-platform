"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Role } from "@/types/receipt";
import { getDemoStore } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, signPayload, verifySignedPayload } from "@/lib/auth-crypto";
import { auth } from "@/lib/auth";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  promptpayId: string;
}

const DEFAULT_STAFF: AuthUser = {
  id: "demo-staff-id",
  name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
  email: "staff@larngear.camp",
  role: "STAFF",
  promptpayId: "0812345678",
};

const DEFAULT_TREASURER: AuthUser = {
  id: "demo-treasurer-id",
  name: "สมหญิง รอบคอบ (Treasurer ค่าย)",
  email: "treasurer@larngear.camp",
  role: "TREASURER",
  promptpayId: "0898765432",
};

async function getSafeCookieStore() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

/**
 * Get current session user — checks Better Auth session first, then falls back to signed session cookie
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await getSafeCookieStore();

  // 1. Check camp_auth cookie first (0ms cryptographic verification)
  const authCookie = cookieStore?.get("camp_auth");
  if (authCookie && authCookie.value) {
    try {
      const verifiedJson = verifySignedPayload(authCookie.value);
      if (verifiedJson) {
        const parsed = JSON.parse(verifiedJson) as AuthUser;
        if (parsed && parsed.id && parsed.email) {
          return parsed;
        }
      } else if (authCookie.value.startsWith("{")) {
        // Backward-compatibility for existing unsigned JSON cookies in browser
        const parsed = JSON.parse(authCookie.value) as AuthUser;
        if (parsed && parsed.id && parsed.email) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error verifying camp_auth cookie:", e);
    }
  }

  // 2. Try Better Auth Session only if a better-auth cookie is present
  const hasBetterAuthCookie =
    cookieStore?.has("better-auth.session_token") ||
    cookieStore?.has("__Secure-better-auth.session_token");

  if (hasBetterAuthCookie) {
    try {
      const headerList = await headers();
      const betterSession = await auth.api.getSession({
        headers: headerList,
      });

      if (betterSession && betterSession.user) {
        const u = betterSession.user as any;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: (u.role as Role) || "STAFF",
          promptpayId: u.promptpayId || "0812345678",
        };
      }
    } catch {
      // Better auth check outside request context or not signed in
    }
  }

  // 3. No active session found
  return null;
}

/**
 * Strict Authentication Guard for Server Actions
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return user;
}

/**
 * Strict Role-Based Access Control (RBAC) Guard for Server Actions
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `FORBIDDEN: User '${user.email}' (${user.role}) lacks required permission: ${allowedRoles.join(", ")}`
    );
  }
  return user;
}

/**
 * Real Register with Better Auth and Supabase PostgreSQL
 */
export async function registerUser({
  name,
  email,
  password,
  promptpayId,
  role = "STAFF",
}: {
  name: string;
  email: string;
  password: string;
  promptpayId?: string;
  role?: Role;
}) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanEmail || !cleanName) {
    return { success: false, error: "กรุณากรอกชื่อและอีเมลให้ครบถ้วน" };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" };
  }

  try {
    const cleanPromptPay = promptpayId?.trim() || "0812345678";
    const passwordHash = hashPassword(password);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          include: { workspace: true },
        },
      },
    });

    let createdUserId = "";

    if (existing) {
      // If user exists and already has a password, they are already registered
      if (existing.passwordHash) {
        return { success: false, error: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ" };
      }

      // If user was pre-invited by a Treasurer (passwordHash is null), activate their account
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          passwordHash,
          promptpayId: cleanPromptPay,
          role: role as any,
        },
      });
      createdUserId = updated.id;
    } else {
      // 1. Try Better Auth signUpEmail via server API if available
      try {
        const headerList = await headers();
        const res = await auth.api.signUpEmail({
          body: {
            name: cleanName,
            email: cleanEmail,
            password,
            role,
            promptpayId: cleanPromptPay,
          },
          headers: headerList,
        });

        if (res && res.user) {
          createdUserId = res.user.id;
        }
      } catch (betterAuthErr: any) {
        console.warn("Better Auth sign up fallback to direct DB:", betterAuthErr?.message);
      }

      // 2. Direct DB record creation if Better Auth API was bypassed
      if (!createdUserId) {
        const newUser = await prisma.user.create({
          data: {
            name: cleanName,
            email: cleanEmail,
            passwordHash,
            promptpayId: cleanPromptPay,
            role: role as any,
          },
        });
        createdUserId = newUser.id;
      }
    }

    // Check if this user was already invited to any workspace by a Treasurer
    const userMemberships = await prisma.workspaceMember.findMany({
      where: { userId: createdUserId, status: "ACTIVE" },
      include: { workspace: true },
    });

    const activeWorkspace = userMemberships.length > 0 ? userMemberships[0].workspace : null;

    const authUser: AuthUser = {
      id: createdUserId,
      name: cleanName,
      email: cleanEmail,
      role: role as Role,
      promptpayId: cleanPromptPay,
    };

    const cookieStore = await getSafeCookieStore();
    const isHttps = process.env.COOKIE_SECURE === "true";

    cookieStore?.set("camp_auth", signPayload(JSON.stringify(authUser)), {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    if (activeWorkspace) {
      cookieStore?.set("active_workspace_id", activeWorkspace.id, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } else {
      cookieStore?.delete("active_workspace_id");
    }

    try {
      revalidatePath("/");
      revalidatePath("/treasury");
      revalidatePath("/login");
    } catch {}

    return { success: true, user: authUser };
  } catch (err: any) {
    console.error("Register error:", err);
    return {
      success: false,
      error: err?.message || "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Real Login with Better Auth and Password Verification
 */
export async function loginWithPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { success: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  try {
    // 1. Try Better Auth signInEmail
    try {
      const headerList = await headers();
      const res = await auth.api.signInEmail({
        body: {
          email: cleanEmail,
          password,
        },
        headers: headerList,
      });

      if (res && res.user) {
        const u = res.user as any;
        const authUser: AuthUser = {
          id: u.id,
          name: u.name,
          email: u.email,
          role: (u.role as Role) || "STAFF",
          promptpayId: u.promptpayId || "0812345678",
        };

        const isHttps = process.env.COOKIE_SECURE === "true";
        const cookieStore = await getSafeCookieStore();
        cookieStore?.set("camp_auth", signPayload(JSON.stringify(authUser)), {
          httpOnly: true,
          secure: isHttps,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        try {
          revalidatePath("/");
          revalidatePath("/treasury");
          revalidatePath("/login");
        } catch {}

        return { success: true, user: authUser };
      }
    } catch (betterAuthErr: any) {
      // Better auth attempted, proceed to check DB password hash
    }

    // 2. Direct DB verification check
    const dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: { workspace: true },
          take: 1,
        },
      },
    });

    if (!dbUser) {
      return { success: false, error: "ไม่พบผู้ใช้งานด้วยอีเมลนี้ กรุณาสมัครสมาชิกก่อน" };
    }

    if (dbUser.passwordHash) {
      const isValid = verifyPassword(password, dbUser.passwordHash);
      if (!isValid) {
        return { success: false, error: "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" };
      }
    }

    const authUser: AuthUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as Role,
      promptpayId: dbUser.promptpayId || "0812345678",
    };

    const isHttps = process.env.COOKIE_SECURE === "true";
    const cookieStore = await getSafeCookieStore();
    cookieStore?.set("camp_auth", signPayload(JSON.stringify(authUser)), {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    if (dbUser.memberships.length > 0) {
      cookieStore?.set("active_workspace_id", dbUser.memberships[0].workspaceId, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    try {
      revalidatePath("/");
      revalidatePath("/treasury");
      revalidatePath("/login");
    } catch {}

    return { success: true, user: authUser };
  } catch (err: any) {
    console.error("Login with password error:", err);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * 1-Click Fast Demo Login (Staff or Treasurer)
 */
export async function loginUser({
  email,
  name,
  role,
  promptpayId,
}: {
  email: string;
  name?: string;
  role: Role;
  promptpayId?: string;
}): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const cookieStore = await getSafeCookieStore();
  const cleanEmail = email.trim().toLowerCase();
  let targetId = role === "TREASURER" ? "demo-treasurer-id" : "demo-staff-id";

  try {
    const userInDb = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: { role },
      create: {
        id: targetId,
        email: cleanEmail,
        name:
          name ||
          (role === "TREASURER"
            ? "สมหญิง รอบคอบ (Treasurer ค่าย)"
            : "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)"),
        role,
        promptpayId:
          promptpayId || (role === "TREASURER" ? "0898765432" : "0812345678"),
      },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });
    targetId = userInDb.id;

    if (userInDb.memberships && userInDb.memberships.length > 0) {
      const isHttps = process.env.COOKIE_SECURE === "true";
      cookieStore?.set("active_workspace_id", userInDb.memberships[0].workspaceId, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch (err) {
    console.warn("DB upsert in loginUser:", err);
  }

  const user: AuthUser = {
    id: targetId,
    name:
      name ||
      (role === "TREASURER"
        ? "สมหญิง รอบคอบ (Treasurer ค่าย)"
        : "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)"),
    email: cleanEmail,
    role,
    promptpayId:
      promptpayId || (role === "TREASURER" ? "0898765432" : "0812345678"),
  };

  const isHttps = process.env.COOKIE_SECURE === "true";

  cookieStore?.set("camp_auth", signPayload(JSON.stringify(user)), {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const store = getDemoStore();
  store.currentRole = role;

  try {
    revalidatePath("/", "layout");
    revalidatePath("/treasury");
    revalidatePath("/claims/new");
  } catch {}

  return { success: true, user };
}

/**
 * Logout
 */
export async function logoutUser() {
  const cookieStore = await getSafeCookieStore();
  if (cookieStore) {
    const cookieNames = [
      "camp_auth",
      "active_workspace_id",
      "better-auth.session_token",
      "__Secure-better-auth.session_token",
      "better-auth.csrf_token",
      "__Secure-better-auth.csrf_token",
    ];

    for (const name of cookieNames) {
      try {
        cookieStore.delete(name);
        cookieStore.set(name, "", {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        });
      } catch {}
    }
  }

  // Reset demo store memory
  try {
    const store = getDemoStore();
    store.currentRole = "STAFF";
  } catch {}

  // Try Better Auth signOut
  try {
    const headerList = await headers();
    await auth.api.signOut({
      headers: headerList,
    });
  } catch {}

  try {
    revalidatePath("/", "layout");
    revalidatePath("/login");
    revalidatePath("/treasury");
  } catch {}

  return { success: true };
}

/**
 * Update current user profile and PromptPay number
 */
export async function updateUserProfile({
  name,
  promptpayId,
}: {
  name?: string;
  promptpayId: string;
}) {
  const currentUser = await requireAuth();
  const cleanPromptPay = promptpayId.replace(/[-\s]/g, "").trim();

  if (!cleanPromptPay) {
    return { success: false, error: "กรุณาระบุหมายเลขพร้อมเพย์" };
  }
  // Validate PromptPay: either 10 digits (mobile phone) or 13 digits (National ID)
  if (!/^\d{10}$|^\d{13}$/.test(cleanPromptPay)) {
    return {
      success: false,
      error: "หมายเลขพร้อมเพย์ต้องเป็นเบอร์มือถือ 10 หลัก (เช่น 0812345678) หรือเลขบัตรประชาชน 13 หลัก",
    };
  }

  const cleanName = name?.trim() || currentUser.name;

  try {
    // 1. Update in Supabase PostgreSQL
    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: cleanName,
        promptpayId: cleanPromptPay,
      },
    });

    // 2. Refresh Auth Cookie session
    const updatedAuthUser: AuthUser = {
      ...currentUser,
      name: updated.name,
      promptpayId: updated.promptpayId || cleanPromptPay,
    };

    const isHttps = process.env.COOKIE_SECURE === "true";
    const cookieStore = await getSafeCookieStore();
    cookieStore?.set("camp_auth", signPayload(JSON.stringify(updatedAuthUser)), {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath("/", "layout");
    revalidatePath("/treasury");
    revalidatePath("/claims/new");

    return {
      success: true,
      user: updatedAuthUser,
    };
  } catch (err: any) {
    console.error("Failed to update user profile:", err);
    return {
      success: false,
      error: err?.message || "ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
    };
  }
}
