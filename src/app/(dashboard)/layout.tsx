import React from "react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/actions/user.actions";
import { getUserWorkspaces, getActiveWorkspace } from "@/actions/workspace.actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?logout=1");
  }

  const workspaces = await getUserWorkspaces();
  const activeWorkspace = await getActiveWorkspace(workspaces);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        user={user}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        Camp & Club Budget Tracker • ระบบบริหารจัดการงบค่ายและเบิกจ่ายเงินอัตโนมัติด้วย AI
      </footer>
    </div>
  );
}
