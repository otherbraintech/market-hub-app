"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { 
  Check, Users, ArrowRight, ArrowLeft, Globe, 
  Facebook, Instagram, Loader2, Target, Bot, Sparkles, Info, Phone, Store, CheckCircle2, Plus, TrendingUp, Building2, Trash2
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
import { InteractiveMapPicker } from "@/components/ui/interactive-map-picker";

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

  // Known prefixes that can have comma-separated sub-values
  const KNOWN_PREFIXES = ["Cadenas Canal Moderno", "Comercios Canal Tradicional", "Apps de Delivery", "Número WhatsApp"];

  // Smart parser: splits the comma-separated string but keeps prefix items and chips-with-commas intact
  const parseItems = React.useCallback((raw: string): string[] => {
    if (!raw) return [];
    const items: string[] = [];
    let remaining = raw;

    // Step 1: Extract all prefix items (they may contain commas in their value)
    for (const prefix of KNOWN_PREFIXES) {
      const marker = `${prefix}:`;
      const idx = remaining.indexOf(marker);
      if (idx !== -1) {
        // Find where this prefix item ends - it ends at the next known prefix, chip, or "Otros"
        let endIdx = remaining.length;
        for (const otherPrefix of KNOWN_PREFIXES) {
          if (otherPrefix === prefix) continue;
          const otherMarker = `${otherPrefix}:`;
          const searchStart = idx + marker.length;
          let pos = remaining.indexOf(`, ${otherMarker}`, searchStart);
          if (pos === -1) pos = remaining.indexOf(`,${otherMarker}`, searchStart);
          if (pos !== -1 && pos < endIdx) endIdx = pos;
        }
        for (const chip of chips) {
          const searchStart = idx + marker.length;
          let pos = remaining.indexOf(`, ${chip}`, searchStart);
          if (pos === -1) pos = remaining.indexOf(`,${chip}`, searchStart);
          if (pos !== -1 && pos < endIdx) endIdx = pos;
        }
        {
          const searchStart = idx + marker.length;
          let pos = remaining.indexOf(`, Otros`, searchStart);
          if (pos === -1) pos = remaining.indexOf(`,Otros`, searchStart);
          if (pos !== -1 && pos < endIdx) endIdx = pos;
        }
        
        let prefixItem = remaining.substring(idx, endIdx).trim();
        if (prefixItem.endsWith(",")) prefixItem = prefixItem.slice(0, -1).trim();
        items.push(prefixItem);
        remaining = remaining.substring(0, idx) + remaining.substring(endIdx);
      }
    }

    // Step 2: Extract chip names that contain commas (e.g. "Apps de Delivery (PedidosYa, Yango, etc.)")
    // These must be extracted before naive comma-splitting
    const chipsWithCommas = chips.filter(c => c.includes(","));
    for (const chip of chipsWithCommas) {
      let pos = remaining.indexOf(chip);
      while (pos !== -1) {
        items.push(chip);
        remaining = remaining.substring(0, pos) + remaining.substring(pos + chip.length);
        pos = remaining.indexOf(chip);
      }
    }

    // Step 3: Split the remaining text by commas for simple items
    const rest = remaining.split(",").map(s => s.trim()).filter(Boolean);
    items.push(...rest);
    
    return items;
  }, [chips]);

  const selectedItems = React.useMemo(() => parseItems(value), [value, parseItems]);

  // Determine which preset chips are selected
  const isChipSelected = React.useCallback((chip: string): boolean => {
    return selectedItems.some(item => {
      const clean = item.trim();
      // Exact match
      if (clean === chip) return true;
      // Matching prefix items with chip
      if (chip === "Canal Moderno" && (clean.startsWith("Cadenas Canal Moderno:") || clean.startsWith("Canal Moderno:"))) return true;
      if (chip === "Canal Tradicional" && (clean.startsWith("Comercios Canal Tradicional:") || clean.startsWith("Canal Tradicional:"))) return true;
      if (chip === "Apps de Delivery (PedidosYa, Yango, etc.)" && clean.startsWith("Apps de Delivery:")) return true;
      if (chip === "WhatsApp directo" && clean.startsWith("Número WhatsApp:")) return true;
      return false;
    });
  }, [selectedItems]);

  // Items that don't match any chip and aren't prefix items and aren't "Otros"
  const customOtrosItems = React.useMemo(() => {
    return selectedItems.filter(item => {
      const clean = item.trim();
      if (!clean) return false;
      if (clean.includes(":")) return false;
      if (clean === "Otros") return false;
      return !chips.includes(clean);
    });
  }, [selectedItems, chips]);

  const selectedPresetChips = chips.filter(chip => isChipSelected(chip));
  const isOtrosActive = selectedItems.some(i => i.trim() === "Otros") || customOtrosItems.length > 0;
  const otrosTextFromValue = customOtrosItems.join(", ");

  const [otrosInputText, setOtrosInputText] = useState(otrosTextFromValue);

  useEffect(() => {
    setOtrosInputText(otrosTextFromValue);
  }, [otrosTextFromValue]);

  const totalCount = selectedPresetChips.length + (isOtrosActive ? 1 : 0);

  const isWhatsAppSelected = Boolean(allowSubInputs && selectedItems.some(item => {
    const clean = item.trim();
    return clean === "WhatsApp directo" || clean.startsWith("Número WhatsApp:");
  }));
  const isDeliverySelected = Boolean(allowSubInputs && selectedItems.some(item => {
    const clean = item.trim();
    return clean === "Apps de Delivery (PedidosYa, Yango, etc.)" || clean.startsWith("Apps de Delivery:");
  }));
  const showModernoCard = Boolean(allowSubInputs && selectedItems.some(item => {
    const clean = item.trim();
    return clean === "Canal Moderno" || clean.startsWith("Cadenas Canal Moderno:") || clean.startsWith("Canal Moderno:");
  }));
  const showTradicionalCard = Boolean(allowSubInputs && selectedItems.some(item => {
    const clean = item.trim();
    return clean === "Canal Tradicional" || clean.startsWith("Comercios Canal Tradicional:") || clean.startsWith("Canal Tradicional:");
  }));
  const isRetailOrPhysicalSelected = showModernoCard || showTradicionalCard;

  const findPrefixText = (prefix: string) => {
    const item = selectedItems.find(i => i.trim().startsWith(`${prefix}:`));
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

  // Rebuild the serialized value string from the item list
  const serializeItems = (items: string[]): string => {
    return items.filter(Boolean).join(", ");
  };

  const updatePrefixItem = (prefix: string, text: string) => {
    const filtered = selectedItems.filter(i => !i.trim().startsWith(`${prefix}:`));
    if (text !== "") {
      filtered.push(`${prefix}: ${text}`);
    }
    onChange(serializeItems(filtered));
  };

  // Pre-fill WhatsApp number when selected
  useEffect(() => {
    if (isWhatsAppSelected && defaultPhoneNumber && !findPrefixText("Número WhatsApp")) {
      setWaNumber(defaultPhoneNumber);
      updatePrefixItem("Número WhatsApp", defaultPhoneNumber);
    }
  }, [isWhatsAppSelected, defaultPhoneNumber]);

  const toggleChip = (chip: string) => {
    const isSelected = isChipSelected(chip);
    let nextItems: string[];

    if (isSelected) {
      nextItems = selectedItems.filter(item => {
        const clean = item.trim();
        if (clean === chip) return false;
        if (chip === "Canal Moderno" && (clean.startsWith("Cadenas Canal Moderno:") || clean.startsWith("Canal Moderno:"))) return false;
        if (chip === "Canal Tradicional" && (clean.startsWith("Comercios Canal Tradicional:") || clean.startsWith("Canal Tradicional:"))) return false;
        if (chip === "Apps de Delivery (PedidosYa, Yango, etc.)" && clean.startsWith("Apps de Delivery:")) return false;
        if (chip === "WhatsApp directo" && clean.startsWith("Número WhatsApp:")) return false;
        return true;
      });
    } else {
      if (maxLimit && totalCount >= maxLimit) {
        toast.info(`Solo puedes seleccionar un máximo de ${maxLimit} opciones.`);
        return;
      }
      nextItems = [...selectedItems, chip];
    }
    onChange(serializeItems(nextItems));
  };

  const toggleOtros = () => {
    if (isOtrosActive) {
      setOtrosInputText("");
      const nextItems = selectedItems.filter(item => {
        const clean = item.trim();
        if (clean === "Otros") return false;
        if (clean.includes(":")) return true;
        return chips.includes(clean);
      });
      onChange(serializeItems(nextItems));
    } else {
      if (maxLimit && totalCount >= maxLimit) {
        toast.info(`Solo puedes seleccionar un máximo de ${maxLimit} opciones.`);
        return;
      }
      onChange(serializeItems([...selectedItems, "Otros"]));
    }
  };

  const handleOtrosInputChange = (text: string) => {
    setOtrosInputText(text);
    // Keep preset chips and prefix items, replace custom otros items
    const presetAndPrefixItems = selectedItems.filter(item => {
      const clean = item.trim();
      if (clean.includes(":")) return true;
      if (chips.includes(clean)) return true;
      return false;
    });

    if (text.trim()) {
      onChange(serializeItems([...presetAndPrefixItems, text.trim()]));
    } else {
      onChange(serializeItems([...presetAndPrefixItems, "Otros"]));
    }
  };

  const toggleSubOption = (subOption: string) => {
    const isAlready = selectedItems.some(i => i.trim() === subOption);
    let nextItems: string[];
    if (isAlready) {
      nextItems = selectedItems.filter(i => i.trim() !== subOption);
    } else {
      nextItems = [...selectedItems, subOption];
    }
    onChange(serializeItems(nextItems));
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
          const isSelected = isChipSelected(chip);
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

      {/* Sub-input para Canal Moderno */}
      {allowSubInputs && showModernoCard && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/60 dark:border-purple-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400">
            <span>🛒</span> Especifica las cadenas o supermercados del Canal Moderno (ej. Hipermaxi, Ketal, Fidalga, OXXO, Tambo, etc.):
          </div>
          <Input
            placeholder="Ej. Hipermaxi, Ketal y Fidalga"
            value={modernoText}
            onChange={(e) => {
              setModernoText(e.target.value);
              updatePrefixItem("Cadenas Canal Moderno", e.target.value);
            }}
            className="h-9 text-xs rounded-xl bg-background border-purple-300 dark:border-purple-800 focus-visible:ring-purple-500 font-medium"
          />
        </div>
      )}

      {/* Sub-input para Canal Tradicional */}
      {allowSubInputs && showTradicionalCard && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            <span>🏪</span> Especifica los comercios o puntos del Canal Tradicional (ej. Tiendas de barrio, pulperías, carnicerías, mercados locales):
          </div>
          <Input
            placeholder="Ej. Tiendas de barrio en la zona central y pulperías locales"
            value={tradicionalText}
            onChange={(e) => {
              setTradicionalText(e.target.value);
              updatePrefixItem("Comercios Canal Tradicional", e.target.value);
            }}
            className="h-9 text-xs rounded-xl bg-background border-amber-300 dark:border-amber-800 focus-visible:ring-amber-500 font-medium"
          />
        </div>
      )}
    </div>
  );
}

function BusinessHoursPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const ALL_DAYS = [
    { key: "Lun", label: "Lunes" },
    { key: "Mar", label: "Martes" },
    { key: "Mié", label: "Miércoles" },
    { key: "Jue", label: "Jueves" },
    { key: "Vie", label: "Viernes" },
    { key: "Sáb", label: "Sábado" },
    { key: "Dom", label: "Domingo" },
  ];

  const [daySchedules, setDaySchedules] = useState<Record<string, { active: boolean; open: string; close: string }>>({
    Lun: { active: true, open: "09:00", close: "18:00" },
    Mar: { active: true, open: "09:00", close: "18:00" },
    Mié: { active: true, open: "09:00", close: "18:00" },
    Jue: { active: true, open: "09:00", close: "18:00" },
    Vie: { active: true, open: "09:00", close: "18:00" },
    Sáb: { active: false, open: "09:00", close: "13:00" },
    Dom: { active: false, open: "09:00", close: "13:00" },
  });

  const [is247, setIs247] = useState<boolean>(false);
  const [customDetail, setCustomDetail] = useState<string>("");

  const applyPreset = (preset: "LV" | "LS" | "ALL" | "247") => {
    if (preset === "247") {
      setIs247(true);
      return;
    }
    setIs247(false);
    setDaySchedules({
      Lun: { active: true, open: "09:00", close: "18:00" },
      Mar: { active: true, open: "09:00", close: "18:00" },
      Mié: { active: true, open: "09:00", close: "18:00" },
      Jue: { active: true, open: "09:00", close: "18:00" },
      Vie: { active: true, open: "09:00", close: "18:00" },
      Sáb: { active: preset === "LS" || preset === "ALL", open: "09:00", close: "13:00" },
      Dom: { active: preset === "ALL", open: "09:00", close: "13:00" },
    });
  };

  const toggleDayActive = (key: string) => {
    setDaySchedules(prev => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active }
    }));
  };

  const updateDayTime = (key: string, field: "open" | "close", val: string) => {
    setDaySchedules(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: val }
    }));
  };

  useEffect(() => {
    if (is247) {
      onChange("Atención 24/7 por WhatsApp / Tienda Web");
      return;
    }

    const activeKeys = ALL_DAYS.filter(d => daySchedules[d.key]?.active).map(d => d.key);
    if (activeKeys.length === 0) {
      onChange("Cerrado");
      return;
    }

    let daysText = "";
    if (activeKeys.length === 5 && ["Lun", "Mar", "Mié", "Jue", "Vie"].every(k => activeKeys.includes(k))) {
      daysText = "Lunes a Viernes";
    } else if (activeKeys.length === 6 && ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].every(k => activeKeys.includes(k))) {
      daysText = "Lunes a Sábado";
    } else if (activeKeys.length === 7) {
      daysText = "Todos los días (Lunes a Domingo)";
    } else {
      daysText = ALL_DAYS.filter(d => activeKeys.includes(d.key)).map(d => d.label).join(", ");
    }

    const firstActive = daySchedules[activeKeys[0]];
    let result = `${daysText} (${firstActive?.open} - ${firstActive?.close})`;
    if (customDetail.trim()) {
      result += ` [${customDetail.trim()}]`;
    }
    onChange(result);
  }, [daySchedules, is247, customDetail]);

  const TIME_OPTIONS = ["06:00", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

  return (
    <div className="space-y-4 p-5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
      {/* Selector de Presets Rápidos */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Selección Rápida de Formato
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset("LV")}
            className="text-xs font-semibold px-3 py-1 rounded-xl bg-background border hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-foreground transition-all"
          >
            📅 Lunes a Viernes (9:00 - 18:00)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("LS")}
            className="text-xs font-semibold px-3 py-1 rounded-xl bg-background border hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-foreground transition-all"
          >
            📅 Lunes a Sábado
          </button>
          <button
            type="button"
            onClick={() => applyPreset("ALL")}
            className="text-xs font-semibold px-3 py-1 rounded-xl bg-background border hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-foreground transition-all"
          >
            🗓️ Todos los Días
          </button>
          <button
            type="button"
            onClick={() => applyPreset("247")}
            className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all"
          >
            ⚡ 24/7 Digital
          </button>
        </div>
      </div>

      {/* Lista Vertical de Días (Lunes a Domingo) */}
      {!is247 && (
        <div className="space-y-2 pt-1">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
            Horarios por Día (Lunes a Domingo)
          </label>

          {ALL_DAYS.map((day) => {
            const sched = daySchedules[day.key] || { active: false, open: "09:00", close: "18:00" };
            return (
              <div 
                key={day.key}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  sched.active 
                    ? "bg-background border-indigo-200 dark:border-indigo-800 shadow-xs" 
                    : "bg-muted/30 border-slate-200 dark:border-slate-800/60 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-[120px]">
                  <input
                    type="checkbox"
                    id={`day-${day.key}`}
                    checked={sched.active}
                    onChange={() => toggleDayActive(day.key)}
                    className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor={`day-${day.key}`} className="text-xs font-bold text-foreground cursor-pointer">
                    {day.label}
                  </label>
                </div>

                {sched.active ? (
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-[10px] font-semibold text-muted-foreground">Apertura:</span>
                    <select
                      value={sched.open}
                      onChange={(e) => updateDayTime(day.key, "open", e.target.value)}
                      className="h-8 rounded-lg bg-muted/40 border border-input px-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <span className="text-[10px] font-semibold text-muted-foreground ml-1">Cierre:</span>
                    <select
                      value={sched.close}
                      onChange={(e) => updateDayTime(day.key, "close", e.target.value)}
                      className="h-8 rounded-lg bg-muted/40 border border-input px-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-muted-foreground italic pr-2">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Visualización en tiempo real del resumen formateado */}
      <div className="p-3.5 bg-background/80 rounded-xl border border-indigo-200/50 flex items-center justify-between gap-2 shadow-xs">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">Horario Configurado</span>
          <span className="text-xs font-extrabold text-foreground block">{value || "Selecciona un horario"}</span>
        </div>
        <div className="h-6 px-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black text-[9px] flex items-center">
          ✓ CONFIGURADO
        </div>
      </div>

      {/* Campo opcional de detalles adicionales */}
      <div className="space-y-1 pt-1">
        <label className="text-[9.5px] font-semibold text-muted-foreground">
          Detalle adicional (Opcional, ej. "Atención continua" o "Turno cortado 12:30 a 14:30")
        </label>
        <Input
          placeholder="Ej. Atención continua sin pausa al mediodía"
          value={customDetail}
          onChange={(e) => setCustomDetail(e.target.value)}
          className="h-9 text-xs rounded-xl bg-background border-slate-200 focus-visible:ring-indigo-500"
        />
      </div>
    </div>
  );
}

interface SucursalItem {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  googleMapsUrl: string;
  isMain: boolean;
}

function SucursalesGoogleMapsPicker({
  value,
  onChange,
  defaultLocation,
  defaultPhone,
}: {
  value: any;
  onChange: (val: any) => void;
  defaultLocation?: string;
  defaultPhone?: string;
}) {
  const [sucursales, setSucursales] = useState<SucursalItem[]>(() => {
    if (value) {
      if (Array.isArray(value) && value.length > 0) return value;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return [
      {
        id: "suc-1",
        name: "Sucursal de Venta #1",
        address: defaultLocation || "Av. Principal #100",
        city: "Santa Cruz de la Sierra",
        phone: defaultPhone || "",
        googleMapsUrl: defaultLocation ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultLocation)}` : "",
        isMain: true,
      },
    ];
  });

  const [activeIdx, setActiveIdx] = useState<number>(0);

  // Sincronizar e hidratar sucursales cuando se cargan de la base de datos
  useEffect(() => {
    if (value) {
      let parsed: SucursalItem[] = [];
      if (Array.isArray(value) && value.length > 0) {
        parsed = value;
      } else if (typeof value === "string") {
        try {
          const p = JSON.parse(value);
          if (Array.isArray(p) && p.length > 0) parsed = p;
        } catch (e) {}
      }
      if (parsed.length > 0) {
        setSucursales(parsed);
      }
    }
  }, [value]);

  useEffect(() => {
    onChange(sucursales);
  }, [sucursales]);

  const activeSucursal = sucursales[activeIdx] || sucursales[0] || {
    id: "suc-1",
    name: "Sucursal de Venta #1",
    address: "",
    city: "Santa Cruz de la Sierra",
    phone: "",
    googleMapsUrl: "",
    isMain: true,
  };

  const updateSucursal = (field: keyof SucursalItem, val: any) => {
    updateSucursalFields({ [field]: val });
  };

  const updateSucursalFields = (fields: Partial<SucursalItem>) => {
    setSucursales((prev) => {
      const next = [...prev];
      if (!next[activeIdx]) return prev;
      next[activeIdx] = { ...next[activeIdx], ...fields };

      if (fields.isMain === true) {
        next.forEach((item, idx) => {
          if (idx !== activeIdx) item.isMain = false;
        });
      }
      return next;
    });
  };

  const addSucursal = () => {
    const newIdx = sucursales.length;
    const prevSuc = sucursales[activeIdx] || sucursales[sucursales.length - 1];
    const newSuc: SucursalItem = {
      id: `suc-${Date.now()}`,
      name: `Sucursal de Venta #${newIdx + 1}`,
      address: prevSuc?.address || "",
      city: prevSuc?.city || "Santa Cruz de la Sierra",
      phone: defaultPhone || "",
      googleMapsUrl: prevSuc?.googleMapsUrl || "",
      isMain: sucursales.length === 0,
    };
    setSucursales((prev) => [...prev, newSuc]);
    setActiveIdx(newIdx);
    toast.success(`¡Sucursal de Venta #${newIdx + 1} añadida! Ajusta el pin en el mapa si lo deseas.`);
  };

  const removeSucursal = (idx: number) => {
    if (sucursales.length <= 1) {
      toast.info("Debes mantener al menos 1 sucursal o ubicación de atención.");
      return;
    }
    const next = sucursales.filter((_, i) => i !== idx);
    setSucursales(next);
    setActiveIdx(Math.max(0, idx - 1));
    toast.success("Sucursal eliminada.");
  };

  const BOLIVIA_CITIES = [
    "Santa Cruz de la Sierra",
    "La Paz",
    "El Alto",
    "Cochabamba",
    "Sucre",
    "Tarija",
    "Oruro",
    "Potosí",
    "Trinidad (Beni)",
    "Cobija (Pando)",
    "Internacional / Otra"
  ];

  const mapQuery = `${activeSucursal.address || ''} ${activeSucursal.city || 'Bolivia'}`.trim();
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directMapsUrl = activeSucursal.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="space-y-5 p-5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
      {/* Pestañas de Sucursales (Multisucursal) */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-200/50 pb-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          {sucursales.map((suc, idx) => (
            <button
              key={suc.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeIdx === idx
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-background/80 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/60 text-foreground border border-slate-200 dark:border-slate-800"
              }`}
            >
              <span>{suc.isMain ? "⭐" : "📍"}</span>
              <span className="truncate max-w-[130px]">{suc.name || `Sucursal #${idx + 1}`}</span>
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSucursal}
          className="h-8 text-xs font-bold gap-1 border-indigo-300 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> Añadir Sucursal
        </Button>
      </div>

      {/* Formulario de la Sucursal Seleccionada + Vista Previa Google Maps */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Formulario (Campos) */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h6 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>🗺️ Configuración de Ubicación ({activeIdx + 1} de {sucursales.length})</span>
            </h6>
            {sucursales.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSucursal(activeIdx)}
                className="h-7 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 font-bold"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Eliminar Sucursal
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                Nombre de la Sucursal / Punto de Venta
              </label>
              <Input
                placeholder="Ej. Sucursal de Venta #1 - Equipetrol / Sucursal Calacoto"
                value={activeSucursal.name}
                onChange={(e) => updateSucursal("name", e.target.value)}
                className="h-9 text-xs rounded-xl bg-background font-bold border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                Ciudad / Municipio
              </label>
              <select
                value={activeSucursal.city}
                onChange={(e) => updateSucursal("city", e.target.value)}
                className="w-full h-9 rounded-xl bg-background border border-slate-200 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {BOLIVIA_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                Dirección Exacta o Referencia de Ubicación
              </label>
              <Input
                placeholder="Ej. Av. San Martín #450, entre 3er y 4to Anillo (frente a Banco Bisa)"
                value={activeSucursal.address}
                onChange={(e) => updateSucursal("address", e.target.value)}
                className="h-9 text-xs rounded-xl bg-background border-slate-200 focus-visible:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                Enlace de Google Maps (URL Directa o Pin de Ubicación)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej. https://maps.google.com/?q=..."
                  value={activeSucursal.googleMapsUrl}
                  onChange={(e) => updateSucursal("googleMapsUrl", e.target.value)}
                  className="h-9 text-xs rounded-xl bg-background border-slate-200 focus-visible:ring-indigo-500 font-mono text-[11px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const generated = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
                    updateSucursal("googleMapsUrl", generated);
                    toast.success("Enlace de Google Maps generado dinámicamente.");
                  }}
                  className="h-9 text-[10px] font-bold shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  📍 Generar Enlace
                </Button>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <input
                type="checkbox"
                id={`main-suc-${activeIdx}`}
                checked={activeSucursal.isMain}
                onChange={(e) => updateSucursal("isMain", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor={`main-suc-${activeIdx}`} className="text-xs font-bold text-foreground cursor-pointer select-none">
                ⭐ Establecer como Casa Matriz / Sucursal Principal del Negocio
              </label>
            </div>
          </div>
        </div>

        {/* Mapa Interactivo con Pin Arrastrable y Búsqueda (Lado derecho) */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Selector de Mapa Interactivo
            </span>
          </div>

          <InteractiveMapPicker
            key={`sucursal-map-${activeIdx}`}
            city={activeSucursal.city}
            address={activeSucursal.address}
            googleMapsUrl={activeSucursal.googleMapsUrl}
            onLocationChange={({ address: newAddr, city: newCity, googleMapsUrl: newMapsUrl }) => {
              updateSucursalFields({
                address: newAddr,
                city: newCity || activeSucursal.city,
                googleMapsUrl: newMapsUrl,
              });
            }}
          />
        </div>
      </div>
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
  const isEdit = searchParams.get("edit") === "true";

  const [businessId, setBusinessId] = useState<string>(isNew ? "" : initialBusinessId);
  const [initializing, setInitializing] = useState(true);
  const [hasIncompleteBusiness, setHasIncompleteBusiness] = useState(false);
  const [currentStep, setCurrentStep] = useState(
    forceStep ? parseInt(forceStep) : (initialBusinessId && !isNew && !isEdit) ? 2 : 1
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

        // Si estamos en modo edición explícito (`edit=true`)
        if (isEdit) {
          setBusinessId(b.id);
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
            logo: b.logo || "",
            branches: (b.branches as any) || [],
            catalog: (b.catalog as any) || { fileUrl: "", fileName: "", summary: "" },
          });
          if (b.onboardingStrategy && typeof b.onboardingStrategy === "object") {
            setStrategyValues((prev) => ({
              ...prev,
              ...(b.onboardingStrategy as any)
            }));
          }
          if (b.competitors && b.competitors.length > 0) {
            setCompetitors(b.competitors.map((c: any) => ({
              id: c.id,
              name: c.name || "",
              website: c.website || "",
              facebook: c.facebook || "",
              instagram: c.instagram || "",
              tiktok: c.tiktok || "",
            })));
          }
          setHasIncompleteBusiness(false);
          setHasStrategyInDb(true);
          setCurrentStep(forceStep ? parseInt(forceStep) : 1);
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
            logo: b.logo || "",
            branches: (b.branches as any) || [],
            catalog: (b.catalog as any) || { fileUrl: "", fileName: "", summary: "" },
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
              id: c.id,
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
          logo: b.logo || "",
          branches: (b.branches as any) || [],
          catalog: (b.catalog as any) || { fileUrl: "", fileName: "", summary: "" },
        });

        if (forceStep) {
          setBusinessId(b.id);
          if (b.competitors && b.competitors.length > 0) {
            setCompetitors(b.competitors.map((c: any) => ({
              id: c.id,
              name: c.name || "",
              website: c.website || "",
              facebook: c.facebook || "",
              instagram: c.instagram || "",
              tiktok: c.tiktok || "",
            })));
          }
          setCurrentStep(parseInt(forceStep));
        } else if (b.competitors && b.competitors.length > 0) {
          setCompetitors(b.competitors.map((c: any) => ({
            id: c.id,
            name: c.name || "",
            website: c.website || "",
            facebook: c.facebook || "",
            instagram: c.instagram || "",
            tiktok: c.tiktok || "",
          })));
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

  const goToStep = async (targetStep: number) => {
    if (businessId && currentStep >= 3) {
      await saveOnboardingStrategyAction(businessId, strategyValues);
    }
    setCurrentStep(targetStep);
  };

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
    id?: string;
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
    businessHours: "",
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
        const res = await saveMultipleCompetitorsAction(businessId, validList, false);
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
    setLoading(true);

    // Auto-sanitizar canales de conversión para evitar bloqueos si no ingresó sub-detalles
    let sanitizedConvChannel = strategyValues.conversionChannel || "";
    if (sanitizedConvChannel.includes("Canal Moderno") && !sanitizedConvChannel.includes("Cadenas Canal Moderno:")) {
      sanitizedConvChannel += ", Cadenas Canal Moderno: Supermercados y cadenas locales";
    }
    if (sanitizedConvChannel.includes("Canal Tradicional") && !sanitizedConvChannel.includes("Comercios Canal Tradicional:")) {
      sanitizedConvChannel += ", Comercios Canal Tradicional: Friales, mercados y pulperías";
    }
    if (sanitizedConvChannel.includes("Apps de Delivery") && !sanitizedConvChannel.includes("Apps de Delivery:")) {
      sanitizedConvChannel += ", Apps de Delivery: PedidosYa, Yango";
    }

    const finalStrategyValues = {
      ...strategyValues,
      conversionChannel: sanitizedConvChannel,
    };

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
            branches: businessFormValues.branches,
            socialLinks: businessFormValues.socialLinks,
            onboardingStrategy: finalStrategyValues
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
            const { onboardingStrategy, ...cleanFormValues } = businessFormValues as any;
            await updateBusiness(activeBusinessId, cleanFormValues);
          }
          const saveRes = await saveOnboardingStrategyAction(activeBusinessId, finalStrategyValues);
          if (!saveRes.success) {
            toast.error(saveRes.error || "Ocurrió un error al guardar las preguntas estratégicas.");
          }
        }

        const validList = competitors.filter(c => c.name.trim() !== "");
        if (validList.length > 0) {
          const res = await saveMultipleCompetitorsAction(activeBusinessId, validList, false);
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
      {/* Indicador Progresivo Elegante para las 11 Etapas */}
      {(() => {
        const stepMeta: Record<number, { subtitle: string; emoji: string; phase: string }> = {
          1: { subtitle: "Perfil del Negocio", emoji: "🏢", phase: "Paso 1 de 11 · Configuración Inicial" },
          2: { subtitle: "Competidores Directos", emoji: "🔍", phase: "Paso 2 de 11 · Análisis de Mercado" },
          3: { subtitle: "Ubicación y Audiencia Objetivo", emoji: "📍", phase: "Paso 3 de 11 · Estrategia Base" },
          4: { subtitle: "Gatillo de Compra y Necesidad Clave", emoji: "⚡", phase: "Paso 4 de 11 · Estrategia Base" },
          5: { subtitle: "Canal Preferido de Conversión", emoji: "💬", phase: "Paso 5 de 11 · Estrategia Base" },
          6: { subtitle: "Personalidad y Tono de Marca", emoji: "🎭", phase: "Paso 6 de 11 · Estrategia Base" },
          7: { subtitle: "Ventaja Competitiva Diferencial", emoji: "🏆", phase: "Paso 7 de 11 · Estrategia Base" },
          8: { subtitle: "Preguntas Frecuentes y Objeciones", emoji: "❓", phase: "Paso 8 de 11 · Estrategia Base" },
          9: { subtitle: "Prueba Social y Testimonios", emoji: "⭐", phase: "Paso 9 de 11 · Estrategia Base" },
          10: { subtitle: "Horarios y Días de Atención", emoji: "🕒", phase: "Paso 10 de 11 · Estrategia Base" },
          11: { subtitle: "Sucursales y Ubicaciones (Google Maps API)", emoji: "🗺️", phase: "Paso 11 de 11 · Puntos de Venta" },
        };
        const meta = stepMeta[currentStep] || stepMeta[1];

        return (
          <div className="bg-card/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {meta.emoji} {meta.phase}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-foreground tracking-tight">
                  {meta.subtitle}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/trends"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/30 transition-all shadow-sm hover:scale-105"
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Motor de Tendencias IA
                </Link>
                <Link
                  href="/business"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
                >
                  <Building2 className="h-3.5 w-3.5" /> Ir al Panel
                </Link>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200/60">
                  {Math.round((currentStep / 11) * 100)}% Completado
                </span>
              </div>
            </div>

            {/* Barra Progresiva de Estado */}
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 shadow-md"
                style={{ width: `${(currentStep / 11) * 100}%` }}
              />
            </div>

            {/* Navegador Interactivo de Pasos (Disponible en Modo Edición / Negocio Existente) */}
            {(isEdit || Boolean(businessId) || hasStrategyInDb) && (
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> NAVEGACIÓN RÁPIDA ENTRE PASOS (EDICIÓN)
                  </span>
                  <span className="text-[9.5px] font-medium text-muted-foreground">
                    Haz clic en cualquier paso para saltar directamente
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((stepNum) => {
                    const isActive = currentStep === stepNum;
                    const labels: Record<number, string> = {
                      1: "1. Perfil",
                      2: "2. Competidores",
                      3: "3. Ubicación",
                      4: "4. Gatillo",
                      5: "5. Canales",
                      6: "6. Marca",
                      7: "7. Diferencial",
                      8: "8. Objeciones",
                      9: "9. Testimonios",
                      10: "10. Horarios",
                      11: "11. Sucursales"
                    };
                    return (
                      <button
                        key={stepNum}
                        type="button"
                        onClick={async () => {
                          if (businessId && currentStep >= 3) {
                            await saveOnboardingStrategyAction(businessId, strategyValues);
                          }
                          setCurrentStep(stepNum);
                        }}
                        className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-xl border transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105"
                            : "bg-background/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-foreground border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                        }`}
                      >
                        {labels[stepNum]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
                    {isEdit ? "Edita tu negocio" : "Crea tu negocio"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    {isEdit 
                      ? "Modifica el perfil de tu negocio, competidores y diagnóstico estratégico." 
                      : "Diseñemos tu estrategia de marca, segmentación de buyer personas y funnels en solo segundos utilizando Inteligencia Artificial."}
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
                  const inferredIndustry = getIndustryPlaceholders(data.industry, data.description, data.name).industryLabel;
                  const updatedFormValues = {
                    ...data,
                    industry: (data.industry && data.industry.trim().length > 0) ? data.industry : inferredIndustry,
                  };
                  setBusinessFormValues(updatedFormValues);
                  setBusinessName(data.name);
                  if (businessId) {
                    const { onboardingStrategy, ...cleanData } = updatedFormValues as any;
                    const res = await updateBusiness(businessId, cleanData);
                    if (!res.success) {
                      toast.error(res.error || "Error al actualizar los datos del negocio");
                    } else {
                      toast.success("Perfil del negocio actualizado");
                    }
                  }
                  goToStep(2);
                }}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/50 p-8 shadow-inner">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10" />
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                <div className="h-14 w-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-500/20">
                  <Users className="h-7 w-7" />
                </div>
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Paso 2: Análisis Competitivo</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    Registra a tus Competidores Directos
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Ingresa los enlaces web o redes de tus principales competidores locales. El agente rastreará sus estrategias para identificar oportunidades de mercado para tu marca.
                  </p>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  {competitors.map((comp, idx) => (
                    <div key={comp.id || `comp-${idx}`} className="p-4 rounded-2xl bg-muted/30 border space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> Competidor #{idx + 1}
                        </span>
                        {competitors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCompetitor(idx)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] font-medium">Nombre del Competidor *</Label>
                          <Input
                            placeholder="Ej. Hamburguesas El Rey"
                            value={comp.name}
                            onChange={(e) => updateCompetitor(idx, "name", e.target.value)}
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium">Sitio Web</Label>
                          <Input
                            placeholder="https://competidor.com"
                            value={comp.website}
                            onChange={(e) => updateCompetitor(idx, "website", e.target.value)}
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium">Instagram</Label>
                          <Input
                            placeholder="https://instagram.com/competidor"
                            value={comp.instagram}
                            onChange={(e) => updateCompetitor(idx, "instagram", e.target.value)}
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium">Facebook</Label>
                          <Input
                            placeholder="https://facebook.com/competidor"
                            value={comp.facebook}
                            onChange={(e) => updateCompetitor(idx, "facebook", e.target.value)}
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium">TikTok</Label>
                          <Input
                            placeholder="https://tiktok.com/@competidor"
                            value={comp.tiktok}
                            onChange={(e) => updateCompetitor(idx, "tiktok", e.target.value)}
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {competitors.length < maxCompetitorsLimit && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCompetitor}
                      className="w-full border-dashed border-slate-300 dark:border-slate-700 rounded-xl h-11 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Agregar Otro Competidor
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToStep(1)}
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button
                    type="button"
                    onClick={handleFinishCompetitors}
                    disabled={loading}
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...
                      </>
                    ) : (
                      <>
                        Continuar al Diagnóstico <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 1 DE 7: Ubicación y Edad Objetivo (Step 3) */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 3 de 10 · Ubicación y Audiencia Objetivo
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Define en qué ciudad o zona se encuentran tus compradores clave y su rango de edad.
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
                </TooltipProvider>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => goToStep(2)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        await saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      goToStep(4);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 2 DE 7: Momento Desencadenante (Step 4) */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 4 de 10 · Gatillo de Compra y Necesidad Clave
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Identifica el momento o necesidad especial que motiva a tus clientes a adquirir tu producto.
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
                </TooltipProvider>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => goToStep(3)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        await saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      goToStep(5);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 3 DE 7: Canal Crítico de Conversión (Step 5) */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 5 de 10 · Canal Preferido de Conversión
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Define los medios principales por donde tus clientes prefieren comunicarse y cerrar sus compras.
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
                    onClick={() => goToStep(4)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        await saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      goToStep(6);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 4 DE 7: Personalidad del Negocio / Arquetipo (Step 6) */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 6 de 10 · Personalidad y Tono de Marca
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Establece el estilo de comunicación con el que tu negocio conectará con la audiencia.
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
                  <MultiSelectQuestion
                    label="4. Personalidad del Negocio (Arquetipo)"
                    question="Si tu negocio fuera una persona, ¿cómo sería?"
                    tooltipText="Define el tono de voz (divertido, refinado, directo, cercano) con el que la IA redactará las publicaciones y guiones de Reels."
                    chips={industryPlaceholders.archetype.chips}
                    value={strategyValues.archetype}
                    onChange={(val) => setStrategyValues({...strategyValues, archetype: val})}
                    otherPlaceholder="Especifica otra personalidad o arquetipo..."
                  />
                </TooltipProvider>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => goToStep(5)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        await saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      goToStep(7);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 5 DE 7: Ventaja Diferencial Única (Step 7) */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 7 de 10 · Ventaja Competitiva Diferencial
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Fija la propuesta de valor y beneficio principal que destaca a tu marca frente a la competencia.
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
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">5. Ventaja Diferencial Única</Label>
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
                    onClick={() => goToStep(6)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        await saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      goToStep(8);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 6 DE 7: Dudas Frena-Ventas Comunes / Brechas (Step 8) */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 8 de 10 · Preguntas Frecuentes y Objeciones
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Indica las dudas o consultas más repetidas de tus clientes antes de comprar para resolverlas en la estrategia.
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
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">6. Dudas Frena-Ventas Comunes</Label>
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
                </TooltipProvider>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => goToStep(7)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        await saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      goToStep(9);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 7 DE 7: Prueba Social & Testimonios (Step 9) */}
        {currentStep === 9 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 9 de 10 · Prueba Social y Testimonios
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Destaca opiniones y comentarios reales de tus clientes para generar máxima confianza en tu oferta.
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
                  <MultiSelectQuestion
                    label="7. Prueba Social & Testimonios (UGC)"
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
                    onClick={() => goToStep(8)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        await saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      goToStep(10);
                    }} 
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 8 DE 8: Horarios y Días de Atención (Step 10) */}
        {currentStep === 10 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 10 de 11 · Horarios y Días de Atención
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Especifica los días y horas de atención al cliente para sincronizar las publicaciones y llamadas a la acción.
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
                  <div className="space-y-3">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">10. Horarios y Días de Atención</Label>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-foreground leading-snug">¿En qué días y horarios atiende tu negocio?</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shrink-0">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Permite a la IA programar publicaciones y CTAs en horas donde tu equipo esté listo para responder consultas y atender llamadas.
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Componente Dinámico de Selección de Días y Horarios */}
                    <BusinessHoursPicker
                      value={strategyValues.businessHours}
                      onChange={(val) => setStrategyValues({...strategyValues, businessHours: val})}
                    />
                  </div>
                </TooltipProvider>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => goToStep(9)} 
                    className="rounded-xl h-11 px-6 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>

                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (businessId) {
                        await saveOnboardingStrategyAction(businessId, strategyValues);
                      }
                      goToStep(11);
                    }}
                    className="rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREGUNTA 11 DE 11: Sucursales y Ubicaciones (Google Maps API) (Step 11) */}
        {currentStep === 11 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-foreground">
                      Paso 11 de 11 · Sucursales y Ubicaciones del Negocio
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      Añade tus sucursales y puntos de venta. La IA integrará las ubicaciones y enlaces de Google Maps en los copies y llamados a la acción.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                  <span>Google Maps API Activo</span>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-md card-shadow bg-card/60 backdrop-blur-md">
              <CardContent className="pt-6 space-y-6">
                <TooltipProvider delayDuration={150}>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">11. Sucursales y Ubicaciones del Negocio</Label>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-foreground leading-snug">¿Dónde están ubicadas tus sucursales y puntos de atención?</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" tabIndex={-1} className="text-muted-foreground/60 hover:text-indigo-600 transition-colors p-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shrink-0">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium leading-relaxed bg-slate-900 text-slate-100 p-2.5 rounded-xl shadow-xl border border-slate-800">
                          Integra múltiples sucursales con mapas en vivo para direccionar el tráfico local de campañas hacia cada tienda o punto de venta.
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Componente Dinámico de Sucursales con Google Maps */}
                    <SucursalesGoogleMapsPicker
                      value={(strategyValues as any).sucursales}
                      onChange={(val) => setStrategyValues({...strategyValues, sucursales: val} as any)}
                      defaultLocation={businessFormValues?.location || ""}
                      defaultPhone={businessFormValues?.phoneNumbers || ""}
                    />
                  </div>
                </TooltipProvider>

                <div className="flex items-center justify-between mt-6 border-t pt-5">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => goToStep(10)} 
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
                        {isEdit ? "Guardar Cambios del Negocio" : "Finalizar y Guardar Negocio"} <ArrowRight className="h-4 w-4 ml-2" />
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
