"use client";

import React, { useState } from "react";
import { ClaimWithRelations, DepartmentBudgetSummary } from "@/types/receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatPromptPay } from "@/lib/utils";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Layers,
  PieChart,
  Filter,
  Check,
  FileText,
} from "lucide-react";

interface TreasuryExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName?: string;
  claims: ClaimWithRelations[];
  departments?: DepartmentBudgetSummary[];
}

type ExportType = "CLAIMS_SUMMARY" | "DETAILED_ITEMS" | "DEPARTMENTS_BUDGET";
type StatusFilterType = "ALL" | "PAID_ONLY" | "PENDING_APPROVED";

export function TreasuryExportDialog({
  open,
  onOpenChange,
  workspaceName = "Camp-Budget",
  claims,
  departments = [],
}: TreasuryExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>("CLAIMS_SUMMARY");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [successNotif, setSuccessNotif] = useState(false);

  // Filter claims based on selection
  const filteredClaims = claims.filter((c) => {
    if (statusFilter === "PAID_ONLY") return c.status === "PAID";
    if (statusFilter === "PENDING_APPROVED") return c.status === "PENDING" || c.status === "APPROVED";
    return true;
  });

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleDownload = () => {
    setIsExporting(true);
    const dateStr = new Date().toISOString().split("T")[0];
    const cleanWsName = workspaceName.replace(/[/\\?%*:|"<>]/g, "-").trim();

    let csvContent = "";
    let fileName = "";

    if (exportType === "CLAIMS_SUMMARY") {
      fileName = `${cleanWsName}-สรุปบิลเบิกจ่าย-${dateStr}.csv`;
      const headers = [
        "รหัสอ้างอิง",
        "วันที่บันทึก",
        "วันที่ในใบเสร็จ",
        "หัวข้อรายการเบิก",
        "ร้านค้า/ผู้รับเงิน",
        "ฝ่าย/แผนก",
        "ผู้ขอเบิก",
        "อีเมลผู้ขอเบิก",
        "หมายเลขพร้อมเพย์",
        "ประเภทเอกสาร",
        "จำนวนรายการสินค้า",
        "ยอดรวมตามใบเสร็จ (บาท)",
        "ภาษีมูลค่าเพิ่ม VAT 7% (บาท)",
        "ยอดเงินขอเบิกสุทธิ (บาท)",
        "สถานะ",
        "วันที่อนุมัติ",
        "วันที่จ่ายเงิน",
        "สรุปรายการสินค้า",
      ];

      const rows = filteredClaims.map((c) => {
        const itemsSummary = (c.items || [])
          .map((it) => `${it.name} (x${it.quantity} = ฿${Number(it.totalPrice || 0).toLocaleString()})`)
          .join(" | ");

        const vatItem = (c.items || []).find((it) => /ภาษี|vat/i.test(it.name));
        const vatVal = vatItem ? Number(vatItem.totalPrice || 0) : 0;

        const statusMap: Record<string, string> = {
          PENDING: "รอเหรัญญิกตรวจสอบ",
          APPROVED: "อนุมัติแล้ว (รอโอนเงิน)",
          PAID: "จ่ายเงินแล้ว",
          REJECTED: "ตีกลับ / ปฏิเสธ",
        };

        const docTypeMap: Record<string, string> = {
          TAX_INVOICE: "ใบกำกับภาษี (Tax Invoice)",
          CASH_RECEIPT: "บิลเงินสด / ใบเสร็จรับเงิน",
          BANK_SLIP: "สลิปโอนเงินธนาคาร",
          OTHER: "เอกสารอื่นๆ",
        };

        const isApprovedOrPaid = c.status === "APPROVED" || c.status === "PAID";
        const approvedDateStr = isApprovedOrPaid && c.updatedAt
          ? new Date(c.updatedAt).toLocaleDateString("th-TH")
          : "-";

        return [
          escapeCsv(c.id),
          escapeCsv(c.createdAt ? new Date(c.createdAt).toLocaleDateString("th-TH") : ""),
          escapeCsv(c.expenseDate ? new Date(c.expenseDate).toLocaleDateString("th-TH") : ""),
          escapeCsv(c.title),
          escapeCsv(c.merchantName || "-"),
          escapeCsv(c.department?.name || "-"),
          escapeCsv(c.submitter?.name || "-"),
          escapeCsv(c.submitter?.email || "-"),
          escapeCsv(c.promptpayId ? `'${c.promptpayId}` : "-"),
          escapeCsv(docTypeMap[c.docType] || c.docType),
          escapeCsv(c.items?.length || 0),
          escapeCsv(c.receiptTotal ? Number(c.receiptTotal).toFixed(2) : Number(c.amount).toFixed(2)),
          escapeCsv(vatVal > 0 ? vatVal.toFixed(2) : "0.00"),
          escapeCsv(Number(c.amount).toFixed(2)),
          escapeCsv(statusMap[c.status] || c.status),
          escapeCsv(approvedDateStr),
          escapeCsv(c.paidAt ? new Date(c.paidAt).toLocaleDateString("th-TH") : "-"),
          escapeCsv(itemsSummary),
        ].join(",");
      });

      csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
    } else if (exportType === "DETAILED_ITEMS") {
      fileName = `${cleanWsName}-รายการสินค้าอย่างละเอียด-${dateStr}.csv`;
      const headers = [
        "รหัสบิล",
        "วันที่บิล",
        "หัวข้อบิล",
        "ร้านค้า",
        "ฝ่าย/แผนก",
        "ผู้ขอเบิก",
        "ลำดับ",
        "ชื่อสินค้า/บริการ",
        "จำนวน",
        "ราคาต่อหน่วย (บาท)",
        "ราคารวม (บาท)",
        "ประเภทรายการ",
        "สถานะบิล",
      ];

      const rows: string[] = [];
      filteredClaims.forEach((c) => {
        (c.items || []).forEach((it, idx) => {
          rows.push(
            [
              escapeCsv(c.id),
              escapeCsv(c.expenseDate ? new Date(c.expenseDate).toLocaleDateString("th-TH") : ""),
              escapeCsv(c.title),
              escapeCsv(c.merchantName || "-"),
              escapeCsv(c.department?.name || "-"),
              escapeCsv(c.submitter?.name || "-"),
              escapeCsv(idx + 1),
              escapeCsv(it.name),
              escapeCsv(it.quantity || 1),
              escapeCsv(Number(it.unitPrice || 0).toFixed(2)),
              escapeCsv(Number(it.totalPrice || 0).toFixed(2)),
              escapeCsv(it.isClaimed ? "เบิกเงินค่าย" : "ของส่วนตัว (ไม่เบิก)"),
              escapeCsv(c.status),
            ].join(",")
          );
        });
      });

      csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
    } else if (exportType === "DEPARTMENTS_BUDGET") {
      fileName = `${cleanWsName}-สรุปงบประมาณแยกฝ่าย-${dateStr}.csv`;
      const headers = [
        "ชื่อฝ่าย/แผนก (Department)",
        "งบประมาณที่จัดสรร (บาท)",
        "เบิกจ่ายจริงแล้ว (บาท)",
        "รอตรวจสอบ/รอโอน (บาท)",
        "งบประมาณคงเหลือ (บาท)",
        "สัดส่วนการใช้งบ (%)",
      ];

      const rows = departments.map((d) => {
        const pct =
          d.usagePercent !== undefined
            ? `${d.usagePercent.toFixed(1)}%`
            : d.allocatedBudget > 0
            ? `${((d.spent / d.allocatedBudget) * 100).toFixed(1)}%`
            : "0.0%";
        return [
          escapeCsv(d.name),
          escapeCsv(Number(d.allocatedBudget).toFixed(2)),
          escapeCsv(Number(d.spent).toFixed(2)),
          escapeCsv(Number(d.reserved).toFixed(2)),
          escapeCsv(Number(d.available).toFixed(2)),
          escapeCsv(pct),
        ].join(",");
      });

      csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
    }

    // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens Thai characters flawlessly
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setSuccessNotif(true);
    setTimeout(() => {
      setSuccessNotif(false);
      onOpenChange(false);
    }, 1200);
  };

  const paidCount = claims.filter((c) => c.status === "PAID").length;
  const pendingCount = claims.filter((c) => c.status === "PENDING" || c.status === "APPROVED").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl" onClose={() => onOpenChange(false)}>
        <DialogHeader className="text-left pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-slate-900">
                ส่งออกข้อมูลสู่ Excel & Google Sheets
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                ดาวน์โหลดไฟล์ .csv ที่รองรับภาษาไทย 100% สำหรับเหรัญญิก
              </p>
            </div>
          </div>
        </DialogHeader>

        {successNotif && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200 mt-3 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">ดาวน์โหลดไฟล์เรียบร้อยแล้ว! สามารถเปิดใน Excel หรือ Google Sheets ได้ทันที</span>
          </div>
        )}

        <div className="space-y-4 pt-3">
          {/* Report Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              1. เลือกรูปแบบรายงานที่ต้องการส่งออก
            </label>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: "CLAIMS_SUMMARY" as ExportType,
                  title: "รายงานสรุปบิลเบิกจ่าย (Claims Summary)",
                  desc: `สรุปภาพรวมทุกบิล วันที่ ร้านค้า ผู้ขอเบิก ยอดเงิน พร้อมเพย์ และสถานะ (${filteredClaims.length} รายการ)`,
                  icon: FileSpreadsheet,
                  color: "text-emerald-600 bg-emerald-50",
                },
                {
                  id: "DETAILED_ITEMS" as ExportType,
                  title: "รายการสินค้าและบิลแยกชิ้นอย่างละเอียด (Detailed Line Items)",
                  desc: "แตกทุกรายการสินค้าในใบเสร็จแต่ละใบ จำนวน ราคาต่อหน่วย และการแยกของส่วนตัว",
                  icon: Layers,
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  id: "DEPARTMENTS_BUDGET" as ExportType,
                  title: "สรุปงบประมาณแยกตามฝ่าย (Department Budget)",
                  desc: `งบจัดสรร ยอดเบิกจ่ายแล้ว ยอดรออนุมัติ และงบคงเหลือของทุกฝ่าย (${departments.length} ฝ่าย)`,
                  icon: PieChart,
                  color: "text-purple-600 bg-purple-50",
                },
              ].map((t) => {
                const isSelected = exportType === t.id;
                const IconComponent = t.icon;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setExportType(t.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${t.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 block">{t.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter (Only applicable for claims reports) */}
          {exportType !== "DEPARTMENTS_BUDGET" && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>2. กรองสถานะรายการที่ต้องการส่งออก</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "ALL" as StatusFilterType, label: "ทั้งหมด", count: claims.length },
                  { id: "PAID_ONLY" as StatusFilterType, label: "เฉพาะที่จ่ายแล้ว", count: paidCount },
                  { id: "PENDING_APPROVED" as StatusFilterType, label: "รอตรวจ / รอโอน", count: pendingCount },
                ].map((f) => {
                  const isSelected = statusFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <span className="block">{f.label}</span>
                      <span className="text-[10px] opacity-80 font-normal">({f.count} รายการ)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Format Note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">💡 ข้อแนะนำสำหรับการเปิดไฟล์:</span>
            <ul className="list-disc list-inside space-y-0.5">
              <li>ไฟล์ถูกสร้างในรูปแบบ <strong>CSV (UTF-8 with BOM)</strong> รองรับภาษาไทยใน Microsoft Excel ได้โดยตรงโดยตัวอักษรไม่เพี้ยน</li>
              <li>สามารถนำเข้า Google Sheets ได้ผ่านเมนู <em>File → Import (ไฟล์ → นำเข้า)</em></li>
            </ul>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl text-xs cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์ Excel / Sheets (.csv)</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
