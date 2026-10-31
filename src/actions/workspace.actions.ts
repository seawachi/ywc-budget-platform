"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth, requireRole } from "./user.actions";
import {
  WorkspaceDTO,
  WorkspaceMemberDTO,
  BusinessUnitInput,
  TeamMemberInput,
  Role,
} from "@/types/receipt";

export interface CreateWorkspaceInput {
  name: string;
  code?: string;
  description?: string;
  totalBudget?: number;
  departments: BusinessUnitInput[];
  teamMembers?: TeamMemberInput[];
}

export interface PendingJoinRequestDTO {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceCode: string | null;
  status: "PENDING";
  createdAt: Date | string;
}

async function getSafeCookieStore() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

/**
 * Get all workspaces accessible by the current user
 */
export async function getUserWorkspaces(): Promise<WorkspaceDTO[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id, status: "ACTIVE" } } },
          { members: { some: { user: { email: user.email }, status: "ACTIVE" } } },
        ],
      },
      include: {
        members: {
          where: {
            OR: [{ userId: user.id }, { user: { email: user.email } }],
            status: "ACTIVE",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      description: w.description,
      totalBudget: Number(w.totalBudget),
      ownerId: w.ownerId,
      myRole: w.members[0]?.role || (w.ownerId === user.id ? "TREASURER" : user.role),
      createdAt: w.createdAt,
    }));
  } catch (err) {
    console.error("Failed to fetch user workspaces from DB:", err);
    return [];
  }
}

/**
 * Get current active workspace (or null if user has no workspaces yet)
 */
export async function getActiveWorkspace(
  preloadedWorkspaces?: WorkspaceDTO[]
): Promise<WorkspaceDTO | null> {
  const cookieStore = await getSafeCookieStore();
  const activeId = cookieStore?.get("active_workspace_id")?.value;
  const workspaces = preloadedWorkspaces ?? (await getUserWorkspaces());

  if (workspaces.length === 0) {
    return null;
  }

  if (activeId) {
    const found = workspaces.find((w) => w.id === activeId);
    if (found) return found;
  }

  // Default to the first available workspace
  return workspaces[0];
}

/**
 * Switch active workspace
 */
