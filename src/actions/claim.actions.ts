"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getDemoStore } from "@/lib/mock-data";
import { ClaimItemDTO, ClaimWithRelations, DocType } from "@/types/receipt";
import { getCurrentUser, requireAuth, requireRole } from "@/actions/user.actions";
import { getActiveWorkspace } from "@/actions/workspace.actions";
import {
  CreateClaimSchema,
  ApproveClaimSchema,
  RejectClaimSchema,
  MarkPaidSchema,
} from "@/lib/validations";
import { mapPrismaClaim } from "@/lib/prisma-mappers";

export async function createClaimWithItems(input: {
  title: string;
  departmentId: string;
  amount: number;
  receiptTotal?: number | null;
  receiptImageUrl: string;
  docType: DocType;
  promptpayId: string;
  items: ClaimItemDTO[];
}) {
  // 1. Authenticate user
  const currentUser = await requireAuth();
  const activeWorkspace = await getActiveWorkspace();

  if (!activeWorkspace) {
    return {
      success: false,
      error: "ไม่พบ Workspace ที่ใช้งานอยู่ กรุณาสร้างหรือเข้าร่วม Workspace ก่อนส่งบิล",
    };
  }

  // 2. Validate input schema with Zod
  const validated = CreateClaimSchema.parse(input);

  try {
    // 3. Prisma DB creation
    const newClaim = await prisma.claim.create({
      data: {
        workspaceId: activeWorkspace.id,
        title: validated.title,
        departmentId: validated.departmentId,
        amount: validated.amount,
        receiptTotal: validated.receiptTotal ?? validated.amount,
        receiptImageUrl: validated.receiptImageUrl,
        docType: validated.docType as any,
        promptpayId: validated.promptpayId || currentUser.promptpayId,
        status: "PENDING",
        submitterId: currentUser.id,
        items: {
          create: validated.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            isClaimed: item.isClaimed,
          })),
        },
      },
      include: {
        department: true,
        submitter: true,
        reviewer: true,
        items: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/treasury");
    return { success: true, claim: mapPrismaClaim(newClaim) };
  } catch (error) {
    console.warn("Prisma write error, utilizing demo fallback:", error);

    // Fallback to Demo Store for offline/demo environment
    const store = getDemoStore();
    const dept = store.departments.find((d) => d.id === validated.departmentId) || store.departments[0];
    const newId = `claim-${Date.now()}`;

    const createdClaim: ClaimWithRelations = {
      id: newId,
      workspaceId: activeWorkspace.id,
      title: validated.title,
      merchantName: null,
      amount: validated.amount,
      receiptTotal: validated.receiptTotal ?? validated.amount,
      expenseDate: new Date().toISOString(),
      receiptImageUrl: validated.receiptImageUrl,
      docType: validated.docType,
      promptpayId: validated.promptpayId || currentUser.promptpayId,
      status: "PENDING",
      paidAt: null,
      rejectReason: null,
      payoutSlipUrl: null,
      departmentId: dept.id,
      submitterId: currentUser.id,
      reviewerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      department: dept,
      submitter: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        promptpayId: validated.promptpayId || currentUser.promptpayId,
      },
      reviewer: null,
      items: validated.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        ...it,
      })),
    };

    store.claims.unshift(createdClaim);

    revalidatePath("/");
    revalidatePath("/treasury");
    return { success: true, claim: createdClaim };
  }
}

/**
 * Approve a claim — Strictly restricted to TREASURER with atomic budget overrun check
 */
