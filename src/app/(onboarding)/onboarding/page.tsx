"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Check, Users, ArrowRight, ArrowLeft, Globe, 
  Facebook, Instagram, Loader2, Target, Bot, Sparkles, HelpCircle 
} from "lucide-react";
import { BusinessForm } from "@/components/business/business-form";
import { saveMultipleCompetitorsAction } from "@/app/(dashboard)/business/[id]/competitor-actions";
import { getBusinesses } from "@/actions/business";
import { OnboardingResultsPanel } from "@/components/business/onboarding-results-panel";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import { BusinessFormValues } from "@/lib/schemas/business";
import { createBusinessWithAI, getUserLimits, getBusinessWithCompetitors } from "@/actions/business";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBusinessId = searchParams.get("businessId") || "";
  const forceStep = searchParams.get("forceStep");
  const isPreview = searchParams.get("preview") === "true" || !!forceStep;

  const [businessId, setBusinessId] = useState<string>(initialBusinessId);
  const [currentStep, setCurrentStep] = useState(
    forceStep ? parseInt(forceStep) : initialBusinessId ? 2 : 1
  );
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessFormValues, setBusinessFormValues] = useState<BusinessFormValues | null>(null);
  const [maxCompetitorsLimit, setMaxCompetitorsLimit] = useState(3);

  // Fetch user limits on mount
  useEffect(() => {
    const fetchLimits = async () => {
      const res = await getUserLimits();
      if (res.success && typeof res.maxCompetitors === "number") {
        setMaxCompetitorsLimit(res.maxCompetitors);
      }
    };
    fetchLimits();
  }, []);

  // Fetch business name when businessId is set, and check if it already has competitors to decide the currentStep
  useEffect(() => {
    if (!businessId) return;
    const fetchBusiness = async () => {
      try {
        const business = await getBusinessWithCompetitors(businessId);
        if (business) {
          setBusinessName(business.name);
          // If competitors are already registered, decide step or redirect
          if (business.competitors && business.competitors.length > 0) {
            if (isPreview) {
              setCurrentStep(3);
            } else {
              router.push(`/business/${businessId}?skipOnboarding=true`);
            }
          } else {
            setCurrentStep(2);
          }
        }
      } catch (err) {
        console.error("Error fetching business info:", err);
      }
    };
    fetchBusiness();
  }, [businessId, isPreview, router]);

  // Auto-detect existing business if user already created one
  useEffect(() => {
    if (businessId) return;
    const checkExistingBusiness = async () => {
      try {
        const list = await getBusinesses();
        if (list && list.length > 0) {
          const latestBusiness = list[0];
          
          // If the existing business already has competitors
          if (latestBusiness.competitors && latestBusiness.competitors.length > 0) {
            if (isPreview) {
              setBusinessId(latestBusiness.id);
              setBusinessName(latestBusiness.name);
              setCurrentStep(3);
            } else {
              router.push(`/business/${latestBusiness.id}?skipOnboarding=true`);
            }
            return;
          }

          setBusinessId(latestBusiness.id);
          setBusinessName(latestBusiness.name);
          setCurrentStep(2);
        }
      } catch (err) {
        console.error("Error checking existing business:", err);
      }
    };
    checkExistingBusiness();
  }, [businessId, isPreview, router]);

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

  const [competitors, setCompetitors] = useState([
    { name: "", website: "", facebook: "", instagram: "", tiktok: "" }
  ]);

  const addCompetitor = () => {
    if (competitors.length >= maxCompetitorsLimit) {
      toast.info(`Has alcanzado el límite máximo de ${maxCompetitorsLimit} competidores permitidos para tu cuenta.`);
      return;
    }
    setCompetitors([...competitors, { name: "", website: "", facebook: "", instagram: "", tiktok: "" }]);
  };

  const removeCompetitor = (index: number) => {
    if (competitors.length <= 1) return;
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, field: string, value: string) => {
    setCompetitors(competitors.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const [strategyValues, setStrategyValues] = useState({
    locationAge: "",
    lifeEvent: "",
    archetype: "",
    conversionChannel: "",
    informationGaps: "",
    socialProof: "",
    differentialAdvantage: ""
  });

  const handleFinishCompetitors = () => {
    const validList = competitors.filter(c => c.name.trim() !== "");
    if (validList.length === 0) {
      toast.error("Agrega al menos un competidor con nombre.");
      return;
    }

    // Cambiar inmediatamente al paso 3 sin esperar la red
    setCurrentStep(3);
  };

  const handleFinishStrategy = async () => {
    setCurrentStep(4);

    // Ejecutar el proceso de creación y guardado en segundo plano
    const runCreationInBackground = async () => {
      try {
        let activeBusinessId = businessId;

        if (!activeBusinessId) {
          if (!businessFormValues) {
            toast.error("Faltan los datos del perfil del negocio.");
            return;
          }

          const createRes = await createBusinessWithAI({
            name: businessFormValues.name,
            description: businessFormValues.description,
            website: businessFormValues.website || "",
            phoneNumbers: businessFormValues.phoneNumbers,
            location: businessFormValues.location,
            socialLinks: businessFormValues.socialLinks,
            onboardingStrategy: strategyValues
          }, true);

          if (createRes.success && createRes.data?.id) {
            activeBusinessId = createRes.data.id;
            setBusinessId(activeBusinessId);
          } else {
            toast.error(createRes.error || "Ocurrió un error al registrar el negocio");
            return;
          }
        }

        const validList = competitors.filter(c => c.name.trim() !== "");
        const res = await saveMultipleCompetitorsAction(activeBusinessId, validList, true);
        if (res.success) {
          toast.success("¡Negocio, estrategia y competidores registrados!");
        } else {
          toast.error(res.error || "Ocurrió un error al guardar los competidores");
        }
      } catch (error) {
        console.error("Error en el guardado asíncrono:", error);
        toast.error("Ocurrió un error inesperado al procesar los datos");
      }
    };

    runCreationInBackground();
  };

  const renderCompetitorForm = (index: number, data: typeof competitors[0]) => {
    return (
      <div className="space-y-4 p-5 bg-muted/20 rounded-2xl border relative group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Competidor {index + 1}
          </span>
          {competitors.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeCompetitor(index)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Eliminar
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Competidor *</Label>
          <Input 
            placeholder="Ej. Competidor Local S.A." 
            value={data.name} 
            onChange={(e) => updateCompetitor(index, "name", e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary" /> Sitio Web
          </Label>
          <Input 
            placeholder="https://competidor.com" 
            value={data.website} 
            onChange={(e) => updateCompetitor(index, "website", e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-dashed">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Redes Sociales</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Facebook" 
                value={data.facebook}
                onChange={(e) => updateCompetitor(index, "facebook", e.target.value)}
                className="h-9 pl-9 text-xs rounded-lg bg-background" 
              />
            </div>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Instagram" 
                value={data.instagram}
                onChange={(e) => updateCompetitor(index, "instagram", e.target.value)}
                className="h-9 pl-9 text-xs rounded-lg bg-background" 
              />
            </div>
            <div className="relative">
              <TikTokIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="TikTok" 
                value={data.tiktok}
                onChange={(e) => updateCompetitor(index, "tiktok", e.target.value)}
                className="h-9 pl-9 text-xs rounded-lg bg-background" 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${currentStep === 3 ? 'max-w-7xl' : 'max-w-4xl'} mx-auto py-10 px-4 space-y-8`}>
      {/* Indicador de pasos estilo Premium Glass */}
      <div className="bg-card/45 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep === 1 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border border-primary/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
              {currentStep > 1 ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : "01"}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Etapa Inicial</span>
              <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 1 ? 'text-primary' : 'text-foreground/80'}`}>Mi Negocio</span>
            </div>
          </div>

          <div className="flex-1 md:hidden h-0.5 bg-muted mx-4 relative rounded-full">
            <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${currentStep >= 2 ? 'w-full' : 'w-0'}`} />
          </div>
        </div>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-slate-200 dark:to-slate-800 mx-2" />

        <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep === 2 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border border-primary/20' : currentStep > 2 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
              {currentStep > 2 ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : "02"}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Etapa de Análisis</span>
              <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 2 ? 'text-primary' : 'text-foreground/80'}`}>Competidores</span>
            </div>
          </div>

          <div className="flex-1 md:hidden h-0.5 bg-muted mx-4 relative rounded-full">
            <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${currentStep === 3 ? 'w-full' : 'w-0'}`} />
          </div>
        </div>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-violet-500/30 mx-2" />

        <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep === 3 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border border-primary/20' : currentStep > 3 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
              {currentStep > 3 ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : "03"}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estrategia Base</span>
              <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 3 ? 'text-primary' : 'text-foreground/80'}`}>Configuración</span>
            </div>
          </div>

          <div className="flex-1 md:hidden h-0.5 bg-muted mx-4 relative rounded-full">
            <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${currentStep === 4 ? 'w-full' : 'w-0'}`} />
          </div>
        </div>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-violet-500/30 mx-2" />

        <div className="flex items-center justify-start w-full md:w-auto gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep === 4 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border border-primary/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
            04
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Resultados IA</span>
            <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 4 ? 'text-primary' : 'text-foreground/80'}`}>Monitoreo e Inteligencia</span>
          </div>
        </div>
      </div>

      {/* Content area with fixed min-height to prevent layout shifts */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent border border-primary/20 p-8 shadow-inner">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                <div className="h-14 w-14 bg-primary/15 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20 animate-bounce-slow">
                  <Target className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tight italic uppercase">
                    Crea tu negocio
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    Diseñemos tu estrategia de marca, segmentación de buyer personas y funnels en solo segundos utilizando Inteligencia Artificial.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/60 backdrop-blur-md rounded-3xl border p-6 md:p-8 card-shadow">
              <BusinessForm 
                isTutorialActive={true} 
                hideStepHeader={true}
                singleStep={true}
                defaultValues={businessFormValues || undefined}
                onSubmitOverride={(data) => {
                  setBusinessFormValues(data);
                  setBusinessName(data.name);
                  setCurrentStep(2);
                }}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/50 p-6 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl" />
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950 rounded-xl flex items-center justify-center text-orange-600 shrink-0 border border-orange-200">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 rounded-full">
                      Competidores: {competitors.length} / {maxCompetitorsLimit}
                    </span>
                  </div>
                  <h5 className="text-base font-bold text-foreground">
                    Registra tu competencia directa{businessName ? ` para ${businessName}` : ""}
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    Para que la IA diseñe una estrategia adaptada a tu mercado, necesitamos analizar la huella digital de tus principales rivales.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
              <CardContent className="pt-6 space-y-4">
                {competitors.map((comp, idx) => (
                  <div key={idx}>
                    {renderCompetitorForm(idx, comp)}
                  </div>
                ))}

                {competitors.length < maxCompetitorsLimit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCompetitor}
                    className="w-full h-12 rounded-xl border-dashed text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <Users className="h-4 w-4 mr-2" /> Añadir otro competidor
                  </Button>
                )}

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(1)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={handleFinishCompetitors} 
                    disabled={loading}
                    className="rounded-xl h-11 px-8 font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                  <Target className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-base font-bold text-foreground">
                    Configuración Estratégica Base
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    Responde estas preguntas extra para tener más información sobre tu negocio. Así podremos armar una mejor estrategia, campaña y calendario.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
              <CardContent className="pt-6 space-y-6">
                <TooltipProvider delayDuration={150}>
                  {/* Pregunta 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">1. Ubicación y Edad Objetivo</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Ayuda a la IA a delimitar el alcance geográfico de la publicidad y ajustar los modismos o jerga sociocultural para los Buyer Personas y copies.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[13px] font-bold text-foreground leading-snug">¿En qué ciudad o zona se encuentran tus clientes y qué edad promedio tienen?</p>
                    <Input 
                      placeholder="Ej. Santa Cruz, entre 20 y 35 años" 
                      value={strategyValues.locationAge} 
                      onChange={(e) => setStrategyValues({...strategyValues, locationAge: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  {/* Pregunta 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">2. Momento Desencadenante (Evento de Vida)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Identifica el gatillo emocional o necesidad puntual (ej. fin de mes, regalo sorpresa, calor) que despierta la urgencia de compra para usarlo como hook.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[13px] font-bold text-foreground leading-snug">¿Qué momento o necesidad especial hace que la gente busque tu producto? (Ej: cumpleaños, antojos).</p>
                    <Input 
                      placeholder="Ej. Quincenas, Cumpleaños, Calor" 
                      value={strategyValues.lifeEvent} 
                      onChange={(e) => setStrategyValues({...strategyValues, lifeEvent: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  {/* Pregunta 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">3. Personalidad del Negocio (Arquetipo)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Define el tono de voz (divertido, refinado, directo, cercano) con el que la IA redactará las publicaciones y guiones de Reels.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[13px] font-bold text-foreground leading-snug">Si tu negocio fuera una persona, ¿cómo sería? (Ej: Tradicional, moderno, exclusivo).</p>
                    <Input 
                      placeholder="Ej. Para ti, Para regalar, De emergencia" 
                      value={strategyValues.archetype} 
                      onChange={(e) => setStrategyValues({...strategyValues, archetype: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  {/* Pregunta 4 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">4. Canal Crítico de Conversión</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Indica por dónde prefieren cerrar la compra tus clientes (ej. WhatsApp, DMs de Instagram, Sitio Web) para priorizar los llamados a la acción (CTAs).
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[13px] font-bold text-foreground leading-snug">¿Por qué medio prefieren tus clientes cerrar la compra? (Ej: WhatsApp, DMs).</p>
                    <Input 
                      placeholder="Ej. TikTok a WhatsApp" 
                      value={strategyValues.conversionChannel} 
                      onChange={(e) => setStrategyValues({...strategyValues, conversionChannel: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  {/* Pregunta 5 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">5. Brechas de Dudas Comunes</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Enumera las objeciones o dudas repetidas de tus clientes (precios, costos de envío, garantía). La IA creará contenidos educativos para derribar estas barreras.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[13px] font-bold text-foreground leading-snug">¿Qué es lo que más te preguntan los clientes antes de comprar?</p>
                    <Input 
                      placeholder="Ej. Precios ocultos, Ubicación poco clara" 
                      value={strategyValues.informationGaps} 
                      onChange={(e) => setStrategyValues({...strategyValues, informationGaps: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  {/* Pregunta 6 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">6. Prueba Social (UGC)</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Menciona testimonios, reseñas o acreditaciones destacadas de tus clientes. El sistema los integrará para generar confianza inmediata en tus anuncios.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[13px] font-bold text-foreground leading-snug">¿Qué comentarios tienen tus clientes sobre tu producto?</p>
                    <Input 
                      placeholder="Ej. Reposts de clientes en Stories" 
                      value={strategyValues.socialProof} 
                      onChange={(e) => setStrategyValues({...strategyValues, socialProof: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  {/* Pregunta 7 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">7. Ventaja Diferencial</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Tu propuesta de valor única o beneficio imbatible frente a competidores. Será el pilar diferencial de las campañas de venta directa.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[13px] font-bold text-foreground leading-snug">¿Cuál es tu mayor ventaja frente a otros negocios similares?</p>
                    <Input 
                      placeholder="Ej. Delivery en menos de 30 mins" 
                      value={strategyValues.differentialAdvantage} 
                      onChange={(e) => setStrategyValues({...strategyValues, differentialAdvantage: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </TooltipProvider>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(2)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={handleFinishStrategy} 
                    disabled={loading}
                    className="rounded-xl h-11 px-8 font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Comenzar Análisis IA <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent border border-violet-200/50 p-6 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl" />
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-violet-100 dark:bg-violet-950 rounded-xl flex items-center justify-center text-violet-600 shrink-0 border border-violet-200 animate-pulse">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-base font-bold text-foreground">
                    Agentes de Inteligencia Artificial activados
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    Los agentes están recopilando y analizando la información de tu negocio y competidores en tiempo real.
                  </p>
                </div>
              </div>
            </div>

            {businessId ? (
              <div className="space-y-4">
                <OnboardingResultsPanel businessId={businessId} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-card/60 border rounded-3xl min-h-[350px] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-foreground">Creando perfil e iniciando agentes...</p>
                  <p className="text-xs text-muted-foreground">Estamos configurando tu entorno digital de análisis de mercado.</p>
                </div>
              </div>
            )}


          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
