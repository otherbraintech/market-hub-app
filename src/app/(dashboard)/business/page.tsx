import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BusinessList } from "@/components/business/business-list";
import { CreateBusinessDialog } from "@/components/business/create-business-dialog";
import { EmptyBusinessState } from "@/components/business/empty-business-state";
import { Building2, Plus, Users, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  
  const [businesses, user] = await Promise.all([
    userId ? prisma.business.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            products: true,
            campaigns: true,
            socialAccounts: true
          }
        },
        competitors: {
          select: { id: true, name: true }
        }
      }
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
    <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card dark:bg-[#0D1526] p-8 rounded-2xl border border-border dark:border-cyan-500/15 shadow-lg dark:shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-xl">
              <Building2 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground dark:text-white">
              Gestión de Negocios & Pymes
            </h2>
          </div>
          <p className="text-muted-foreground dark:text-slate-400 text-xs font-medium ml-12">
            Directorio corporativo de marcas, competidores y ejecuciones de agentes IA.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex flex-col gap-2 min-w-[220px]">
            <div className="flex justify-between items-end w-full text-[10.5px] font-extrabold uppercase tracking-widest text-muted-foreground dark:text-slate-400">
              <span>Capacidad del Plan</span>
              <span className={`text-xs ${count >= limit ? "text-rose-600 dark:text-rose-400 font-bold" : "text-cyan-600 dark:text-cyan-400 font-black"}`}>
                {count} / {limit} Clientes
              </span>
            </div>
            <Progress value={percentage} className="h-2 w-full bg-slate-100 dark:bg-slate-900 shadow-inner" />
          </div>
          
          {count > 0 && <div className="h-10 w-px bg-border dark:bg-slate-800 hidden sm:block" />}
          
          {count === 0 ? null : count < limit ? (
            <CreateBusinessDialog />
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted dark:bg-slate-900 rounded-xl text-xs font-bold text-muted-foreground dark:text-slate-400 border border-border dark:border-slate-800">
              <ShieldCheck className="h-4 w-4 text-amber-500 dark:text-amber-400" /> Plan al límite
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
