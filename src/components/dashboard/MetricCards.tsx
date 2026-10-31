import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  CheckCircle2,
  Hourglass,
  PiggyBank,
  TrendingUp,
} from "lucide-react";

interface MetricCardsProps {
  totalAllocated: number;
  actualDisbursed: number;
  pendingReserved: number;
  availableBalance: number;
}

export function MetricCards({
  totalAllocated,
  actualDisbursed,
  pendingReserved,
  availableBalance,
}: MetricCardsProps) {
  const disbursedPercent = totalAllocated > 0 ? Math.round((actualDisbursed / totalAllocated) * 100) : 0;
  const reservedPercent = totalAllocated > 0 ? Math.round((pendingReserved / totalAllocated) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Allocated Budget */}
      <div className="card-hover relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Allocated
          </span>
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalAllocated)}
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-blue-600" />
            งบประมาณรวมทั้งค่าย
          </p>
        </div>
        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full w-full" />
        </div>
      </div>

      {/* 2. Actual Disbursed */}
      <div className="card-hover relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Actual Disbursed
          </span>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(actualDisbursed)}
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            โอนจ่ายคืนแล้ว ({disbursedPercent}%)
          </p>
        </div>
        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, disbursedPercent)}%` }}
          />
        </div>
      </div>

      {/* 3. Pending / Reserved */}
      <div className="card-hover relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Pending / Reserved
          </span>
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 shadow-sm">
            <Hourglass className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {formatCurrency(pendingReserved)}
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            กันงบไว้รออนุมัติ ({reservedPercent}%)
          </p>
        </div>
        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, reservedPercent)}%` }}
          />
        </div>
      </div>

      {/* 4. Available Balance */}
      <div className="card-hover relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            Available Balance
          </span>
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 shadow-sm">
            <PiggyBank className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-black text-indigo-900 tracking-tight">
            {formatCurrency(availableBalance)}
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            งบคงเหลือที่ขอเบิกได้จริง
          </p>
        </div>
        <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${totalAllocated > 0 ? Math.min(100, Math.round((availableBalance / totalAllocated) * 100)) : 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
