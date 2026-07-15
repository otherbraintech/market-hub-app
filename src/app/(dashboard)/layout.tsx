import { AppSidebar } from "@/components/app-sidebar"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getBusinesses, getSelectedBusinessId } from "@/actions/business";
import { getSession } from "@/lib/auth";
import { BusinessRedirector } from "@/components/business/business-redirector";
import { SessionWatcher } from "@/components/auth/session-watcher";
import { triggerMissingCompetitorAnalyses } from "@/app/(dashboard)/business/[id]/competitor-actions";
import { RoleAccessGuard } from "@/components/auth/role-access-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [businesses, selectedId, session] = await Promise.all([
    getBusinesses(),
    getSelectedBusinessId(),
    getSession()
  ]);

  if (selectedId) {
    triggerMissingCompetitorAnalyses(selectedId).catch((err) => {
      console.error("Error triggering missing competitor analyses on layout load:", err);
    });
  }

  console.log("DashboardLayout Data:", { 
    businessesCount: businesses.length, 
    selectedId,
    session: session ? { username: session.username, email: session.email } : null
  });

  return (
    <SidebarProvider>
      <SessionWatcher initialExpired={!session} />
      <BusinessRedirector hasBusinesses={businesses.length > 0} />
      <AppSidebar businesses={businesses} selectedId={selectedId} session={session} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-card/20 pr-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DynamicBreadcrumb />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {session ? (
            <RoleAccessGuard role={session.user?.role}>
              {children}
            </RoleAccessGuard>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
