"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Calendar as CalendarIcon, Users, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import CreateCampaignModal from "@/components/campaigns/create-campaign-modal";
import { DeleteCampaignButton } from "@/components/campaigns/delete-campaign-button";
import { CampaignPlannerButton } from "@/components/campaigns/campaign-planner-button";
import { ViewCampaignModal } from "@/components/campaigns/view-campaign-modal";

interface CampaignsClientPageProps {
  initialCampaigns: any[];
  selectedBusinessId: string;
  businessName: string;
}

export function CampaignsClientPage({
  initialCampaigns,
  selectedBusinessId,
  businessName,
}: CampaignsClientPageProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const router = useRouter();

  // Mapeo de colores de estado de campañas
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-800",
    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800",
    ACTIVE: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-800",
    COMPLETED: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800",
  };

  const statusTranslations: Record<string, string> = {
    DRAFT: "Borrador",
    SCHEDULED: "Programada",
    ACTIVE: "Activa",
    PAUSED: "Pausada",
    COMPLETED: "Completada",
  };

  // Efecto para autogenerar las 6 campañas y planificaciones si no hay ninguna
  useEffect(() => {
    if (initialCampaigns.length === 0 && !isAutoGenerating) {
      const runAutoGeneration = async () => {
        try {
          setIsAutoGenerating(true);
          const res = await fetch(`/api/business/${selectedBusinessId}/auto-generate-cascade`, {
            method: "POST"
          });
          if (res.ok) {
            toast.success("¡Circuito de marketing automatizado con éxito!");
            window.location.reload();
          } else {
            setIsAutoGenerating(false);
          }
        } catch (error) {
          console.error("Error running auto cascade:", error);
          setIsAutoGenerating(false);
        }
      };
      runAutoGeneration();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerateAll = async () => {
    try {
      setIsAutoGenerating(true);
      const res = await fetch(`/api/business/${selectedBusinessId}/auto-generate-cascade`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("¡Campaña y calendario regenerados con éxito!");
        window.location.reload();
      } else {
        toast.error("Error al regenerar el circuito.");
        setIsAutoGenerating(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error inesperado al intentar regenerar.");
      setIsAutoGenerating(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campañas de Marketing: {businessName}</h1>
          <p className="text-muted-foreground text-sm">Monitorea y previsualiza las campañas sincronizadas con tus estrategias.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRegenerateAll}
            disabled={isAutoGenerating}
            className="text-xs font-semibold gap-1.5 border-violet-200 bg-violet-50/50 text-violet-700 hover:bg-violet-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAutoGenerating ? 'animate-spin' : ''}`} />
            Regenerar Circuito IA (6 Campañas)
          </Button>
          <CreateCampaignModal businessId={selectedBusinessId} />
        </div>
      </div>

      {isAutoGenerating ? (
        <Card className="border border-violet-100 dark:border-violet-950 bg-gradient-to-br from-violet-50/40 via-white to-white shadow-sm flex flex-col items-center justify-center py-32 text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-200/40 rounded-full blur-2xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-spin duration-3000">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-3 max-w-md">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Creando tu circuito de marketing (6 Campañas)...
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              La IA está estructurando 6 campañas temáticas asociadas a tus estrategias e insertando publicaciones de calendario automáticas para que las puedas ver organizadas por días y redes sociales.
            </CardDescription>
          </div>
        </Card>
      ) : (
        <>
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

          {/* LISTADO DE CAMPAÑAS */}
          {campaigns.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-muted/50 bg-muted/5 rounded-2xl">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">No hay campañas de marketing aún</h2>
              <p className="text-muted-foreground max-w-sm mt-2 text-xs leading-relaxed">
                Espera un momento mientras el circuito automatizado inicializa tus campañas, o créalas tú mismo manualmente.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-md border border-muted/40 transition-shadow duration-300">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${statusColors[campaign.status]} text-[10px] font-bold border`}>
                          {statusTranslations[campaign.status] || campaign.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{campaign.business.name}</span>
                        {campaign.strategy?.name && (
                          <Badge variant="secondary" className="text-[9px] bg-violet-100 text-violet-700 border-none font-semibold">
                            {campaign.strategy.name}
                          </Badge>
                        )}
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
                          {campaign._count.contents} Publicaciones planificadas
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
                        <div className="flex flex-wrap gap-1.5 w-full">
                          <div className="flex-1 min-w-[70px]">
                            <ViewCampaignModal campaign={campaign} />
                          </div>
                          <div className="flex-1 min-w-[70px]">
                            <CreateCampaignModal 
                              businessId={selectedBusinessId} 
                              editCampaignId={campaign.id} 
                              initialCampaignData={campaign}
                              trigger={
                                <Button className="w-full text-xs font-semibold" variant="outline" size="sm">
                                  Editar
                                </Button>
                              }
                            />
                          </div>
                          <DeleteCampaignButton campaignId={campaign.id} businessId={campaign.businessId} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
