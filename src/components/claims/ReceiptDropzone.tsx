"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Camera,
  FolderOpen,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react";

interface ReceiptDropzoneProps {
  onImageSelected: (base64OrUrl: string, fileOrName: string, isSample?: boolean) => void;
  onRemoteUrlReady?: (remoteUrl: string) => void;
  isLoading: boolean;
}

const AI_SCAN_STAGES = [
  {
    step: 1,
    name: "เตรียมไฟล์ภาพความละเอียดสูง",
    shortName: "1. โหลดภาพ",
    desc: "กำลังประมวลผลไฟล์ภาพและตรวจสอบความคมชัดเพื่อส่งให้ AI...",
  },
  {
    step: 2,
    name: "Gemini 2.5 ตรวจจับข้อความและตัวเลข",
    shortName: "2. อ่านข้อความ",
    desc: "กำลังอ่านชื่อร้าน วันที่ และเลขที่บิลจากภาพ...",
  },
  {
    step: 3,
    name: "สกัดรายการสินค้า & ภาษี VAT 7%",
    shortName: "3. สินค้า & VAT",
    desc: "กำลังแยกรายการสินค้า คำนวณราคาต่อหน่วย และภาษี 7%...",
  },
  {
    step: 4,
    name: "ตรวจสอบความถูกต้องของยอดรวม",
    shortName: "4. ตรวจยอดรวม",
    desc: "กำลังกระทบยอดเงินสุทธิและเตรียมแบบฟอร์มเบิกจ่าย...",
  },
];

