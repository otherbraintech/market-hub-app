"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, differenceInCalendarMonths } from "date-fns"
import {
    CalendarIcon,
    Loader2,
    Info,
    Sparkles,
    Target,
    Lightbulb,
    Users,
    Package
} from "lucide-react"
import Image from "next/image"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import { createPlanningOrder, updatePlanningOrder } from "@/app/actions/planning"
import {
    planningOrderSchema,
    type PlanningOrderInput,
    PlanningObjective,
    AssetSource,
    ContentStrategy,
    EmotionalTone,
    ContentPillar
} from "@/lib/schemas/planning"

interface Product {
    id: string
    name: string
    imageUrl?: string | null
}

interface BusinessConfig {
    id: string
    name: string
    tone: string
    channels: string[]
    buyerPersona: {
        ageRange: string
        pains: string[]
        desires: string[]
    }
}

interface PlanningOrderFormProps {
    products: Product[]
    businessConfig?: BusinessConfig
    orderId?: string
    initialData?: Partial<PlanningOrderInput>
}

// Constantes para UI
const OBJECTIVE_CONFIG: Record<PlanningObjective, { label: string; description: string }> = {
    AUMENTAR_VENTAS: {
        label: "Aumentar Ventas",
        description: "Contenido enfocado en conversión directa"
    },
    GENERAR_AWARENESS: {
        label: "Dar a Conocer la Marca",
        description: "Contenido viral y de alto alcance"
    },
    LANZAMIENTO_PRODUCTO: {
        label: "Lanzar Producto",
        description: "Contenido educativo y de expectativa"
    },
    FIDELIZACION_COMUNIDAD: {
        label: "Fidelizar Comunidad",
        description: "Contenido de valor para clientes actuales"
    },
    TRAFICO_WEB: {
        label: "Llevar Tráfico al Sitio",
        description: "Contenido con llamado claro a visitar web"
    },
    EDUCACION_TUTORIALES: {
        label: "Educar Audiencia",
        description: "Tutoriales, tips, cómo-usar"
    },
    OTRO: {
        label: "Otro",
        description: "Objetivo personalizado"
    }
}

const STRATEGY_CONFIG: Record<ContentStrategy, { label: string; shortDesc: string }> = {
    PROBLEM_SOLUTION: { label: "Problema → Solución", shortDesc: "Identificar dolor y presentar solución" },
    SOCIAL_PROOF: { label: "Prueba Social", shortDesc: "Testimonios y casos de éxito" },
    EDUCATIONAL: { label: "Educacional", shortDesc: "Tutoriales y tips" },
    BEHIND_SCENES: { label: "Detrás de Escenas", shortDesc: "Proceso y equipo" },
    ENTERTAINMENT: { label: "Entretenimiento", shortDesc: "Trends y contenido viral" },
    URGENCY_SCARCITY: { label: "Urgencia/Escasez", shortDesc: "Ofertas por tiempo limitado" }
}

const TONE_CONFIG: Record<EmotionalTone, string> = {
    INSPIRATIONAL: "Inspiracional",
    URGENT: "Urgente",
    EDUCATIONAL: "Educativo",
    PLAYFUL: "Divertido",
    AUTHORITATIVE: "Autoritativo",
    EMPATHETIC: "Empático"
}

const PILLAR_CONFIG: Record<ContentPillar, string> = {
    QUALITY: "Calidad",
    INNOVATION: "Innovación",
    SUSTAINABILITY: "Sostenibilidad",
    COMMUNITY: "Comunidad",
    EDUCATION: "Educación",
    PROMOTION: "Promoción",
    STORYTELLING: "Storytelling"
}

