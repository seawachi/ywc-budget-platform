"use client";

import React from "react";
import { DocType } from "@/types/receipt";
import { Input } from "@/components/ui/input";
import { Smartphone, Building2, Tag, Calendar, Store } from "lucide-react";
import { formatPromptPay } from "@/lib/utils";

interface DepartmentOption {
  id: string;
  name: string;
  color: string;
  allocatedBudget: number;
}

interface ClaimMetadataFormProps {
  title: string;
  setTitle: (val: string) => void;
  merchantName: string;
  setMerchantName: (val: string) => void;
  departmentId: string;
  setDepartmentId: (val: string) => void;
  departments: DepartmentOption[];
  docType: DocType;
  setDocType: (val: DocType) => void;
  expenseDate: string;
  setExpenseDate: (val: string) => void;
  promptpayId: string;
  setPromptpayId: (val: string) => void;
}

export function ClaimMetadataForm({
  title,
  setTitle,
  merchantName,
  setMerchantName,
  departmentId,
  setDepartmentId,
  departments,
  docType,
  setDocType,
  expenseDate,
  setExpenseDate,
  promptpayId,
  setPromptpayId,
}: ClaimMetadataFormProps) {
  return (
    <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] space-y-5">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-50">
        <Tag className="w-4 h-4 text-blue-600" />
        ข้อมูลการเบิกจ่ายและฝ่ายที่รับผิดชอบ
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            หัวข้อการขอเบิกเงิน (Expense Title) *
          </label>
          <Input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ค่าน้ำดื่มและน้ำแข็งกิจกรรมเตรียมค่าย"
            className="text-xs"
          />
        </div>

        {/* Merchant / Store */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            ชื่อร้านค้า / ผู้รับเงิน (Merchant)
          </label>
          <Input
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            placeholder="เช่น Makro สามย่านมิตรทาวน์"
            className="text-xs"
          />
        </div>

        {/* Expense Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            วันที่ในใบเสร็จ (Expense Date)
          </label>
          <Input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Department Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            ฝ่ายที่เบิก (Department) *
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full h-10 rounded-xl bg-slate-100/70 hover:bg-slate-100 focus:bg-white px-3.5 text-xs font-medium text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} (งบ {d.allocatedBudget.toLocaleString()} บาท)
              </option>
            ))}
          </select>
        </div>

        {/* Doc Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            ประเภทเอกสารหลักฐาน (Document Type)
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="w-full h-10 rounded-xl bg-slate-100/70 hover:bg-slate-100 focus:bg-white px-3.5 text-xs font-medium text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          >
            <option value="TAX_INVOICE">ใบกำกับภาษี / ใบเสร็จรับเงิน (Tax Invoice / Receipt)</option>
            <option value="CASH_RECEIPT">บิลเงินสดเขียนมือ (Cash Receipt)</option>
            <option value="BANK_SLIP">สลิปโอนเงินธนาคาร (Bank Transfer Slip)</option>
            <option value="OTHER">เอกสารหลักฐานอื่นๆ (Other)</option>
          </select>
        </div>

        {/* PromptPay ID */}
        <div className="md:col-span-2 space-y-2 bg-blue-50/70 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              เบอร์โทรศัพท์ / เลขบัตรประชาชน พร้อมเพย์ (PromptPay ID สำหรับรับเงินโอนคืน) *
            </label>
            {promptpayId && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full shadow-sm">
                พร้อมเพย์: {formatPromptPay(promptpayId)}
              </span>
            )}
          </div>
          <Input
            type="text"
            required
            value={promptpayId}
            onChange={(e) => setPromptpayId(e.target.value)}
            placeholder="เช่น 0812345678 หรือ 1103701234567"
            className="bg-white text-xs font-mono"
          />
          <p className="text-[11px] text-slate-400">
            * เหรัญญิกจะใช้หมายเลขนี้ในการสร้าง QR Code โอนเงินคืนทันทีหลังกดอนุมัติ
          </p>
        </div>
      </div>
    </div>
  );
}
