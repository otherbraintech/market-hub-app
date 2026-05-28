import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Calendar as CalendarIcon, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

import { getSelectedBusinessId } from "@/actions/business";
import CreateCampaignModal from "@/components/campaigns/create-campaign-modal";
import { DeleteCampaignButton } from "@/components/campaigns/delete-campaign-button";
import { CampaignPlannerButton } from "@/components/campaigns/campaign-planner-button";
import { ViewCampaignModal } from "@/components/campaigns/view-campaign-modal";

export default async function CampaignsPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Por favor, selecciona un negocio en la barra lateral para ver sus campañas activas.
        </p>
      </div>
    );
  }

  const rawCampaigns = await prisma.campaign.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      business: { select: { name: true } },
      strategy: { select: { name: true } },
      _count: { select: { contents: true } }
    },
    orderBy: { startDate: "desc" }
  });

  const business = await prisma.business.findUnique({
    where: { id: selectedBusinessId },
    select: { name: true }
  });
  const businessName = business?.name || "";

  const campaigns = rawCampaigns.map((c) => ({
    ...c,
    budget: c.budget ? Number(c.budget.toString()) : null,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate ? c.endDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-800",
    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800",
    ACTIVE: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-800",
    COMPLETED: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800",
  };

  return (
    <div className="p-8 space-y-8">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campañas Activas: {businessName}</h1>
          <p className="text-muted-foreground text-sm">Monitorea, genera y gestiona tus campañas de marketing de alto rendimiento.</p>
        </div>
        <div className="flex items-center gap-3">
          <CreateCampaignModal businessId={selectedBusinessId} />
        </div>
      </div>

      {/* METRICAS RAPIDAS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20 hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Campañas</span>
            </div>
            <div className="text-3xl font-black tracking-tight">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activas Ahora</span>
            </div>
            <div className="text-3xl font-black tracking-tight">{campaigns.filter(c => c.status === 'ACTIVE').length}</div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Programadas</span>
            </div>
            <div className="text-3xl font-black tracking-tight">{campaigns.filter(c => c.status === 'SCHEDULED').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* LISTADO O ESTADO VACIO */}
      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-muted/50 bg-muted/5 rounded-2xl">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold">No hay campañas de marketing aún</h2>
          <p className="text-muted-foreground max-w-sm mt-2 text-xs leading-relaxed">
            Las campañas agrupan tus publicaciones, copys e ideas bajo un objetivo de negocio unificado. 
            ¡Deja que nuestra IA te sugiera ideas de campañas ganadoras ahora mismo!
          </p>
          <div className="flex items-center gap-3 mt-6">
            <CreateCampaignModal businessId={selectedBusinessId} />
            <CreateCampaignModal 
              businessId={selectedBusinessId} 
              initialAiMode={false}
              trigger={
                <Button variant="outline" className="text-xs font-semibold">
                  Nueva campaña manual
                </Button>
              }
            />
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden hover:shadow-md border border-muted/40 transition-shadow duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${statusColors[campaign.status]} text-[10px] font-bold border`}>
                      {campaign.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{campaign.business.name}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-black tracking-tight mb-1">{campaign.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl">
                      {campaign.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-[11px] pt-1 font-medium">
                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {format(new Date(campaign.startDate), "d MMM", { locale: es })} - {campaign.endDate ? format(new Date(campaign.endDate), "d MMM yyyy", { locale: es }) : "Continuo"}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                      <Target className="h-3.5 w-3.5" />
                      {campaign.objective}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                      <Users className="h-3.5 w-3.5" />
                      {campaign._count.contents} Contenidos
                    </div>
                  </div>
                </div>

                <div className="bg-muted/10 p-6 md:w-64 border-t md:border-t-0 md:border-l border-muted/20 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Presupuesto Asignado</p>
                    <p className="text-xl font-black text-foreground">{campaign.budget ? `$${campaign.budget.toString()} USD` : "No definido"}</p>
                  </div>
                  <div className="space-y-2">
                    {campaign._count.contents === 0 ? (
                      <CampaignPlannerButton campaignId={campaign.id} businessId={campaign.businessId} hasContent={false} />
                    ) : (
                      <Link href={`/calendar?campaignId=${campaign.id}`} className="block w-full">
                        <Button className="w-full text-xs font-semibold relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-sm border-0 group px-3 py-1.5 gradient-primary">
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-white shrink-0" />
                          <span>Ver Calendario</span>
                        </Button>
                      </Link>
                    )}
                    <div className="flex gap-1.5 w-full">
                      <div className="flex-1">
                        <ViewCampaignModal campaign={campaign} />
                      </div>
                      {campaign._count.contents > 0 && (
                        <div className="flex-1">
                          <CampaignPlannerButton campaignId={campaign.id} businessId={campaign.businessId} hasContent={true} className="w-full" />
                        </div>
                      )}
                      <DeleteCampaignButton campaignId={campaign.id} businessId={campaign.businessId} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
