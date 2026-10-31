"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspaceAction } from "@/actions/workspace.actions";
import { BusinessUnitInput, TeamMemberInput, Role } from "@/types/receipt";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Layers,
  Users,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
  User,
  Scale,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Hash,
} from "lucide-react";

const COLOR_PALETTE = [
  { name: "Emerald", hex: "#10B981" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Orange", hex: "#F97316" },
];

const PRESETS: Record<
  string,
  { label: string; description: string; units: { name: string; budget: number; color: string }[] }
> = {
  camp: {
    label: "ค่ายกิจกรรม / ค่ายนักเรียน-นักศึกษา",
    description: "สวัสดิการอาหาร, พัสดุสถานที่, กิจกรรมสันทนาการ, พยาบาล",
    units: [
      { name: "ฝ่ายสวัสดิการและอาหาร", budget: 25000, color: "#10B981" },
      { name: "ฝ่ายพัสดุและสถานที่", budget: 15000, color: "#3B82F6" },
      { name: "ฝ่ายกิจกรรมและสันทนาการ", budget: 10000, color: "#F59E0B" },
      { name: "ฝ่ายพยาบาลและประสานงาน", budget: 5000, color: "#F43F5E" },
    ],
  },
  club: {
    label: "ชมรม / สโมสรนิสิต-นักศึกษา",
    description: "โครงการวิชาการ, สื่อประชาสัมพันธ์, สันทนาการ, จัดซื้อทั่วไป",
    units: [
      { name: "ฝ่ายโครงการและวิชาการ", budget: 20000, color: "#6366F1" },
      { name: "ฝ่ายสื่อและประชาสัมพันธ์", budget: 10000, color: "#8B5CF6" },
      { name: "ฝ่ายกิจกรรมสัมพันธ์", budget: 15000, color: "#06B6D4" },
      { name: "ฝ่ายธุรการและพัสดุ", budget: 10000, color: "#3B82F6" },
    ],
  },
  general: {
    label: "องค์กรทั่วไป / งานอีเวนต์ / SME",
    description: "Operations, Marketing, Team Welfare, Emergency Fund",
    units: [
      { name: "Operations & Logistics", budget: 30000, color: "#3B82F6" },
      { name: "Marketing & Public Relations", budget: 20000, color: "#8B5CF6" },
      { name: "Team Welfare & Catering", budget: 15000, color: "#10B981" },
      { name: "Emergency & Contingency Fund", budget: 10000, color: "#F59E0B" },
    ],
  },
};

interface WorkspaceOnboardingWizardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onComplete?: () => void;
  isModal?: boolean;
}

