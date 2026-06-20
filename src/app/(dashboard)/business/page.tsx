import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BusinessList } from "@/components/business/business-list";
import { CreateBusinessDialog } from "@/components/business/create-business-dialog";
import { EmptyBusinessState } from "@/components/business/empty-business-state";
import { Plus, Briefcase } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  
  const [businesses, user] = await Promise.all([
    userId ? prisma.business.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }) : Promise.resolve([]),
    userId ? prisma.user.findUnique({
      where: { id: userId },
      select: { maxBusinesses: true }
    }) : Promise.resolve(null)
  ]);

  const limit = user?.maxBusinesses || 1;
  const count = businesses.length;
  const percentage = Math.min((count / limit) * 100, 100);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card p-8 rounded-3xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-black tracking-tight uppercase italic text-primary/90">Mis Negocios</h2>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-12">
            Gestiona y escala tus perfiles de marca en un solo lugar.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="flex justify-between items-end w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Capacidad del Plan</span>
              <span className={`text-xs ${count >= limit ? "text-destructive" : "text-primary font-black"}`}>
                  {count} / {limit}
              </span>
            </div>
            <Progress value={percentage} className="h-2 w-full bg-muted shadow-inner" />
          </div>
          
          <div className="h-10 w-px bg-border hidden sm:block" />
          
          {count < limit ? (
            <CreateBusinessDialog />
          ) : (
             <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs font-bold text-muted-foreground border border-dashed">
                Plan al límite
             </div>
          )}
        </div>
      </div>

      {businesses.length === 0 ? (
        <EmptyBusinessState />
      ) : (
        <BusinessList businesses={businesses} />
      )}
    </div>
  );
}