export function EnhancedPlanningOrderForm({ products, businessConfig, orderId, initialData }: PlanningOrderFormProps) {
    const { toast } = useToast()
    const [isPending, startTransition] = React.useTransition()
    const [showExceptions, setShowExceptions] = React.useState(
        !!initialData?.excludedDates?.length
    )
    const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const [hasPendingAutosave, setHasPendingAutosave] = React.useState(false)
    const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
    const initialValuesRef = React.useRef<PlanningOrderInput | null>(null)
    const lastSavedValuesRef = React.useRef<PlanningOrderInput | null>(null)
    const skipNextAutosaveRef = React.useRef(false)

    const lsSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)

    const lsDraftKey = orderId ? `planning-draft-${orderId}` : null;

    // Configuración inicial de channelRules (vacía para que la IA decida)
    const defaultChannelRules: Record<string, { formats: any[] }> = {}

    const form = useForm<PlanningOrderInput>({
        resolver: zodResolver(planningOrderSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            objective: initialData?.objective || PlanningObjective.AUMENTAR_VENTAS,
            priorityProductIds: initialData?.priorityProductIds || [],
            additionalFocus: initialData?.additionalFocus || "",
            references: initialData?.references || "",
            frequencyBase: initialData?.frequencyBase || 1.0,
            channelRules: (initialData?.channelRules as any) || defaultChannelRules,
            assetSource: initialData?.assetSource || AssetSource.MIXED,
            productionNotes: initialData?.productionNotes || "",
            excludedDates: initialData?.excludedDates || [],
            dateRange: initialData?.dateRange,

            // Valores por defecto de los nuevos campos
            contentStrategy: initialData?.contentStrategy || ContentStrategy.PROBLEM_SOLUTION,
            contentPillars: initialData?.contentPillars || [ContentPillar.QUALITY],
            emotionalTone: initialData?.emotionalTone || EmotionalTone.INSPIRATIONAL,
            customObjective: "",
            campaignAudience: initialData?.campaignAudience || "",
            callToAction: initialData?.callToAction || "",
            keywords: initialData?.keywords || [],
            visualStyleOverride: initialData?.visualStyleOverride || "",
            offerDetail: initialData?.offerDetail || "",
            primaryChannel: initialData?.primaryChannel || "",
            focusOnBuyerPains: initialData?.focusOnBuyerPains ?? true,
        },
    })

    const [keywordInput, setKeywordInput] = React.useState("")
    const [selectedStylePreset, setSelectedStylePreset] = React.useState<string>("custom")

    const STYLE_PRESETS = [
        { value: "minimalist", label: "Minimalista y Limpio", desc: "Fondos neutros, tipografía simple, poco ruido visual." },
        { value: "corporate", label: "Corporativo y Profesional", desc: "Azules/grises, estructurado, confiable." },
        { value: "vibrant", label: "Vibrante y Pop", desc: "Colores saturados, alto contraste, dinámico." },
        { value: "luxury", label: "Lujo y Elegante", desc: "Negro/Dorado, serif, sofisticado, minimalista dark." },
        { value: "ugc", label: "UGC / Casero", desc: "Estilo orgánico, amateur intencional, cercano." },
        { value: "tech", label: "Futurista / Tech", desc: "Neones, gradientes, moderno." },
        { value: "custom", label: "Personalizado...", desc: "Escribe tu propio estilo." },
    ]

    const handleStyleChange = (val: string) => {
        setSelectedStylePreset(val)
        if (val === "custom") {
            form.setValue("visualStyleOverride", "")
        } else {
            const preset = STYLE_PRESETS.find(p => p.value === val)
            if (preset) form.setValue("visualStyleOverride", preset.label)
        }
    }

    React.useEffect(() => {
        // Initialize style preset if value exists
        const currentStyle = initialData?.visualStyleOverride || ""
        const preset = STYLE_PRESETS.find(p => p.value !== 'custom' && currentStyle.toLowerCase().includes(p.label.toLowerCase()))
        if (preset) {
            setSelectedStylePreset(preset.value)
        } else if (currentStyle) {
            setSelectedStylePreset("custom")
        }
    }, [initialData?.visualStyleOverride])

    const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const val = keywordInput.trim()
            if (val && !form.getValues("keywords").includes(val)) {
                form.setValue("keywords", [...form.getValues("keywords"), val])
                setKeywordInput("")
            }
        }
    }

    const removeKeyword = (k: string) => {
        // Force refresh by spreading new array
        form.setValue("keywords", [...form.getValues("keywords").filter(kw => kw !== k)])
    }

    React.useEffect(() => {
        if (initialValuesRef.current) return
        const values = form.getValues() as PlanningOrderInput
        initialValuesRef.current = values
        lastSavedValuesRef.current = values
    }, [form])

    // Hydration from LocalStorage
    React.useEffect(() => {
        if (!lsDraftKey) return;
        try {
            const saved = localStorage.getItem(lsDraftKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Restore dates from strings
                if (parsed.dateRange?.from) parsed.dateRange.from = new Date(parsed.dateRange.from);
                if (parsed.dateRange?.to) parsed.dateRange.to = new Date(parsed.dateRange.to);
                if (parsed.excludedDates) parsed.excludedDates = parsed.excludedDates.map((d: string) => new Date(d));

                if (parsed.excludedDates?.length > 0) {
                    setShowExceptions(true);
                }

                form.reset({ ...form.getValues(), ...parsed });
            }
        } catch (e) {
            console.error("Error hydrating draft", e);
        }
    }, [lsDraftKey, form]);

    // Dual Autosave Effect (Local + DB)
    React.useEffect(() => {
        if (!orderId) return;

        const subscription = form.watch((values) => {
            if (skipNextAutosaveRef.current) {
                skipNextAutosaveRef.current = false
                return
            }
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            setHasPendingAutosave(true)
            saveTimerRef.current = setTimeout(async () => {
                setIsSaving(true)
                try {
                    await updatePlanningOrder(orderId, values as PlanningOrderInput, { saveAsDraft: true });
                    setLastSaved(new Date());
                    lastSavedValuesRef.current = values as PlanningOrderInput

                    skipNextAutosaveRef.current = true
                    form.reset(values as PlanningOrderInput)
                } catch (error) {
                    console.error("Autosave failed", error);
                } finally {
                    setIsSaving(false);
                    setHasPendingAutosave(false)
                }
            }, 300000); // 5 minutes debounce
        });

        return () => {
            subscription.unsubscribe();
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            if (lsSaveTimerRef.current) clearTimeout(lsSaveTimerRef.current);
        }
    }, [form, orderId, lsDraftKey]);

    function onSubmit(data: PlanningOrderInput) {
        startTransition(async () => {
            let result;
            if (orderId) {
                result = await updatePlanningOrder(orderId, data)
            } else {
                result = await createPlanningOrder(data)
            }

            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: orderId ? "✅ Orden actualizada" : "✅ Orden creada",
                    description: "La planificación ha sido guardada exitosamente.",
                })

                setLastSaved(new Date())
                lastSavedValuesRef.current = data
            }
        })
    }

    function onUndoChanges() {
        const target = lastSavedValuesRef.current ?? initialValuesRef.current
        if (!target) return
        skipNextAutosaveRef.current = true
        setHasPendingAutosave(false)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        form.reset(target)
    }

    async function onManualSave() {
        if (!orderId) return

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        setHasPendingAutosave(false)

        const values = form.getValues() as PlanningOrderInput

        setIsSaving(true)
        try {
            await updatePlanningOrder(orderId, values, { saveAsDraft: true })
            setLastSaved(new Date())
            lastSavedValuesRef.current = values

            skipNextAutosaveRef.current = true
            form.reset(values)
        } catch (error) {
            console.error("Manual save failed", error)
            toast({
                title: "Error",
                description: "No se pudo guardar los cambios.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8">

            <div className="flex justify-end mb-3">
                <div className="w-full sm:w-auto rounded-lg border bg-background/60 px-3 py-2 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="h-8"
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isSaving || isPending || !form.formState.isDirty}
                        >
                            {orderId ? "Guardar" : "Crear"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={onUndoChanges}
                            disabled={isSaving || isPending || !form.formState.isDirty}
                        >
                            Deshacer
                        </Button>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 sm:border-l sm:pl-3">
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Guardando...
                                </>
                            ) : hasPendingAutosave ? (
                                <span>Autoguardado pendiente</span>
                            ) : lastSaved ? (
                                <span>Guardado a las {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            ) : form.formState.isDirty ? (
                                <span>Cambios sin guardar</span>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* SECCIÓN 1: Información Básica */}
                    <div className="space-y-6 rounded-lg border p-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            1. Período y Objetivo
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre de la campaña *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Plan Q1 - Campaña de Verano" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dateRange.from"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Fecha inicio *</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date < new Date()}
                                                        locale={es}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="objective"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Objetivo principal *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="cursor-pointer">
                                                        <SelectValue placeholder="Selecciona un objetivo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(OBJECTIVE_CONFIG).map(([key, config]) => (
                                                        <SelectItem key={key} value={key}>
                                                            <div>
                                                                <div className="font-medium">{config.label}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {config.description}
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {form.watch("objective") === PlanningObjective.OTRO && (
                                    <FormField
                                        control={form.control}
                                        name="customObjective"
                                        render={({ field }) => (
                                            <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <FormLabel>¿Cuál es tu objetivo específico?</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Describe tu objetivo específico..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="dateRange.to"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Fecha fin *</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            (form.getValues("dateRange.from") ? date <= form.getValues("dateRange.from")! : false)
                                                        }
                                                        locale={es}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Excepciones (Moved here) */}
                        {form.watch("dateRange")?.from && form.watch("dateRange")?.to && (
                            <div className="pt-6 border-t mt-6">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Switch
                                        id="enable-exceptions"
                                        checked={showExceptions}
                                        onCheckedChange={setShowExceptions}
                                    />
                                    <Label htmlFor="enable-exceptions" className="text-base font-medium">
                                        Personalizar calendario (Excluir fechas)
                                    </Label>
                                </div>

                                {showExceptions && (
                                    <FormField
                                        control={form.control}
                                        name="excludedDates"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormDescription>
                                                    Selecciona los días específicos donde NO deseas publicar contenido.
                                                </FormDescription>
                                                <div className="mt-4 border rounded-lg p-4">
                                                    <Calendar
                                                        key={`${form.watch("dateRange.from")?.toString()}-${form.watch("dateRange.to")?.toString()}`}
                                                        showOutsideDays={false}
                                                        className="w-full max-w-none"
                                                        classNames={{
                                                            months: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                                                            month: "flex flex-col w-full space-y-4",
                                                            caption: "flex justify-center pt-1 relative items-center mb-4 w-full",
                                                        }}
                                                        mode="multiple"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        fromDate={form.watch("dateRange.from")}
                                                        toDate={form.watch("dateRange.to")}
                                                        disabled={(date) =>
                                                            !form.watch("dateRange.from") ||
                                                            !form.watch("dateRange.to") ||
                                                            date < form.watch("dateRange.from")! ||
                                                            date > form.watch("dateRange.to")!
                                                        }
                                                        defaultMonth={form.watch("dateRange.from")}
                                                        numberOfMonths={differenceInCalendarMonths(
                                                            form.watch("dateRange.to")!,
                                                            form.watch("dateRange.from")!
                                                        ) + 1
                                                        }
                                                        locale={es}
                                                    />
                                                    {field.value && field.value.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t">
                                                            <div className="text-sm font-medium mb-2">Días excluidos seleccionados ({field.value.length}):</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {field.value
                                                                    .sort((a: Date, b: Date) => a.getTime() - b.getTime())
                                                                    .map((date: Date) => format(date, "d 'de' MMMM", { locale: es }))
                                                                    .join(", ")}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}
                    </div>



                    {/* SECCIÓN 2: Estrategia y Enfoque */}
                    <div className="space-y-6 rounded-lg border p-6">

                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            2. Estrategia y Enfoque
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="contentStrategy"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estrategia narrativa</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="cursor-pointer">
                                                        <SelectValue placeholder="Selecciona estrategia" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(STRATEGY_CONFIG).map(([key, config]) => (
                                                        <SelectItem key={key} value={key}>
                                                            <div>
                                                                <div className="font-medium">{config.label}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {config.shortDesc}
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Estructura principal para el contenido
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="emotionalTone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tono emocional</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="cursor-pointer">
                                                        <SelectValue placeholder="Selecciona tono" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(TONE_CONFIG).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="frequencyBase"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Publicaciones por día</FormLabel>
                                                <Badge variant="outline">{field.value}</Badge>
                                            </div>
                                            <FormControl>
                                                <Slider
                                                    min={0.5}
                                                    max={3}
                                                    step={0.5}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(vals) => field.onChange(vals[0])}
                                                    className="mt-2"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Promedio diario distribuido entre canales
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="primaryChannel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Canal de enfoque principal (Opcional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="cursor-pointer">
                                                        <SelectValue placeholder="La IA distribuirá proporcionalmente" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin preferencia (Equilibrado)</SelectItem>
                                                    {businessConfig?.channels.map(ch => (
                                                        <SelectItem key={ch} value={ch} className="capitalize">{ch.toLowerCase()}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Indica si quieres priorizar una red social específica
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="focusOnBuyerPains"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Enfocar en dolores del cliente</FormLabel>
                                                    <FormDescription className="text-xs">
                                                        Contenido que resuelva problemas específicos
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="cursor-pointer"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                </div>
                            </div>
                        </div>

                        {/* Pilares Temáticos */}
                        <FormField
                            control={form.control}
                            name="contentPillars"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pilares temáticos *</FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                        {Object.entries(PILLAR_CONFIG).map(([key, label]) => (
                                            <div
                                                key={key}
                                                className={cn(
                                                    "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                                                    field.value?.includes(key as ContentPillar)
                                                        ? "border-primary bg-primary/10"
                                                        : "border-input hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                <Checkbox
                                                    id={`pillar-${key}`}
                                                    checked={field.value?.includes(key as ContentPillar)}
                                                    onCheckedChange={(checked) => {
                                                        const current = field.value || []
                                                        const isChecked = checked === true

                                                        if (isChecked) {
                                                            if (!current.includes(key as ContentPillar)) {
                                                                field.onChange([...current, key as ContentPillar])
                                                            }
                                                            return
                                                        }

                                                        field.onChange(current.filter((v) => v !== (key as ContentPillar)))
                                                    }}
                                                    className="cursor-pointer"
                                                />
                                                <Label htmlFor={`pillar-${key}`} className="cursor-pointer text-sm">
                                                    {label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <FormDescription>
                                        Selecciona los temas principales para esta campaña
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* SECCIÓN 3: Contexto Creativo (Para la IA) */}
                    <div className="space-y-6 rounded-lg border p-6 bg-blue-50/20">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            3. Contexto Creativo (Para la IA)
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="campaignAudience"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Público Objetivo de Campaña
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej. Clientes que compraron en los últimos 6 meses, o Nuevos usuarios interesados en tecnología."
                                                className="resize-none h-24"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Si es diferente al público general de tu marca.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="offerDetail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Detalles de la Oferta / Información Clave</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej. 20% de descuento usando cupón VERANO24, Envío gratis en compras mayores a $50..."
                                                className="resize-none h-24"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Datos específicos que la IA debe incluir en los copies.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="callToAction"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Llamado a la Acción (CTA)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. 'Regístrate aquí', 'Comenta INFO', 'Compra con 20% OFF'" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                La acción principal que quieres que realicen.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="visualStyleOverride"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estilo Visual</FormLabel>
                                            <div className="space-y-3">
                                                <Select
                                                    value={selectedStylePreset}
                                                    onValueChange={handleStyleChange}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="cursor-pointer">
                                                            <SelectValue placeholder="Selecciona un estilo visual" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {STYLE_PRESETS.map((style) => (
                                                            <SelectItem key={style.value} value={style.value}>
                                                                <div className="flex flex-col items-start text-left">
                                                                    <span className="font-medium">{style.label}</span>
                                                                    <span className="text-xs text-muted-foreground">{style.desc}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {selectedStylePreset === "custom" && (
                                                    <Input
                                                        placeholder="Describe el estilo visual (ej. Cyberpunk, Vintage, etc.)"
                                                        {...field}
                                                    />
                                                )}

                                                {selectedStylePreset !== "custom" && (
                                                    <div className="hidden">
                                                        <Input {...field} value={(() => {
                                                            const preset = STYLE_PRESETS.find(p => p.value === selectedStylePreset)
                                                            return preset ? preset.label : ""
                                                        })()} readOnly />
                                                    </div>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="keywords"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Palabras Clave / Temas de Búsqueda</FormLabel>
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                value={keywordInput}
                                                onChange={(e) => setKeywordInput(e.target.value)}
                                                onKeyDown={handleAddKeyword}
                                                placeholder="Escribe una palabra y presiona Enter..."
                                                className="max-w-sm"
                                            />
                                            <Button type="button" onClick={() => {
                                                const val = keywordInput.trim()
                                                if (val && !field.value.includes(val)) {
                                                    field.onChange([...field.value, val])
                                                    setKeywordInput("")
                                                }
                                            }} variant="secondary">Agregar</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border rounded-md bg-background">
                                            {field.value.length === 0 && (
                                                <span className="text-sm text-muted-foreground italic">Sin palabras clave</span>
                                            )}
                                            {field.value.map((kw, i) => (
                                                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                                                    {kw}
                                                    <span
                                                        className="cursor-pointer hover:bg-muted rounded-full p-0.5"
                                                        onClick={() => removeKeyword(kw)}
                                                    >
                                                        ×
                                                    </span>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <FormDescription>
                                        Ayuda a la IA a encontrar tendencias y vocabulario relevante.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* SECCIÓN 4: Productos y Material */}
                    <div className="space-y-6 rounded-lg border p-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            4. Productos y Material
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="priorityProductIds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Productos a destacar</FormLabel>
                                            <div className="space-y-2 max-h-80 overflow-y-auto border rounded-md p-2">
                                                {products.map((product) => (
                                                    <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-0">
                                                        <Checkbox
                                                            id={`product-${product.id}`}
                                                            checked={field.value?.includes(product.id)}
                                                            onCheckedChange={(checked) => {
                                                                const current = field.value || []
                                                                if (checked) {
                                                                    field.onChange([...current, product.id])
                                                                } else {
                                                                    field.onChange(
                                                                        current.filter((value: string) => value !== product.id)
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex items-center gap-3 cursor-pointer select-none flex-1" onClick={() => {
                                                            const current = field.value || []
                                                            const checked = current.includes(product.id)
                                                            if (!checked) {
                                                                field.onChange([...current, product.id])
                                                            } else {
                                                                field.onChange(current.filter((value: string) => value !== product.id))
                                                            }
                                                        }}>
                                                            <div className="relative h-12 w-12 rounded border bg-muted flex-shrink-0 overflow-hidden">
                                                                {product.imageUrl ? (
                                                                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <Package className="w-6 h-6 text-muted-foreground/40" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <Label htmlFor={`product-${product.id}`} className="cursor-pointer font-semibold">
                                                                    {product.name}
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {products.length === 0 && (
                                                    <div className="p-4 text-center text-muted-foreground italic text-sm">
                                                        No hay productos registrados. Puedes agregarlos en Configuración.
                                                    </div>
                                                )}
                                            </div>
                                            <FormDescription>
                                                Si no seleccionas ninguno, la IA cubrirá todos los productos
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="assetSource"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fuente de material visual</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona fuente" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={AssetSource.CLIENT_PROVIDED}>
                                                        Tengo fotos/videos propios
                                                    </SelectItem>
                                                    <SelectItem value={AssetSource.AI_GENERATED}>
                                                        Usar Stock o IA (no tengo material)
                                                    </SelectItem>
                                                    <SelectItem value={AssetSource.MIXED}>
                                                        Mezclar (tengo algo, complementar)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="references"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Referencias e inspiración</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Links a posts, perfiles, carpetas..."
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>Opcional</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="productionNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Restricciones / Directrices Negativas</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ej. No usar el color rojo, No usar música rock, Evitar jerga juvenil..."
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>Qué debe EVITAR la IA</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* BOTÓN SUBMIT */}

                </form>
            </Form>
        </div>
    )
}