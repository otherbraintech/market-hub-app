"use client"

import * as React from "react"
import { HelpCircle, Loader2, Instagram, Facebook, Smartphone, Plus, Trash2, Globe } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useBusiness } from "@/contexts/business-context"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { saveBusinessBaseConfig } from "@/app/actions/base-config"
import { useToast } from "@/hooks/use-toast"

const SOCIAL_CHANNEL_OPTIONS = ["instagram", "tiktok", "facebook"]

function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm leading-snug text-balance">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
}

function normalizeHex(value: string) {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  const isValid = /^#?[0-9A-Fa-f]{6}$/.test(trimmed) || /^#[0-9A-Fa-f]{6}$/.test(withHash)
  if (!isValid) return null
  return withHash.toLowerCase()
}

export interface BaseConfigFormState {
  years_in_market: string
  country: string
  city: string
  coverage_area: "" | "local" | "nacional" | "internacional"
  brand_tone:
  | ""
  | "formal"
  | "juvenil"
  | "profesional"
  | "premium"
  | "divertido"
  | "cercano"
  | "motivador"
  | "serio"
  | "emocional"
  | "informal"
  brand_personality: string
  brand_language_level: "" | "simple" | "medio" | "avanzado"
  allowed_emojis: boolean
  forbidden_words: string
  target_audience_all_ages: boolean
  target_audience_age_ranges: string
  target_gender: "" | "hombre" | "mujer" | "mixto"

  main_pain_point: string
  main_desire: string
  main_objection: string
  buying_motivation: string
  main_products: string
  average_ticket: "" | "bajo" | "medio" | "alto"
  purchase_frequency: "" | "ocasional" | "recurrente"
  active_channels: string
  visual_style: "" | "minimalista" | "moderno" | "elegante" | "colorido" | "oscuro"
  brand_colors: string
  competitors: any // Will be parsed as array of objects
}