export function ReceiptDropzone({ onImageSelected, onRemoteUrlReady, isLoading }: ReceiptDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      setElapsedMs(0);
      interval = setInterval(() => {
        setElapsedMs((prev) => prev + 200);
      }, 200);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const currentStageIndex =
    elapsedMs < 2000 ? 0 : elapsedMs < 5000 ? 1 : elapsedMs < 9000 ? 2 : 3;
  const currentStage = AI_SCAN_STAGES[currentStageIndex];
  const elapsedSec = (elapsedMs / 1000).toFixed(1);
  const progressPercent = Math.min(95, Math.max(10, Math.round((elapsedMs / 18000) * 100)));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedPreview(base64);

      // 1. Immediately pass base64 to parent so OCR and preview start without waiting!
      onImageSelected(base64, file.name, false);

      // 2. Upload file to Supabase S3 in background
      try {
        const formData = new FormData();
        formData.append("file", file);
        fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.url) {
              onRemoteUrlReady?.(data.url);
            }
          })
          .catch((err) => console.warn("Supabase S3 background upload notice:", err));
      } catch (err) {
        console.warn("Upload error:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (samplePath: string, sampleName: string) => {
    setSelectedPreview(samplePath);
    onImageSelected(samplePath, sampleName, true);
    onRemoteUrlReady?.(samplePath);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hidden File and Camera Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {/* Upload Dropzone / Camera Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={(e) => {
          // If clicked on the dropzone area (not on specific action buttons)
          if (!selectedPreview && !isLoading) {
            const target = e.target as HTMLElement;
            if (!target.closest("button")) {
              fileInputRef.current?.click();
            }
          }
        }}
        className={`relative rounded-3xl p-5 sm:p-7 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[190px] sm:min-h-[225px] border-2 border-dashed ${
          dragActive
            ? "border-blue-600 bg-blue-100/70 scale-[0.99] shadow-inner ring-4 ring-blue-200/60"
            : selectedPreview
            ? "border-emerald-300 bg-slate-50/70 shadow-xs"
            : "border-blue-300 hover:border-blue-500 bg-gradient-to-b from-blue-50/30 to-slate-50/70 hover:bg-blue-50/50 shadow-xs cursor-pointer group"
        }`}
      >
        {/* Active Drag Overlay */}
        {dragActive && !isLoading && (
          <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px] rounded-3xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-600 pointer-events-none animate-in fade-in duration-150 z-10">
            <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 shadow-lg flex items-center justify-center animate-bounce">
              <UploadCloud className="w-6 h-6" />
            </div>
            <span className="font-black text-blue-900 text-sm">
              ปล่อยไฟล์รูปใบเสร็จที่นี่เพื่อสแกนด้วย AI (Drop to Upload)
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-3.5 py-4 w-full max-w-md animate-in fade-in duration-200">
            {/* Animated Brain / Radar Spinner */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm">
                <Sparkles className="w-7 h-7 text-blue-600 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
              </span>
            </div>

            {/* Current State Title & Description */}
            <div className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  <span>ขั้นตอนที่ {currentStage.step}/4</span>
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {currentStage.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                {currentStage.desc}
              </p>
            </div>

            {/* Progress Bar & Timeout Indicator */}
            <div className="w-full space-y-1.5 pt-1 px-2">
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium px-1">
                <span className="flex items-center gap-1 text-blue-600 font-bold">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>กำลังสแกน: {elapsedSec}s</span>
                </span>
                <span className="text-slate-400">
                  Timeout จำกัดเวลา: 35s
                </span>
              </div>
            </div>

            {/* Step Checkpoints */}
            <div className="grid grid-cols-4 gap-1.5 w-full pt-1">
              {AI_SCAN_STAGES.map((st, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div
                    key={st.step}
                    className={`flex flex-col items-center p-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                      isPassed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isCurrent
                        ? "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-100/80"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    }`}
                  >
                    <span>
                      {isPassed ? "✓ " : isCurrent ? "⚡ " : ""}
                      {st.shortName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : selectedPreview ? (
          <div className="flex flex-col items-center gap-3 py-1 w-full">
            <div className="relative w-36 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg shadow-slate-900/10 bg-white border border-slate-200/80 p-2 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPreview}
                alt="Selected receipt preview"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              อัปโหลดบิลเรียบร้อยแล้ว (แตะด้านล่างเพื่อถ่ายใหม่)
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-700 shadow-sm text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                ถ่ายใหม่
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-700 shadow-sm text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
                เลือกรูปอื่น
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <div
              className={`h-12 w-12 rounded-2xl bg-white shadow-md text-blue-600 flex items-center justify-center transition-transform ${
                dragActive ? "scale-110 ring-4 ring-blue-100" : "group-hover:scale-105"
              }`}
            >
              <UploadCloud className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-bold text-slate-900">
                ถ่ายรูปใบเสร็จ หรืออัปโหลดจากเครื่อง
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/80 shadow-xs">
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                <span>ลากและวางรูปภาพที่นี่ (Drag & Drop)</span>
              </div>
              <p className="text-xs text-slate-400">
                หรือคลิกที่กรอบนี้เพื่อเลือกไฟล์ • รองรับกล้องมือถือ, สลิปธนาคาร, หรือบิลเงินสด
              </p>
            </div>

            {/* Mobile-Friendly Action Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องถ่าย</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white text-slate-700 font-bold text-xs shadow-sm border border-slate-200/80 active:scale-95 transition hover:bg-slate-50 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span>เลือกจากอัลบั้ม</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3 Quick Sample Receipts for Interview Demonstration */}
      <div className="bg-amber-50/60 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            บิลตัวอย่างคลิกเดียวทดสอบ AI (Demo Receipts)
          </span>
          <span className="text-[10px] text-amber-700/80 hidden sm:inline font-medium">
            แตะเพื่อทดสอบทันที
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Sample 1: Makro Mixed Bill */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              handleSelectSample("/sample-receipts/makro-mixed-bill.svg", "makro-mixed-bill")
            }
            className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-white rounded-xl shadow-sm hover:shadow text-left transition-all group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              MK
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                1. ใบกำกับภาษี Makro
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                บิลค่าย + ของส่วนตัว + VAT 7%
              </span>
            </div>
          </button>

          {/* Sample 2: K-Plus Slip */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              handleSelectSample("/sample-receipts/kplus-slip.svg", "kplus-slip")
            }
            className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-white rounded-xl shadow-sm hover:shadow text-left transition-all group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              K+
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                2. สลิปโอนเงิน K+
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                ค่าเช่าเครื่องเสียง 8,000 บาท
              </span>
            </div>
          </button>

          {/* Sample 3: Handwritten Cash Receipt */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              handleSelectSample("/sample-receipts/handwritten-bill.svg", "handwritten-bill")
            }
            className="flex items-center gap-2.5 p-2.5 sm:p-3 bg-white rounded-xl shadow-sm hover:shadow text-left transition-all group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                3. บิลเงินสดเขียนมือ
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                ค่าข้าวกล่อง 6,500 บาท
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
