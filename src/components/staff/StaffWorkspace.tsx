"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ClaimWithRelations, ClaimItemDTO, DocType } from "@/types/receipt";
import { ReceiptDropzone } from "@/components/claims/ReceiptDropzone";
import { EditableReceiptItems } from "@/components/claims/EditableReceiptItems";
import { ClaimMetadataForm } from "@/components/claims/ClaimMetadataForm";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { ClaimStatusBadge, DocTypeBadge } from "@/components/claims/StatusBadge";
import { createClaimWithItems } from "@/actions/claim.actions";
import { formatCurrency, formatDate, formatPromptPay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  UploadCloud,
  History,
  Send,
  AlertCircle,
  CheckCircle2,
  Receipt,
  User,
  Sparkles,
  Search,
  ChevronRight,
  ExternalLink,
  Calendar,
  Building,
  Smartphone,
  AlertTriangle,
  X,
  Camera,
  Edit3,
} from "lucide-react";

interface StaffWorkspaceProps {
  user: {
    id: string;
    name: string;
    email: string;
    promptpayId?: string | null;
  };
  claims: ClaimWithRelations[];
  departments: Array<{
    id: string;
    name: string;
    color: string;
    allocatedBudget: number;
  }>;
}

export function StaffWorkspace({ user, claims, departments }: StaffWorkspaceProps) {
  const router = useRouter();

  // Upload & Scan states
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [remoteReceiptUrl, setRemoteReceiptUrl] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [showUploadPad, setShowUploadPad] = useState(false);

  // Form states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(user.name);
  const [title, setTitle] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "");
  const [docType, setDocType] = useState<DocType>("TAX_INVOICE");
  const [promptpayId, setPromptpayId] = useState(user.promptpayId || "0812345678");
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [items, setItems] = useState<ClaimItemDTO[]>([]);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successBanner, setSuccessBanner] = useState(false);

  // History search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Click to view modal state
  const [viewingClaim, setViewingClaim] = useState<ClaimWithRelations | null>(null);

  // Filter claims belonging to this staff
  const myClaims = claims.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchMerchant = c.merchantName?.toLowerCase().includes(q);
      if (!matchTitle && !matchMerchant) return false;
    }
    return true;
  });

  const handleImageSelected = async (
    base64OrUrl: string,
    fileName: string,
    isSample: boolean = false
  ) => {
    setReceiptImage(base64OrUrl);
    setIsScanning(true);
    setErrorMsg("");
    setSuccessBanner(false);

    // Strict 35-second timeout limit for AI extraction
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64OrUrl,
          sampleType: isSample ? fileName : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.details || errorData?.error || `HTTP ${res.status}: การประมวลผล OCR ล้มเหลว`
        );
      }

      const data = await res.json();

      setTitle(data.title || "รายการเบิกเงินค่าย");
      setMerchantName(data.merchantName || "");
      setDocType(data.docType || "TAX_INVOICE");
      setReceiptTotal(data.receiptTotal || 0);
      if (data.expenseDate) setExpenseDate(data.expenseDate);

      if (data.fallbackNotice) {
        setErrorMsg(`⚠️ แจ้งเตือน: ${data.fallbackNotice}`);
      }

      if (data.items && data.items.length > 0) {
        setItems(
          data.items.map((it: any, idx: number) => ({
            id: `item-${idx}`,
            name: it.name,
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 0,
            totalPrice: it.totalPrice || it.quantity * it.unitPrice,
            isClaimed: it.isClaimed !== undefined ? it.isClaimed : true,
          }))
        );
      }
      setHasScanned(true);
      setShowUploadPad(false); // Hide upload pad once scan is done!
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("OCR Error details:", err);
      if (err.name === "AbortError") {
        setErrorMsg(
          "การสแกนด้วย AI ใช้เวลานานเกินกำหนด (Timeout 35s) — สาเหตุ: Google Gemini API หรือเครือข่ายใช้เวลาตอบสนองนานเกินไป (อาจเกิดจากขนาดภาพใหญ่ หรือคีย์โควต้าเต็ม) กรุณากรอกรายการด้วยตนเอง หรือลองใหม่อีกครั้ง"
        );
      } else {
        setErrorMsg(
          `ไม่สามารถสแกนบิลด้วย AI ได้ — สาเหตุ: ${err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ"} กรุณากรอกรายการด้วยตนเอง`
        );
      }
      setHasScanned(true);
      setShowUploadPad(true); // Keep upload pad open on error
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("กรุณากรอกหัวข้อการขอเบิกเงิน");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    const claimableTotal = items
      .filter((it) => it.isClaimed)
      .reduce((acc, it) => acc + (it.totalPrice || 0), 0);

    if (claimableTotal <= 0) {
      setErrorMsg("ยอดเงินที่ขอเบิกต้องมากกว่า 0 บาท (คุณติ๊กรายการออกทั้งหมด)");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createClaimWithItems({
        title,
        departmentId,
        amount: claimableTotal,
        receiptTotal: receiptTotal || claimableTotal,
        receiptImageUrl: remoteReceiptUrl || (receiptImage.startsWith("http") ? receiptImage : "/sample-receipts/makro-mixed-bill.svg"),
        docType,
        promptpayId,
        items,
      });

      if (res.success) {
        setSuccessBanner(true);
        // Reset form
        setReceiptImage("");
        setRemoteReceiptUrl("");
        setHasScanned(false);
        setShowUploadPad(false);
        setTitle("");
        setMerchantName("");
        setItems([]);
        setReceiptTotal(0);
        router.refresh();
      } else {
        setErrorMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimableAmount = items
    .filter((it) => it.isClaimed)
    .reduce((acc, it) => acc + (it.totalPrice || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Staff Header Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-4 sm:p-7 text-white shadow-xl shadow-blue-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-md">
            <User className="w-3.5 h-3.5 text-blue-200" />
            <span>Staff Portal • ผู้เบิกเงิน</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            ส่งบิลเบิกเงินและบันทึกค่าใช้จ่าย
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80">
            ยินดีต้อนรับคุณ {currentUserName} • อัปโหลดใบเสร็จเพื่อเริ่มสแกนด้วย AI ได้ทันที
          </p>
        </div>

        <button
          type="button"
          onClick={() => setProfileModalOpen(true)}
          title="คลิกเพื่อแก้ไขโปรไฟล์หรือหมายเลขพร้อมเพย์"
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center gap-2.5 text-xs self-start sm:self-auto shadow-sm cursor-pointer transition border border-white/10 hover:border-white/25 active:scale-95 group text-left"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div>
            <span className="text-blue-200 block text-[10px] flex items-center gap-1">
              <span>พร้อมเพย์รับเงินคืน</span>
              <Edit3 className="w-2.5 h-2.5 text-blue-200 opacity-60 group-hover:opacity-100 transition" />
            </span>
            <span className="font-mono font-bold text-white text-xs">
              {formatPromptPay(promptpayId || user.promptpayId || "0812345678")}
            </span>
          </div>
        </button>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ส่งบิลเบิกเงินเรียบร้อยแล้ว! รายการของคุณเข้าสู่คิวรอเหรัญญิกตรวจสอบ</span>
          </div>
          <button
            onClick={() => setSuccessBanner(false)}
            className="text-emerald-600 hover:underline text-xs font-bold"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Immediate Upload & AI Scanner Section */}
      <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-50">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              อัปโหลดใบเสร็จ (Upload & AI Scan)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              ถ่ายรูปบิลหรือเลือกบิลตัวอย่าง AI จะสกัดรายการสินค้าทันที
            </p>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0">
            <Sparkles className="w-3 h-3 text-blue-600" />
            AI Scanner
          </span>
        </div>

        {/* If scan is done and user hasn't clicked upload again: Hide upload pad & show compact summary bar */}
        {hasScanned && !showUploadPad ? (
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              {receiptImage && (
                <div className="w-12 h-14 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center p-1 shadow-xs">
                  <img
                    src={receiptImage}
                    alt="Receipt thumbnail"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {merchantName ? `สแกนบิลร้าน ${merchantName}` : "สแกนใบเสร็จเรียบร้อยแล้ว"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>AI สแกนเสร็จแล้ว</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ดึงรายการสินค้าแล้ว {items.length} รายการ • ยอดสุทธิ ฿{receiptTotal.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUploadPad(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>อัปโหลดบิลใหม่ / ถ่ายใหม่</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {hasScanned && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowUploadPad(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ซ่อนกล่องอัปโหลด (ใช้รูปเดิม)</span>
                </button>
              </div>
            )}
            <ReceiptDropzone
              onImageSelected={handleImageSelected}
              onRemoteUrlReady={setRemoteReceiptUrl}
              isLoading={isScanning}
            />
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-800 text-xs flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* When scanned: Unfold form & editable items right here */}
        {hasScanned && (
          <form onSubmit={handleSubmit} className="pt-2 sm:pt-3 space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            {/* Scanned Receipt Preview Banner */}
            {receiptImage && (
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                <div className="relative h-48 sm:h-56 w-full sm:w-52 rounded-2xl overflow-hidden shadow-md bg-white shrink-0 flex items-center justify-center p-2 border border-slate-200/60">
                  <img
                    src={receiptImage}
                    alt="Scanned Bill"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex-1 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      รูปภาพใบเสร็จที่สแกน (Scanned Bill)
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      AI Extracted
                    </span>
                  </div>
                  <p className="text-slate-500">
                    ตรวจเช็กรายการและราคาเทียบกับรูปใบเสร็จจริงด้านซ้าย หากมีรายการของใช้ส่วนตัว ให้แตะนำเครื่องหมายถูกออก
                  </p>
                  <a
                    href={receiptImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs mt-1 bg-white px-3 py-1.5 rounded-xl shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดดูรูปใบเสร็จขนาดเต็ม (Full View)</span>
                  </a>
                </div>
              </div>
            )}

            {/* Editable Line Items (Mobile cards + Desktop table) */}
            {items.length > 0 && (
              <EditableReceiptItems
                items={items}
                receiptTotal={receiptTotal}
                onItemsChange={setItems}
              />
            )}

            {/* Metadata inputs */}
            <ClaimMetadataForm
              title={title}
              setTitle={setTitle}
              merchantName={merchantName}
              setMerchantName={setMerchantName}
              departmentId={departmentId}
              setDepartmentId={setDepartmentId}
              departments={departments}
              docType={docType}
              setDocType={setDocType}
              expenseDate={expenseDate}
              setExpenseDate={setExpenseDate}
              promptpayId={promptpayId}
              setPromptpayId={setPromptpayId}
            />

            {/* Submit Action Bar */}
            <div className="rounded-2xl bg-blue-50/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-baseline justify-between sm:block">
                <span className="text-[11px] sm:text-xs font-bold text-blue-900/80 block uppercase tracking-wider">
                  ยอดขอเบิกสุทธิที่จะส่งเข้าคิว:
                </span>
                <span className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                  {claimableAmount.toLocaleString()} ฿
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setHasScanned(false);
                    setReceiptImage("");
                    setItems([]);
                  }}
                  className="w-1/3 sm:w-auto text-xs shadow-sm hover:shadow"
                >
                  ล้างข้อมูล
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="flex-1 sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-5 sm:px-7 shadow-lg shadow-blue-600/25 gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "กำลังส่ง..." : "ยืนยันส่งเบิกเงิน"}</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Staff Claim History & Logs Section: Compact & Click-to-View */}
      <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-50">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              ประวัติการส่งบิล (My Claims History)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              แตะที่รายการเพื่อเปิดดูรูปบิลและรายการที่เบิก
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบิล, ร้านค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full sm:w-56 rounded-xl bg-slate-50 pl-9 pr-3 text-xs shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        {/* Status Filter Tabs (Horizontal scroll on phone) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: "ทั้งหมด", value: "ALL", count: claims.length },
            { label: "รอตรวจ", value: "PENDING", count: claims.filter((c) => c.status === "PENDING").length },
            { label: "อนุมัติแล้ว", value: "APPROVED", count: claims.filter((c) => c.status === "APPROVED").length },
            { label: "โอนแล้ว", value: "PAID", count: claims.filter((c) => c.status === "PAID").length },
            { label: "ตีกลับ", value: "REJECTED", count: claims.filter((c) => c.status === "REJECTED").length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                statusFilter === tab.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* COMPACT LIST: Clean, Touch-friendly, Click to View */}
        <div className="divide-y divide-slate-100">
          {myClaims.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              ไม่พบรายการขอเบิกเงินในหมวดหมู่นี้
            </div>
          ) : (
            myClaims.map((claim) => (
              <div
                key={claim.id}
                onClick={() => setViewingClaim(claim)}
                className="py-3 px-2.5 sm:px-3 rounded-2xl hover:bg-slate-50/90 active:bg-slate-100 transition-all cursor-pointer group flex items-center justify-between gap-3"
              >
                {/* Left: Title + Merchant + Date + DocType */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition truncate">
                      {claim.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    {claim.merchantName && (
                      <span className="truncate">ร้าน: {claim.merchantName}</span>
                    )}
                    <span>• {formatDate(claim.expenseDate)}</span>
                    <DocTypeBadge docType={claim.docType} />
                  </div>

                  {claim.status === "REJECTED" && claim.rejectReason && (
                    <div className="text-[10px] sm:text-[11px] text-red-600 font-medium mt-1 truncate">
                      เหตุผลตีกลับ: {claim.rejectReason}
                    </div>
                  )}
                </div>

                {/* Middle: Department badge (desktop) */}
                <div className="hidden sm:block shrink-0">
                  {claim.department && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: claim.department.color }}
                      />
                      {claim.department.name}
                    </span>
                  )}
                </div>

                {/* Right: Status + Amount + Chevron */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-black text-slate-900 text-xs sm:text-base">
                      {formatCurrency(claim.amount)}
                    </span>
                    <ClaimStatusBadge status={claim.status} />
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CLICK TO VIEW MODAL (Responsive for phones and desktop) */}
      {viewingClaim && (
        <Dialog open={!!viewingClaim} onOpenChange={(open) => !open && setViewingClaim(null)}>
          <DialogContent
            className="w-[94vw] max-w-2xl p-4 sm:p-6 bg-white rounded-3xl shadow-2xl border-none max-h-[88vh] overflow-y-auto space-y-3 sm:space-y-4"
            onClose={() => setViewingClaim(null)}
          >
            <DialogHeader className="pb-3 border-b border-slate-100 text-left">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {viewingClaim.department?.name}
                  </span>
                  <DocTypeBadge docType={viewingClaim.docType} />
                </div>
                <ClaimStatusBadge status={viewingClaim.status} />
              </div>
              <DialogTitle className="text-base sm:text-lg font-black text-slate-900 mt-2">
                {viewingClaim.title}
              </DialogTitle>
              {viewingClaim.merchantName && (
                <p className="text-xs text-slate-400 mt-0.5">
                  ร้านค้า: <span className="font-semibold text-slate-700">{viewingClaim.merchantName}</span>
                </p>
              )}
            </DialogHeader>

            {/* Rejection Note */}
            {viewingClaim.status === "REJECTED" && viewingClaim.rejectReason && (
              <div className="p-3 rounded-2xl bg-red-50 text-xs text-red-800 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  เหตุผลการตีกลับเพื่อแก้ไข:
                </span>
                <p className="pl-5 text-red-700">{viewingClaim.rejectReason}</p>
              </div>
            )}

            {/* Receipt Image Preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-600" />
                รูปใบเสร็จต้นฉบับ
              </span>
              <div className="bg-slate-50 rounded-2xl p-2 sm:p-3 flex items-center justify-center max-h-[260px] sm:max-h-[320px] overflow-hidden shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingClaim.receiptImageUrl}
                  alt="Receipt preview"
                  className="max-h-[240px] sm:max-h-[300px] w-auto object-contain rounded-xl shadow-md"
                />
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">
                รายการสินค้าที่ขอเบิก:
              </span>
              <div className="rounded-2xl bg-slate-50/70 p-2.5 sm:p-3 shadow-inner divide-y divide-slate-100 text-xs">
                {viewingClaim.items?.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className={`font-semibold block truncate ${!it.isClaimed ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {it.name}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400">
                        {it.quantity} x {formatCurrency(it.unitPrice)}
                        {!it.isClaimed && " (ของส่วนตัว)"}
                      </span>
                    </div>
                    <span className={`font-bold shrink-0 ${!it.isClaimed ? "line-through text-slate-400" : "text-slate-900"}`}>
                      {formatCurrency(it.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PromptPay & Total Footer */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] sm:text-[11px]">เบอร์พร้อมเพย์รับเงินโอน</span>
                <span className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">
                  {formatPromptPay(viewingClaim.promptpayId)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] sm:text-[11px]">ยอดขอเบิกสุทธิ</span>
                <span className="font-black text-blue-700 text-lg sm:text-xl">
                  {formatCurrency(viewingClaim.amount)}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* User Profile & PromptPay Update Modal */}
      <UserProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        user={{
          ...user,
          name: currentUserName,
          promptpayId,
        }}
        onUpdated={({ name: newName, promptpayId: newPromptPay }) => {
          setCurrentUserName(newName);
          setPromptpayId(newPromptPay);
        }}
      />
    </div>
  );
}
