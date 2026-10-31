"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calculateDashboardMetrics } from "@/lib/mock-data";
import { DashboardMetrics } from "@/types/receipt";
import { getActiveWorkspace } from "@/actions/workspace.actions";
import { mapPrismaClaim, mapPrismaDepartment } from "@/lib/prisma-mappers";

export async function getBudgetDashboardData(): Promise<DashboardMetrics> {
  const activeWorkspace = await getActiveWorkspace();

  if (!activeWorkspace) {
    return {
      totalAllocated: 0,
      actualDisbursed: 0,
      pendingReserved: 0,
      availableBalance: 0,
      departments: [],
      recentClaims: [],
      workspace: undefined,
    };
  }

  try {
    const [departments, claims] = await Promise.all([
      prisma.department.findMany({
        where: {
          workspaceId: activeWorkspace.id,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.claim.findMany({
        where: {
          workspaceId: activeWorkspace.id,
        },
        include: {
          department: true,
          submitter: true,
          reviewer: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const mappedDepartments = departments.map(mapPrismaDepartment);
    const mappedClaims = claims.map(mapPrismaClaim);

    if (mappedDepartments.length > 0) {
      const metrics = calculateDashboardMetrics(
        mappedClaims,
        mappedDepartments as any
      );

      const totalAllocated = Math.max(activeWorkspace.totalBudget, metrics.totalAllocated);
      const availableBalance = Math.max(
        0,
        totalAllocated - metrics.actualDisbursed - metrics.pendingReserved
      );

      return {
        totalAllocated,
        actualDisbursed: metrics.actualDisbursed,
        pendingReserved: metrics.pendingReserved,
        availableBalance,
        departments: metrics.departmentSummaries,
        recentClaims: mappedClaims,
        workspace: activeWorkspace,
      };
    }

    // Workspace exists but has 0 departments yet
    return {
      totalAllocated: activeWorkspace.totalBudget || 0,
      actualDisbursed: 0,
      pendingReserved: 0,
      availableBalance: activeWorkspace.totalBudget || 0,
      departments: [],
      recentClaims: mappedClaims,
      workspace: activeWorkspace,
    };
  } catch (error) {
    console.error("Prisma fetch failed:", error);
    return {
      totalAllocated: activeWorkspace.totalBudget || 0,
      actualDisbursed: 0,
      pendingReserved: 0,
      availableBalance: activeWorkspace.totalBudget || 0,
      departments: [],
      recentClaims: [],
      workspace: activeWorkspace,
    };
  }
}

export async function resetDemoData() {
  revalidatePath("/");
  revalidatePath("/treasury");
  return { success: true };
}
