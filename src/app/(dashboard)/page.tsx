import React from "react";
import { redirect } from "next/navigation";
import { getBudgetDashboardData } from "@/actions/budget.actions";
import { getCurrentUser } from "@/actions/user.actions";
import { getActiveWorkspace } from "@/actions/workspace.actions";
import { StaffWorkspace } from "@/components/staff/StaffWorkspace";
import { TreasuryWorkspace } from "@/components/treasury/TreasuryWorkspace";
import { WorkspaceOnboardingWizard } from "@/components/workspace/WorkspaceOnboardingWizard";
import { StaffNoWorkspaceView } from "@/components/staff/StaffNoWorkspaceView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?logout=1");
  }

  const data = await getBudgetDashboardData();
  const activeWorkspace = data.workspace || null;

  // If user is TREASURER:
  if (user.role === "TREASURER") {
    // If no workspace exists yet, show Fresh Onboarding Wizard
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

  // If user is STAFF:
  // If staff has no workspace yet:
  if (!activeWorkspace) {
    return <StaffNoWorkspaceView user={user} />;
  }

  // Staff Portal with active workspace
  return (
    <StaffWorkspace
      user={user}
      claims={data.recentClaims}
      departments={data.departments}
    />
  );
}