export function WorkspaceOnboardingWizard({
  user,
  onComplete,
  isModal = false,
}: WorkspaceOnboardingWizardProps) {
  const router = useRouter();

  // Wizard Step: 1 = Basic Info, 2 = Business Units, 3 = Team Invitation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Workspace Basics
  const [wsName, setWsName] = useState("");
  const [wsCode, setWsCode] = useState("");
  const [wsDescription, setWsDescription] = useState("");

  // Step 2: Business Units (Departments)
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitInput[]>([
    { name: "ฝ่ายสวัสดิการและอาหาร", allocatedBudget: 25000, color: "#10B981" },
    { name: "ฝ่ายพัสดุและสถานที่", allocatedBudget: 15000, color: "#3B82F6" },
    { name: "ฝ่ายกิจกรรมและสันทนาการ", allocatedBudget: 10000, color: "#F59E0B" },
  ]);

  // Step 3: Treasure Team & Staff (Invited by Gmail)
  const [invitedEmail, setInvitedEmail] = useState("");
  const [invitedRole, setInvitedRole] = useState<Role>("TREASURER");
  const [teamMembers, setTeamMembers] = useState<TeamMemberInput[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Calculate Total Budget from Business Units
  const totalAllocatedBudget = businessUnits.reduce(
    (sum, bu) => sum + (Number(bu.allocatedBudget) || 0),
    0
  );

  const applyPreset = (presetKey: string) => {
    const p = PRESETS[presetKey];
    if (!p) return;
    setBusinessUnits(
      p.units.map((u) => ({
        name: u.name,
        allocatedBudget: u.budget,
        color: u.color,
      }))
    );
  };

  const addBusinessUnit = () => {
    const nextColor = COLOR_PALETTE[businessUnits.length % COLOR_PALETTE.length].hex;
    setBusinessUnits((prev) => [
      ...prev,
      {
        name: `ฝ่ายงานที่ ${prev.length + 1}`,
        allocatedBudget: 10000,
        color: nextColor,
      },
    ]);
  };

  const removeBusinessUnit = (index: number) => {
    if (businessUnits.length <= 1) {
      setErrorMsg("ต้องมีฝ่ายงาน / Business Unit อย่างน้อย 1 ฝ่าย");
      return;
    }
    setBusinessUnits((prev) => prev.filter((_, i) => i !== index));
    setErrorMsg("");
  };

  const updateBusinessUnit = (
    index: number,
    field: keyof BusinessUnitInput,
    value: string | number
  ) => {
    setBusinessUnits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addTeamMember = () => {
    const cleanEmail = invitedEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg("กรุณาระบุที่อยู่อีเมล หรือ Gmail ให้ถูกต้อง");
      return;
    }

    if (cleanEmail === user.email.toLowerCase()) {
      setErrorMsg("คุณเป็นเจ้าของ Workspace อยู่แล้ว ไม่จำเป็นต้องเชิญตนเอง");
      return;
    }

    if (teamMembers.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setErrorMsg("อีเมลนี้ถูกเพิ่มในรายการเชิญแล้ว");
      return;
    }

    setTeamMembers((prev) => [...prev, { email: cleanEmail, role: invitedRole }]);
    setInvitedEmail("");
    setErrorMsg("");
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!wsName.trim()) {
        setErrorMsg("กรุณาระบุชื่อ Workspace / ค่าย / องค์กร");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (businessUnits.length === 0) {
        setErrorMsg("กรุณากำหนดฝ่ายงาน / Business Unit อย่างน้อย 1 ฝ่าย");
        return;
      }
      for (const bu of businessUnits) {
        if (!bu.name.trim()) {
          setErrorMsg("กรุณาระบุชื่อฝ่ายงานให้ครบถ้วน");
          return;
        }
        if (Number(bu.allocatedBudget) <= 0) {
          setErrorMsg(`กรุณาระบุงบประมาณสำหรับ '${bu.name}' ให้มากกว่า 0 บาท`);
          return;
        }
      }
      setStep(3);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createWorkspaceAction({
        name: wsName.trim(),
        code: wsCode.trim() || undefined,
        description: wsDescription.trim() || undefined,
        totalBudget: totalAllocatedBudget,
        departments: businessUnits.map((bu) => ({
          name: bu.name.trim(),
          allocatedBudget: Number(bu.allocatedBudget) || 1000,
          color: bu.color,
        })),
        teamMembers,
      });

      if (res.success) {
        onComplete?.();
        window.location.href = "/treasury";
      } else {
        setErrorMsg(res.error || "เกิดข้อผิดพลาดในการสร้าง Workspace");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full max-w-4xl mx-auto ${
        isModal ? "p-2" : "py-6 px-3 sm:px-6"
      } space-y-6 animate-in fade-in duration-300`}
    >
      {/* Wizard Header Hero */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>เริ่มต้นใช้งานใหม่ (Fresh Onboarding Wizard)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            สร้าง Workspace ใหม่และจัดสรรงบประมาณ
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
            ยินดีต้อนรับคุณ {user.name} • กำหนดฝ่ายงาน (Business Units)
            จัดสรรงบประมาณ และเชิญทีมงานเหรัญญิกด้วย Gmail เพื่อเริ่มเบิกจ่ายเงินจริง
          </p>
        </div>

        {/* Steps Progress Indicator */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-5 border-t border-white/10 text-xs">
          <div
            className={`flex items-center gap-2 p-2 rounded-xl transition ${
              step === 1
                ? "bg-white/15 text-white font-bold"
                : step > 1
                ? "text-emerald-400"
                : "text-white/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                step > 1
                  ? "bg-emerald-500 text-white"
                  : step === 1
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
            </div>
            <span className="truncate">1. ข้อมูล Workspace</span>
          </div>

          <div
            className={`flex items-center gap-2 p-2 rounded-xl transition ${
              step === 2
                ? "bg-white/15 text-white font-bold"
                : step > 2
                ? "text-emerald-400"
                : "text-white/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                step > 2
                  ? "bg-emerald-500 text-white"
                  : step === 2
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : "2"}
            </div>
            <span className="truncate">2. ฝ่ายงานและงบ</span>
          </div>

          <div
            className={`flex items-center gap-2 p-2 rounded-xl transition ${
              step === 3
                ? "bg-white/15 text-white font-bold"
                : "text-white/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                step === 3 ? "bg-blue-500 text-white" : "bg-white/10 text-white/50"
              }`}
            >
              3
            </div>
            <span className="truncate">3. เชิญทีมด้วย Gmail</span>
          </div>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2.5 border border-red-200/60 shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: WORKSPACE BASICS */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>ขั้นตอนที่ 1: ตั้งชื่อและกำหนดรายละเอียด Workspace</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ระบุชื่อค่าย ชมรม กิจกรรม หรือองค์กรของคุณ เช่น ค่ายลานเกียร์ 2026, Startup Bootcamp
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>ชื่อ Workspace / ค่าย / องค์กร</span>
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="เช่น ค่ายพัฒนาศักยภาพเยาวชน 2026 (Larngear Camp)"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>รหัสย่อค่าย (Code) - ไม่บังคับ</span>
                </label>
                <Input
                  type="text"
                  placeholder="เช่น LG-2026 หรือ TECH-26"
                  value={wsCode}
                  onChange={(e) => setWsCode(e.target.value)}
                  className="h-11 rounded-xl text-sm font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>เจ้าของ Workspace (ผู้สร้าง)</span>
                </label>
                <div className="h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center text-xs text-slate-600 font-semibold truncate">
                  {user.name} ({user.email})
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                คำอธิบายหรือเป้าหมายค่าย (Description) - ไม่บังคับ
              </label>
              <textarea
                rows={3}
                placeholder="ระบุรายละเอียดสั้นๆ เช่น โครงการค่ายจัดขึ้นระหว่างวันที่ 15-18 ธันวาคม 2569 ณ มหาวิทยาลัย เพื่อพัฒนาทักษะวิชาการและสันทนาการ"
                value={wsDescription}
                onChange={(e) => setWsDescription(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              type="button"
              onClick={handleNextStep}
              className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-md shadow-indigo-500/20"
            >
              <span>ถัดไป: จัดการฝ่ายงานและงบประมาณ</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: BUSINESS UNITS & BUDGET ALLOCATION */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>ขั้นตอนที่ 2: กำหนดฝ่ายงาน (Business Units) และงบประมาณ</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                กำหนดฝ่ายที่ขอเบิกเงิน พร้อมงบประมาณจัดสรรเฉพาะของแต่ละฝ่าย ระบบจะคำนวณงบรวมให้อัตโนมัติ
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl self-start sm:self-auto text-right">
              <span className="text-[10px] text-indigo-600 font-bold block">งบประมาณรวมทั้งค่าย</span>
              <span className="text-base sm:text-lg font-black text-indigo-900 font-mono">
                {formatCurrency(totalAllocatedBudget)}
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>เลือกใช้ชุดโครงสร้างแนะนำด่วน (1-Click Presets):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="p-3 text-left rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition group"
                >
                  <span className="block font-bold text-xs text-slate-800 group-hover:text-indigo-700">
                    {p.label}
                  </span>
                  <span className="block text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {p.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Business Units List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                รายการฝ่ายงานใน Workspace ({businessUnits.length} ฝ่าย)
              </span>
              <button
                type="button"
                onClick={addBusinessUnit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มฝ่ายงาน (Add Business Unit)</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {businessUnits.map((bu, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white flex flex-col sm:flex-row items-center gap-3 transition"
                >
                  {/* Color Selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="w-4 h-8 rounded-lg shrink-0 shadow-xs"
                      style={{ backgroundColor: bu.color }}
                    />
                    <select
                      value={bu.color}
                      onChange={(e) => updateBusinessUnit(idx, "color", e.target.value)}
                      className="text-[11px] h-9 rounded-xl border border-slate-200 bg-white px-2 focus:ring-1 focus:ring-blue-500 font-semibold"
                    >
                      {COLOR_PALETTE.map((c) => (
                        <option key={c.hex} value={c.hex}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Business Unit Name */}
                  <div className="flex-1 w-full">
                    <Input
                      type="text"
                      placeholder="เช่น ฝ่ายสวัสดิการและอาหาร, Marketing"
                      value={bu.name}
                      onChange={(e) => updateBusinessUnit(idx, "name", e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  {/* Allocated Budget Input */}
                  <div className="w-full sm:w-44 shrink-0 flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-bold">฿</span>
                    <Input
                      type="number"
                      step={500}
                      min={0}
                      placeholder="งบประมาณ"
                      value={bu.allocatedBudget || ""}
                      onChange={(e) =>
                        updateBusinessUnit(idx, "allocatedBudget", parseFloat(e.target.value) || 0)
                      }
                      className="h-9 text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeBusinessUnit(idx)}
                    title="ลบฝ่ายนี้"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition shrink-0 self-end sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="h-11 px-5 rounded-xl text-xs gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </Button>

            <Button
              type="button"
              onClick={handleNextStep}
              className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-md shadow-indigo-500/20"
            >
              <span>ถัดไป: เชิญทีมเหรัญญิกและสต๊าฟ</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: TREASURE TEAM INVITATIONS BY GMAIL */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>ขั้นตอนที่ 3: เชิญทีมงานเหรัญญิกและสต๊าฟด้วย Gmail (Team by Gmail)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ระบุ Gmail ของเพื่อนร่วมทีมเหรัญญิกหรือสต๊าฟ เมื่อเพื่อนร่วมทีมเข้าสู่ระบบด้วย Gmail นั้น
              จะสามารถเข้าถึง Workspace และส่งเบิก/อนุมัติได้ทันที
            </p>
          </div>

          {/* Invitation Input Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>เพิ่มอีเมลหรือ Gmail เพื่อเชิญเข้าร่วมทีม:</span>
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="flex-1 w-full">
                <Input
                  type="email"
                  placeholder="เช่น treasurer.friend@gmail.com หรือ staff@gmail.com"
                  value={invitedEmail}
                  onChange={(e) => setInvitedEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTeamMember();
                    }
                  }}
                  className="h-10 text-xs bg-white rounded-xl"
                />
              </div>

              <div className="w-full sm:w-48 shrink-0 flex items-center gap-2">
                <select
                  value={invitedRole}
                  onChange={(e) => setInvitedRole(e.target.value as Role)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TREASURER">เหรัญญิก (Treasurer)</option>
                  <option value="STAFF">สต๊าฟ (Staff ผู้เบิก)</option>
                </select>

                <Button
                  type="button"
                  onClick={addTeamMember}
                  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span>เพิ่ม</span>
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>
                <strong>Treasurer</strong>: ตรวจบิล, สร้าง QR พร้อมเพย์จ่ายเงิน, ดู Dashboard ภาพรวมงบ |{" "}
                <strong>Staff</strong>: สแกนบิลและยื่นคำขอเบิกเงิน
              </span>
            </p>
          </div>

          {/* Invited Members List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>รายชื่อทีมงานที่จะได้รับสิทธิ์ใน Workspace นี้:</span>
              <span className="text-slate-400 font-normal">
                รวม {teamMembers.length + 1} คน (คุณ + ที่เชิญเพิ่ม {teamMembers.length} คน)
              </span>
            </span>

            <div className="space-y-2">
              {/* Workspace Owner (Fixed) */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-slate-900">{user.name}</span>
                    <span className="block text-[10px] text-slate-400">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    เจ้าของ Workspace (Lead Treasurer)
                  </span>
                </div>
              </div>

              {/* Invited Team Members */}
              {teamMembers.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        m.role === "TREASURER"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {m.role === "TREASURER" ? (
                        <Scale className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="block font-bold text-xs text-slate-900 font-mono">
                        {m.email}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {m.role === "TREASURER"
                          ? "เหรัญญิก (ตรวจบิล & จ่ายเงิน)"
                          : "สต๊าฟ (ผู้เบิกเงิน)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        m.role === "TREASURER"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {m.role === "TREASURER" ? "Treasurer" : "Staff"}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeTeamMember(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {teamMembers.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  ยังไม่ได้เพิ่มสมาชิกเพิ่มเติม (คุณสามารถเชิญเพื่อนร่วมทีมเพิ่มได้ตลอดเวลาภายหลัง)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setStep(2)}
              className="h-11 px-5 rounded-xl text-xs gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="h-11 px-7 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs gap-2 shadow-lg shadow-blue-500/25"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "กำลังสร้าง Workspace..." : "สร้าง Workspace และเริ่มใช้งานทันที"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
