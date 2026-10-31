"use client";

import React, { useState } from "react";
import { ClaimWithRelations } from "@/types/receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPromptPay } from "@/lib/utils";
import { generatePromptPayPayload } from "@/lib/promptpay";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Smartphone,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";

interface PromptPayPayoutDialogProps {
  claim: ClaimWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkPaid: (claimId: string, slipUrl?: string) => void;
}

export function PromptPayPayoutDialog({
  claim,
  open,
  onOpenChange,
  onMarkPaid,
}: PromptPayPayoutDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!claim) return null;

  const targetNumber = claim.promptpayId || "0812345678";
  const amount = claim.amount;
  const qrPayload = generatePromptPayPayload(targetNumber, amount);

  const handleCopy = () => {
    navigator.clipboard.writeText(targetNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPaid = () => {
    setIsSubmitting(true);
    onMarkPaid(claim.id, "/sample-receipts/kplus-slip.svg");
    setTimeout(() => {
      setIsSubmitting(false);
      onOpenChange(false);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-[94vw] p-5 sm:p-7 text-center rounded-3xl border-none shadow-2xl max-h-[90vh] overflow-y-auto"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader className="items-center text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 mx-auto shadow-sm">
            <Smartphone className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900">
            โอนเงินคืนผู้เบิกผ่าน PromptPay
          </DialogTitle>
          <p className="text-xs text-slate-400">
            สแกนด้วยแอปพลิเคชันธนาคารทุกธนาคาร (ยอดเงินล็อกอัตโนมัติ)
          </p>
        </DialogHeader>

        {/* PromptPay Card Container */}
        <div className="my-3 p-6 rounded-3xl bg-gradient-to-b from-blue-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-blue-800/40 mb-4">
            <span className="text-[11px] font-bold tracking-widest text-blue-200 uppercase">
              PROMPTPAY QR
            </span>
            <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              EMVCo Verified
            </span>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
            <QRCodeSVG
              value={qrPayload}
              size={190}
              level="M"
              includeMargin={false}
              className="mx-auto"
            />
          </div>

          {/* Amount Badge */}
          <div className="mt-4 pt-3 border-t border-blue-800/40">
            <span className="text-xs text-blue-200/80 block">ยอดเงินโอนคืนที่ล็อกไว้</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(amount)}
            </span>
          </div>

          {/* Submitter Name & PromptPay ID */}
          <div className="mt-2.5 flex items-center justify-center gap-2 text-xs text-blue-200 bg-blue-950/70 py-1.5 px-3.5 rounded-xl mx-auto w-fit shadow-inner">
            <span>{formatPromptPay(targetNumber)}</span>
            <button
              onClick={handleCopy}
              className="p-1 hover:text-white transition"
              title="คัดลอกเบอร์"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="block text-[11px] text-blue-300/80 mt-1.5">
            ผู้รับ: {claim.submitter?.name || "สมชาย หมายมั่น"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mt-4">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmPaid}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ยืนยันการโอนเงินสำเร็จ (Mark as Paid)</span>
          </Button>

          <p className="text-[11px] text-slate-400">
            * ในโหมดสัมภาษณ์ กดปุ่มเพื่อบันทึกสถานะ <span className="text-emerald-600 font-bold">PAID</span> และตัดงบประมาณทันที
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
