import { ClaimWithRelations, ClaimItemDTO, WorkspaceDTO, DepartmentBudgetSummary } from "@/types/receipt";

export function mapPrismaClaim(claim: any): ClaimWithRelations {
  return {
    ...claim,
    amount: Number(claim.amount ?? 0),
    receiptTotal: claim.receiptTotal != null ? Number(claim.receiptTotal) : null,
    expenseDate: claim.expenseDate instanceof Date ? claim.expenseDate.toISOString() : String(claim.expenseDate || ""),
    createdAt: claim.createdAt instanceof Date ? claim.createdAt.toISOString() : String(claim.createdAt || ""),
    updatedAt: claim.updatedAt instanceof Date ? claim.updatedAt.toISOString() : String(claim.updatedAt || ""),
    paidAt: claim.paidAt instanceof Date ? claim.paidAt.toISOString() : (claim.paidAt ? String(claim.paidAt) : null),
    department: claim.department
      ? {
          id: claim.department.id,
          name: claim.department.name,
          color: claim.department.color,
          allocatedBudget: Number(claim.department.allocatedBudget ?? 0),
        }
      : undefined,
    items: (claim.items || []).map((it: any): ClaimItemDTO => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice ?? 0),
      totalPrice: Number(it.totalPrice ?? 0),
      isClaimed: it.isClaimed,
    })),
  };
}

export function mapPrismaDepartment(dept: any) {
  return {
    id: dept.id,
    name: dept.name,
    color: dept.color,
    allocatedBudget: Number(dept.allocatedBudget ?? 0),
    workspaceId: dept.workspaceId,
  };
}

export function mapPrismaWorkspace(ws: any, userRole?: any): WorkspaceDTO {
  return {
    id: ws.id,
    name: ws.name,
    code: ws.code,
    description: ws.description,
    totalBudget: Number(ws.totalBudget ?? 0),
    ownerId: ws.ownerId,
    myRole: userRole,
    createdAt: ws.createdAt instanceof Date ? ws.createdAt.toISOString() : String(ws.createdAt || ""),
  };
}
