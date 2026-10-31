"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Root Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-5">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
          <p className="text-sm text-slate-500">
            ระบบไม่สามารถประมวลผลคำขอของคุณได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
          </p>
          {error?.digest && (
            <p className="text-xs font-mono text-slate-400 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200/50 break-all">
              Error Digest: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-500/20 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
          >
            <Home className="w-4 h-4" />
            <span>หน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
