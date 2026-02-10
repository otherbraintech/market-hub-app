"use client"

import { useState } from "react";
import { Business } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BusinessForm } from "./business-form";

interface BusinessInfoCardProps {
  business: Business;
}

export function BusinessInfoCard({ business }: BusinessInfoCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <Card className="card-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Información del Negocio</CardTitle>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar {business.name}</DialogTitle>
              <DialogDescription>
                Actualiza los detalles básicos y estratégicos de tu negocio.
              </DialogDescription>
            </DialogHeader>
            <BusinessForm 
              defaultValues={{
                ...business,
                description: business.description || "",
                industry: business.industry || "",
                website: business.website || "",
                brandVoice: (business.brandVoice as any) || { tone: [], personality: [], values: [] },
                targetAudience: (business.targetAudience as any) || { demographics: "", psychographics: "" }
              }}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                window.location.reload();
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Industria</p>
            <p className="font-medium">{business.industry || "No definida"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Website</p>
            <p className="font-medium truncate">{business.website || "No definido"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Descripción</p>
            <p className="text-xs leading-relaxed">{business.description || "Sin descripción."}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
