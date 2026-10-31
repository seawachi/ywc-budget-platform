import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClaimById } from "@/actions/claim.actions";
import { getCurrentUser } from "@/actions/user.actions";
import { ClaimStatusBadge, DocTypeBadge } from "@/components/claims/StatusBadge";
import { formatCurrency, formatDate, formatPromptPay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Smartphone,
  ExternalLink,
  Receipt,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let claim = null;
  let user = null;

  try {
    [claim, user] = await Promise.all([getClaimById(id), getCurrentUser()]);
  } catch (err: any) {
    if (err?.message?.includes("FORBIDDEN")) {
      return (
        <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">ไม่มีสิทธิ์เข้าถึงรายการนี้</h2>
          <p className="text-sm text-slate-500">
            คุณสามารถดูได้เฉพาะรายการที่คุณเป็นผู้ส่งเบิก หรือติดต่อเหรัญญิกเพื่อขอข้อมูล
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      );
    }
  }

  if (!claim || !user) {
    notFound();
  }

  const claimedItems = claim.items?.filter((it) => it.isClaimed) || [];
  const excludedItems = claim.items?.filter((it) => !it.isClaimed) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับหน้า Dashboard</span>
        </Link>
        <ClaimStatusBadge status={claim.status} />
      </div>

      {/* Header Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full shadow-sm">
                {claim.department?.name}
              </span>
              <DocTypeBadge docType={claim.docType} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {claim.title}
            </h1>
            {claim.merchantName && (
              <p className="text-xs text-slate-400">
                ร้านค้า: <span className="font-semibold text-slate-700">{claim.merchantName}</span>
              </p>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">ยอดเงินเบิกสุทธิ</span>
            <span className="text-3xl font-black text-blue-600">
              {formatCurrency(claim.amount)}
            </span>
          </div>
        </div>

        {/* Rejection notice */}
        {claim.status === "REJECTED" && claim.rejectReason && (
          <div className="p-4 rounded-2xl bg-red-50 text-xs text-red-800 space-y-1 shadow-sm">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              บิลนี้ถูกส่งกลับเพื่อแก้ไข:
            </span>
            <p className="pl-5 text-red-700">{claim.rejectReason}</p>
          </div>
        )}

        {/* Metadata info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-50 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">วันที่ในบิล</span>
            <span className="font-semibold text-slate-700">
              {formatDate(claim.expenseDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">ผู้ขอเบิก</span>
            <span className="font-semibold text-slate-700">
              {claim.submitter?.name || "สต๊าฟ"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">เบอร์พร้อมเพย์รับเงิน</span>
            <span className="font-mono font-bold text-emerald-700">
              {formatPromptPay(claim.promptpayId)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">สถานะปัจจุบัน</span>
            <span className="font-bold text-slate-800">{claim.status}</span>
          </div>
        </div>
      </div>

      {/* Two Column: Left Image, Right Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receipt Image */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              หลักฐานใบเสร็จต้นฉบับ
            </h2>
            <a
              href={claim.receiptImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>เปิดรูปเต็ม</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center min-h-[300px] shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={claim.receiptImageUrl}
              alt="Receipt preview"
              className="max-h-[380px] w-auto rounded-xl shadow-md object-contain"
            />
          </div>
        </div>

        {/* Claim Items Breakdown */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-50">
              รายการสินค้าที่ขอเบิก ({claimedItems.length} รายการ)
            </h2>

            <div className="divide-y divide-slate-100 text-xs">
              {claimedItems.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {item.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-black text-slate-900">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            {excludedItems.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 text-xs space-y-1 shadow-inner">
                <span className="font-bold text-slate-500 block">
                  รายการส่วนตัวที่ตัดออกจากการเบิก:
                </span>
                {excludedItems.map((ex, i) => (
                  <div key={i} className="flex justify-between text-slate-400 line-through">
                    <span>{ex.name}</span>
                    <span>{formatCurrency(ex.totalPrice)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick link to Treasury if Treasurer */}
          {user.role === "TREASURER" && (
            <div className="pt-3 border-t border-slate-50">
              <Link href="/treasury">
                <Button className="w-full text-xs font-bold gap-2 shadow-md">
                  ไปที่หน้าคิวตรวจบิล (Treasury Queue)
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
