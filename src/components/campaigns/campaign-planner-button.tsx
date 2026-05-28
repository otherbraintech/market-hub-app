"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { generateCampaignContentAction } from "@/actions/campaign-planner";

interface CampaignPlannerButtonProps {
  campaignId: string;
  businessId: string;
  hasContent: boolean;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

const loadingTexts = [
  "Analizando objetivos y segmentación de la campaña...",
  "Buscando las mejores horas de publicación para tu audiencia...",
  "Redactando copys magnéticos con técnicas de copywriting...",
  "Escribiendo guiones de video detallados y storyboards creativos...",
  "Diseñando prompts artísticos para generadores de imágenes por IA...",
  "Estructurando el calendario editorial y programando posts...",
];

export function CampaignPlannerButton({
  campaignId,
  businessId,
  hasContent,
  variant = "default",
  className,
}: CampaignPlannerButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 3000);
    } else {
      setTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handlePlanContent = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Confirmación si ya tiene contenido para evitar sobreescritura accidental
    if (hasContent) {
      const confirmReset = window.confirm(
        "Esta campaña ya tiene contenido planificado en el calendario. ¿Estás seguro de que deseas planificar de nuevo con IA? Esto reemplazará las publicaciones actuales de esta campaña."
      );
      if (!confirmReset) return;
    }

    setIsLoading(true);
    try {
      const res = await generateCampaignContentAction(campaignId);
      if (res.success) {
        toast.success("¡Calendario editorial generado con éxito!");
        router.push(`/calendar?campaignId=${campaignId}`);
        router.refresh();
      } else {
        toast.error(res.error || "Ocurrió un error al planificar la campaña.");
      }
    } catch (err) {
      toast.error("Error al conectar con la IA de planificación.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {hasContent ? (
        <Button
          onClick={handlePlanContent}
          variant="outline"
          size="sm"
          className={`text-xs gap-1 border-violet-200 text-violet-750 dark:border-violet-850 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 font-semibold ${className}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Regenerar IA</span>
        </Button>
      ) : (
        <Button
          onClick={handlePlanContent}
          className={`w-full text-xs font-semibold relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-sm border-0 group px-3 py-1.5 gradient-primary ${className}`}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300 animate-pulse shrink-0" />
          <span>Planificar con IA</span>
        </Button>
      )}

      {/* Pantalla de carga inmersiva glassmorphic */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
          
          <div className="relative p-8 max-w-md w-full bg-card/60 border border-muted/20 rounded-2xl shadow-2xl space-y-6 text-center backdrop-blur-md">
            {/* Animación central premium */}
            <div className="relative flex items-center justify-center h-20">
              <div className="absolute h-18 w-18 rounded-full border-4 border-violet-500/20 animate-ping" />
              <div className="absolute h-16 w-16 rounded-full border-4 border-violet-500/30 animate-pulse" />
              <div className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>

            {/* Mensajes de estado rotativos */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-1.5">
                <Loader2 className="h-4.5 w-4.5 text-violet-600 animate-spin" />
                Diseñando Calendario Editorial
              </h3>
              <p className="text-xs text-muted-foreground font-medium min-h-[32px] px-4 leading-relaxed transition-all duration-500">
                {loadingTexts[textIndex]}
              </p>
            </div>

            {/* Barra de progreso visual */}
            <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full transition-all duration-500"
                style={{ width: `${((textIndex + 1) / loadingTexts.length) * 100}%` }}
              />
            </div>
            
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">
              Gemini 2.0 Flash Marketing Agent
            </span>
          </div>
        </div>
      )}
    </>
  );
}
