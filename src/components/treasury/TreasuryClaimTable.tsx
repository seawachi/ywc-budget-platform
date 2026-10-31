"use client";

import React, { useState } from "react";
import { ClaimWithRelations } from "@/types/receipt";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClaimStatusBadge, DocTypeBadge } from "@/components/claims/StatusBadge";
import { Button } from "@/components/ui/button";
import { Search, Eye, QrCode, FileSpreadsheet } from "lucide-react";

interface TreasuryClaimTableProps {
  claims: ClaimWithRelations[];
  onReviewClaim: (claim: ClaimWithRelations) => void;
  onPayClaim?: (claim: ClaimWithRelations) => void;
  onExport?: () => void;
}

export function TreasuryClaimTable({
  claims,
  onReviewClaim,
  onPayClaim,
  onExport,
}: TreasuryClaimTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClaims = claims.filter((claim) => {
    if (statusFilter !== "ALL" && claim.status !== statusFilter) return false;
    if (deptFilter !== "ALL" && claim.departmentId !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = claim.title.toLowerCase().includes(q);
      const matchMerchant = claim.merchantName?.toLowerCase().includes(q);
      const matchSubmitter = claim.submitter?.name.toLowerCase().includes(q);
      if (!matchTitle && !matchMerchant && !matchSubmitter) return false;
    }
    return true;
  });

  // Extract unique departments
  const departments = Array.from(
    new Map(
      claims
        .filter((c) => c.department)
        .map((c) => [c.department!.id, c.department!])
    ).values()
  );

  return (
    <div className="rounded-3xl bg-white shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] overflow-hidden">
      {/* Filters Toolbar */}
      <div className="p-3.5 sm:p-5 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-3.5">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { label: "ทั้งหมด", value: "ALL", count: claims.length },
            {
              label: "รอตรวจ",
              value: "PENDING",
              count: claims.filter((c) => c.status === "PENDING").length,
              color: "text-amber-700 bg-amber-50",
            },
            {
              label: "รอโอนจ่าย",
              value: "APPROVED",
              count: claims.filter((c) => c.status === "APPROVED").length,
              color: "text-blue-700 bg-blue-50",
            },
            {
              label: "จ่ายแล้ว",
              value: "PAID",
              count: claims.filter((c) => c.status === "PAID").length,
              color: "text-emerald-700 bg-emerald-50",
            },
            {
              label: "ตีกลับ",
              value: "REJECTED",
              count: claims.filter((c) => c.status === "REJECTED").length,
              color: "text-red-700 bg-red-50",
            },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === tab.value
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-white text-slate-600 hover:bg-slate-100 shadow-sm"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  statusFilter === tab.value
                    ? "bg-slate-800 text-white"
                    : tab.color || "bg-slate-100 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Department Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Dept filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 sm:h-10 rounded-xl bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">ทุกฝ่าย (All Depts)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบิล, ผู้เบิก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 sm:h-10 w-full sm:w-56 rounded-xl bg-white pl-9 pr-3 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Export to Excel / Sheets Button */}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              title="ส่งออกรายงานสู่ Excel หรือ Google Sheets"
              className="h-9 sm:h-10 px-3 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">ส่งออก Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact List / Table: No Horizontal Scrollbar */}
      <div className="divide-y divide-slate-100 p-2">
        {filteredClaims.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            ไม่พบรายการขอเบิกเงินที่ตรงกับเงื่อนไข
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="p-3.5 rounded-2xl hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Left Column: Title + Submitter + Merchant + Date + DocType */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                    {claim.title}
                  </span>
                  <DocTypeBadge docType={claim.docType} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  {claim.department && (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: claim.department.color }}
                      />
                      {claim.department.name}
                    </span>
                  )}
                  <span>ผู้เบิก: {claim.submitter?.name?.split(" ")[0] || "สต๊าฟ"}</span>
                  {claim.merchantName && <span>ร้าน: {claim.merchantName}</span>}
                  <span>วันที่: {formatDate(claim.expenseDate)}</span>
                </div>

                {claim.status === "REJECTED" && claim.rejectReason && (
                  <div className="text-[11px] text-red-600 font-medium mt-1">
                    เหตุผลตีกลับ: {claim.rejectReason}
                  </div>
                )}
              </div>

              {/* Right Column: Amount + Status + Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="block font-black text-slate-900 text-base">
                    {formatCurrency(claim.amount)}
                  </span>
                  <div className="mt-0.5">
                    <ClaimStatusBadge status={claim.status} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={claim.status === "PENDING" ? "default" : "outline"}
                    onClick={() => onReviewClaim(claim)}
                    className="h-8 gap-1.5 text-xs shadow-sm hover:shadow"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{claim.status === "PENDING" ? "ตรวจบิล" : "ดูข้อมูล"}</span>
                  </Button>

                  {claim.status === "APPROVED" && onPayClaim && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => onPayClaim(claim)}
                      className="h-8 gap-1.5 text-xs shadow-sm hover:shadow"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>สแกนจ่าย</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
