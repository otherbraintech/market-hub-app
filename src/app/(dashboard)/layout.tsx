import { AppSidebar } from "@/components/layout/app-sidebar";
import { getBusinesses, getSelectedBusinessId } from "@/actions/business";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [businesses, selectedId] = await Promise.all([
    getBusinesses(),
    getSelectedBusinessId()
  ]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar businesses={businesses} selectedId={selectedId} />
      <main className="flex-1 overflow-x-hidden bg-background">
        {children}
      </main>
    </div>
  )
}
