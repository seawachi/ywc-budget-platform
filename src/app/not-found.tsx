import React from "react";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-5">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">404 - ไม่พบหน้าที่คุณต้องการ</h2>
          <p className="text-sm text-slate-500">
            หน้าที่คุณกำลังค้นหาไม่มีอยู่ในระบบ หรือคุณอาจไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
