"use client";

import React, { useState } from "react";
import { ClaimWithRelations, DepartmentBudgetSummary, WorkspaceDTO } from "@/types/receipt";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { DepartmentProgressList } from "@/components/dashboard/DepartmentProgressList";
import { TreasuryClaimTable } from "@/components/treasury/TreasuryClaimTable";
import { SplitReviewDialog } from "@/components/treasury/SplitReviewDialog";
import { PromptPayPayoutDialog } from "@/components/treasury/PromptPayPayoutDialog";
import { TreasuryExportDialog } from "@/components/treasury/TreasuryExportDialog";
import { WorkspaceTeamManagement } from "@/components/workspace/WorkspaceTeamManagement";
import { approveClaim, rejectClaim, markClaimPaid } from "@/actions/claim.actions";
import { getBudgetDashboardData } from "@/actions/budget.actions";
import {
  Scale,
  RefreshCw,
  ClipboardList,
  BarChart3,
  Wallet,
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TreasuryWorkspaceProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  workspace?: WorkspaceDTO;
  metrics: {
    totalAllocated: number;
    actualDisbursed: number;
    pendingReserved: number;
    availableBalance: number;
    departments: DepartmentBudgetSummary[];
    claims: ClaimWithRelations[];
  };
}

export function TreasuryWorkspace({ user, workspace, metrics }: TreasuryWorkspaceProps) {
  const router = useRouter();
  const [claims, setClaims] = useState<ClaimWithRelations[]>(metrics.claims);
  const [loading, setLoading] = useState(false);

  // Synchronize state when server props update
  React.useEffect(() => {
    setClaims(metrics.claims);
  }, [metrics.claims]);

  // Tab View: 'QUEUE' (primary default) vs 'DASHBOARD' vs 'TEAM'
  const [activeTab, setActiveTab] = useState<"QUEUE" | "DASHBOARD" | "TEAM">("QUEUE");

  // Split-Screen Review Modal state
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithRelations | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // PromptPay QR Payout Modal state
  const [payClaim, setPayClaim] = useState<ClaimWithRelations | null>(null);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

  // Export to Excel / Sheets Modal state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await getBudgetDashboardData();
      setClaims(data.recentClaims);
      router.refresh();
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (claim: ClaimWithRelations) => {
    setSelectedClaim(claim);
    setReviewDialogOpen(true);
  };

  const handleOpenPay = (claim: ClaimWithRelations) => {
    setPayClaim(claim);
    setPayoutDialogOpen(true);
  };

  const handleApprove = async (claimId: string) => {
    // 1. Optimistic Update
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: "APPROVED" as const } : c))
    );
    setReviewDialogOpen(false);

    const approved = claims.find((c) => c.id === claimId);
    if (approved) {
      setPayClaim({ ...approved, status: "APPROVED" });
      setPayoutDialogOpen(true);
    }

    const res = await approveClaim({ claimId });
    if (!res.success) {
      alert(res.error || "ไม่สามารถอนุมัติรายการได้");
      fetchClaims();
    } else {
      router.refresh();
    }
  };

  const handleReject = async (claimId: string, reason: string) => {
    // 1. Optimistic Update
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, status: "REJECTED" as const, rejectReason: reason } : c
      )
    );
    setReviewDialogOpen(false);

    const res = await rejectClaim({ claimId, reason });
    if (!res.success) {
      alert(res.error || "ไม่สามารถปฏิเสธรายการได้");
      fetchClaims();
    } else {
      router.refresh();
    }
  };

  const handleMarkPaid = async (claimId: string, slipUrl?: string) => {
    // 1. Optimistic Update
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: "PAID" as const,
              payoutSlipUrl: slipUrl || "/sample-receipts/kplus-slip.svg",
              paidAt: new Date().toISOString(),
            }
          : c
      )
    );

    const res = await markClaimPaid({ claimId, payoutSlipUrl: slipUrl });
    if (!res.success) {
      alert(res.error || "ไม่สามารถบันทึกการจ่ายเงินได้");
      fetchClaims();
    } else {
      router.refresh();
    }
  };

  // Calculations for quick top status
  const pendingClaims = claims.filter((c) => c.status === "PENDING");
  const approvedClaims = claims.filter((c) => c.status === "APPROVED");
  const pendingTotal = pendingClaims.reduce((acc, c) => acc + c.amount, 0);
  const approvedTotal = approvedClaims.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-5 pb-16 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Treasury Header Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-7 text-white shadow-xl shadow-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Scale className="w-3.5 h-3.5 text-indigo-300" />
            <span>Treasury Portal • ระบบเหรัญญิก</span>
            {workspace && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-white font-bold">{workspace.name}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            ตรวจสอบบิลและอนุมัติจ่ายเงิน
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80">
            ยินดีต้อนรับคุณ {user.name} • จัดการคิวตรวจบิลแบบ Split-Screen สร้าง QR พร้อมเพย์ และจัดการทีมงาน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setExportDialogOpen(true)}
            title="ส่งออกรายงานสรุปสู่ Excel หรือ Google Sheets"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก Excel / Sheets</span>
          </button>

          <button
            onClick={fetchClaims}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition text-white shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation: Queue, Dashboard, Team */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-100 rounded-2xl shadow-inner">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {/* Tab 1: Primary Pending Queue */}
          <button
            type="button"
            onClick={() => setActiveTab("QUEUE")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "QUEUE"
                ? "bg-white text-indigo-700 shadow-md font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>คิวตรวจบิล (Queue)</span>
            {pendingClaims.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingClaims.length}
              </span>
            )}
          </button>

          {/* Tab 2: Secondary Budget Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab("DASHBOARD")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "DASHBOARD"
                ? "bg-white text-indigo-700 shadow-md font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-slate-500 shrink-0" />
            <span>แดชบอร์ดงบประมาณ (Budget)</span>
          </button>

          {/* Tab 3: Team Management by Gmail */}
          <button
            type="button"
            onClick={() => setActiveTab("TEAM")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "TEAM"
                ? "bg-white text-indigo-700 shadow-md font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-slate-500 shrink-0" />
            <span>ทีมงาน & สิทธิ์ผู้ใช้ (Team)</span>
          </button>
        </div>

        {/* Quick Context Pill */}
        <div className="hidden lg:flex items-center gap-3 text-xs px-3 text-slate-500">
          <span>
            งบค่ายคงเหลือ:{" "}
            <strong className="text-emerald-600 font-bold">
              {formatCurrency(metrics.availableBalance)}
            </strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            เบิกจ่ายแล้ว:{" "}
            <strong className="text-slate-800 font-bold">
              {formatCurrency(metrics.actualDisbursed)}
            </strong>
          </span>
        </div>
      </div>

      {/* VIEW 1: Primary Pending Queue */}
      {activeTab === "QUEUE" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Quick Status Bar for Treasurer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Box 1: Pending Verification */}
            <div className="rounded-2xl bg-white p-4 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  รอการตรวจสอบ (Pending)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-amber-600 font-mono">
                    {pendingClaims.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({formatCurrency(pendingTotal)})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">บิลใหม่ที่รอเหรัญญิกอนุมัติ</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Box 2: Approved Awaiting Payout */}
            <div className="rounded-2xl bg-white p-4 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  อนุมัติแล้ว รอโอน (Approved)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-indigo-600 font-mono">
                    {approvedClaims.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({formatCurrency(approvedTotal)})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">กดสร้าง QR พร้อมเพย์เพื่อจ่าย</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Box 3: Available Budget */}
            <div
              onClick={() => setActiveTab("DASHBOARD")}
              className="rounded-2xl bg-white p-4 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] flex items-center justify-between cursor-pointer hover:border-emerald-200 border border-transparent transition"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  งบค่ายคงเหลือจริง
                </span>
                <div className="text-xl font-black text-emerald-600 font-mono">
                  {formatCurrency(metrics.availableBalance)}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold block">
                  คลิกเพื่อดูแดชบอร์ดงบประมาณ
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Primary Claim Table / Cards Queue */}
          <TreasuryClaimTable
            claims={claims}
            onReviewClaim={handleOpenReview}
            onPayClaim={handleOpenPay}
            onExport={() => setExportDialogOpen(true)}
          />
        </div>
      )}

      {/* VIEW 2: Secondary Budget Dashboard */}
      {activeTab === "DASHBOARD" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                ภาพรวมงบประมาณค่าย (Camp Budget Overview)
              </h2>
              <p className="text-xs text-slate-400">
                งบประมาณรวม {formatCurrency(metrics.totalAllocated)} และความคืบหน้าการเบิกจ่ายแยกตามฝ่าย
              </p>
            </div>

            <button
              onClick={() => setActiveTab("QUEUE")}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl shadow-sm transition"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>กลับไปคิวตรวจบิล ({pendingClaims.length})</span>
            </button>
          </div>

          {/* 4 Summary Budget Metric Cards */}
          <MetricCards
            totalAllocated={metrics.totalAllocated}
            actualDisbursed={metrics.actualDisbursed}
            pendingReserved={metrics.pendingReserved}
            availableBalance={metrics.availableBalance}
          />

          {/* Department Budget Bars */}
          <DepartmentProgressList departments={metrics.departments} />
        </div>
      )}

      {/* VIEW 3: Team Management by Gmail */}
      {activeTab === "TEAM" && workspace && (
        <div className="animate-in fade-in duration-200">
          <WorkspaceTeamManagement
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            currentUser={{
              id: user.id,
              email: user.email,
              role: "TREASURER",
            }}
          />
        </div>
      )}

      {/* Split-Screen Review & Audit Modal */}
      {selectedClaim && (
        <SplitReviewDialog
          claim={selectedClaim}
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* PromptPay EMVCo QR Payout Modal */}
      {payClaim && (
        <PromptPayPayoutDialog
          claim={payClaim}
          open={payoutDialogOpen}
          onOpenChange={setPayoutDialogOpen}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {/* Export to Excel & Google Sheets Modal */}
      <TreasuryExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        workspaceName={workspace?.name}
        claims={claims}
        departments={metrics.departments}
      />
    </div>
  );
}