export async function setActiveWorkspaceId(workspaceId: string) {
  const cookieStore = await getSafeCookieStore();
  const isHttps = process.env.COOKIE_SECURE === "true";
  cookieStore?.set("active_workspace_id", workspaceId, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  try {
    revalidatePath("/");
    revalidatePath("/treasury");
    revalidatePath("/claims/new");
  } catch {}
  return { success: true };
}

/**
 * Create a brand new workspace in Supabase PostgreSQL
 * with Business Units (Departments) and Treasure Team members invited by Gmail
 */
export async function createWorkspaceAction(input: CreateWorkspaceInput) {
  try {
    const user = await requireRole(["TREASURER"]);
    const name = input.name.trim();
    if (!name) {
      return { success: false, error: "กรุณาระบุชื่อ Workspace" };
    }

    // Calculate sum of business units or use provided total budget
    const deptTotal = (input.departments || []).reduce(
      (sum, d) => sum + (Number(d.allocatedBudget) || 0),
      0
    );
    const totalBudget = Math.max(Number(input.totalBudget) || 0, deptTotal, 10000);

    // 1. Create Workspace with owner and departments in an atomic operation
    const newWs = await prisma.workspace.create({
      data: {
        name,
        code: input.code?.trim() || null,
        description: input.description?.trim() || null,
        totalBudget,
        ownerId: user.id,
        members: {
          create: [
            {
              userId: user.id,
              role: "TREASURER", // Workspace creator is a Treasurer
              status: "ACTIVE",
            },
          ],
        },
        departments: {
          create:
            input.departments && input.departments.length > 0
              ? input.departments.map((d) => ({
                  name: d.name.trim(),
                  allocatedBudget: Number(d.allocatedBudget) || 1000,
                  color: d.color || "#3B82F6",
                }))
              : [
                  {
                    name: "ฝ่ายสวัสดิการและอาหาร",
                    allocatedBudget: Math.round(totalBudget * 0.4),
                    color: "#10B981",
                  },
                  {
                    name: "ฝ่ายพัสดุและสถานที่",
                    allocatedBudget: Math.round(totalBudget * 0.3),
                    color: "#3B82F6",
                  },
                  {
                    name: "ฝ่ายกิจกรรมและสันทนาการ",
                    allocatedBudget: Math.round(totalBudget * 0.3),
                    color: "#F59E0B",
                  },
                ],
        },
      },
      include: {
        departments: true,
        members: true,
      },
    });

    // 2. Add Team Members invited by Gmail (Treasurer or Staff)
    if (input.teamMembers && input.teamMembers.length > 0) {
      for (const member of input.teamMembers) {
        const cleanEmail = member.email.trim().toLowerCase();
        if (!cleanEmail || cleanEmail === user.email.toLowerCase()) continue;

        try {
          // Upsert User with this Gmail address so they can log in seamlessly
          const memberUser = await prisma.user.upsert({
            where: { email: cleanEmail },
            update: {},
            create: {
              email: cleanEmail,
              name: cleanEmail.split("@")[0],
              role: member.role || "STAFF",
            },
          });

          // Add to WorkspaceMember
          await prisma.workspaceMember.upsert({
            where: {
              workspaceId_userId: {
                workspaceId: newWs.id,
                userId: memberUser.id,
              },
            },
            update: { role: member.role || "STAFF", status: "ACTIVE" },
            create: {
              workspaceId: newWs.id,
              userId: memberUser.id,
              role: member.role || "STAFF",
              status: "ACTIVE",
            },
          });
        } catch (memberErr) {
          console.warn(`Could not add member ${cleanEmail}:`, memberErr);
        }
      }
    }

    // 3. Set newly created workspace as active in cookie
    await setActiveWorkspaceId(newWs.id);

    try {
      revalidatePath("/");
      revalidatePath("/treasury");
      revalidatePath("/claims/new");
    } catch {}

    return {
      success: true,
      workspace: {
        id: newWs.id,
        name: newWs.name,
        code: newWs.code,
        description: newWs.description,
        totalBudget: Number(newWs.totalBudget),
        ownerId: newWs.ownerId,
        myRole: "TREASURER" as Role,
        createdAt: newWs.createdAt,
      },
    };
  } catch (err: any) {
    console.error("Failed to create workspace in DB:", err);
    return {
      success: false,
      error: err?.message || "ไม่สามารถสร้าง Workspace ได้ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Add a new team member to workspace by Gmail / Email
 */
export async function addWorkspaceMemberByEmail({
  workspaceId,
  email,
  role = "STAFF",
}: {
  workspaceId: string;
  email: string;
  role: Role;
}) {
  const currentUser = await requireAuth();

  // Verify that the current user has TREASURER role or owns this workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: currentUser.id },
      },
    },
  });

  if (!workspace) {
    return { success: false, error: "ไม่พบ Workspace ที่ระบุ" };
  }

  const isOwner = workspace.ownerId === currentUser.id;
  const isTreasurerMember = workspace.members[0]?.role === "TREASURER";
  if (!isOwner && !isTreasurerMember && currentUser.role !== "TREASURER") {
    return { success: false, error: "คุณไม่มีสิทธิ์ในการเชิญสมาชิกใน Workspace นี้" };
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { success: false, error: "กรุณาระบุที่อยู่อีเมลหรือ Gmail ให้ถูกต้อง" };
  }

  try {
    // 1. Find or create User with this email
    const memberUser = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {},
      create: {
        email: cleanEmail,
        name: cleanEmail.split("@")[0],
        role,
      },
    });

    // 2. Upsert WorkspaceMember
    const member = await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: memberUser.id,
        },
      },
      update: { role, status: "ACTIVE" },
      create: {
        workspaceId,
        userId: memberUser.id,
        role,
        status: "ACTIVE",
      },
    });

    revalidatePath("/treasury");
    revalidatePath("/");

    return {
      success: true,
      member: {
        id: member.id,
        userId: memberUser.id,
        name: memberUser.name,
        email: memberUser.email,
        role: member.role,
        status: "ACTIVE" as const,
        createdAt: member.createdAt,
      },
    };
  } catch (err: any) {
    console.error("Failed to add workspace member:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการเชิญสมาชิก" };
  }
}

/**
 * Get all members of a workspace
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberDTO[]> {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user?.name || m.user?.email?.split("@")[0] || "สมาชิก",
      email: m.user?.email || "",
      role: m.role,
      status: (m.status as "ACTIVE" | "PENDING" | "REJECTED") || "ACTIVE",
      createdAt: m.createdAt,
    }));
  } catch (err) {
    console.error("Failed to fetch workspace members:", err);
    return [];
  }
}

/**
 * Remove a member from workspace
 */
