"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Zap,
  ArrowRight,
  ShieldCheck,
  User,
  Scale,
  Smartphone,
  Lock,
  Mail,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  UserPlus,
  LogIn,
} from "lucide-react";
import {
  loginWithPassword,
  registerUser,
  loginUser,
} from "@/actions/user.actions";
import { Role } from "@/types/receipt";

export default function LoginPage() {
  const router = useRouter();

  // Mode: 'LOGIN' vs 'REGISTER'
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [promptpayId, setPromptpayId] = useState("");
  const [role, setRole] = useState<Role>("STAFF");

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("role") === "TREASURER") {
        setRole("TREASURER");
      }
      if (params.get("logout")) {
        setSuccessMsg("ออกจากระบบเรียบร้อยแล้ว ท่านสามารถเลือกบทบาทเพื่อเข้าสู่ระบบใหม่");
      }
    }
  }, []);

  // Real Login with Email & Password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await loginWithPassword({ email, password });
      if (res.success && res.user) {
        setSuccessMsg(`ยินดีต้อนรับคุณ ${res.user.name} กำลังเข้าสู่ระบบ...`);
        setTimeout(() => {
          if (res.user?.role === "TREASURER") {
            window.location.href = "/treasury";
          } else {
            window.location.href = "/";
          }
        }, 300);
      } else {
        setErrorMsg(res.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  // Real Register with Database Record & Workspace
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await registerUser({
        name,
        email,
        password,
        promptpayId,
        role,
      });

      if (res.success && res.user) {
        setSuccessMsg(`สมัครสมาชิกและสร้าง Workspace สำเร็จ! ยินดีต้อนรับคุณ ${res.user.name}`);
        setTimeout(() => {
          if (res.user?.role === "TREASURER") {
            window.location.href = "/treasury";
          } else {
            window.location.href = "/";
          }
        }, 400);
      } else {
        setErrorMsg(res.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
    } finally {
      setLoading(false);
    }
  };

  // One-Click Fast Login for Reviewers
  const handleFastDemoLogin = async (targetRole: Role) => {
    setLoading(true);
    setErrorMsg("");
    const demoEmail =
      targetRole === "TREASURER" ? "treasurer@larngear.camp" : "staff@larngear.camp";
    const demoName =
      targetRole === "TREASURER"
        ? "สมหญิง รอบคอบ (Treasurer ค่าย)"
        : "สมชาย หมายมั่น (Staff ฝ่ายสวัสดิการ)";
    const demoPromptPay = targetRole === "TREASURER" ? "0898765432" : "0812345678";

    setSuccessMsg(
      `เข้าสู่ระบบในฐานะ ${targetRole === "TREASURER" ? "Treasurer (เหรัญญิก)" : "Staff (ผู้เบิก)"}...`
    );

    try {
      const res = await loginUser({
        email: demoEmail,
        name: demoName,
        role: targetRole,
        promptpayId: demoPromptPay,
      });

      if (!res.success) {
        setErrorMsg(res.error || "ไม่สามารถเข้าสู่ระบบได้");
        setLoading(false);
        return;
      }

      setTimeout(() => {
        if (targetRole === "TREASURER") {
          window.location.href = "/treasury";
        } else {
          window.location.href = "/";
        }
      }, 150);
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 text-white">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-2xl shadow-blue-500/25 mx-auto items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Camp Budget Tracker
          </h1>
          <p className="text-xs text-slate-400">
            ระบบบริหารจัดการงบค่าย Multi-Workspace และตรวจบิล AI
          </p>
        </div>

        {/* 1-Click Fast Reviewer Box */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl p-4 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1-Click Fast Access (สำหรับทดสอบระบบ)
            </span>
            <span className="text-[10px] text-slate-400">รหัสผ่าน password123</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleFastDemoLogin("STAFF")}
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-left transition shadow-md group active:scale-95"
            >
              <div className="flex items-center justify-between">
                <User className="w-4 h-4 text-blue-200" />
                <ArrowRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="block font-bold text-xs mt-1">Staff ผู้เบิก</span>
              <span className="block text-[10px] text-blue-100/70 truncate">
                สแกนบิล Makro / สลิป
              </span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleFastDemoLogin("TREASURER")}
              className="p-3 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-900 hover:from-purple-600 hover:to-indigo-800 text-left transition shadow-md group active:scale-95"
            >
              <div className="flex items-center justify-between">
                <Scale className="w-4 h-4 text-purple-200" />
                <ArrowRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition" />
              </div>
              <span className="block font-bold text-xs mt-1">เหรัญญิกค่าย</span>
              <span className="block text-[10px] text-purple-100/70 truncate">
                ตรวจบิล & สร้าง QR
              </span>
            </button>
          </div>
        </div>

        {/* Real Authentication Card (Login & Register Tabs) */}
        <div className="rounded-3xl bg-white p-5 sm:p-7 text-slate-900 shadow-2xl space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("LOGIN");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === "LOGIN"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ (Sign In)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("REGISTER");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === "REGISTER"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>สร้างบัญชี (Sign Up)</span>
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: REAL LOGIN FORM */}
          {mode === "LOGIN" && (
            <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  อีเมล (Email Address)
                </label>
                <Input
                  type="email"
                  required
                  placeholder="เช่น staff@larngear.camp หรือ your-email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 text-xs h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  รหัสผ่าน (Password)
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 text-xs h-10 font-mono"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-lg transition"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Sign In)"}</span>
                </Button>
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-1">
                บัญชีสาธิต: staff@larngear.camp หรือ treasurer@larngear.camp (รหัส: password123)
              </p>
            </form>
          )}

          {/* TAB 2: REAL REGISTER FORM */}
          {mode === "REGISTER" && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  ชื่อ-นามสกุล หรือชื่อเล่น (Full Name) *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="เช่น วชิรวิชญ์ บุณย์สิน (ตูน)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-50 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  อีเมล (Email) *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  รหัสผ่าน (Password, อย่างน้อย 6 ตัวอักษร) *
                </label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  เบอร์พร้อมเพย์รับเงินคืน (PromptPay ID)
                </label>
                <Input
                  type="text"
                  placeholder="เช่น 0812345678"
                  value={promptpayId}
                  onChange={(e) => setPromptpayId(e.target.value)}
                  className="bg-slate-50 text-xs h-9 font-mono"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  ตำแหน่งหลักในค่าย (Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("STAFF")}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                      role === "STAFF"
                        ? "bg-blue-50 border-blue-600 text-blue-700 font-bold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Staff ผู้เบิกเงิน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("TREASURER")}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                      role === "TREASURER"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-bold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>เหรัญญิก (Treasurer)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  <span>{loading ? "กำลังลงทะเบียน..." : "สมัครสมาชิกและเริ่มต้นใช้งาน"}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
