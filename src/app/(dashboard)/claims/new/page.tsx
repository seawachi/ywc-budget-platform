"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReceiptDropzone } from "@/components/claims/ReceiptDropzone";
import { EditableReceiptItems } from "@/components/claims/EditableReceiptItems";
import { ClaimMetadataForm } from "@/components/claims/ClaimMetadataForm";
import { Button } from "@/components/ui/button";
import { createClaimWithItems } from "@/actions/claim.actions";
import { ClaimItemDTO, DocType } from "@/types/receipt";
import {
  Sparkles,
  ArrowLeft,
  Send,
  AlertCircle,
  Receipt,
  FileCheck,
  Camera,
  CheckCircle2,
  X,
} from "lucide-react";

const initialDepartments = [
  { id: "dept-welfare", name: "ฝ่ายสวัสดิการ", color: "#10B981", allocatedBudget: 20000 },
  { id: "dept-logistics", name: "ฝ่ายพัสดุและสถานที่", color: "#3B82F6", allocatedBudget: 15000 },
  { id: "dept-activities", name: "ฝ่ายกิจกรรมและสันทนาการ", color: "#F59E0B", allocatedBudget: 10000 },
  { id: "dept-medical", name: "ฝ่ายพยาบาลและประสานงาน", color: "#EC4899", allocatedBudget: 5000 },
];

export default function NewClaimPage() {
  const router = useRouter();

  // Step 1: Upload state
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [remoteReceiptUrl, setRemoteReceiptUrl] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [showUploadPad, setShowUploadPad] = useState(false);

  // Step 2 & 3: Extracted data & line items
  const [title, setTitle] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [departmentId, setDepartmentId] = useState(initialDepartments[0].id);
  const [docType, setDocType] = useState<DocType>("TAX_INVOICE");
  const [promptpayId, setPromptpayId] = useState("0812345678");
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [items, setItems] = useState<ClaimItemDTO[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageSelected = async (
    base64OrUrl: string,
    fileName: string,
    isSample: boolean = false
  ) => {
    setReceiptImage(base64OrUrl);
    setIsScanning(true);
    setErrorMsg("");

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

      setTitle(data.title || "รายการเบิกจ่ายงบค่าย");
      setMerchantName(data.merchantName || "");
      setDocType(data.docType || "TAX_INVOICE");
      setReceiptTotal(data.receiptTotal || 0);
      if (data.expenseDate) setExpenseDate(data.expenseDate);

      if (data.fallbackNotice) {
        setErrorMsg(`⚠️ แจ้งเตือน: ${data.fallbackNotice}`);
      }

      // Populate items
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
      setShowUploadPad(false); // Auto-hide upload pad once scan is done!
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("AI OCR error:", err);
      if (err.name === "AbortError") {
        setErrorMsg(
          "การสแกนด้วย AI ใช้เวลานานเกินกำหนด (Timeout 35s) — สาเหตุ: Google Gemini API หรือเครือข่ายใช้เวลาตอบสนองนานเกินไป (อาจเกิดจากขนาดภาพใหญ่ หรือคีย์โควต้าเต็ม) กรุณากรอกรายการด้วยตนเอง หรือลองใหม่อีกครั้ง"
        );
      } else {
        setErrorMsg(
          `ไม่สามารถสแกนบิลด้วย AI ได้ — สาเหตุ: ${err.message || "เกิดข้อผิดพลาดในการประมวลผล"} กรุณากรอกรายการด้วยตนเอง`
        );
      }
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
        router.push("/?claimSuccess=true");
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับหน้า Dashboard</span>
        </Link>
        <span className="text-xs text-slate-400 font-medium">
          แบบฟอร์มขอเบิกเงินงบค่าย (Staff Claim Form)
        </span>
      </div>

      {/* Main Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-blue-600" />
          ส่งบิลขอเบิกเงิน (New Reimbursement Claim)
        </h1>
        <p className="text-xs text-slate-400">
          อัปโหลดรูปบิล หรือใช้บิลตัวอย่าง AI จะแยกรายการให้คุณตรวจสอบและติ๊กของส่วนตัวออกก่อนส่ง
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Upload Receipt */}
        <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-sm">
                1
              </span>
              แนบรูปใบเสร็จ / สลิปโอนเงิน (Receipt Upload & AI Scan)
            </h2>
            <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Gemini 2.5 Flash OCR
            </span>
          </div>

          {/* If scan is done and user hasn't clicked upload again: Hide upload pad & show compact summary bar */}
          {items.length > 0 && receiptImage && !showUploadPad ? (
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center p-1 shadow-xs">
                  <img
                    src={receiptImage}
                    alt="Receipt thumbnail"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>
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
              {items.length > 0 && (
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
        </div>

        {/* Step 2: Line Items */}
        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                ตรวจสอบและแก้ไขรายการสินค้า (Editable Line Items)
              </h2>
            </div>

            <EditableReceiptItems
              items={items}
              receiptTotal={receiptTotal}
              onItemsChange={setItems}
            />
          </div>
        )}

        {/* Step 3: Metadata Form */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              3
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              รายละเอียดการขอเบิกและบัญชีรับเงินโอน
            </h2>
          </div>

          <ClaimMetadataForm
            title={title}
            setTitle={setTitle}
            merchantName={merchantName}
            setMerchantName={setMerchantName}
            departmentId={departmentId}
            setDepartmentId={setDepartmentId}
            departments={initialDepartments}
            docType={docType}
            setDocType={setDocType}
            expenseDate={expenseDate}
            setExpenseDate={setExpenseDate}
            promptpayId={promptpayId}
            setPromptpayId={setPromptpayId}
          />
        </div>

        {/* Bottom Submit Bar */}
        <div className="rounded-3xl bg-blue-50/90 p-6 shadow-md shadow-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-900/80 block uppercase tracking-wider">
              ยอดขอเบิกเงินสุทธิที่รอเข้าคิวอนุมัติ:
            </span>
            <span className="text-3xl font-black text-blue-700 tracking-tight">
              {claimableAmount.toLocaleString()} ฿
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto text-xs shadow-sm hover:shadow"
              >
                ยกเลิก
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-7 shadow-lg shadow-blue-600/25 gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "กำลังส่งข้อมูล..." : "ยืนยันส่งเบิกเงิน (Submit Claim)"}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