export async function removeWorkspaceMember({
  workspaceId,
  memberId,
}: {
  workspaceId: string;
  memberId: string;
}) {
  const currentUser = await requireAuth();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: currentUser.id },
      },
    },
  });

  if (!workspace) {
    return { success: false, error: "ไม่พบ Workspace" };
  }

  const isOwner = workspace.ownerId === currentUser.id;
  const isTreasurer = workspace.members[0]?.role === "TREASURER" || currentUser.role === "TREASURER";
  if (!isOwner && !isTreasurer) {
    return { success: false, error: "คุณไม่มีสิทธิ์ในการจัดการสมาชิก" };
  }

  try {
    const memberToDelete = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (memberToDelete?.userId === workspace.ownerId) {
      return { success: false, error: "ไม่สามารถลบเจ้าของ Workspace ได้" };
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    revalidatePath("/treasury");
    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete member:", err);
    return { success: false, error: "ไม่สามารถลบสมาชิกได้" };
  }
}

/**
 * Join an existing workspace by its unique camp code (e.g. "LG-2026")
 * Creates a PENDING membership request that requires Treasurer approval
 */
export async function joinWorkspaceByCode(rawCode: string) {
  const user = await requireAuth();
  const cleanCode = rawCode.trim();

  if (!cleanCode) {
    return { success: false, error: "กรุณาระบุรหัสค่าย (Workspace Code)" };
  }

  try {
    const workspace = await prisma.workspace.findFirst({
      where: {
        code: {
          equals: cleanCode,
          mode: "insensitive",
        },
      },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      return { success: false, error: `ไม่พบค่ายหรือ Workspace ที่ตรงกับรหัส "${cleanCode}"` };
    }

    if (workspace.ownerId === user.id) {
      return { success: false, error: "คุณเป็นเจ้าของค่ายนี้อยู่แล้ว" };
    }

    // Check existing membership
    const existingMember = workspace.members.find(
      (m) => m.userId === user.id
    );

    if (existingMember) {
      if (existingMember.status === "ACTIVE") {
        return { success: false, error: `คุณเป็นสมาชิกของค่าย "${workspace.name}" อยู่แล้ว` };
      }
      if (existingMember.status === "PENDING") {
        return {
          success: false,
          error: `คุณได้ส่งคำขอเข้าร่วมค่าย "${workspace.name}" แล้ว อยู่ระหว่างรอเหรัญญิกตรวจสอบและอนุมัติ`,
        };
      }
      // If REJECTED, update back to PENDING so they can request again
      await prisma.workspaceMember.update({
        where: { id: existingMember.id },
        data: { status: "PENDING" },
      });
    } else {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "STAFF",
          status: "PENDING",
        },
      });
    }

    revalidatePath("/", "layout");
    revalidatePath("/treasury");

    return {
      success: true,
      pendingApproval: true,
      workspaceName: workspace.name,
      workspaceCode: workspace.code,
      workspaceId: workspace.id,
    };
  } catch (err: any) {
    console.error("Failed to join workspace by code:", err);
    return { success: false, error: err?.message || "เกิดข้อผิดพลาดในการเข้าร่วม Workspace" };
  }
}

/**
 * Get all pending join requests for the current user
 */
export async function getUserPendingJoinRequests(): Promise<PendingJoinRequestDTO[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const requests = await prisma.workspaceMember.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      workspaceName: r.workspace.name,
      workspaceCode: r.workspace.code,
      status: "PENDING" as const,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error("Failed to fetch pending join requests:", err);
    return [];
  }
}

/**
 * Cancel a pending join request by staff
 */
export async function cancelPendingJoinRequest(memberId: string) {
  const user = await requireAuth();

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.userId !== user.id || member.status !== "PENDING") {
      return { success: false, error: "ไม่พบคำขอนี้ หรือคำขอได้รับการดำเนินการแล้ว" };
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to cancel pending join request:", err);
    return { success: false, error: err?.message || "ไม่สามารถยกเลิกคำขอได้" };
  }
}

/**
 * Approve a member's pending join request (Treasurer only)
 */
