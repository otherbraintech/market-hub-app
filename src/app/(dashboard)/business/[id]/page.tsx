import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BusinessHeader } from "@/components/business/business-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listProductsByBusiness } from "@/modules/products";
import { listCampaignsByBusiness } from "@/modules/campaigns";
import { listSocialAccounts } from "@/modules/publishing";
import { BusinessInfoCard } from "@/components/business/business-info-card";
import { BusinessExtraInfoCard } from "@/components/business/business-extra-info-card";
import { ScrapingReportDialog } from "@/components/business/scraping-report-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Target } from "lucide-react";

import { AgentPipelineMonitor } from "@/components/business/agent-pipeline-monitor";

export default async function BusinessDetailPage({ 
  params,
}: { 
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
          campaigns: true,
          socialAccounts: true,
        }
      },
      competitors: true
    }
  });

  if (!business) {
    notFound();
  }

  // Authorization check: ensure the business belongs to the current user
  if (business.userId !== session.user.id) {
    redirect("/business");
  }

  // Fetch products, campaigns, social accounts and contents sequentially to prevent DB pool connection failures
  const productsData = await listProductsByBusiness(business.id);
  const campaignsData = await listCampaignsByBusiness(business.id);
  const socialAccounts = await listSocialAccounts(business.id);
  const contents = await prisma.content.findMany({
    where: { campaign: { businessId: business.id } },
    include: {
      campaign: { select: { name: true } },
      socialAccount: { select: { accountName: true } },
    },
    orderBy: { scheduledAt: 'asc' }
  });

  // Fetch latest analysis report for this business
  const myAnalysis = await prisma.analysisReport.findFirst({
    where: { entityId: business.id, type: "MY_BUSINESS", status: "COMPLETED" },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch active strategy for AI generation
  const activeStrategy = await prisma.marketingStrategy.findFirst({
    where: { businessId: business.id, isActive: true },
    select: { id: true }
  });

  const userLimit = await prisma.user.findUnique({
    where: { id: business.userId || '' },
    select: { maxCompetitors: true }
  });

  const { products } = productsData;
  const { campaigns } = campaignsData;

  const campaignsBrief = campaigns.map(c => ({ id: c.id, name: c.name }));
  const productsBrief = products.map(p => ({ id: p.id, name: p.name }));
  const socialAccountsBrief = socialAccounts.map(a => ({ id: a.id, accountName: a.accountName, channel: a.channel }));

  return (
    <div className="flex flex-col h-full bg-background pb-12">
      <BusinessHeader business={business} />
      
      <div className="flex-1 p-8 pt-6 space-y-8 max-w-[1200px]">
        {/* Monitor de Pipeline de Agentes IA */}
        <AgentPipelineMonitor businessId={business.id} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h2 className="text-3xl font-black tracking-tight mb-2">Resumen de Negocio</h2>
             <p className="text-muted-foreground">Estado actual y métricas generales de {business.name}.</p>
          </div>
          <div className="flex gap-3">
             {myAnalysis && (
               <ScrapingReportDialog data={myAnalysis.data as any} channel={myAnalysis.channel} />
             )}
             <Button asChild variant="outline" className="gap-2">
               <Link href={`/business/${id}/analysis`} className="flex items-center gap-2">
                 <Target className="h-4 w-4 text-purple-500" />
                 Análisis de Mi Negocio
               </Link>
             </Button>
             <Button asChild variant="outline" className="gap-2">
               <Link href="/competitors/analysis" className="flex items-center gap-2">
                 <Users className="h-4 w-4 text-blue-500" />
                 Ver Competencia
               </Link>
             </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="card-shadow border-none bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{business._count.products}</div>
              <p className="text-xs text-muted-foreground mt-1">Productos registrados</p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-none bg-emerald-50/50 dark:bg-emerald-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{business._count.campaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">Campañas activas</p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-none bg-purple-50/50 dark:bg-purple-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                Social
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{business._count.socialAccounts}</div>
              <p className="text-xs text-muted-foreground mt-1">Cuentas vinculadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <BusinessExtraInfoCard 
              businessId={business.id}
              initialPhoneNumbers={business.phoneNumbers}
              initialLocation={business.location}
              initialSocialLinks={business.socialLinks as any}
              initialCompetitors={business.competitors as any}
              maxCompetitors={userLimit?.maxCompetitors ?? 3}
            />
           <BusinessInfoCard business={business} />
        </div>
      </div>
    </div>
  );
}
