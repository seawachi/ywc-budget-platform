"use client";

import React, { useState } from "react";
import { ClaimWithRelations } from "@/types/receipt";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocTypeBadge, ClaimStatusBadge } from "@/components/claims/StatusBadge";
import { formatCurrency, formatDate, formatPromptPay } from "@/lib/utils";
import {
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Calendar,
  Building,
  User,
  ExternalLink,
  Scale,
  QrCode,
  Image as ImageIcon,
} from "lucide-react";

interface SplitReviewDialogProps {
  claim: ClaimWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (claimId: string) => void;
  onReject: (claimId: string, reason: string) => void;
}

export function SplitReviewDialog({
  claim,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: SplitReviewDialogProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState<"image" | "details">("details");

  if (!claim) return null;

  const handleApprove = () => {
    onApprove(claim.id);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert("กรุณากรอกเหตุผลการตีกลับเอกสารเพื่อให้สต๊าฟแก้ไข");
      return;
    }
    onReject(claim.id, rejectReason);
    setIsRejecting(false);
    setRejectReason("");
  };

  const claimedItems = claim.items?.filter((it) => it.isClaimed) || [];
  const excludedItems = claim.items?.filter((it) => !it.isClaimed) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl w-[96vw] p-0 h-[92vh] max-h-[820px] bg-slate-900 border-none shadow-2xl rounded-3xl flex flex-col overflow-hidden"
        onClose={() => onOpenChange(false)}
      >
        {/* Top Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 text-white shrink-0 pr-14 sm:pr-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              <span>ตรวจบิลและเทียบต้นฉบับ</span>
            </h2>
            <ClaimStatusBadge status={claim.status} />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden xs:inline">เลขที่บิล:</span>
            <span className="font-mono text-slate-200 text-[11px] sm:text-xs bg-slate-800 px-2 py-0.5 rounded-lg">
              {claim.id}
            </span>
          </div>
        </div>

        {/* Mobile / Tablet View Switcher (< lg) */}
        <div className="lg:hidden flex items-center bg-slate-800 p-1 rounded-xl text-xs shrink-0 mx-3 sm:mx-4 mb-2">
          <button
            type="button"
            onClick={() => setActiveMobileTab("image")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMobileTab === "image"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>รูปใบเสร็จต้นฉบับ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("details")}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMobileTab === "details"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>รายการสินค้า & อนุมัติ</span>
          </button>
        </div>

        {/* Split Screen Layout Container */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-slate-100 overflow-hidden">
          {/* LEFT PANE: Original Receipt with Zoom */}
          <div
            className={`${
              activeMobileTab === "image" ? "flex" : "hidden"
            } lg:flex lg:w-1/2 bg-slate-950 p-3 sm:p-4 flex-col justify-between min-h-0 h-full relative select-none`}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-2 shrink-0 z-10">
              <div className="flex items-center gap-2">
                <DocTypeBadge docType={claim.docType} />
                <span className="text-xs text-slate-400 font-mono">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.2).toFixed(1))))}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                  title="ซูมออก"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition cursor-pointer"
                  title="ขนาดเริ่มต้น 100%"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.2).toFixed(1))))}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                  title="ซูมเข้า"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <a
                  href={claim.receiptImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  title="เปิดดูรูปเต็มหน้าจอในแท็บใหม่"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Receipt Image Display Area */}
            <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-2 rounded-2xl bg-slate-900/60 shadow-inner">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="max-h-full max-w-full flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={claim.receiptImageUrl}
                  alt="Original receipt"
                  className="max-h-[55vh] max-w-full w-auto object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>

            {/* Bottom OCR Summary */}
            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
              <span>ยอดท้ายบิลกระดาษ (OCR):</span>
              <span className="font-mono font-bold text-amber-400 text-xs">
                {formatCurrency(claim.receiptTotal || claim.amount)}
              </span>
            </div>
          </div>

          {/* RIGHT PANE: Line Items & Decision */}
          <div
            className={`${
              activeMobileTab === "details" ? "flex" : "hidden"
            } lg:flex lg:w-1/2 bg-white flex-col min-h-0 h-full border-t lg:border-t-0 lg:border-l border-slate-200`}
          >
            {/* Scrollable middle body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Claim Title & Dept Info */}
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                  <Building className="w-3.5 h-3.5" />
                  {claim.department?.name}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {claim.title}
                </h3>
                {claim.merchantName && (
                  <p className="text-xs text-slate-400">
                    ร้านค้า: <span className="font-semibold text-slate-700">{claim.merchantName}</span>
                  </p>
                )}
              </div>

              {/* Submitter & PromptPay Info */}
              <div className="grid grid-cols-2 gap-2.5 p-3 sm:p-3.5 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3" /> ผู้ขอเบิก (Staff)
                  </span>
                  <span className="font-bold text-slate-800 block truncate">
                    {claim.submitter?.name || "สมชาย หมายมั่น"}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Smartphone className="w-3 h-3" /> เบอร์พร้อมเพย์รับเงิน
                  </span>
                  <span className="font-mono font-black text-emerald-700 block text-xs sm:text-sm">
                    {formatPromptPay(claim.promptpayId)}
                  </span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">
                  รายการสินค้าที่สต๊าฟขอเบิก ({claimedItems.length} รายการ):
                </span>

                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs min-w-[320px]">
                    <thead className="text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-100/70 border-b border-slate-200/60">
                      <tr>
                        <th className="p-2 sm:p-2.5">รายการ</th>
                        <th className="p-2 sm:p-2.5 text-center w-14">จำนวน</th>
                        <th className="p-2 sm:p-2.5 text-right w-20">ราคา</th>
                        <th className="p-2 sm:p-2.5 text-right w-24">รวมเงิน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {claimedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white transition">
                          <td className="p-2 sm:p-2.5 font-medium text-slate-800">
                            <span className="block line-clamp-2">{item.name}</span>
                            {/ภาษีมูลค่าเพิ่ม|vat/i.test(item.name) && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 rounded">
                                VAT 7%
                              </span>
                            )}
                          </td>
                          <td className="p-2 sm:p-2.5 text-center text-slate-500 font-mono">
                            {item.quantity}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right text-slate-500 font-mono">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-black text-slate-900 font-mono">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Excluded personal items note */}
                {excludedItems.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-xs text-red-700 space-y-1 border border-red-100">
                    <span className="font-bold flex items-center gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      มีรายการของส่วนตัวที่สต๊าฟตัดออก ({excludedItems.length} รายการ):
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-red-600 pl-1 space-y-0.5">
                      {excludedItems.map((ex, i) => (
                        <li key={i} className="truncate">
                          {ex.name} ({formatCurrency(ex.totalPrice)})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Total Claim Amount Summary */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-between border border-blue-100">
                <div>
                  <span className="text-xs font-bold block uppercase tracking-wider">
                    ยอดเงินสุทธิที่อนุมัติให้โอน:
                  </span>
                  <span className="text-[10px] text-blue-600">
                    * คิดเฉพาะรายการที่เกี่ยวข้องกับค่าย
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
                  {formatCurrency(claim.amount)}
                </span>
              </div>

              {/* Rejection Note if existing */}
              {claim.rejectReason && (
                <div className="p-3 bg-red-50 rounded-xl text-xs text-red-800 border border-red-200">
                  <span className="font-bold block">เหตุผลการตีกลับ:</span>
                  <span>{claim.rejectReason}</span>
                </div>
              )}
            </div>

            {/* Sticky Bottom Action Area */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-10">
              {isRejecting ? (
                <div className="space-y-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
                  <label className="text-xs font-bold text-red-900 block">
                    ระบุเหตุผลในการตีกลับเอกสาร (Reject Reason):
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="เช่น แนบมาเฉพาะสลิปโอนเงิน รบกวนถ่ายรูปใบเสร็จร้านค้าแนบมาใหม่ครับ"
                    className="w-full text-xs p-2.5 rounded-lg bg-white border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsRejecting(false)}
                      className="text-xs h-8 cursor-pointer"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleConfirmReject}
                      className="text-xs font-bold h-8 shadow-sm cursor-pointer"
                    >
                      ยืนยันตีกลับบิล
                    </Button>
                  </div>
                </div>
              ) : claim.status === "PENDING" ? (
                <div className="flex items-center justify-end gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRejecting(true)}
                    className="text-red-600 hover:bg-red-50 text-xs font-bold gap-1.5 h-10 px-3 sm:px-4 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>ตีกลับบิล (Reject)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    onClick={handleApprove}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-10 px-4 sm:px-5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>อนุมัติ & เปิด PromptPay QR</span>
                  </Button>
                </div>
              ) : claim.status === "APPROVED" ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="success"
                    onClick={handleApprove}
                    className="font-bold text-xs gap-1.5 h-10 px-5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>สแกน QR โอนเงิน PromptPay ทันที</span>
                  </Button>
                </div>
              ) : (
                <div className="text-right text-xs text-slate-400 font-medium">
                  บิลนี้ได้รับการดำเนินการแล้ว ({claim.status})
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
