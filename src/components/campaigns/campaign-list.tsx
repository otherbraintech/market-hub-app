"use client";

import { useState } from "react";
import { CampaignWithTypes } from "@/modules/campaigns";
import { deleteCampaignAction } from "@/actions/campaign";
import { CampaignForm } from "./campaign-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Megaphone, MoreHorizontal, Trash, Edit, Plus, Calendar, Target } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CampaignFormValues } from "@/lib/schemas/campaign";
import { CampaignStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface CampaignListProps {
  businessId: string;
  campaigns: CampaignWithTypes[];
}

export function CampaignList({ businessId, campaigns }: CampaignListProps) {
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithTypes | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar esta campaña?")) {
      const result = await deleteCampaignAction(id, businessId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    }
  }

  // Mapper simple
  const mapCampaignToForm = (c: CampaignWithTypes): CampaignFormValues & { id: string } => ({
    id: c.id,
    name: c.name,
    description: c.description || undefined,
    objective: c.objective,
    startDate: new Date(c.startDate),
    endDate: c.endDate ? new Date(c.endDate) : undefined,
    budget: c.budget ? Number(c.budget) : undefined,
    channels: c.channels || [],
    status: c.status,
    strategyId: c.strategyId || undefined,
    targeting: c.targeting ? {
        // Mapeo defensivo de targeting si existe
        locations: (c.targeting as any).locations,
        ageRange: (c.targeting as any).ageRange,
        interests: (c.targeting as any).interests,
        customAudiences: (c.targeting as any).customAudiences,
    } : undefined
  });

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
      case "DRAFT": return "text-muted-foreground";
      case "COMPLETED": return "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20";
      case "PAUSED": return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20";
      case "CANCELLED": return "bg-red-500/10 text-red-700 hover:bg-red-500/20";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Campañas de Marketing</h3>
        <Button onClick={() => {
          setEditingCampaign(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Campaña
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-lg bg-muted/20 border-dashed p-8 text-center">
          <div className="p-4 rounded-full bg-background mb-4 shadow-sm">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No hay campañas activas</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Crea campañas para organizar tus generaciones de contenido y medir resultados.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
             <Plus className="mr-2 h-4 w-4" /> Crear Campaña
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Megaphone className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold line-clamp-1" title={campaign.name}>
                        {campaign.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1", getStatusColor(campaign.status))}>
                            {campaign.status}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            {campaign.objective}
                        </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
                      setEditingCampaign(campaign);
                      setIsDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                  {campaign.description || "Sin descripción."}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(campaign.startDate), "d MMM yyyy", { locale: es })} 
                        {campaign.endDate && ` - ${format(new Date(campaign.endDate), "d MMM yyyy", { locale: es })}`}
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingCampaign(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Editar Campaña" : "Nueva Campaña"}</DialogTitle>
            <DialogDescription>
              Planifica tus esfuerzos de marketing.
            </DialogDescription>
          </DialogHeader>
          <CampaignForm 
            businessId={businessId}
            defaultValues={editingCampaign ? mapCampaignToForm(editingCampaign) : undefined} 
            onSuccess={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
