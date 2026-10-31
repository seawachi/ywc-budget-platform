import React from "react";
import { redirect } from "next/navigation";
import { getBudgetDashboardData } from "@/actions/budget.actions";
import { getCurrentUser } from "@/actions/user.actions";
import { getActiveWorkspace } from "@/actions/workspace.actions";
import { TreasuryWorkspace } from "@/components/treasury/TreasuryWorkspace";
import { WorkspaceOnboardingWizard } from "@/components/workspace/WorkspaceOnboardingWizard";

export const dynamic = "force-dynamic";

export default async function TreasuryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?logout=1");
  }

  // Strict RBAC route protection: only Treasurers may access the Treasury Workspace
  if (user.role !== "TREASURER") {
    redirect("/");
  }

  const data = await getBudgetDashboardData();
  const activeWorkspace = data.workspace || null;

  // If the treasurer has no active workspace yet (fresh start!), show the Onboarding Setup Wizard!
  if (!activeWorkspace) {
    return <WorkspaceOnboardingWizard user={user} />;
  }

  return (
    <TreasuryWorkspace
      user={user}
      workspace={activeWorkspace}
      metrics={{
        totalAllocated: data.totalAllocated,
        actualDisbursed: data.actualDisbursed,
        pendingReserved: data.pendingReserved,
        availableBalance: data.availableBalance,
        departments: data.departments,
        claims: data.recentClaims,
      }}
    />
  );
}
