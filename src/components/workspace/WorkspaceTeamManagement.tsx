"use client";

import React, { useState, useEffect } from "react";
import {
  getWorkspaceMembers,
  addWorkspaceMemberByEmail,
  removeWorkspaceMember,
  approveWorkspaceJoinRequest,
  rejectWorkspaceJoinRequest,
} from "@/actions/workspace.actions";
import { WorkspaceMemberDTO, Role } from "@/types/receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  User,
  Scale,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  Clock,
  Loader2,
} from "lucide-react";

interface WorkspaceTeamManagementProps {
  workspaceId: string;
  workspaceName: string;
  currentUser: {
    id: string;
    email: string;
    role: Role;
  };
}

export function WorkspaceTeamManagement({
  workspaceId,
  workspaceName,
  currentUser,
}: WorkspaceTeamManagementProps) {
  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Invite Form State
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("TREASURER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const pendingMembers = members.filter((m) => m.status === "PENDING");
  const activeMembers = members.filter((m) => m.status !== "PENDING");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getWorkspaceMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  const handleApprove = async (memberId: string, memberName: string) => {
    setProcessingMemberId(memberId);
    setFeedback(null);
    try {
      const res = await approveWorkspaceJoinRequest({ workspaceId, memberId });
      if (res.success) {
        setFeedback({
          type: "success",
          text: `อนุมัติคำขอของ "${memberName || res.memberName}" เรียบร้อยแล้ว สมาชิกสามารถเข้าใช้งานค่ายได้ทันที`,
        });
        await fetchMembers();
      } else {
        setFeedback({ type: "error", text: res.error || "ไม่สามารถอนุมัติได้" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "เกิดข้อผิดพลาดในการอนุมัติ" });
    } finally {
      setProcessingMemberId(null);
    }
  };

  const handleReject = async (memberId: string, memberName: string) => {
    if (!confirm(`ต้องการปฏิเสธคำขอเข้าร่วมค่ายของ ${memberName} หรือไม่?`)) return;
    setProcessingMemberId(memberId);
    setFeedback(null);
    try {
      const res = await rejectWorkspaceJoinRequest({ workspaceId, memberId });
      if (res.success) {
        setFeedback({
          type: "success",
          text: `ปฏิเสธคำขอของ "${memberName}" เรียบร้อยแล้ว`,
        });
        await fetchMembers();
      } else {
        setFeedback({ type: "error", text: res.error || "ไม่สามารถปฏิเสธได้" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "เกิดข้อผิดพลาดในการปฏิเสธ" });
    } finally {
      setProcessingMemberId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await addWorkspaceMemberByEmail({
        workspaceId,
        email,
        role,
      });

      if (res.success && res.member) {
        setSuccessMsg(`เชิญ ${email} เรียบร้อยแล้ว!`);
        setEmail("");
        fetchMembers();
        setTimeout(() => {
          setSuccessMsg("");
          setInviteModalOpen(false);
        }, 1200);
      } else {
        setErrorMsg(res.error || "ไม่สามารถเชิญสมาชิกได้");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!confirm(`ต้องการนำ ${memberEmail} ออกจาก Workspace หรือไม่?`)) return;

    try {
      const res = await removeWorkspaceMember({ workspaceId, memberId });
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        alert(res.error || "ไม่สามารถลบสมาชิกได้");
      }
    } catch (err: any) {
      alert(err?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-100 space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>การจัดการทีมงาน (Team by Gmail)</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            สมาชิกและสิทธิ์ใน {workspaceName}
          </h2>
          <p className="text-xs text-slate-500">
            เชิญทีมงานเหรัญญิก (Treasurer) หรือสต๊าฟ (Staff) ด้วย Gmail เพื่อให้เข้าถึง Workspace นี้
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchMembers}
            disabled={loading}
            className="h-9 px-3 rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>รีเฟรช</span>
          </Button>

          <Button
            type="button"
            onClick={() => {
              setErrorMsg("");
              setSuccessMsg("");
              setEmail("");
              setInviteModalOpen(true);
            }}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>เชิญสมาชิกด้วย Gmail</span>
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Join Requests Section */}
      {pendingMembers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-4 h-4 animate-pulse text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>คำขอเข้าร่วมค่ายรอการอนุมัติ (Pending Join Requests)</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 text-[10px] font-black">
                    {pendingMembers.length} คำขอ
                  </span>
                </h3>
                <p className="text-[11px] text-amber-700/80">
                  สต๊าฟที่กรอกรหัสค่ายจะยังไม่สามารถเข้าใช้งานได้จนกว่าเหรัญญิกจะกดอนุมัติที่นี่
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-amber-200/60 bg-white/95 rounded-xl border border-amber-200/60 overflow-hidden shadow-xs">
            {pendingMembers.map((m) => {
              const isProcessing = processingMemberId === m.id;
              return (
                <div
                  key={m.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{m.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          รอเหรัญญิกอนุมัติ
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                        <span>{m.email}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">
                          ส่งคำขอเมื่อ{" "}
                          {new Date(m.createdAt).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isProcessing}
                      onClick={() => handleReject(m.id, m.name)}
                      className="h-8 px-3 rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 gap-1.5 font-bold cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>ปฏิเสธ</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleApprove(m.id, m.name)}
                      className="h-8 px-4 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold shadow-sm shadow-emerald-600/20 cursor-pointer"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>อนุมัติเข้าร่วม</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="overflow-x-auto">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-slate-700">
            สมาชิกที่ได้รับการอนุมัติ ({activeMembers.length} คน)
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pl-2">สมาชิก (Member)</th>
              <th className="pb-3">Gmail / Email</th>
              <th className="pb-3">บทบาท (Role)</th>
              <th className="pb-3">สถานะ (Status)</th>
              <th className="pb-3 text-right pr-2">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeMembers.map((m) => {
              const isCurrentUser = m.userId === currentUser.id;

              return (
                <tr key={m.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                          m.role === "TREASURER"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {m.role === "TREASURER" ? (
                          <Scale className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="font-bold text-slate-800">
                        {m.name} {isCurrentUser && <span className="text-slate-400">(คุณ)</span>}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 font-mono text-slate-600">{m.email}</td>

                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.role === "TREASURER"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {m.role === "TREASURER" ? "Treasurer (เหรัญญิก)" : "Staff (ผู้เบิก)"}
                    </span>
                  </td>

                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-3 h-3" />
                      <span>อนุมัติแล้ว</span>
                    </span>
                  </td>

                  <td className="py-3 text-right pr-2">
                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id, m.email)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                        title="นำออกจาก Workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {activeMembers.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  ยังไม่มีสมาชิกที่ได้รับการอนุมัติใน Workspace นี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl" onClose={() => setInviteModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <span>เชิญสมาชิกเข้าร่วม Workspace ด้วย Gmail</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 pt-3">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ที่อยู่อีเมล หรือ Gmail *</label>
              <Input
                type="email"
                required
                placeholder="colleague@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">บทบาทและสิทธิ์ (Role) *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TREASURER">เหรัญญิก (Treasurer - ตรวจบิล & จ่ายเงิน)</option>
                <option value="STAFF">สต๊าฟ (Staff - สแกนและส่งบิลเบิกเงิน)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInviteModalOpen(false)}
                className="h-9 rounded-xl text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {isSubmitting ? "กำลังส่งคำเชิญ..." : "ยืนยันการเชิญ"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
