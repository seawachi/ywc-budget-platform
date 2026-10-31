import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-slate-700">กำลังโหลดข้อมูลระบบงบค่าย...</p>
        <p className="text-xs text-slate-400">กรุณารอสักครู่ ระบบกำลังดึงข้อมูลงบประมาณและใบเสร็จ</p>
      </div>
    </div>
  );
}
