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
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