export async function approveWorkspaceJoinRequest({
  workspaceId,
  memberId,
}: {
  workspaceId: string;
  memberId: string;
}) {
  const currentUser = await requireAuth();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: currentUser.id, status: "ACTIVE" },
      },
    },
  });

  if (!workspace) {
    return { success: false, error: "ไม่พบ Workspace" };
  }

  const isOwner = workspace.ownerId === currentUser.id;
  const isTreasurer =
    workspace.members[0]?.role === "TREASURER" || currentUser.role === "TREASURER";
  if (!isOwner && !isTreasurer) {
    return { success: false, error: "คุณไม่มีสิทธิ์ในการอนุมัติสมาชิก" };
  }

  try {
    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { status: "ACTIVE" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    revalidatePath("/treasury");
    revalidatePath("/");

    return {
      success: true,
      memberName: updated.user?.name || updated.user?.email || "สมาชิก",
    };
  } catch (err: any) {
    console.error("Failed to approve join request:", err);
    return { success: false, error: err?.message || "ไม่สามารถอนุมัติคำขอได้" };
  }
}

/**
 * Reject / Decline a member's pending join request (Treasurer only)
 */
export async function rejectWorkspaceJoinRequest({
  workspaceId,
  memberId,
}: {
  workspaceId: string;
  memberId: string;
}) {
  const currentUser = await requireAuth();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: currentUser.id, status: "ACTIVE" },
      },
    },
  });

  if (!workspace) {
    return { success: false, error: "ไม่พบ Workspace" };
  }

  const isOwner = workspace.ownerId === currentUser.id;
  const isTreasurer =
    workspace.members[0]?.role === "TREASURER" || currentUser.role === "TREASURER";
  if (!isOwner && !isTreasurer) {
    return { success: false, error: "คุณไม่มีสิทธิ์ในการปฏิเสธสมาชิก" };
  }

  try {
    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    revalidatePath("/treasury");
    revalidatePath("/");

    return { success: true };
  } catch (err: any) {
    console.error("Failed to reject join request:", err);
    return { success: false, error: err?.message || "ไม่สามารถปฏิเสธคำขอได้" };
  }
}

/**
 * 1-Click Quick Setup Demo Workspace (Larngear Camp 2026)
 * Enables instant testing of all Staff & Treasury features
 */
export async function createDemoWorkspaceAction() {
  try {
    const user = await requireRole(["TREASURER"]);
    // Find or upsert treasurer and staff
    const treasurer = await prisma.user.upsert({
      where: { email: "treasurer@larngear.camp" },
      update: {},
      create: {
        id: "demo-treasurer-id",
        email: "treasurer@larngear.camp",
        name: "สมหญิง รอบคอบ (Treasurer ค่าย)",
        role: "TREASURER",
        promptpayId: "0898765432",
      },
    });

    const staff = await prisma.user.upsert({
      where: { email: "staff@larngear.camp" },
      update: {},
      create: {
        id: "demo-staff-id",
        email: "staff@larngear.camp",
        name: "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)",
        role: "STAFF",
        promptpayId: "0812345678",
      },
    });

    const ws = await prisma.workspace.create({
      data: {
        name: "ค่ายลานเกียร์ 2026 (Larngear Camp)",
        code: "LG-2026",
        description: "ค่ายวิศวะพัฒนาน้องเพื่อเยาวชน ปีการศึกษา 2569",
        totalBudget: 50000,
        ownerId: treasurer.id,
        members: {
          create: [
            { userId: treasurer.id, role: "TREASURER", status: "ACTIVE" },
            { userId: staff.id, role: "STAFF", status: "ACTIVE" },
            ...(user.id !== treasurer.id && user.id !== staff.id
              ? [{ userId: user.id, role: user.role, status: "ACTIVE" }]
              : []),
          ],
        },
        departments: {
          create: [
            { name: "ฝ่ายสวัสดิการและอาหาร", allocatedBudget: 25000, color: "#10B981" },
            { name: "ฝ่ายพัสดุและสถานที่", allocatedBudget: 15000, color: "#3B82F6" },
            { name: "ฝ่ายกิจกรรมและสันทนาการ", allocatedBudget: 10000, color: "#F59E0B" },
          ],
        },
      },
    });

    await setActiveWorkspaceId(ws.id);
    revalidatePath("/", "layout");
    revalidatePath("/treasury");
    return { success: true, workspace: ws };
  } catch (err: any) {
    console.error("Failed to create demo workspace:", err);
    return { success: false, error: err?.message || "ไม่สามารถสร้าง Demo Workspace ได้" };
  }
}
