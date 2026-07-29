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
  Facebook, Instagram, Loader2, Target, Bot, Sparkles, Info, Phone, Store, CheckCircle2
} from "lucide-react";
import { BusinessForm } from "@/components/business/business-form";
import { saveMultipleCompetitorsAction } from "@/app/(dashboard)/business/[id]/competitor-actions";
import { getBusinesses } from "@/actions/business";
import { OnboardingResultsPanel } from "@/components/business/onboarding-results-panel";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import { BusinessFormValues } from "@/lib/schemas/business";
import { createBusinessWithAI, getUserLimits, getBusinessWithCompetitors, saveOnboardingStrategyAction, updateBusiness, startStrategyStage } from "@/actions/business";
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
  defaultPhoneNumber?: string;
  allowSubInputs?: boolean;
}

function MultiSelectQuestion({
  label,
  question,
  tooltipText,
  chips,
  value,
  onChange,
  maxLimit,
  otherPlaceholder = "Escribe otra opción personalizada...",
  defaultPhoneNumber = "",
  allowSubInputs = false
}: MultiSelectQuestionProps) {
  const selectedItems = React.useMemo(() => {
    if (!value) return [];
    return value.split(",").map(s => s.trimStart()).filter(Boolean);
  }, [value]);

  const selectedPresetChips = chips.filter(chip => selectedItems.map(s => s.trim()).includes(chip));
  const customOtrosItems = selectedItems.filter(item => !chips.includes(item.trim()) && !item.includes(":"));
  const isOtrosActive = selectedItems.some(i => i.trim() === "Otros") || customOtrosItems.length > 0;
  const otrosTextFromValue = customOtrosItems.filter(item => item.trim() !== "Otros").join(", ");

  const [otrosInputText, setOtrosInputText] = useState(otrosTextFromValue);

  useEffect(() => {
    setOtrosInputText(otrosTextFromValue);
  }, [otrosTextFromValue]);

  const totalCount = selectedPresetChips.length + (isOtrosActive ? 1 : 0);

  const isWhatsAppSelected = Boolean(allowSubInputs && selectedItems.some(item => item.toLowerCase().includes("whatsapp")));
  const isDeliverySelected = Boolean(allowSubInputs && selectedItems.some(item => item.toLowerCase().includes("delivery") || item.toLowerCase().includes("pedidosya") || item.toLowerCase().includes("yango")));
  const showModernoCard = selectedItems.some(i => i.toLowerCase().includes("moderno"));
  const showTradicionalCard = selectedItems.some(i => i.toLowerCase().includes("tradicional"));
  const isRetailOrPhysicalSelected = showModernoCard || showTradicionalCard;

  const findPrefixText = (prefix: string) => {
    const item = selectedItems.find(i => i.startsWith(`${prefix}:`));
    if (!item) return "";
    return item.replace(`${prefix}:`, "").trimStart();
  };

  const [modernoText, setModernoText] = useState(() => findPrefixText("Cadenas Canal Moderno"));
  const [tradicionalText, setTradicionalText] = useState(() => findPrefixText("Comercios Canal Tradicional"));
  const [deliveryAppsText, setDeliveryAppsText] = useState(() => findPrefixText("Apps de Delivery"));
  const [waNumber, setWaNumber] = useState(() => {
    const existing = findPrefixText("Número WhatsApp");
    if (existing) return existing;
    return defaultPhoneNumber || "";
  });

  const updatePrefixItem = (prefix: string, text: string) => {
    const filtered = selectedItems.filter(i => !i.startsWith(`${prefix}:`));
    if (text !== "") {
      filtered.push(`${prefix}: ${text}`);
    }
    onChange(filtered.join(", "));
  };

  // Pre-llenar teléfono de WhatsApp cuando la opción esté seleccionada y se disponga de un número por defecto
  useEffect(() => {
    if (isWhatsAppSelected && defaultPhoneNumber && !findPrefixText("Número WhatsApp")) {
      setWaNumber(defaultPhoneNumber);
      updatePrefixItem("Número WhatsApp", defaultPhoneNumber);
    }
  }, [isWhatsAppSelected, defaultPhoneNumber]);

  const toggleSubOption = (subOption: string) => {
    const isAlready = selectedItems.map(i => i.trim()).includes(subOption);
    let nextSelected: string[];
    if (isAlready) {
      nextSelected = selectedItems.filter(i => i.trim() !== subOption);
    } else {
      nextSelected = [...selectedItems, subOption];
    }
    onChange(nextSelected.join(", "));
  };

  const updateStrategyValue = (newPresetChips: string[], otrosEnabled: boolean, newOtrosText: string) => {
    const combined: string[] = [...newPresetChips];
    const prefixItems = selectedItems.filter(i => i.includes(":"));
    prefixItems.forEach(p => {
      if (!combined.includes(p)) combined.push(p);
    });

    if (otrosEnabled) {
      if (newOtrosText !== undefined && newOtrosText !== "") {
        combined.push(newOtrosText);
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
      updateStrategyValue(nextPresets, isOtrosActive, otrosInputText);
    } else {
      if (maxLimit && totalCount >= maxLimit) {
        toast.info(`Solo puedes seleccionar un máximo de ${maxLimit} opciones.`);
        return;
      }
      const nextPresets = [...selectedPresetChips, chip];
      updateStrategyValue(nextPresets, isOtrosActive, otrosInputText);
    }
  };

  const toggleOtros = () => {
    if (isOtrosActive) {
      setOtrosInputText("");
      updateStrategyValue(selectedPresetChips, false, "");
    } else {
      if (maxLimit && totalCount >= maxLimit) {
        toast.info(`Solo puedes seleccionar un máximo de ${maxLimit} opciones.`);
        return;
      }
      updateStrategyValue(selectedPresetChips, true, otrosInputText);
    }
  };

  const handleOtrosInputChange = (text: string) => {
    setOtrosInputText(text);
    updateStrategyValue(selectedPresetChips, true, text);
  };

  const getChipTooltip = (chip: string) => {
    const lower = chip.toLowerCase();
    if (lower.includes("moderno")) {
      return {
        title: "Canal Moderno",
        description: "Establecimientos estructurados, generalmente pertenecientes a grandes cadenas, con procesos de compra automatizados y autoservicio.",
        examples: "Supermercados e Hipermercados (Hipermaxi, Ketal, Fidalga, Walmart), Tiendas de Conveniencia (OXXO, Tambo, 7-Eleven)."
      };
    }
    if (lower.includes("tradicional")) {
      return {
        title: "Canal Tradicional",
        description: "Comercios independientes, habitualmente atendidos por sus propios dueños, con un trato más cercano y vecinal.",
        examples: "Tiendas de barrio (almacenes, bodegas, pulperías, abarrotes), carnicerías local, fruterías y panaderías de zona."
      };
    }
    if (lower.includes("whatsapp")) {
      return {
        title: "Canal WhatsApp Directo",
        description: "Atención personalizada 1 a 1 por mensajería instantánea para cerrar pedidos, consultas o delivery sin intermediarios.",
        examples: "WhatsApp Business, atención directa por chat, catálogos en WhatsApp."
      };
    }
    if (lower.includes("web") || lower.includes("online") || lower.includes("tienda")) {
      return {
        title: "Sitio Web / Tienda Online",
        description: "Plataforma digital propia para pedidos automatizados, carrito de compras e-commerce o catálogo web.",
        examples: "Tienda e-commerce, catálogo web interactivo, carrito de compras directo."
      };
    }
    if (lower.includes("demo") || lower.includes("zoom") || lower.includes("cita") || lower.includes("presencial")) {
      return {
        title: "Venta Consultiva / Citas",
        description: "Agendamiento de reuniones presenciales, virtuales o citas de evaluación técnica.",
        examples: "Reuniones por Zoom, Demos en vivo, Citas diagnósticas presenciales."
      };
    }
    return null;
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
          const info = getChipTooltip(chip);

          const chipButton = (
            <button
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

          if (!info) {
            return <React.Fragment key={idx}>{chipButton}</React.Fragment>;
          }

          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                {chipButton}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs bg-slate-900 text-slate-100 p-3 rounded-2xl shadow-2xl border border-slate-800 space-y-1.5 z-50">
                <div className="font-black text-indigo-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <span>✨</span> {info.title}
                </div>
                <p className="text-slate-200 leading-relaxed font-medium text-[11px]">{info.description}</p>
                <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 leading-snug">
                  <strong className="text-slate-300">Ejemplos:</strong> {info.examples}
                </div>
              </TooltipContent>
            </Tooltip>
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
            value={otrosInputText}
            onChange={(e) => handleOtrosInputChange(e.target.value)}
            className="h-10 text-xs rounded-xl bg-background border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500"
          />
        </div>
      )}

      {/* Campo de Número de WhatsApp si WhatsApp está seleccionado */}
      {isWhatsAppSelected && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <Phone className="h-3.5 w-3.5" /> Número de WhatsApp para ventas / atención de clientes:
          </div>
          <Input
            placeholder="Ej. +591 70000000"
            value={waNumber}
            onChange={(e) => {
              setWaNumber(e.target.value);
              updatePrefixItem("Número WhatsApp", e.target.value);
            }}
            className="h-9 text-xs rounded-xl bg-background border-emerald-300 dark:border-emerald-800 focus-visible:ring-emerald-500 font-mono"
          />
        </div>
      )}

      {/* Sub-input para Apps de Delivery */}
      {isDeliverySelected && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
            <span>🛵</span> Especifica qué Apps de Delivery utilizas (ej. PedidosYa, Yango Delivery, Uber Eats, etc.):
          </div>
          <Input
            placeholder="Ej. PedidosYa y Yango Delivery"
            value={deliveryAppsText}
            onChange={(e) => {
              setDeliveryAppsText(e.target.value);
              updatePrefixItem("Apps de Delivery", e.target.value);
            }}
            className="h-9 text-xs rounded-xl bg-background border-indigo-300 dark:border-indigo-800 focus-visible:ring-indigo-500 font-medium"
          />
        </div>
      )}
    </div>
  );
}

