export type Role = "STAFF" | "TREASURER";

export type ClaimStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED";

export type DocType = "BANK_SLIP" | "CASH_RECEIPT" | "TAX_INVOICE" | "OTHER";

export interface ClaimItemDTO {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isClaimed: boolean;
}

export interface ExtractedReceiptData {
  title: string;
  merchantName: string;
  expenseDate: string; // ISO string or YYYY-MM-DD
  docType: DocType;
  receiptTotal: number;
  vatAmount?: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isClaimed?: boolean;
  }>;
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  totalBudget: number;
  ownerId: string;
  myRole?: Role;
  createdAt: Date | string;
}

export interface WorkspaceMemberDTO {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "PENDING" | "REJECTED";
  createdAt: Date | string;
}

export interface BusinessUnitInput {
  id?: string;
  name: string;
  allocatedBudget: number;
  color: string;
}

export interface TeamMemberInput {
  email: string;
  role: Role;
}

export interface ClaimWithRelations {
  id: string;
  title: string;
  merchantName: string | null;
  amount: number;
  receiptTotal: number | null;
  expenseDate: Date | string;
  receiptImageUrl: string;
  docType: DocType;
  promptpayId: string;
  status: ClaimStatus;
  rejectReason: string | null;
  payoutSlipUrl: string | null;
  paidAt: Date | string | null;
  workspaceId?: string | null;
  departmentId: string;
  submitterId: string;
  reviewerId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  department?: {
    id: string;
    name: string;
    color: string;
    allocatedBudget: number;
  };
  submitter?: {
    id: string;
    name: string;
    email: string;
    promptpayId?: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
  } | null;
  items: ClaimItemDTO[];
}

export interface DepartmentBudgetSummary {
  id: string;
  name: string;
  color: string;
  allocatedBudget: number;
  spent: number;       // PAID
  reserved: number;    // PENDING + APPROVED
  available: number;   // allocated - spent - reserved
  usagePercent: number;
}

export interface DashboardMetrics {
  totalAllocated: number;
  actualDisbursed: number;
  pendingReserved: number;
  availableBalance: number;
  departments: DepartmentBudgetSummary[];
  recentClaims: ClaimWithRelations[];
  workspace?: WorkspaceDTO;
}
