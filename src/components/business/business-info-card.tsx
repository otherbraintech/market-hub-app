"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BusinessInfoCardProps {
  business: any;
}

export function BusinessInfoCard({ business }: BusinessInfoCardProps) {
  return (
    <Card className="card-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Información del Negocio</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
          <Link href={`/business/create?businessId=${business.id}&edit=true`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="border-t pt-4 space-y-4">
          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">Identidad de Marca</p>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Tono</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(business.brandVoice as any)?.tone?.map((t: string) => (
                    <span key={t} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-medium">{t}</span>
                  )) || <span className="text-[10px] text-muted-foreground">No definido</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Personalidad</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(business.brandVoice as any)?.personality?.map((p: string) => (
                    <span key={p} className="px-1.5 py-0.5 bg-secondary/20 text-secondary-foreground text-[10px] rounded-md font-medium">{p}</span>
                  )) || <span className="text-[10px] text-muted-foreground">No definido</span>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">Audiencia Objetivo</p>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Demografía</p>
                <p className="text-[11px] leading-snug">{(business.targetAudience as any)?.demographics || "No definida"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Psicografía</p>
                <p className="text-[11px] leading-snug">{(business.targetAudience as any)?.psychographics || "No definida"}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
