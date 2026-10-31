"use client";

import React, { useState, useEffect } from "react";
import { logoutUser } from "@/actions/user.actions";
import {
  joinWorkspaceByCode,
  getUserPendingJoinRequests,
  cancelPendingJoinRequest,
  PendingJoinRequestDTO,
} from "@/actions/workspace.actions";
import { AuthUser } from "@/actions/user.actions";
import {
  Building2,
  KeyRound,
  LogOut,
  Scale,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldAlert,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";

interface StaffNoWorkspaceViewProps {
  user: AuthUser;
}

export function StaffNoWorkspaceView({ user }: StaffNoWorkspaceViewProps) {
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pendingRequests, setPendingRequests] = useState<PendingJoinRequestDTO[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    setIsLoadingPending(true);
    try {
      const data = await getUserPendingJoinRequests();
      setPendingRequests(data);
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg("กรุณากรอกรหัสค่าย (เช่น LG-2026)");
      return;
    }

    setIsJoining(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await joinWorkspaceByCode(code);
      if (res.success) {
        setSuccessMsg(
          `ส่งคำขอเข้าร่วมค่าย "${res.workspaceName}" เรียบร้อยแล้ว! กรุณารอเหรัญญิกตรวจสอบและอนุมัติในระบบการจัดการสมาชิก`
        );
        setCode("");
        await fetchPendingRequests();
      } else {
        setErrorMsg(res.error || "ไม่สามารถเข้าร่วมค่ายได้");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancelRequest = async (id: string, wsName: string) => {
    if (!confirm(`ต้องการยกเลิกคำขอเข้าร่วมค่าย "${wsName}" หรือไม่?`)) return;
    setIsCancellingId(id);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await cancelPendingJoinRequest(id);
      if (res.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
        setSuccessMsg(`ยกเลิกคำขอเข้าร่วมค่าย "${wsName}" เรียบร้อยแล้ว`);
      } else {
        setErrorMsg(res.error || "ไม่สามารถยกเลิกคำขอได้");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการยกเลิกคำขอ");
    } finally {
      setIsCancellingId(null);
    }
  };

  const handleLogout = async (roleHint?: "TREASURER" | "STAFF") => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Force hard redirect to clear browser cache and cookies
      const target = roleHint
        ? `/login?logout=1&role=${roleHint}`
        : `/login?logout=1`;
      window.location.href = target;
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 sm:p-10 bg-white rounded-3xl shadow-xl border border-slate-100 text-center space-y-7 animate-in fade-in">
      {/* Icon Badge */}
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner ring-8 ring-blue-50/50">
        <Building2 className="w-8 h-8" />
      </div>

      {/* Main Title & Status */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100/80 text-blue-800 mb-1">
          <User className="w-3.5 h-3.5" />
          <span>บัญชี: {user.name} ({user.email})</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          ยังไม่มี Workspace ที่คุณเข้าร่วม
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          คุณเข้าสู่ระบบในฐานะ <strong>Staff ผู้เบิกเงิน</strong> ในระบบยังไม่มีค่ายที่ผูกกับบัญชีนี้ กรุณาแจ้งให้เหรัญญิก (Treasurer) เพิ่มอีเมลของคุณเข้าสู่ค่าย หรือนำรหัสค่าย (Workspace Code) จากเหรัญญิกมากรอกด้านล่างเพื่อส่งคำขอเข้าร่วม
        </p>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 justify-center text-left border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 justify-center text-left border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pending Join Requests Card */}
      {pendingRequests.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-left space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>คำขอเข้าร่วมค่ายของคุณ (อยู่ระหว่างรอเหรัญญิกอนุมัติ)</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              disabled={isLoadingPending}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200/80 text-amber-900 text-xs font-bold transition cursor-pointer"
              title="ตรวจสอบสถานะการอนุมัติล่าสุด"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingPending ? "animate-spin" : ""}`} />
              <span>ตรวจสอบผล</span>
            </button>
          </div>

          <div className="space-y-2">
            {pendingRequests.map((req) => {
              const isCancelling = isCancellingId === req.id;
              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl bg-white/90 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{req.workspaceName}</span>
                      {req.workspaceCode && (
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-slate-100 text-slate-700 font-bold">
                          {req.workspaceCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-amber-700 font-medium">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-900 text-[10px] font-bold">
                        ⏳ รอเหรัญญิกอนุมัติ (Pending)
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        ส่งคำขอเมื่อ{" "}
                        {new Date(req.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCancelRequest(req.id, req.workspaceName)}
                    disabled={isCancelling}
                    className="self-end sm:self-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-500 hover:text-red-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {isCancelling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    <span>ยกเลิกคำขอ</span>
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-amber-800/80 leading-relaxed">
            💡 เหรัญญิกสามารถอนุมัติคำขอของคุณได้ที่หน้า <strong>"จัดการสมาชิกค่าย"</strong> เมื่อได้รับการอนุมัติ คุณจะสามารถเข้าสู่ระบบเพื่อสแกนใบเสร็จและส่งเบิกเงินได้ทันที
          </p>
        </div>
      )}

      {/* Option 1: Join with Code */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <KeyRound className="w-4 h-4 text-blue-600" />
          <span>ขอเข้าร่วมค่ายด้วยรหัสค่าย (Workspace Code)</span>
        </div>
        <p className="text-xs text-slate-500">
          หากเหรัญญิกสร้างค่ายแล้วและให้รหัสค่ายแก่คุณ (เช่น <code>LG-2026</code>) สามารถกรอกที่นี่เพื่อส่งคำขอเข้าร่วมค่าย โดยต้องรอการอนุมัติจากเหรัญญิกก่อนเข้าใช้งาน หรือรอให้เหรัญญิกเชิญอีเมล <strong>{user.email}</strong> เข้าสู่ค่ายโดยตรง
        </p>
        <form onSubmit={handleJoinByCode} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ตัวอย่าง: LG-2026"
            disabled={isJoining}
            className="flex-1 px-4 py-2 text-xs uppercase font-mono tracking-wider rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="submit"
            disabled={isJoining || !code.trim()}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            {isJoining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            <span>ส่งคำขอเข้าร่วม</span>
          </button>
        </form>
      </div>

      {/* Role Notice: Workspace Creation is restricted to Treasurer */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-left flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800 block">สิทธิ์การสร้าง Workspace เฉพาะเหรัญญิก (Treasurer Only)</span>
          <p>
            ผู้ใช้ตำแหน่ง Staff จะไม่สามารถสร้าง Workspace ใหม่ได้ หากคุณต้องการสร้างค่ายใหม่หรือจัดสรรงบประมาณ กรุณาออกจากระบบแล้วเข้าสู่ระบบด้วยบัญชีเหรัญญิก
          </p>
        </div>
      </div>

      {/* Option 2: Logout and Re-login as Treasurer or Other Account */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          type="button"
          onClick={() => handleLogout()}
          disabled={isLoggingOut}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <LogOut className="w-4 h-4 text-slate-500" />
          )}
          <span>ออกจากระบบ (Logout)</span>
        </button>

        <button
          type="button"
          onClick={() => handleLogout("TREASURER")}
          disabled={isLoggingOut}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
        >
          <Scale className="w-4 h-4 text-purple-200" />
          <span>ออกจากระบบ & เข้าสู่ระบบเป็นเหรัญญิกเพื่อสร้างค่าย</span>
        </button>
      </div>
    </div>
  );
}
