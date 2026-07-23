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
  Facebook, Instagram, Loader2, Target, Bot, Sparkles, Info 
} from "lucide-react";
import { BusinessForm } from "@/components/business/business-form";
import { saveMultipleCompetitorsAction } from "@/app/(dashboard)/business/[id]/competitor-actions";
import { getBusinesses } from "@/actions/business";
import { OnboardingResultsPanel } from "@/components/business/onboarding-results-panel";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import { BusinessFormValues } from "@/lib/schemas/business";
import { createBusinessWithAI, getUserLimits, getBusinessWithCompetitors, saveOnboardingStrategyAction } from "@/actions/business";
import { getIndustryPlaceholders } from "@/lib/industry-suggestions";

interface MultiSelectQuestionProps {
  label: string;
  question: string;
  tooltipText: string;
  chips: string[];
  value: string;
  onChange: (newValue: string) => void;
  maxLimit?: number;
  otherPlaceholder?: string;
}

function MultiSelectQuestion({
  label,
  question,
  tooltipText,
  chips,
  value,
  onChange,
  maxLimit,
  otherPlaceholder = "Escribe otra opción personalizada..."
}: MultiSelectQuestionProps) {
  const selectedItems = React.useMemo(() => {
    if (!value) return [];
    return value.split(",").map(s => s.trim()).filter(Boolean);
  }, [value]);

  const selectedPresetChips = chips.filter(chip => selectedItems.includes(chip));
  const customOtrosItems = selectedItems.filter(item => !chips.includes(item));
  const isOtrosActive = selectedItems.includes("Otros") || customOtrosItems.length > 0;
  const otrosText = customOtrosItems.filter(item => item !== "Otros").join(", ");

  const totalCount = selectedPresetChips.length + (isOtrosActive ? 1 : 0);

  const updateStrategyValue = (newPresetChips: string[], otrosEnabled: boolean, newOtrosText: string) => {
    const combined: string[] = [...newPresetChips];
    if (otrosEnabled) {
      if (newOtrosText.trim()) {
        combined.push(newOtrosText.trim());
      } else {
        combined.push("Otros");
      }
    }
    onChange(combined.join(", "));
  };

  const toggleChip = (chip: string) => {
    const isSelected = selectedPresetChips.includes(chip);
    if (isSelected) {
      const nextPresets = selectedPresetChips.filter(c => c !== chip);
      updateStrategyValue(nextPresets, isOtrosActive, otrosText);
    } else {
      if (maxLimit && totalCount >= maxLimit) {
        toast.info(`Solo puedes seleccionar un máximo de ${maxLimit} opciones.`);
        return;
      }
      const nextPresets = [...selectedPresetChips, chip];
      updateStrategyValue(nextPresets, isOtrosActive, otrosText);
    }
  };

  const toggleOtros = () => {
    if (isOtrosActive) {
      updateStrategyValue(selectedPresetChips, false, "");
    } else {
      if (maxLimit && totalCount >= maxLimit) {
        toast.info(`Solo puedes seleccionar un máximo de ${maxLimit} opciones.`);
        return;
      }
      updateStrategyValue(selectedPresetChips, true, "");
    }
  };

  const handleOtrosInputChange = (text: string) => {
    updateStrategyValue(selectedPresetChips, true, text);
  };

  return (
    <div className="space-y-3 p-4 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 transition-all">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{label}</Label>
        {maxLimit ? (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
            totalCount >= maxLimit 
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
              : 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
          }`}>
            {totalCount} / {maxLimit} seleccionadas (máx. 3)
          </span>
        ) : (
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
            Multiselección ({totalCount})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <p className="text-[13px] font-bold text-foreground leading-snug">{question}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shrink-0">
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {chips.map((chip, idx) => {
          const isSelected = selectedPresetChips.includes(chip);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleChip(chip)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                  : 'bg-background hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 text-foreground border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className={`h-3.5 w-3.5 rounded flex items-center justify-center border transition-colors ${
                isSelected ? 'bg-primary-foreground text-primary border-transparent' : 'border-muted-foreground/40'
              }`}>
                {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </div>
              {chip}
            </button>
          );
        })}

        <button
          type="button"
          onClick={toggleOtros}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 ${
            isOtrosActive
              ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
              : 'bg-background hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 text-foreground border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className={`h-3.5 w-3.5 rounded flex items-center justify-center border transition-colors ${
            isOtrosActive ? 'bg-primary-foreground text-primary border-transparent' : 'border-muted-foreground/40'
          }`}>
            {isOtrosActive && <Check className="h-2.5 w-2.5 stroke-[3]" />}
          </div>
          Otros...
        </button>
      </div>

      {isOtrosActive && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Input
            placeholder={otherPlaceholder}
            value={otrosText}
            onChange={(e) => handleOtrosInputChange(e.target.value)}
            className="h-10 text-xs rounded-xl bg-background border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

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

  const industryPlaceholders = getIndustryPlaceholders(
    businessFormValues?.industry,
    businessFormValues?.description,
    businessName || businessFormValues?.name
  );

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
          // Hidratar businessFormValues para que el paso 1 muestre datos al volver
          setBusinessFormValues({
            name: business.name,
            description: business.description || "",
            industry: business.industry || "",
            website: business.website || "",
            phoneNumbers: business.phoneNumbers || "",
            location: (business.location as any) || "",
            brandVoice: (business.brandVoice as any) || { tone: [], personality: [], values: [] },
            targetAudience: (business.targetAudience as any) || { demographics: "", psychographics: "" },
            socialLinks: (business.socialLinks as any) || { facebook: "", instagram: "", tiktok: "" },
          });
          // Hidratar strategyValues para que el paso 3 muestre datos al volver
          if (business.onboardingStrategy && typeof business.onboardingStrategy === "object") {
            setStrategyValues((prev) => ({
              ...prev,
              ...(business.onboardingStrategy as any)
            }));
          }
          // Hidratar competidores para que el paso 2 muestre datos al volver
          if (business.competitors && business.competitors.length > 0) {
            setCompetitors(business.competitors.map((c: any) => ({
              name: c.name || "",
              website: c.website || "",
              facebook: c.facebook || "",
              instagram: c.instagram || "",
              tiktok: c.tiktok || "",
            })));
          }
          if (forceStep) {
            setCurrentStep(parseInt(forceStep));
          } else if (business.competitors && business.competitors.length > 0) {
            if (isPreview) {
              const hasStrategy = business.onboardingStrategy && Object.keys(business.onboardingStrategy as object).length > 0;
              setCurrentStep(hasStrategy ? 4 : 3);
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
  }, [businessId, isPreview, forceStep, router]);

  // Auto-detect existing business if user already created one
  useEffect(() => {
    if (businessId) return;
    const checkExistingBusiness = async () => {
      try {
        const list = await getBusinesses();
        if (list && list.length > 0) {
          const latestBusiness = list[0];
          
          if (latestBusiness.onboardingStrategy && typeof latestBusiness.onboardingStrategy === "object") {
            setStrategyValues((prev) => ({
              ...prev,
              ...(latestBusiness.onboardingStrategy as any)
            }));
          }

          // If the existing business already has competitors
          if (latestBusiness.competitors && latestBusiness.competitors.length > 0) {
            if (isPreview) {
              setBusinessId(latestBusiness.id);
              setBusinessName(latestBusiness.name);
              if (forceStep) {
                setCurrentStep(parseInt(forceStep));
              } else {
                const hasStrategy = latestBusiness.onboardingStrategy && Object.keys(latestBusiness.onboardingStrategy as object).length > 0;
                setCurrentStep(hasStrategy ? 4 : 3);
              }
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
  }, [businessId, isPreview, forceStep, router]);

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

    // Actualizar la URL de forma síncrona para reflejar el paso 4 y que la recarga de página (F5) no vuelva al paso 3
    if (businessId) {
      router.replace(`/onboarding?businessId=${businessId}&preview=true&forceStep=4`);
    }

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
            router.replace(`/onboarding?businessId=${activeBusinessId}&preview=true&forceStep=4`);
          } else {
            toast.error(createRes.error || "Ocurrió un error al registrar el negocio");
            return;
          }
        } else {
          // Si el negocio ya existe, guardar onboardingStrategy en la base de datos
          const saveRes = await saveOnboardingStrategyAction(activeBusinessId, strategyValues);
          if (!saveRes.success) {
            toast.error(saveRes.error || "Ocurrió un error al guardar las preguntas estratégicas.");
          }
        }

        const validList = competitors.filter(c => c.name.trim() !== "");
        if (validList.length > 0) {
          const res = await saveMultipleCompetitorsAction(activeBusinessId, validList, true);
          if (res.success) {
            toast.success("¡Negocio, estrategia y competidores guardados correctamente!");
          } else {
            toast.error(res.error || "Ocurrió un error al guardar los competidores");
          }
        } else {
          toast.success("¡Configuración estratégica del negocio guardada!");
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
          <button type="button" onClick={() => currentStep > 1 && setCurrentStep(1)} className={`flex items-center gap-3 ${currentStep > 1 ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep === 1 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border border-primary/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
              {currentStep > 1 ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : "01"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Etapa Inicial</span>
              <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 1 ? 'text-primary' : 'text-foreground/80'}`}>Mi Negocio</span>
            </div>
          </button>

          <div className="flex-1 md:hidden h-0.5 bg-muted mx-4 relative rounded-full">
            <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${currentStep >= 2 ? 'w-full' : 'w-0'}`} />
          </div>
        </div>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-slate-200 dark:to-slate-800 mx-2" />

        <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-4">
          <button type="button" onClick={() => currentStep > 2 && setCurrentStep(2)} className={`flex items-center gap-3 ${currentStep > 2 ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep === 2 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border border-primary/20' : currentStep > 2 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
              {currentStep > 2 ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : "02"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Etapa de Análisis</span>
              <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 2 ? 'text-primary' : 'text-foreground/80'}`}>Competidores</span>
            </div>
          </button>

          <div className="flex-1 md:hidden h-0.5 bg-muted mx-4 relative rounded-full">
            <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${currentStep === 3 ? 'w-full' : 'w-0'}`} />
          </div>
        </div>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-violet-500/30 mx-2" />

        <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-4">
          <button type="button" onClick={() => currentStep > 3 && setCurrentStep(3)} className={`flex items-center gap-3 ${currentStep > 3 ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep === 3 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border border-primary/20' : currentStep > 3 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
              {currentStep > 3 ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : "03"}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estrategia Base</span>
              <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 3 ? 'text-primary' : 'text-foreground/80'}`}>Configuración</span>
            </div>
          </button>

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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                  <span>Rubro detectado: <strong>{industryPlaceholders.industryLabel}</strong></span>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
              <CardContent className="pt-6 space-y-6">
                <TooltipProvider delayDuration={150}>
                  {/* Pregunta 1 */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">1. Ubicación y Edad Objetivo</Label>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-foreground leading-snug">¿En qué ciudad o zona se encuentran tus clientes y qué edad promedio tienen?</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shrink-0">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Ayuda a la IA a delimitar el alcance geográfico de la publicidad y ajustar los modismos o jerga sociocultural para los Buyer Personas y copies.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      placeholder={industryPlaceholders.locationAge.placeholder} 
                      value={strategyValues.locationAge} 
                      onChange={(e) => setStrategyValues({...strategyValues, locationAge: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-medium text-muted-foreground/70 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-500" /> Ejemplos:
                      </span>
                      {industryPlaceholders.locationAge.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setStrategyValues({...strategyValues, locationAge: chip})}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/50 transition-colors"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pregunta 2 */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">2. Momento Desencadenante (Evento de Vida)</Label>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-foreground leading-snug">¿Qué momento o necesidad especial hace que la gente busque tu producto?</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shrink-0">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Identifica el gatillo emocional o necesidad puntual (ej. fin de mes, regalo sorpresa, calor) que despierta la urgencia de compra para usarlo como hook.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      placeholder={industryPlaceholders.lifeEvent.placeholder} 
                      value={strategyValues.lifeEvent} 
                      onChange={(e) => setStrategyValues({...strategyValues, lifeEvent: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-medium text-muted-foreground/70 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-500" /> Ejemplos:
                      </span>
                      {industryPlaceholders.lifeEvent.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setStrategyValues({...strategyValues, lifeEvent: chip})}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/50 transition-colors"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pregunta 3 (Multiselección) */}
                  <MultiSelectQuestion
                    label="3. Personalidad del Negocio (Arquetipo)"
                    question="Si tu negocio fuera una persona, ¿cómo sería?"
                    tooltipText="Define el tono de voz (divertido, refinado, directo, cercano) con el que la IA redactará las publicaciones y guiones de Reels."
                    chips={industryPlaceholders.archetype.chips}
                    value={strategyValues.archetype}
                    onChange={(val) => setStrategyValues({...strategyValues, archetype: val})}
                    otherPlaceholder="Especifica otra personalidad o arquetipo..."
                  />

                  {/* Pregunta 4 (Multiselección) */}
                  <MultiSelectQuestion
                    label="4. Canal Crítico de Conversión"
                    question="¿Por qué medio prefieren tus clientes cerrar la compra?"
                    tooltipText="Indica por dónde prefieren cerrar la compra tus clientes (ej. WhatsApp, DMs de Instagram, Sitio Web) para priorizar los llamados a la acción (CTAs)."
                    chips={industryPlaceholders.conversionChannel.chips}
                    value={strategyValues.conversionChannel}
                    onChange={(val) => setStrategyValues({...strategyValues, conversionChannel: val})}
                    otherPlaceholder="Especifica otro canal de conversión..."
                  />

                  {/* Pregunta 5 */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">5. Brechas de Dudas Comunes</Label>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-foreground leading-snug">¿Qué es lo que más te preguntan los clientes antes de comprar?</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shrink-0">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Enumera las objeciones o dudas repetidas de tus clientes (precios, costos de envío, garantía). La IA creará contenidos educativos para derribar estas barreras.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      placeholder={industryPlaceholders.informationGaps.placeholder} 
                      value={strategyValues.informationGaps} 
                      onChange={(e) => setStrategyValues({...strategyValues, informationGaps: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-medium text-muted-foreground/70 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-500" /> Ejemplos:
                      </span>
                      {industryPlaceholders.informationGaps.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setStrategyValues({...strategyValues, informationGaps: chip})}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/50 transition-colors"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pregunta 6 (Multiselección - Máximo 3 opciones) */}
                  <MultiSelectQuestion
                    label="6. Prueba Social (UGC)"
                    question="¿Qué comentarios tienen tus clientes sobre tu producto?"
                    tooltipText="Menciona testimonios, reseñas o acreditaciones destacadas de tus clientes. El sistema los integrará para generar confianza inmediata en tus anuncios."
                    chips={industryPlaceholders.socialProof.chips}
                    value={strategyValues.socialProof}
                    onChange={(val) => setStrategyValues({...strategyValues, socialProof: val})}
                    maxLimit={3}
                    otherPlaceholder="Especifica otro testimonio o prueba social..."
                  />

                  {/* Pregunta 7 */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">7. Ventaja Diferencial</Label>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-foreground leading-snug">¿Cuál es tu mayor ventaja frente a otros negocios similares?</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shrink-0">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Tu propuesta de valor única o beneficio imbatible frente a competidores. Será el pilar diferencial de las campañas de venta directa.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input 
                      placeholder={industryPlaceholders.differentialAdvantage.placeholder} 
                      value={strategyValues.differentialAdvantage} 
                      onChange={(e) => setStrategyValues({...strategyValues, differentialAdvantage: e.target.value})}
                      className="h-11 rounded-xl"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-medium text-muted-foreground/70 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-500" /> Ejemplos:
                      </span>
                      {industryPlaceholders.differentialAdvantage.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setStrategyValues({...strategyValues, differentialAdvantage: chip})}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/50 transition-colors"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
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