export function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBusinessId = searchParams.get("businessId") || "";
  const forceStep = searchParams.get("forceStep");
  const isPreview = searchParams.get("preview") === "true" || !!forceStep;

  const isNew = searchParams.get("new") === "true";

  const [businessId, setBusinessId] = useState<string>(isNew ? "" : initialBusinessId);
  const [initializing, setInitializing] = useState(true);
  const [hasIncompleteBusiness, setHasIncompleteBusiness] = useState(false);
  const [currentStep, setCurrentStep] = useState(
    forceStep ? parseInt(forceStep) : (initialBusinessId && !isNew) ? 2 : 1
  );
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessFormValues, setBusinessFormValues] = useState<BusinessFormValues | null>(null);
  const [maxCompetitorsLimit, setMaxCompetitorsLimit] = useState(3);
  const [maxBusinessesLimit, setMaxBusinessesLimit] = useState(1);
  const [userBusinessesCount, setUserBusinessesCount] = useState(0);
  const [existingBusinessId, setExistingBusinessId] = useState<string | null>(null);
  const [existingBusinessName, setExistingBusinessName] = useState<string>("");
  const [showNoStrategyDialog, setShowNoStrategyDialog] = useState(false);
  const [hasStrategyInDb, setHasStrategyInDb] = useState(false);

  const industryPlaceholders = getIndustryPlaceholders(
    businessFormValues?.industry,
    businessFormValues?.description,
    businessName || businessFormValues?.name
  );

  // Sincronización e inicialización unificada de límites, negocios e hidratación de datos
  useEffect(() => {
    let isMounted = true;

    const initializeOnboarding = async () => {
      // 1. Obtener límites de usuario
      try {
        const limitsRes = await getUserLimits();
        if (isMounted && limitsRes.success) {
          if (typeof limitsRes.maxCompetitors === "number") {
            setMaxCompetitorsLimit(limitsRes.maxCompetitors);
          }
          if (typeof limitsRes.maxBusinesses === "number") {
            setMaxBusinessesLimit(limitsRes.maxBusinesses);
          }
        }
      } catch (err) {
        console.error("Error fetching user limits:", err);
      }

      // 2. Obtener lista de negocios
      try {
        const list = await getBusinesses();
        if (!isMounted) return;

        const count = Array.isArray(list) ? list.length : 0;
        setUserBusinessesCount(count);

        if (list && list.length > 0) {
          setExistingBusinessId(list[0].id);
          setExistingBusinessName(list[0].name);
        }

        let b: any = null;
        let incompleteFound = false;

        const isForm3Filled = (obj: any): boolean => {
          if (!obj || typeof obj !== "object") return false;
          const vals = Object.values(obj);
          return vals.some((val: any) => typeof val === "string" && val.trim().length > 0);
        };

        if (businessId) {
          b = await getBusinessWithCompetitors(businessId);
        } else if (list && list.length > 0) {
          for (const item of list) {
            const temp = await getBusinessWithCompetitors(item.id);
            if (temp) {
              const hasStrat = isForm3Filled(temp.onboardingStrategy);
              if (!hasStrat) {
                b = temp;
                incompleteFound = true;
                break;
              }
            }
          }
          if (!b && list.length > 0) {
            b = await getBusinessWithCompetitors(list[0].id);
          }
        }

        if (!isMounted || !b) {
          setInitializing(false);
          return;
        }

        const hasStrategyData = isForm3Filled(b.onboardingStrategy);

        // Si el negocio actual o detectado carece del Formulario 3, CARGARLO E IR AL PASO 3
        if (!hasStrategyData || incompleteFound) {
          setBusinessId(b.id);
          setBusinessName(b.name);
          setHasIncompleteBusiness(true);
          setBusinessFormValues({
            name: b.name,
            description: b.description || "",
            industry: b.industry || "",
            website: b.website || "",
            phoneNumbers: b.phoneNumbers || "",
            location: (b.location as any) || "",
            brandVoice: (b.brandVoice as any) || { tone: [], personality: [], values: [] },
            targetAudience: (b.targetAudience as any) || { demographics: "", psychographics: "" },
            socialLinks: (b.socialLinks as any) || { facebook: "", instagram: "", tiktok: "" },
          });
          setHasStrategyInDb(false);
          if (b.onboardingStrategy && typeof b.onboardingStrategy === "object") {
            setStrategyValues((prev) => ({
              ...prev,
              ...(b.onboardingStrategy as any)
            }));
          }
          if (b.competitors && b.competitors.length > 0) {
            setCompetitors(b.competitors.map((c: any) => ({
              name: c.name || "",
              website: c.website || "",
              facebook: c.facebook || "",
              instagram: c.instagram || "",
              tiktok: c.tiktok || "",
            })));
            
            // Detectar en cuál sub-paso específico del diagnóstico quedó el usuario
            const strat = b.onboardingStrategy || {};
            const hasStep3Data = Boolean(strat.locationAge || strat.lifeEvent || strat.conversionChannel);
            const hasStep4Data = Boolean(strat.archetype || strat.differentialAdvantage);

            if (hasStep3Data && !hasStep4Data) {
              setCurrentStep(4);
            } else if (hasStep3Data && hasStep4Data) {
              setCurrentStep(5);
            } else {
              setCurrentStep(3);
            }
          } else {
            setCurrentStep(2);
          }
          setInitializing(false);
          return;
        }

        // Si TODOS los negocios del usuario ya están completos:
        setHasIncompleteBusiness(false);
        setHasStrategyInDb(true);
        setBusinessName(b.name);
        setBusinessFormValues({
          name: b.name,
          description: b.description || "",
          industry: b.industry || "",
          website: b.website || "",
          phoneNumbers: b.phoneNumbers || "",
          location: (b.location as any) || "",
          brandVoice: (b.brandVoice as any) || { tone: [], personality: [], values: [] },
          targetAudience: (b.targetAudience as any) || { demographics: "", psychographics: "" },
          socialLinks: (b.socialLinks as any) || { facebook: "", instagram: "", tiktok: "" },
        });

        if (forceStep) {
          setBusinessId(b.id);
          setCurrentStep(parseInt(forceStep));
        } else if (b.competitors && b.competitors.length > 0) {
          if (isPreview) {
            setBusinessId(b.id);
            setCurrentStep(3);
          } else if (!isNew) {
            router.push(`/business/${b.id}?skipOnboarding=true`);
          } else {
            if (count >= maxBusinessesLimit) {
              setExistingBusinessId(b.id);
              setExistingBusinessName(b.name);
            } else {
              setBusinessId("");
              setBusinessName("");
              setBusinessFormValues(null);
              setCompetitors([]);
              setCurrentStep(1);
            }
          }
        } else {
          setBusinessId(b.id);
          setCurrentStep(2);
        }
      } catch (err) {
        console.error("Error initializing onboarding business data:", err);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    initializeOnboarding();

    return () => {
      isMounted = false;
    };
  }, [businessId, isPreview, forceStep, router, isNew]);

  const checkIfStrategyExists = () => {
    const hasSessionStrategy = Object.values(strategyValues).some(
      (val) => typeof val === "string" && val.trim().length > 0
    );
    return hasSessionStrategy || hasStrategyInDb;
  };

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

  const [competitors, setCompetitors] = useState<Array<{
    name: string;
    website: string;
    facebook: string;
    instagram: string;
    tiktok: string;
  }>>([
    { name: "", website: "", facebook: "", instagram: "", tiktok: "" },
  ]);

  const addCompetitor = () => {
    if (competitors.length >= maxCompetitorsLimit) {
      toast.info(`Solo puedes agregar hasta ${maxCompetitorsLimit} competidores.`);
      return;
    }
    setCompetitors([
      ...competitors,
      { name: "", website: "", facebook: "", instagram: "", tiktok: "" },
    ]);
  };

  const removeCompetitor = (index: number) => {
    if (competitors.length <= 1) return;
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, field: string, value: string) => {
    const next = [...competitors];
    next[index] = { ...next[index], [field]: value };
    setCompetitors(next);
  };

  const [strategyValues, setStrategyValues] = useState({
    locationAge: "",
    lifeEvent: "",
    archetype: "",
    conversionChannel: "",
    informationGaps: "",
    socialProof: "",
    differentialAdvantage: "",
  });

  const handleFinishCompetitors = async () => {
    const validList = competitors.filter(c => c.name.trim() !== "");
    if (validList.length === 0) {
      toast.error("Ingresa al menos el nombre de 1 competidor.");
      return;
    }

    if (businessId) {
      setLoading(true);
      try {
        const res = await saveMultipleCompetitorsAction(businessId, validList, true);
        if (res.success) {
          toast.success("¡Competidores guardados con éxito!");
        } else {
          toast.error(res.error || "Ocurrió un error al guardar los competidores");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error al guardar competidores");
      } finally {
        setLoading(false);
      }
    }

    setCurrentStep(3);
  };

  const handleFinishStrategy = async () => {
    // Validaciones de canal de conversión (Pregunta 4)
    const convChannel = strategyValues.conversionChannel || "";
    if (convChannel.toLowerCase().includes("moderno")) {
      const hasModernoDetails = convChannel.includes("Cadenas Canal Moderno:") && convChannel.split("Cadenas Canal Moderno:")[1]?.trim();
      if (!hasModernoDetails) {
        toast.error("Por favor, especifica el nombre de los supermercados o cadenas del Canal Moderno.");
        return;
      }
    }
    if (convChannel.toLowerCase().includes("tradicional")) {
      const hasTradicionalDetails = convChannel.includes("Comercios Canal Tradicional:") && convChannel.split("Comercios Canal Tradicional:")[1]?.trim();
      if (!hasTradicionalDetails) {
        toast.error("Por favor, especifica los mercados, pulperías o zonas del Canal Tradicional.");
        return;
      }
    }
    if (convChannel.toLowerCase().includes("delivery") || convChannel.toLowerCase().includes("pedidosya") || convChannel.toLowerCase().includes("yango")) {
      const hasDeliveryDetails = convChannel.includes("Apps de Delivery:") && convChannel.split("Apps de Delivery:")[1]?.trim();
      if (!hasDeliveryDetails) {
        toast.error("Por favor, especifica el nombre de las Apps de Delivery que utilizas (ej. PedidosYa, Yango).");
        return;
      }
    }
    if (convChannel.toLowerCase().includes("whatsapp")) {
      const hasWaNumber = convChannel.includes("Número WhatsApp:") && convChannel.split("Número WhatsApp:")[1]?.trim();
      if (!hasWaNumber && !businessFormValues?.phoneNumbers) {
        toast.error("Por favor, ingresa el número de WhatsApp para atención y ventas.");
        return;
      }
    }
    if (convChannel.includes("Otros") && !convChannel.split(",").some(item => !item.includes(":") && item.trim() !== "Otros" && item.trim() !== "")) {
      toast.error("Has seleccionado la opción 'Otros' en canales pero el campo de texto está vacío.");
      return;
    }

    setLoading(true);

    // Ejecutar el proceso de creación y guardado, luego redirigir al detalle del negocio
    const runCreationAndRedirect = async () => {
      try {
        let activeBusinessId = businessId;

        if (!activeBusinessId) {
          if (!businessFormValues) {
            toast.error("Faltan los datos del perfil del negocio.");
            setLoading(false);
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
          }, false);

          if (createRes.success && createRes.data?.id) {
            activeBusinessId = createRes.data.id;
            setBusinessId(activeBusinessId);
          } else {
            toast.error(createRes.error || "Ocurrió un error al registrar el negocio");
            setLoading(false);
            return;
          }
        } else {
          // Si el negocio ya existe, actualizar sus datos del perfil (paso 1) y guardar onboardingStrategy en la base de datos
          if (businessFormValues) {
            await updateBusiness(activeBusinessId, businessFormValues);
          }
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

        // Redirigir directamente al detalle del negocio (sin paso 4 de onboarding)
        router.push(`/business/${activeBusinessId}?skipOnboarding=true`);
      } catch (error) {
        console.error("Error en el guardado:", error);
        toast.error("Ocurrió un error inesperado al procesar los datos");
        setLoading(false);
      }
    };

    runCreationAndRedirect();
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

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-semibold animate-pulse">Cargando datos de tu negocio...</p>
      </div>
    );
  }

  if (isNew && !businessId && userBusinessesCount >= maxBusinessesLimit && !hasIncompleteBusiness) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="bg-card/80 backdrop-blur-md rounded-3xl border border-amber-500/25 p-8 shadow-xl text-center space-y-6">
          <div className="h-16 w-16 bg-amber-500/15 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto border border-amber-500/20 shadow-sm">
            <Store className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              Límite de Negocios Alcanzado ({userBusinessesCount} / {maxBusinessesLimit})
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto font-medium">
              Tu cuenta actual permite un máximo de <strong>{maxBusinessesLimit} negocio(s)</strong>. Ya tienes registrado el negocio <strong>"{existingBusinessName || "tu marca"}"</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/business")} 
              className="w-full sm:w-auto rounded-xl font-bold text-xs h-11 px-6 border-slate-200 dark:border-slate-800"
            >
              <Users className="h-4 w-4 mr-2" /> Gestionar Mis Negocios
            </Button>
            {existingBusinessId && (
              <Button 
                type="button" 
                onClick={() => {
                  if (existingBusinessId) {
                    setBusinessId(existingBusinessId);
                    setCurrentStep(3);
                  }
                }} 
                className="w-full sm:w-auto rounded-xl font-bold text-xs h-11 px-6 bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
              >
                Completar Diagnóstico de Negocio <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${currentStep >= 3 ? 'max-w-7xl' : 'max-w-4xl'} mx-auto py-10 px-4 space-y-8`}>
      {/* Indicador de pasos estilo Premium Glass (5 Pasos) */}
      <div className="bg-card/45 backdrop-blur-md border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 overflow-x-auto">
        {/* Step 1 */}
        <button type="button" onClick={() => currentStep > 1 && setCurrentStep(1)} className={`flex items-center gap-2.5 ${currentStep > 1 ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${currentStep === 1 ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105 border border-primary/20' : currentStep > 1 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
            {currentStep > 1 ? <Check className="h-4 w-4 stroke-[3]" /> : "01"}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Perfil</span>
            <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 1 ? 'text-primary' : 'text-foreground/80'}`}>Mi Negocio</span>
          </div>
        </button>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-slate-200 dark:to-slate-800 mx-1" />

        {/* Step 2 */}
        <button type="button" onClick={() => currentStep > 2 && setCurrentStep(2)} className={`flex items-center gap-2.5 ${currentStep > 2 ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${currentStep === 2 ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105 border border-primary/20' : currentStep > 2 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
            {currentStep > 2 ? <Check className="h-4 w-4 stroke-[3]" /> : "02"}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Mercado</span>
            <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 2 ? 'text-primary' : 'text-foreground/80'}`}>Competidores</span>
          </div>
        </button>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-indigo-500/30 mx-1" />

        {/* Step 3 */}
        <button type="button" onClick={() => currentStep > 3 && setCurrentStep(3)} className={`flex items-center gap-2.5 ${currentStep > 3 ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${currentStep === 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105 border border-indigo-500/20' : currentStep > 3 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
            {currentStep > 3 ? <Check className="h-4 w-4 stroke-[3]" /> : "03"}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Diagnóstico 1/3</span>
            <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground/80'}`}>Audiencia</span>
          </div>
        </button>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-indigo-500/30 mx-1" />

        {/* Step 4 */}
        <button type="button" onClick={() => currentStep > 4 && setCurrentStep(4)} className={`flex items-center gap-2.5 ${currentStep > 4 ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${currentStep === 4 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105 border border-indigo-500/20' : currentStep > 4 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
            {currentStep > 4 ? <Check className="h-4 w-4 stroke-[3]" /> : "04"}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Diagnóstico 2/3</span>
            <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 4 ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground/80'}`}>Valor</span>
          </div>
        </button>

        <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-800 to-indigo-500/30 mx-1" />

        {/* Step 5 */}
        <button type="button" onClick={() => currentStep > 5 && setCurrentStep(5)} className={`flex items-center gap-2.5 ${currentStep > 5 ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${currentStep === 5 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105 border border-indigo-500/20' : currentStep > 5 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
            {currentStep > 5 ? <Check className="h-4 w-4 stroke-[3]" /> : "05"}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Diagnóstico 3/3</span>
            <span className={`text-xs font-black uppercase tracking-wider transition-colors ${currentStep === 5 ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground/80'}`}>Confianza</span>
          </div>
        </button>
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
                onSubmitOverride={async (data) => {
                  setBusinessFormValues(data);
                  setBusinessName(data.name);
                  if (businessId) {
                    const res = await updateBusiness(businessId, data);
                    if (!res.success) {
                      toast.error(res.error || "Error al actualizar los datos del negocio");
                    } else {
                      toast.success("Perfil del negocio actualizado");
                    }
                  }
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
                      Diagnóstico del Negocio (1/3): Audiencia & Canales
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Define la ubicación y edades de tus compradores principales, el momento de necesidad y los canales donde cierras ventas.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                  <span>Rubro: <strong>{industryPlaceholders.industryLabel}</strong></span>
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
                          Ayuda a la IA a delimitar el alcance geográfico de la publicidad y ajustar los modismos socioculturales.
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
                          Identifica el gatillo emocional o necesidad puntual que despierta la urgencia de compra para usarlo como hook.
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

                  {/* Pregunta 4 (Multiselección) */}
                  <MultiSelectQuestion
                    label="3. Canal Crítico de Conversión"
                    question="¿Por qué medio prefieren tus clientes cerrar la compra?"
                    tooltipText="Indica por dónde prefieren cerrar la compra tus clientes para priorizar los llamados a la acción (CTAs)."
                    chips={industryPlaceholders.conversionChannel.chips}
                    value={strategyValues.conversionChannel}
                    onChange={(val) => setStrategyValues({...strategyValues, conversionChannel: val})}
                    otherPlaceholder="Especifica otro canal de conversión..."
                    defaultPhoneNumber={businessFormValues?.phoneNumbers || ""}
                    allowSubInputs={true}
                  />
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
                    onClick={async () => {
                      if (businessId) {
                        saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      setCurrentStep(4);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente (2/3) <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Diagnóstico del Negocio (2/3): Valor & Arquetipo
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Establece el arquetipo de personalidad con el que se expresará tu marca y la ventaja única que la diferencia.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                  <span>Rubro: <strong>{industryPlaceholders.industryLabel}</strong></span>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
              <CardContent className="pt-6 space-y-6">
                <TooltipProvider delayDuration={150}>
                  {/* Pregunta 3 (Multiselección) */}
                  <MultiSelectQuestion
                    label="1. Personalidad del Negocio (Arquetipo)"
                    question="Si tu negocio fuera una persona, ¿cómo sería?"
                    tooltipText="Define el tono de voz (divertido, refinado, directo, cercano) con el que la IA redactará las publicaciones y guiones de Reels."
                    chips={industryPlaceholders.archetype.chips}
                    value={strategyValues.archetype}
                    onChange={(val) => setStrategyValues({...strategyValues, archetype: val})}
                    otherPlaceholder="Especifica otra personalidad o arquetipo..."
                  />

                  {/* Pregunta 7 */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">2. Ventaja Diferencial Única</Label>
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
                    onClick={() => setCurrentStep(3)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      setCurrentStep(5);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente (3/3) <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Diagnóstico del Negocio (3/3): Confianza & Cierre
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Resuelve las principales objeciones de tus clientes y respalda tu oferta con pruebas sociales de impacto.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                  <span>Rubro: <strong>{industryPlaceholders.industryLabel}</strong></span>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
              <CardContent className="pt-6 space-y-6">
                <TooltipProvider delayDuration={150}>
                  {/* Pregunta 5 */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">1. Dudas Frena-Ventas Comunes</Label>
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
                    label="2. Prueba Social & Testimonios (UGC)"
                    question="¿Qué comentarios tienen tus clientes sobre tu producto?"
                    tooltipText="Menciona testimonios, reseñas o acreditaciones destacadas de tus clientes. El sistema los integrará para generar confianza inmediata en tus anuncios."
                    chips={industryPlaceholders.socialProof.chips}
                    value={strategyValues.socialProof}
                    onChange={(val) => setStrategyValues({...strategyValues, socialProof: val})}
                    maxLimit={3}
                    otherPlaceholder="Especifica otro testimonio o prueba social..."
                  />
                </TooltipProvider>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(4)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={handleFinishStrategy} 
                    disabled={loading}
                    className="rounded-xl h-11 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Finalizar y Guardar Negocio <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>



      <style>{`
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
