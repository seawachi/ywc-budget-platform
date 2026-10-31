"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Role, WorkspaceDTO } from "@/types/receipt";
import { setActiveWorkspaceId } from "@/actions/workspace.actions";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WorkspaceOnboardingWizard } from "./WorkspaceOnboardingWizard";
import {
  FolderKanban,
  Check,
  Plus,
  ChevronDown,
  Building,
} from "lucide-react";

interface WorkspaceSwitcherProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    promptpayId?: string | null;
  };
  workspaces: WorkspaceDTO[];
  activeWorkspace: WorkspaceDTO | null;
}

export function WorkspaceSwitcher({
  user,
  workspaces,
  activeWorkspace,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isTreasurer = user.role === "TREASURER";

  const handleSelectWorkspace = (id: string) => {
    if (activeWorkspace && id === activeWorkspace.id) {
      setDropdownOpen(false);
      return;
    }

    startTransition(async () => {
      await setActiveWorkspaceId(id);
      setDropdownOpen(false);
      router.refresh();
    });
  };

  // If there are no workspaces yet
  if (!activeWorkspace || workspaces.length === 0) {
    if (!isTreasurer) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-xl text-xs text-slate-500 font-medium">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span>ยังไม่มีค่าย</span>
        </div>
      );
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ สร้าง Workspace แรก</span>
        </button>

        {modalOpen && (
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent
              className="w-[95vw] max-w-4xl p-2 sm:p-4 bg-transparent shadow-none border-none max-h-[95vh] overflow-y-auto"
              onClose={() => setModalOpen(false)}
            >
              <WorkspaceOnboardingWizard
                user={user}
                onComplete={() => setModalOpen(false)}
                isModal
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Workspace Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-bold text-slate-800 transition shadow-inner cursor-pointer"
        title="สลับ Workspace หรือสร้างใหม่"
      >
        <FolderKanban className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="truncate max-w-[110px] sm:max-w-[150px] md:max-w-[180px]">
          {activeWorkspace.name}
        </span>
        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-bold shrink-0">
          {(Number(activeWorkspace.totalBudget || 0) / 1000).toFixed(0)}k ฿
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />

          <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Workspaces ({workspaces.length})
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                คลิกเพื่อสลับค่าย
              </span>
            </div>

            {/* List of Workspaces */}
            <div className="py-1 max-h-56 overflow-y-auto space-y-1">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspace.id;

                return (
                  <button
                    key={ws.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2 group cursor-pointer ${
                      isActive
                        ? "bg-blue-50 text-blue-900 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs truncate block font-bold group-hover:text-blue-600">
                          {ws.name}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        งบ {formatCurrency(ws.totalBudget)}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isActive ? (
                        <Check className="w-4 h-4 text-blue-600" />
                      ) : (
                        <span className="text-[10px] text-slate-300 group-hover:text-slate-600">
                          สลับ
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create New Workspace Button (Only for Treasurer) */}
            {isTreasurer && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ สร้าง Workspace ใหม่ (New Workspace)</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CREATE WORKSPACE WIZARD MODAL (TREASURER ONLY) */}
      {modalOpen && isTreasurer && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent
            className="w-[95vw] max-w-4xl p-2 sm:p-4 bg-transparent shadow-none border-none max-h-[95vh] overflow-y-auto"
            onClose={() => setModalOpen(false)}
          >
            <WorkspaceOnboardingWizard
              user={user}
              onComplete={() => setModalOpen(false)}
              isModal
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
