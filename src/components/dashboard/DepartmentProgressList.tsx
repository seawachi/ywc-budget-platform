import React from "react";
import { DepartmentBudgetSummary } from "@/types/receipt";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, CheckCircle, ShieldAlert, BarChart3 } from "lucide-react";

interface DepartmentProgressListProps {
  departments: DepartmentBudgetSummary[];
}

export function DepartmentProgressList({ departments }: DepartmentProgressListProps) {
  return (
    <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            งบประมาณและความคืบหน้าแยกตามฝ่าย (Department Budget)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ตรวจเช็กเพดานงบก่อนส่งเบิก • หลอดเปลี่ยนสีอัตโนมัติ (เขียว &lt; 75%, เหลือง 75-90%, แดง &gt; 90%)
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &lt;75% ปลอดภัย
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 75-90% ใกล้เต็ม
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> &gt;90% วิกฤต
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => {
          const usedTotal = dept.spent + dept.reserved;
          const percent = dept.usagePercent;

          return (
            <div
              key={dept.id}
              className="p-5 rounded-2xl bg-slate-50/80 hover:bg-slate-50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="font-bold text-sm text-slate-900">
                      {dept.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {percent > 90 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-700">
                        <ShieldAlert className="w-3 h-3" />
                        {percent}% ใกล้หมด
                      </span>
                    ) : percent >= 75 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-700">
                        <AlertTriangle className="w-3 h-3" />
                        {percent}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3" />
                        {percent}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <Progress value={percent} autoColor className="h-2 my-3 bg-slate-200/70" />
              </div>

              {/* Stats row */}
              <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-3 text-xs gap-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">งบที่ได้รับ</span>
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(dept.allocatedBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ใช้ไปแล้ว + จอง</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(usedTotal)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">คงเหลือจริง</span>
                  <span className="font-black text-emerald-600">
                    {formatCurrency(dept.available)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
