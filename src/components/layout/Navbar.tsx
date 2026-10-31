"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Role, WorkspaceDTO } from "@/types/receipt";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { resetDemoData } from "@/actions/budget.actions";
import { logoutUser } from "@/actions/user.actions";
import {
  Wallet,
  RotateCcw,
  Smartphone,
  LogOut,
  FolderKanban,
  User,
  Scale,
  Loader2,
  Edit3,
} from "lucide-react";
import { formatPromptPay } from "@/lib/utils";

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    promptpayId?: string | null;
  };
  workspaces?: WorkspaceDTO[];
  activeWorkspace?: WorkspaceDTO | null;
}

export function Navbar({ user, workspaces = [], activeWorkspace }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isResetting, startReset] = useTransition();
  const [isLoggingOut, startLogout] = useTransition();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUserState, setCurrentUserState] = useState(user);

  useEffect(() => {
    setCurrentUserState(user);
  }, [user]);

  const handleReset = () => {
    if (confirm("ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?")) {
      startReset(async () => {
        await resetDemoData();
        window.location.href = "/";
      });
    }
  };

  const handleLogout = () => {
    startLogout(async () => {
      try {
        await logoutUser();
      } catch (err) {
        console.error("Logout failed:", err);
      } finally {
        window.location.href = "/login?logout=1";
      }
    });
  };

  const isStaff = user.role === "STAFF";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md shadow-[0_2px_15px_-3px_rgba(15,23,42,0.06)] border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity & Workspace Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href={isStaff ? "/" : "/treasury"}
              className="flex items-center gap-2 group"
            >
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-sm shadow-blue-500/20 flex items-center justify-center shrink-0">
                <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
                  <Wallet className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-blue-600 transition group-hover:scale-105" />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight hidden xs:inline-block">
                    Camp Budget
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium hidden md:block">
                  {isStaff ? "พอร์ทัลสต๊าฟ (Staff Portal)" : "ระบบเหรัญญิก (Treasury)"}
                </span>
              </div>
            </Link>

            {/* Workspace Switcher Component */}
            <div className="border-l border-slate-200 pl-2 sm:pl-3">
              <WorkspaceSwitcher
                user={user}
                workspaces={workspaces}
                activeWorkspace={activeWorkspace || null}
              />
            </div>
          </div>

          {/* Right Section: Compact Controls & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Badge (Locked - No instant switching without logout) */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-xs ${
                isStaff
                  ? "bg-blue-50/80 border-blue-200 text-blue-700"
                  : "bg-indigo-50/80 border-indigo-200 text-indigo-700"
              }`}
            >
              {isStaff ? (
                <>
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] sm:text-xs">Staff ผู้เบิก</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] sm:text-xs">เหรัญญิก (Treasurer)</span>
                </>
              )}
            </div>

            {/* Clickable Profile & PromptPay Button */}
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              title="คลิกเพื่อแก้ไขโปรไฟล์และหมายเลขพร้อมเพย์ (PromptPay)"
              className="flex items-center gap-2 pl-2 sm:pl-2.5 pr-2 py-1 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition cursor-pointer group text-left"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 group-hover:scale-105 transition">
                {currentUserState.name ? currentUserState.name.slice(0, 1).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-800 line-clamp-1 max-w-[100px] sm:max-w-[120px] group-hover:text-blue-600 transition">
                    {currentUserState.name.split(" ")[0]}
                  </span>
                  <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-blue-500 transition" />
                </div>
                <span className="text-[9px] text-slate-500 font-mono line-clamp-1">
                  {currentUserState.promptpayId
                    ? formatPromptPay(currentUserState.promptpayId)
                    : "ตั้งพร้อมเพย์"}
                </span>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="ออกจากระบบ เพื่อสลับบทบาทหรือเปลี่ยนบัญชี"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-600 bg-slate-100/90 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : (
                <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
              )}
              <span className="text-[11px] font-bold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile & PromptPay Update Modal */}
      <UserProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        user={currentUserState}
        onUpdated={({ name: newName, promptpayId: newPromptPay }) => {
          setCurrentUserState((prev) => ({
            ...prev,
            name: newName,
            promptpayId: newPromptPay,
          }));
        }}
      />
    </header>
  );
}
