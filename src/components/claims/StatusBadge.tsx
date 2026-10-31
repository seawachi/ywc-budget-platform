import React from "react";
import { ClaimStatus, DocType } from "@/types/receipt";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Banknote, Receipt, FileText, File } from "lucide-react";

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="warning" className="gap-1.5 font-semibold bg-amber-50 text-amber-700 shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          รอตรวจบิล (Pending)
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="default" className="gap-1.5 font-semibold bg-blue-50 text-blue-700 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          อนุมัติแล้ว รอโอน (Approved)
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="success" className="gap-1.5 font-semibold bg-emerald-50 text-emerald-700 shadow-sm">
          <Banknote className="w-3.5 h-3.5" />
          โอนแล้ว (Paid)
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className="gap-1.5 font-semibold bg-red-50 text-red-700 shadow-sm">
          <XCircle className="w-3.5 h-3.5" />
          ตีกลับ (Rejected)
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function DocTypeBadge({ docType }: { docType: DocType }) {
  switch (docType) {
    case "BANK_SLIP":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 shadow-sm">
          <Banknote className="w-3 h-3 text-purple-600" />
          สลิปโอนเงิน (Bank Slip)
        </span>
      );
    case "CASH_RECEIPT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 shadow-sm">
          <Receipt className="w-3 h-3 text-orange-600" />
          บิลเงินสด (Cash Receipt)
        </span>
      );
    case "TAX_INVOICE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 shadow-sm">
          <FileText className="w-3 h-3 text-blue-600" />
          ใบกำกับภาษี (Tax Invoice)
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 shadow-sm">
          <File className="w-3 h-3 text-slate-500" />
          เอกสารทั่วไป
        </span>
      );
  }
}