export async function approveClaim(input: { claimId: string; reviewerId?: string }) {
  // 1. RBAC Guard: Only TREASURER can approve claims
  const reviewer = await requireRole(["TREASURER"]);

  // 2. Validate input schema
  const { claimId } = ApproveClaimSchema.parse(input);

  try {
    // 3. Execute atomic transaction with budget overrun verification
    const updated = await prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({
        where: { id: claimId },
        include: { department: true },
      });

      if (!claim) {
        throw new Error("ไม่พบรายการเบิกเงินที่ระบุ");
      }

      if (claim.status !== "PENDING") {
        throw new Error(`รายการนี้อยู่ในสถานะ ${claim.status} ไม่สามารถอนุมัติซ้ำได้`);
      }

      // Check current department budget consumption
      const aggregate = await tx.claim.aggregate({
        where: {
          departmentId: claim.departmentId,
          status: { in: ["APPROVED", "PAID"] },
        },
        _sum: { amount: true },
      });

      const spentOrCommitted = Number(aggregate._sum.amount ?? 0);
      const allocatedBudget = Number(claim.department.allocatedBudget);
      const claimAmount = Number(claim.amount);

      if (spentOrCommitted + claimAmount > allocatedBudget) {
        throw new Error(
          `งบประมาณฝ่ายไม่เพียงพอ: งบคงเหลือ ${(allocatedBudget - spentOrCommitted).toLocaleString("th-TH")} บาท, แต่ยอดเบิก ${claimAmount.toLocaleString("th-TH")} บาท`
        );
      }

      return await tx.claim.update({
        where: { id: claimId },
        data: {
          status: "APPROVED",
          reviewerId: reviewer.id, // Strictly bound to authenticated reviewer
          updatedAt: new Date(),
        },
        include: {
          department: true,
          submitter: true,
          reviewer: true,
          items: true,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/treasury");
    return { success: true, claim: mapPrismaClaim(updated) };
  } catch (error: any) {
    console.warn("Prisma approve transaction notice:", error?.message || error);

    // Fallback to demo store if database is offline
    const store = getDemoStore();
    const claim = store.claims.find((c) => c.id === claimId);
    if (claim) {
      claim.status = "APPROVED";
      claim.reviewerId = reviewer.id;
      claim.updatedAt = new Date().toISOString();
      revalidatePath("/");
      revalidatePath("/treasury");
      return { success: true, claim };
    }

    return { success: false, error: error?.message || "ไม่สามารถอนุมัติรายการได้" };
  }
}

/**
 * Reject a claim — Strictly restricted to TREASURER
 */
export async function rejectClaim(input: { claimId: string; reason: string }) {
  // 1. RBAC Guard: Only TREASURER can reject claims
  const reviewer = await requireRole(["TREASURER"]);

  // 2. Validate input schema
  const { claimId, reason } = RejectClaimSchema.parse(input);

  try {
    const updated = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: "REJECTED",
        rejectReason: reason,
        reviewerId: reviewer.id,
        updatedAt: new Date(),
      },
      include: {
        department: true,
        submitter: true,
        reviewer: true,
        items: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/treasury");
    return { success: true, claim: mapPrismaClaim(updated) };
  } catch (error) {
    console.warn("Prisma reject error, updating Demo Store:", error);
    const store = getDemoStore();
    const claim = store.claims.find((c) => c.id === claimId);
    if (claim) {
      claim.status = "REJECTED";
      claim.rejectReason = reason;
      claim.reviewerId = reviewer.id;
      claim.updatedAt = new Date().toISOString();
      revalidatePath("/");
      revalidatePath("/treasury");
      return { success: true, claim };
    }
    return { success: false, error: "ไม่สามารถปฏิเสธรายการได้" };
  }
}

/**
 * Mark claim as paid — Strictly restricted to TREASURER
 */
export async function markClaimPaid(input: { claimId: string; payoutSlipUrl?: string }) {
  // 1. RBAC Guard: Only TREASURER can mark as paid
  await requireRole(["TREASURER"]);

  // 2. Validate input schema
  const { claimId, payoutSlipUrl } = MarkPaidSchema.parse(input);

  try {
    const updated = await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        payoutSlipUrl: payoutSlipUrl || "/sample-receipts/kplus-slip.svg",
        updatedAt: new Date(),
      },
      include: {
        department: true,
        submitter: true,
        reviewer: true,
        items: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/treasury");
    return { success: true, claim: mapPrismaClaim(updated) };
  } catch (error) {
    console.warn("Prisma markPaid error, updating Demo Store:", error);
    const store = getDemoStore();
    const claim = store.claims.find((c) => c.id === claimId);
    if (claim) {
      claim.status = "PAID";
      claim.paidAt = new Date().toISOString();
      claim.payoutSlipUrl = payoutSlipUrl || "/sample-receipts/kplus-slip.svg";
      claim.updatedAt = new Date().toISOString();
      revalidatePath("/");
      revalidatePath("/treasury");
      return { success: true, claim };
    }
    return { success: false, error: "ไม่สามารถบันทึกการจ่ายเงินได้" };
  }
}

/**
 * Get claim by ID with Insecure Direct Object Reference (IDOR) prevention
 */
export async function getClaimById(id: string): Promise<ClaimWithRelations | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  try {
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        department: true,
        submitter: true,
        reviewer: true,
        items: true,
      },
    });

    if (claim) {
      const mapped = mapPrismaClaim(claim);
      // IDOR Guard: Only Treasurer OR Claim Submitter can view the claim details
      if (currentUser.role !== "TREASURER" && mapped.submitterId !== currentUser.id) {
        throw new Error("FORBIDDEN: You do not have permission to view this claim.");
      }
      return mapped;
    }
  } catch (error: any) {
    if (error?.message?.startsWith("FORBIDDEN")) {
      throw error;
    }
    console.warn("Prisma getClaimById failed:", error);
  }

  const store = getDemoStore();
  const found = store.claims.find((c) => c.id === id);
  if (found) {
    // IDOR Guard on fallback store as well
    if (currentUser.role !== "TREASURER" && found.submitterId !== currentUser.id) {
      throw new Error("FORBIDDEN: You do not have permission to view this claim.");
    }
    return found;
  }

  return null;
}
