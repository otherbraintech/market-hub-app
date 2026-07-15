"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Sparkles, Check, Users, ArrowRight, ArrowLeft, Bot, Globe, 
  Facebook, Instagram, Terminal, Cpu, Loader2, Landmark 
} from "lucide-react";
import { AgentPipelineMonitor } from "@/components/business/agent-pipeline-monitor";
import { saveMultipleCompetitorsAction } from "@/app/(dashboard)/business/[id]/competitor-actions";

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [currentStep, setCurrentStep] = useState(2); // Start at Step 2: Competitors (Step 1 is Business creation)
  const [competitorStep, setCompetitorStep] = useState(1); // 1, 2, or 3 competitor
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");

  // 3 Competitors states
  const [comp1, setComp1] = useState({ name: "", website: "", facebook: "", instagram: "", tiktok: "" });
  const [comp2, setComp2] = useState({ name: "", website: "", facebook: "", instagram: "", tiktok: "" });
  const [comp3, setComp3] = useState({ name: "", website: "", facebook: "", instagram: "", tiktok: "" });

  useEffect(() => {
    if (!businessId) return;
    const fetchBusiness = async () => {
      try {
        const res = await fetch(`/api/business/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.business) {
            setBusinessName(data.business.name);
          }
        }
      } catch (err) {
        console.error("Error fetching business info:", err);
      }
    };
    fetchBusiness();
  }, [businessId]);

  const TikTokIcon = ({ className }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );

  const getCompState = (num: number) => {
    if (num === 1) return { val: comp1, set: setComp1 };
    if (num === 2) return { val: comp2, set: setComp2 };
    return { val: comp3, set: comp3Setter };
  };

  const comp3Setter = (val: any) => {
    setComp3(val);
  };

  const handleNextCompetitor = () => {
    const { val } = getCompState(competitorStep);
    if (!val.name || val.name.trim() === "") {
      toast.error(`Por favor ingresa al menos el nombre del Competidor ${competitorStep}`);
      return;
    }
    setCompetitorStep((prev) => prev + 1);
  };

  const handlePrevCompetitor = () => {
    setCompetitorStep((prev) => prev - 1);
  };

  const handleFinishCompetitors = async () => {
    // Validate current competitor first
    const { val } = getCompState(competitorStep);
    if (!val.name || val.name.trim() === "") {
      toast.error(`Por favor ingresa al menos el nombre del Competidor ${competitorStep}`);
      return;
    }

    setLoading(true);
    try {
      const list = [comp1, comp2, comp3].filter(c => c.name.trim() !== "");
      const res = await saveMultipleCompetitorsAction(businessId, list);
      if (res.success) {
        toast.success("¡Competidores registrados e inicio de análisis exitoso!");
        setCurrentStep(3); // Transition to real-time monitor
      } else {
        toast.error(res.error || "Ocurrió un error al guardar");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado al guardar los competidores");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOrForceFinish = async () => {
    // Save whatever has a name, even if it's less than 3
    setLoading(true);
    try {
      const list = [comp1, comp2, comp3].filter(c => c.name.trim() !== "");
      if (list.length === 0) {
        // If they enter nothing, just transition to step 3 or let them configure
        toast.info("Saltando configuración de competidores.");
        setCurrentStep(3);
        return;
      }
      const res = await saveMultipleCompetitorsAction(businessId, list);
      if (res.success) {
        toast.success("Competidores guardados.");
        setCurrentStep(3);
      } else {
        toast.error(res.error || "Error al guardar");
      }
    } catch (e) {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const renderCompetitorForm = (num: number, data: typeof comp1, setData: React.Dispatch<React.SetStateAction<typeof comp1>>) => {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Competidor *</Label>
          <Input 
            placeholder="Ej. Competidor Local S.A." 
            value={data.name} 
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-4.5 w-4.5 text-primary" /> Sitio Web (Opcional)
          </Label>
          <Input 
            placeholder="https://competidor.com" 
            value={data.website} 
            onChange={(e) => setData({ ...data, website: e.target.value })}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-dashed mt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Redes Sociales (Opcional)</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Facebook" 
                value={data.facebook}
                onChange={(e) => setData({ ...data, facebook: e.target.value })}
                className="h-9 pl-9 text-xs rounded-lg bg-background" 
              />
            </div>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Instagram" 
                value={data.instagram}
                onChange={(e) => setData({ ...data, instagram: e.target.value })}
                className="h-9 pl-9 text-xs rounded-lg bg-background" 
              />
            </div>
            <div className="relative">
              <TikTokIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="TikTok" 
                value={data.tiktok}
                onChange={(e) => setData({ ...data, tiktok: e.target.value })}
                className="h-9 pl-9 text-xs rounded-lg bg-background" 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Indicador de pasos generales */}
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            <Check className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paso 1</span>
            <span className="text-[11px] font-bold text-muted-foreground">Negocio Creado</span>
          </div>
        </div>
        <div className="flex-1 h-0.5 bg-muted mx-4 relative rounded-full">
          <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${currentStep >= 2 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-115 shadow-md' : currentStep > 2 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
            {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paso 2</span>
            <span className={`text-[11px] font-bold transition-colors ${currentStep === 2 ? 'text-primary' : 'text-muted-foreground'}`}>Competidores</span>
          </div>
        </div>
        <div className="flex-1 h-0.5 bg-muted mx-4 relative rounded-full">
          <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${currentStep === 3 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${currentStep === 3 ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-115 shadow-md' : 'bg-muted text-muted-foreground'}`}>
            3
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paso 3</span>
            <span className={`text-[11px] font-bold transition-colors ${currentStep === 3 ? 'text-primary' : 'text-muted-foreground'}`}>Monitoreo IA</span>
          </div>
        </div>
      </div>

      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Cabecera del paso de competidores */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/50 p-6 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl" />
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950 rounded-xl flex items-center justify-center text-orange-650 shrink-0 border border-orange-200">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 rounded-full">Paso Requerido</span>
                  <span className="text-xs font-bold text-muted-foreground">
                    Competidor {competitorStep} de 3
                  </span>
                </div>
                <h5 className="text-base font-bold text-foreground">
                  Registra tu competencia directa para {businessName || "tu negocio"}
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                  Para que la IA de MarketHub diseñe una estrategia verdaderamente adaptada a tu mercado, necesitamos analizar la huella digital de tus principales rivales comerciales.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-orange-600" />
                  <span>Datos de Competidor {competitorStep}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Por favor, ingresa los datos básicos y enlaces digitales de tu rival número {competitorStep}.
                </CardDescription>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((stepIdx) => (
                  <div 
                    key={stepIdx} 
                    className={`h-2.5 w-8 rounded-full transition-all duration-300 ${
                      competitorStep === stepIdx 
                        ? 'bg-orange-500 scale-110 shadow-sm' 
                        : competitorStep > stepIdx 
                        ? 'bg-emerald-500' 
                        : 'bg-muted'
                    }`} 
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {competitorStep === 1 && renderCompetitorForm(1, comp1, setComp1)}
              {competitorStep === 2 && renderCompetitorForm(2, comp2, setComp2)}
              {competitorStep === 3 && renderCompetitorForm(3, comp3, setComp3)}

              <div className="flex items-center justify-between mt-8 border-t pt-4">
                {competitorStep > 1 ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePrevCompetitor} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleSkipOrForceFinish} 
                    disabled={loading}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    Omitir por ahora
                  </Button>
                )}

                <div className="flex gap-2">
                  {competitorStep < 3 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleSkipOrForceFinish} 
                      disabled={loading}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
                    >
                      Registrar sólo hasta aquí
                    </Button>
                  )}

                  {competitorStep < 3 ? (
                    <Button 
                      type="button" 
                      onClick={handleNextCompetitor} 
                      className="rounded-xl h-11 px-6 font-bold bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Siguiente Competidor <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={handleFinishCompetitors} 
                      disabled={loading}
                      className="rounded-xl h-11 px-6 font-bold bg-primary text-primary-foreground"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          Finalizar y Activar Agentes <Sparkles className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent border border-violet-200/50 p-6 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl" />
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-violet-100 dark:bg-violet-950 rounded-xl flex items-center justify-center text-violet-650 shrink-0 border border-violet-200 animate-pulse">
                <Bot className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 px-2.5 py-0.5 rounded-full">IA Activa</span>
                  <span className="text-xs font-bold text-muted-foreground">Procesamiento y Auditoría</span>
                </div>
                <h5 className="text-base font-bold text-foreground">
                  Los Agentes de MarketHub están analizando tu mercado
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                  Hemos activado los procesos de scraping y consolidación digital. Los agentes están construyendo la matriz FODA, identificando oportunidades y diseñando tu calendario editorial personalizado.
                </p>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-violet-600" />
                  <span>Consola de Ejecución en Tiempo Real</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Sigue los logs de auditoría y avance secuencial del motor cognitivo de IA.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <AgentPipelineMonitor businessId={businessId} />

              <div className="flex justify-end mt-8 border-t pt-4">
                <Button 
                  onClick={() => router.push(`/business/${businessId}`)} 
                  className="rounded-xl h-11 px-8 font-bold"
                >
                  Ir a mi Panel de Control <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