export function BaseConfigForm({ initialForm }: { initialForm: BaseConfigFormState }) {
  const [form, setForm] = React.useState<BaseConfigFormState>(initialForm)

  React.useEffect(() => {
    setForm(initialForm)
  }, [initialForm])

  const [brandPersonalityInput, setBrandPersonalityInput] = React.useState("")
  const [forbiddenWordsInput, setForbiddenWordsInput] = React.useState("")
  const [helperAgeMin, setHelperAgeMin] = React.useState("")
  const [helperAgeMax, setHelperAgeMax] = React.useState("")
  const [competitorInput, setCompetitorInput] = React.useState({ name: "", url: "", social_network: "" })
  const brandColorPickerRef = React.useRef<HTMLInputElement | null>(null)
  const brandColorTextRef = React.useRef<HTMLInputElement | null>(null)
  const [editingBrandColor, setEditingBrandColor] = React.useState<string | null>(null)

  const brandPersonalityTags = parseCommaList(form.brand_personality)
  const forbiddenWordsTags = parseCommaList(form.forbidden_words)
  const activeChannelsTags = parseCommaList(form.active_channels)
  const brandColorTags = parseCommaList(form.brand_colors)
  const ageTags = parseCommaList(form.target_audience_age_ranges)
  const isAllAges = form.target_audience_all_ages

  function setBrandColorEditorValue(value: string) {
    const normalized = normalizeHex(value)
    if (!normalized) return
    if (brandColorPickerRef.current) {
      brandColorPickerRef.current.value = normalized
    }
    if (brandColorTextRef.current) {
      brandColorTextRef.current.value = normalized
    }
  }

  function beginEditBrandColor(color: string) {
    setEditingBrandColor(color)
    setBrandColorEditorValue(color)
  }

  function cancelEditBrandColor() {
    setEditingBrandColor(null)
  }

  function upsertBrandColor(candidate: string) {
    const normalized = normalizeHex(candidate)
    if (!normalized) return

    if (editingBrandColor) {
      const from = editingBrandColor
      setForm((f) => {
        const parts = parseCommaList(f.brand_colors)
        const replaced = parts.map((p) => (p === from ? normalized : p))
        const deduped = replaced.filter((p, idx) => replaced.indexOf(p) === idx)
        return { ...f, brand_colors: deduped.join(", ") }
      })
      setEditingBrandColor(null)
      setBrandColorEditorValue(normalized)
      return
    }

    addTagToField("brand_colors", normalized)
    setBrandColorEditorValue(normalized)
  }

  function addBrandColorFromPicker() {
    const textValue = brandColorTextRef.current?.value?.trim()
    const pickerValue = brandColorPickerRef.current?.value?.trim()
    const candidate = textValue ? textValue : pickerValue
    if (!candidate) return
    upsertBrandColor(candidate)
  }

  function syncBrandColorText(value: string) {
    const next = value.toLowerCase()
    if (brandColorTextRef.current) {
      brandColorTextRef.current.value = next
    }
  }

  // Age helper functions
  const COMMON_AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]

  function toggleAllAges(checked: boolean) {
    setForm(f => ({ ...f, target_audience_all_ages: checked }))
  }

  function addAgeRange(range: string) {
    if (isAllAges) {
      // If adding a specific range while "All ages" is checked, uncheck "All ages"
      setForm(f => ({
        ...f,
        target_audience_all_ages: false,
        target_audience_age_ranges: range
      }))
      return
    }
    setForm(f => {
      const current = parseCommaList(f.target_audience_age_ranges)
      if (current.includes(range)) return f
      return { ...f, target_audience_age_ranges: [...current, range].join(", ") }
    })
  }

  function removeAgeRange(range: string) {
    setForm(f => {
      const current = parseCommaList(f.target_audience_age_ranges)
      const next = current.filter(r => r !== range)
      return { ...f, target_audience_age_ranges: next.join(", ") }
    })
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type, checked } = e.target as HTMLInputElement
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }))
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
  }

  function addTagToField(
    field: "brand_personality" | "forbidden_words" | "active_channels" | "brand_colors",
    rawTag: string
  ) {
    const tag = field === "brand_colors" ? normalizeHex(rawTag) : rawTag.trim()
    if (!tag) return
    setForm((f) => {
      const current = (f[field] as string) || ""
      const parts = parseCommaList(current)
      if (parts.includes(tag)) return f
      const nextParts = [...parts, tag]
      const next: BaseConfigFormState = { ...f, [field]: nextParts.join(", ") }
      return next
    })
  }

  function removeTagFromField(
    field: "brand_personality" | "forbidden_words" | "active_channels" | "brand_colors",
    tag: string
  ) {
    setForm((f) => {
      const current = (f[field] as string) || ""
      const parts = parseCommaList(current)
      const nextParts = parts.filter((p) => p !== tag)
      const next: BaseConfigFormState = { ...f, [field]: nextParts.join(", ") }
      return next
    })
  }

  const competitorsList = Array.isArray(form.competitors) ? form.competitors : []

  function addCompetitor() {
    if (!competitorInput.name) return
    setForm(f => ({
      ...f,
      competitors: [...competitorsList, { ...competitorInput }]
    }))
    setCompetitorInput({ name: "", url: "", social_network: "" })
  }

  function removeCompetitor(index: number) {
    setForm(f => ({
      ...f,
      competitors: competitorsList.filter((_, i) => i !== index)
    }))
  }

  function handleTagInputKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "brand_personality" | "forbidden_words" | "brand_colors",
    inputValue: string,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (!inputValue.trim()) return
      addTagToField(field, inputValue)
      setInput("")
    }
  }

  function toggleChannel(channel: string) {
    const exists = activeChannelsTags.includes(channel)
    if (exists) {
      removeTagFromField("active_channels", channel)
    } else {
      addTagToField("active_channels", channel)
    }
  }

  const [isPending, startTransition] = React.useTransition()
  const { toast } = useToast()

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await saveBusinessBaseConfig(formData)
      if (result.error) {
        toast({
          title: "Error al guardar",
          description: "Hubo un problema al guardar la configuración. Intenta nuevamente.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Configuración guardada",
          description: "Los cambios se han guardado correctamente.",
        })
      }
    })
  }

  const { isBusinessSwitching } = useBusiness()

  if (isBusinessSwitching) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Cargando información del negocio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Define parámetros estándar de marca para la planificación de contenido.
          </p>
        </div>
      </div>
      <form action={handleAction} className="space-y-8 max-w-3xl">
        {/* Sections... */}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Identidad del negocio
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="years_in_market">
                <LabelWithTooltip
                  label="Años en el mercado"
                  tooltip="Cuánto tiempo llevas operando con este negocio o marca."
                />
              </Label>
              <Input
                id="years_in_market"
                name="years_in_market"
                type="number"
                min={0}
                value={form.years_in_market}
                onChange={handleChange}
                placeholder="Ej. 3"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">
                <LabelWithTooltip
                  label="País"
                  tooltip="País principal donde opera el negocio."
                />
              </Label>
              <Input
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Ej. México"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">
                <LabelWithTooltip
                  label="Ciudad"
                  tooltip="Ciudad principal de operación o sede."
                />
              </Label>
              <Input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Ej. Ciudad de México"
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverage_area">
              <LabelWithTooltip
                label="Alcance"
                tooltip="Nivel de alcance actual de tu negocio: local, nacional o internacional."
              />
            </Label>
            <Select
              value={form.coverage_area}
              name="coverage_area"
              onValueChange={(val) => setForm(f => ({ ...f, coverage_area: val as any }))}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona alcance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="nacional">Nacional</SelectItem>
                <SelectItem value="internacional">Internacional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Marca y comunicación
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="brand_tone">
                <LabelWithTooltip
                  label="Tono de marca"
                  tooltip="Cómo quieres que suene tu comunicación: más formal, cercana, divertida, motivadora, etc."
                />
              </Label>
              <Select
                value={form.brand_tone}
                name="brand_tone"
                onValueChange={(val) => setForm(f => ({ ...f, brand_tone: val as any }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tono" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="juvenil">Juvenil</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="divertido">Divertido</SelectItem>
                  <SelectItem value="cercano">Cercano</SelectItem>
                  <SelectItem value="motivador">Motivador</SelectItem>
                  <SelectItem value="serio">Serio</SelectItem>
                  <SelectItem value="emocional">Emocional</SelectItem>
                  <SelectItem value="informal">Informal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand_language_level">
                <LabelWithTooltip
                  label="Nivel de lenguaje"
                  tooltip="Qué tan técnico o sencillo debe ser el lenguaje de la comunicación."
                />
              </Label>
              <Select
                value={form.brand_language_level}
                name="brand_language_level"
                onValueChange={(val) => setForm(f => ({ ...f, brand_language_level: val as any }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="allowed_emojis"
                checked={form.allowed_emojis}
                onCheckedChange={(checked) => setForm(f => ({ ...f, allowed_emojis: checked === true }))}
                disabled={isPending}
              />
              {form.allowed_emojis && <input type="hidden" name="allowed_emojis" value="on" />}
              <Label htmlFor="allowed_emojis">
                Permitir emojis en el copy
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand_personality">
              <LabelWithTooltip
                label="Personalidad de marca"
                tooltip="Palabras clave que describen la personalidad de tu marca. Usa varias, como si fueran etiquetas."
              />
            </Label>
            <div className="space-y-2">
              <Input
                id="brand_personality"
                name="brand_personality"
                value={brandPersonalityInput}
                onChange={(e) => setBrandPersonalityInput(e.target.value)}
                onKeyDown={(e) =>
                  handleTagInputKeyDown(
                    e,
                    "brand_personality",
                    brandPersonalityInput,
                    setBrandPersonalityInput,
                  )
                }
                disabled={isPending}
                placeholder="Escribe un rasgo y presiona Enter o coma para agregarlo"
              />
              <input
                type="hidden"
                name="brand_personality_hidden"
                value={form.brand_personality}
              />
              {brandPersonalityTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {brandPersonalityTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1 bg-primary/10 text-primary dark:text-zinc-100 hover:bg-primary/20"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant={"ghost"}
                        onClick={() => removeTagFromField("brand_personality", tag)}
                        disabled={isPending}
                        className="h-4 w-4 p-0 rounded-full hover:bg-foreground/10 dark:hover:bg-zinc-800"
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="forbidden_words">
              <LabelWithTooltip
                label="Palabras prohibidas"
                tooltip="Palabras, expresiones o conceptos que no quieres que la IA utilice nunca."
              />
            </Label>
            <div className="space-y-2">
              <Input
                id="forbidden_words"
                name="forbidden_words"
                value={forbiddenWordsInput}
                onChange={(e) => setForbiddenWordsInput(e.target.value)}
                onKeyDown={(e) =>
                  handleTagInputKeyDown(
                    e,
                    "forbidden_words",
                    forbiddenWordsInput,
                    setForbiddenWordsInput,
                  )
                }
                disabled={isPending}
                placeholder="Escribe una palabra y presiona Enter o coma para agregarla"
              />
              <input
                type="hidden"
                name="forbidden_words_hidden"
                value={form.forbidden_words}
              />
              {forbiddenWordsTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {forbiddenWordsTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="destructive"
                      className="gap-1 pr-1 bg-destructive/10 text-destructive dark:text-red-200 hover:bg-destructive/20 border-destructive/20"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeTagFromField("forbidden_words", tag)}
                        disabled={isPending}
                        className="h-4 w-4 p-0 rounded-full hover:bg-destructive/30 text-destructive dark:text-red-400"
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Público base
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="target_age_range">
                <LabelWithTooltip
                  label="Rango de edad"
                  tooltip="Define una edad mínima y máxima aproximada de tu público objetivo."
                />
              </Label>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all_ages"
                    checked={isAllAges}
                    onCheckedChange={(checked) => toggleAllAges(checked === true)}
                    disabled={isPending}
                  />
                  {isAllAges && <input type="hidden" name="target_audience_all_ages" value="on" />}
                  <Label htmlFor="all_ages" className="font-normal cursor-pointer">
                    Todas las edades
                  </Label>
                </div>

                {!isAllAges && (
                  <div className="space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="grid w-full gap-2">
                        <Label htmlFor="age_min" className="text-xs">Mínima</Label>
                        <Input
                          id="age_min"
                          type="number"
                          value={helperAgeMin}
                          onChange={(e) => setHelperAgeMin(e.target.value)}
                          placeholder="Ej. 18"
                          min={0}
                          className="w-full"
                          disabled={isPending}
                        />
                      </div>
                      <span className="pb-2 text-muted-foreground">-</span>
                      <div className="grid w-full gap-2">
                        <Label htmlFor="age_max" className="text-xs">Máxima</Label>
                        <Input
                          id="age_max"
                          type="number"
                          value={helperAgeMax}
                          onChange={(e) => setHelperAgeMax(e.target.value)}
                          placeholder="Ej. 65"
                          min={0}
                          className="w-full"
                          disabled={isPending}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          if (!helperAgeMin || !helperAgeMax) return
                          const range = `${helperAgeMin}-${helperAgeMax}`
                          addAgeRange(range)
                          setHelperAgeMin("")
                          setHelperAgeMax("")
                        }}
                        disabled={!helperAgeMin || !helperAgeMax || isPending}
                        className="mb-[1px]"
                      >
                        Agregar
                      </Button>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                      Ingresa la edad mínima y máxima para crear un rango personalizado.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {isAllAges ? (
                    <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                      Todas las edades
                    </Badge>
                  ) : (
                    ageTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pr-1 bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                        onClick={() => {
                          const [min, max] = tag.split("-")
                          if (min && max) {
                            setHelperAgeMin(min)
                            setHelperAgeMax(max)
                          }
                          removeAgeRange(tag)
                        }}
                      >
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeAgeRange(tag)
                          }}
                          disabled={isPending}
                          className="h-4 w-4 p-0 rounded-full hover:bg-foreground/10"
                        >
                          ×
                        </Button>
                      </Badge>
                    ))
                  )}
                </div>

                <input type="hidden" name="target_audience_age_ranges" value={form.target_audience_age_ranges} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_gender">
                <LabelWithTooltip
                  label="Género principal"
                  tooltip="Si tu comunicación está más dirigida a un género específico o es mixta."
                />
              </Label>
              <Select
                value={form.target_gender}
                name="target_gender"
                onValueChange={(val) => setForm(f => ({ ...f, target_gender: val as any }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixto">Mixto</SelectItem>
                  <SelectItem value="hombre">Hombre</SelectItem>
                  <SelectItem value="mujer">Mujer</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Insights del cliente
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="main_pain_point">
                <LabelWithTooltip
                  label="Dolor principal"
                  tooltip="Problema o frustración más importante que resuelves para tu cliente ideal."
                />
              </Label>
              <Textarea
                id="main_pain_point"
                name="main_pain_point"
                value={form.main_pain_point}
                onChange={handleChange}
                disabled={isPending}
                placeholder="Ej. No sabe cómo conseguir clientes constantes."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_desire">
                <LabelWithTooltip
                  label="Deseo principal"
                  tooltip="Resultado positivo que tu cliente quiere conseguir gracias a tu oferta."
                />
              </Label>
              <Textarea
                id="main_desire"
                name="main_desire"
                value={form.main_desire}
                onChange={handleChange}
                disabled={isPending}
                placeholder="Ej. Quiere aumentar sus ventas online mes a mes."
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="main_objection">
                <LabelWithTooltip
                  label="Objeción principal"
                  tooltip="Razón más común por la que un potencial cliente duda o no compra."
                />
              </Label>
              <Textarea
                id="main_objection"
                name="main_objection"
                value={form.main_objection}
                onChange={handleChange}
                disabled={isPending}
                placeholder="Ej. Cree que el servicio es muy caro o que no funcionará."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buying_motivation">
                <LabelWithTooltip
                  label="Motivación de compra"
                  tooltip="Disparadores y motivaciones que impulsan al cliente a tomar la decisión de compra."
                />
              </Label>
              <Textarea
                id="buying_motivation"
                name="buying_motivation"
                value={form.buying_motivation}
                onChange={handleChange}
                disabled={isPending}
                placeholder="Ej. Quiere ahorrar tiempo, dinero o mejorar su imagen profesional."
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Oferta base
          </h2>
          <div className="space-y-2">
            <Label htmlFor="main_products">
              <LabelWithTooltip
                label="Productos/servicios principales"
                tooltip="Describe tus productos o servicios clave y su importancia relativa."
              />
            </Label>
            <Textarea
              id="main_products"
              name="main_products"
              value={form.main_products}
              onChange={handleChange}
              disabled={isPending}
              placeholder="Describe brevemente los productos clave y su prioridad."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="average_ticket">
                <LabelWithTooltip
                  label="Ticket promedio"
                  tooltip="Valor promedio que suele pagar un cliente por compra."
                />
              </Label>
              <Select
                value={form.average_ticket}
                name="average_ticket"
                onValueChange={(val) => setForm(f => ({ ...f, average_ticket: val as any }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona ticket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_frequency">
                <LabelWithTooltip
                  label="Frecuencia de compra"
                  tooltip="Cada cuánto suelen comprarte los clientes (ocasional, recurrente, etc.)."
                />
              </Label>
              <Select
                value={form.purchase_frequency}
                name="purchase_frequency"
                onValueChange={(val) => setForm(f => ({ ...f, purchase_frequency: val as any }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ocasional">Ocasional</SelectItem>
                  <SelectItem value="recurrente">Recurrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Canales base
          </h2>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Selecciona las redes y canales donde la marca está activa. El primer canal se tomará como
              principal.
            </p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {SOCIAL_CHANNEL_OPTIONS.map((channel) => {
                const isActive = activeChannelsTags.includes(channel)
                return (
                  <div
                    key={channel}
                    onClick={() => toggleChannel(channel)}
                    className={`
                      relative group flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer select-none
                      ${isActive
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted/40 hover:border-primary/50 hover:bg-muted/30"
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-full transition-colors
                      ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary"}
                    `}>
                      {channel === 'instagram' && <Instagram size={24} />}
                      {channel === 'facebook' && <Facebook size={24} />}
                      {channel === 'tiktok' && <Smartphone size={24} />}
                    </div>

                    <div className="text-center">
                      <p className={`font-semibold capitalize ${isActive ? "text-primary" : "text-foreground"}`}>
                        {channel}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                        {isActive ? "Activo" : "Inactivo"}
                      </p>
                    </div>

                    {isActive && (
                      <div className="absolute top-3 right-3 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <input type="hidden" name="active_channels_hidden" value={form.active_channels} />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Estilo visual base
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="visual_style">
                <LabelWithTooltip
                  label="Estilo visual"
                  tooltip="Estilo general de la marca en piezas gráficas: minimalista, moderno, elegante, retro, etc."
                />
              </Label>
              <Select
                value={form.visual_style}
                name="visual_style"
                onValueChange={(val) => setForm(f => ({ ...f, visual_style: val as any }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimalista">Minimalista</SelectItem>
                  <SelectItem value="moderno">Moderno</SelectItem>
                  <SelectItem value="elegante">Elegante</SelectItem>
                  <SelectItem value="colorido">Colorido</SelectItem>
                  <SelectItem value="oscuro">Oscuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand_colors">
                <LabelWithTooltip
                  label="Colores de marca"
                  tooltip="Agrega uno o varios colores principales de la marca en formato HEX (por ejemplo #FF0000)."
                />
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    ref={brandColorPickerRef}
                    defaultValue="#000000"
                    onInput={(e) => {
                      const value = (e.target as HTMLInputElement).value
                      syncBrandColorText(value)
                    }}
                    className="h-9 w-9 rounded-md border bg-background p-1"
                    aria-label="Seleccionar color"
                    disabled={isPending}
                  />
                  <Input
                    id="brand_colors"
                    name="brand_colors"
                    ref={brandColorTextRef}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault()
                        const value = (e.currentTarget as HTMLInputElement).value
                        if (!value.trim()) return
                        upsertBrandColor(value)
                      }
                    }}
                    className="flex-1"
                    placeholder="Escribe un color HEX y presiona Enter (ej. #FF0000)"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBrandColorFromPicker}
                    disabled={isPending}
                  >
                    {editingBrandColor ? "Actualizar" : "Agregar"}
                  </Button>
                </div>
                <input type="hidden" name="brand_colors_hidden" value={form.brand_colors} />
                {editingBrandColor && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Editando: {editingBrandColor}</span>
                    <Button
                      type="button"
                      variant="link"
                      onClick={cancelEditBrandColor}
                      className="h-auto p-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                {brandColorTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {brandColorTags.map((color) => (
                      <Badge
                        key={color}
                        variant="secondary"
                        onClick={() => beginEditBrandColor(color)}
                        className={`cursor-pointer gap-2 pr-1 transition-colors ${editingBrandColor === color
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                          }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                        {color}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTagFromField("brand_colors", color)
                          }}
                          className="h-4 w-4 p-0 rounded-full hover:bg-foreground/10"
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Competidores y Referencias
          </h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej. Marca X"
                  value={competitorInput.name}
                  onChange={e => setCompetitorInput(v => ({ ...v, name: e.target.value }))}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  placeholder="https://instagram.com/marcay"
                  value={competitorInput.url}
                  onChange={e => setCompetitorInput(v => ({ ...v, url: e.target.value }))}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>Red Social</Label>
                <div className="flex gap-2">
                  <Select
                    value={competitorInput.social_network}
                    onValueChange={val => setCompetitorInput(v => ({ ...v, social_network: val }))}
                    disabled={isPending}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Red Social" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addCompetitor}
                    disabled={!competitorInput.name || isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {competitorsList.length > 0 && (
              <div className="rounded-md border divide-y overflow-hidden">
                {competitorsList.map((comp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{comp.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{comp.social_network || "Otro"}</span>
                        {comp.url && (
                          <>
                            <span>•</span>
                            <a href={comp.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                              <Globe className="h-3 w-3" /> Ver link
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeCompetitor(idx)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <input type="hidden" name="competitors_hidden" value={JSON.stringify(competitorsList)} />
          </div>
        </section>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Guardando..." : "Guardar configuración base"}
          </Button>
        </div>
      </form>
    </div>
  )
}
