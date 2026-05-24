import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Calendar as CalendarIcon, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

import { getSelectedBusinessId } from "@/actions/business";

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

  const campaigns = await prisma.campaign.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      business: { select: { name: true } },
      _count: { select: { contents: true } }
    },
    orderBy: { startDate: "desc" }
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campañas Activas</h1>
          <p className="text-muted-foreground">Monitorea y gestiona tus campañas de marketing en ejecución.</p>
        </div>
        <Button className="gradient-primary">
          <Plus className="mr-2 h-4 w-4" /> Nueva Campaña
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Campañas</span>
            </div>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Activas Ahora</span>
            </div>
            <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'ACTIVE').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Programadas</span>
            </div>
            <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'SCHEDULED').length}</div>
          </CardContent>
        </Card>
      </div>

      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">No hay campañas aún</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            Las campañas agrupan contenidos con un objetivo específico. Crea una para empezar.
          </p>
          <Button variant="outline" className="mt-6">
            Nueva campaña
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[campaign.status]}>
                      {campaign.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{campaign.business.name}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl mb-4">
                    {campaign.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      {format(new Date(campaign.startDate), "d MMM", { locale: es })} - {campaign.endDate ? format(new Date(campaign.endDate), "d MMM yyyy", { locale: es }) : "Continuo"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      {campaign.objective}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {campaign._count.contents} Contenidos
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 p-6 md:w-64 border-t md:border-t-0 md:border-l flex flex-col justify-between">
                   <div className="space-y-2">
                     <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Presupuesto</p>
                     <p className="text-lg font-bold">{campaign.budget ? `$${campaign.budget.toString()}` : "No definido"}</p>
                   </div>
                   <div className="space-y-2 mt-4">
                     <Button 
                       className="w-full" 
                       variant="default" 
                       size="sm"
                       onClick={() => {
                         // TODO: Implement AI suggestions modal
                         alert('Función de sugerencias IA próximamente disponible');
                       }}
                     >
                       <Sparkles className="h-4 w-4 mr-2" />
                       Sugerencias IA
                     </Button>
                     <Link href={`/business/${campaign.businessId}`}>
                       <Button className="w-full" variant="outline" size="sm">Ver Campaña</Button>
                     </Link>
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
