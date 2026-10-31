"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/types/receipt";
import { updateUserProfile } from "@/actions/user.actions";
import { formatPromptPay } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Scale,
  ShieldCheck,
  CreditCard,
  QrCode,
} from "lucide-react";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    role?: Role;
    promptpayId?: string | null;
  };
  onUpdated?: (updated: { name: string; promptpayId: string }) => void;
}

export function UserProfileModal({
  open,
  onOpenChange,
  user,
  onUpdated,
}: UserProfileModalProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [promptpayId, setPromptpayId] = useState(user.promptpayId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (open) {
      setName(user.name || "");
      setPromptpayId(user.promptpayId || "");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [open, user]);

  const cleanDigits = promptpayId.replace(/[-\s]/g, "");
  const isValidLength = cleanDigits.length === 10 || cleanDigits.length === 13;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!cleanDigits) {
      setErrorMsg("กรุณาระบุหมายเลขพร้อมเพย์");
      return;
    }

    if (!isValidLength) {
      setErrorMsg("หมายเลขพร้อมเพย์ต้องเป็นเบอร์โทรศัพท์ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateUserProfile({
        name,
        promptpayId: cleanDigits,
      });

      if (res.success && res.user) {
        setSuccessMsg("อัปเดตข้อมูลและหมายเลขพร้อมเพย์เรียบร้อยแล้ว!");
        onUpdated?.({
          name: res.user.name,
          promptpayId: res.user.promptpayId || cleanDigits,
        });
        router.refresh();
        setTimeout(() => {
          onOpenChange(false);
        }, 1100);
      } else {
        setErrorMsg(res.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTreasurer = user.role === "TREASURER";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-6 sm:p-7 rounded-3xl"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader className="text-left pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-slate-900">
                ข้อมูลโปรไฟล์ & พร้อมเพย์
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                แก้ไขชื่อและเบอร์พร้อมเพย์สำหรับรับเงินโอนจ่ายคืน
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* User Role Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs mt-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                isTreasurer ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {isTreasurer ? <Scale className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-bold text-slate-800 block text-xs">{user.email}</span>
              <span className="text-[10px] text-slate-400">
                {isTreasurer ? "บทบาท: เหรัญญิก (Treasurer)" : "บทบาท: สต๊าฟผู้เบิกเงิน (Staff)"}
              </span>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isTreasurer
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}
          >
            {user.role}
          </span>
        </div>

        {/* Feedback Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>ชื่อ - นามสกุล (Display Name)</span>
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="สมชาย หมายมั่น"
              className="h-10 text-xs rounded-xl"
            />
          </div>

          {/* PromptPay Number Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>หมายเลขพร้อมเพย์รับเงินคืน (PromptPay ID) *</span>
              </span>
              {cleanDigits.length > 0 && (
                <span
                  className={`text-[10px] font-bold ${
                    isValidLength ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {cleanDigits.length} หลัก {isValidLength ? "✓" : "(ต้องการ 10 หรือ 13 หลัก)"}
                </span>
              )}
            </label>
            <Input
              type="text"
              required
              value={promptpayId}
              onChange={(e) => setPromptpayId(e.target.value)}
              placeholder="0812345678 หรือ 1100200123456"
              className="h-10 text-xs font-mono rounded-xl tracking-wider"
            />

            {/* Live PromptPay Formatted Preview */}
            {cleanDigits.length > 0 && (
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-center justify-between text-xs">
                <span className="text-[11px] text-blue-800 font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>รูปแบบที่จะแสดงบน QR Code:</span>
                </span>
                <span className="font-mono font-bold text-blue-900 text-xs">
                  {formatPromptPay(cleanDigits)}
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 เมื่อเหรัญญิกอนุมัติการเบิกเงิน ระบบจะใช้หมายเลขนี้สร้าง QR Code PromptPay ให้เหรัญญิกสแกนจ่ายเงินคืนเข้าบัญชีของคุณทันที
            </p>
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
              type="submit"
              disabled={isSubmitting || !cleanDigits || !isValidLength}
              className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึกข้อมูลพร้อมเพย์</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
