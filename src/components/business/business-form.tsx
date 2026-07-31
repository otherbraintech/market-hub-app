import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessSchema, BusinessFormValues } from "@/lib/schemas/business";
import { createBusiness, updateBusiness, createBusinessWithAI } from "@/actions/business";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { HelpCircle, Sparkles, MapPin, Phone, Globe, Facebook, Instagram, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

interface BusinessFormProps {
  defaultValues?: BusinessFormValues & { id?: string };
  onSuccess?: () => void;
  onCreated?: (id: string) => void;
  isTutorialActive?: boolean;
  hideStepHeader?: boolean;
  singleStep?: boolean;
  onSubmitOverride?: (data: BusinessFormValues) => void;
}
export function BusinessForm({ defaultValues, onSuccess, onCreated, isTutorialActive, hideStepHeader, singleStep, onSubmitOverride }: BusinessFormProps) {
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(!defaultValues?.id);
  const [step, setStep] = useState(1);
  const isEditing = !!defaultValues?.id;
  const [branches, setBranches] = useState<Array<{ name: string; address: string; googleMapsUrl: string }>>(
    (defaultValues as any)?.branches || [{ name: "Sucursal Principal", address: defaultValues?.location || "", googleMapsUrl: "" }]
  );
  const [catalogUrl, setCatalogUrl] = useState<string>((defaultValues as any)?.catalog?.fileUrl || "");
  const [catalogSummary, setCatalogSummary] = useState<string>((defaultValues as any)?.catalog?.summary || "");

  const addBranch = () => {
    setBranches([...branches, { name: `Sucursal ${branches.length + 1}`, address: "", googleMapsUrl: "" }]);
  };

  const updateBranch = (index: number, field: string, val: string) => {
    const updated = [...branches];
    (updated[index] as any)[field] = val;
    setBranches(updated);
  };

  const removeBranch = (index: number) => {
    if (branches.length === 1) return;
    setBranches(branches.filter((_, i) => i !== index));
  };

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema) as any,
    defaultValues: defaultValues || {
      name: "",
      description: "",
      industry: "",
      website: "",
      phoneNumbers: "",
      location: "",
      socialLinks: {
        facebook: "",
        instagram: "",
        tiktok: "",
      },
      onboardingStrategy: {
        locationAge: "",
        lifeEvent: "",
        archetype: "",
        conversionChannel: "",
        informationGaps: "",
        socialProof: "",
        differentialAdvantage: "",
      },
      brandVoice: {
        tone: [],
        personality: [],
        values: [],
      },
      targetAudience: {
        demographics: "",
        psychographics: "",
      }
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  async function onSubmit(data: BusinessFormValues) {
    const finalData = {
      ...data,
      branches,
      catalog: { fileUrl: catalogUrl, fileName: catalogUrl ? "Catálogo_Productos.pdf" : "", summary: catalogSummary }
    };

    if (onSubmitOverride) {
      onSubmitOverride(finalData);
      return;
    }

    if (useAI && step === 1 && !singleStep) {
        setStep(2);
        return;
    }
    if (useAI && step === 2 && !singleStep) {
        setStep(3);
        return;
    }
    if (useAI && step === 3 && !singleStep) {
        setStep(4);
        return;
    }

    setLoading(true);
    try {
      let result;
      if (isEditing && defaultValues?.id) {
        result = await updateBusiness(defaultValues.id, data);
      } else if (useAI) {
        result = await createBusinessWithAI({
          name: data.name,
          description: data.description,
          website: data.website || "",
          phoneNumbers: data.phoneNumbers,
          location: data.location,
          socialLinks: data.socialLinks,
          onboardingStrategy: data.onboardingStrategy,
        });
      } else {
        result = await createBusiness(data);
      }

      const res = result as any;
      if (res.success) {
        toast.success(res.message);
        onSuccess?.();
        if (res.data?.id) {
          if (onCreated) {
            onCreated(res.data.id);
          } else {
            window.location.href = `/onboarding?businessId=${res.data.id}`;
          }
        }
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const LabelHelp = ({ label, help }: { label: string; help: string }) => (
    <div className="flex items-center gap-2">
      <FormLabel>{label}</FormLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          {help}
        </TooltipContent>
      </Tooltip>
    </div>
  );

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

  return (
    <TooltipProvider>
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors);
            toast.error("Hay errores en el formulario. Revisa los campos.");
          })} 
          className="space-y-4"
        >
        {useAI && !isEditing ? (
          <div className="space-y-6 py-2">
            {isTutorialActive && !hideStepHeader && (
              <>
                {/* 1. Indicador de pasos visual tipo Line/Wizard */}
                <div className="flex items-center justify-between px-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${step === 1 ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-md' : 'bg-primary/20 text-primary'}`}>
                      1
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paso 1</span>
                      <span className={`text-[11px] font-bold transition-colors ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>Perfil del Negocio</span>
                    </div>
                  </div>
                  <div className="flex-1 h-0.5 bg-muted mx-4 relative rounded-full">
                    <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${step >= 2 ? 'w-full' : 'w-0'}`} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${step === 2 ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-md' : step > 2 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      2
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paso 2</span>
                      <span className={`text-[11px] font-bold transition-colors ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>Contacto y Redes</span>
                    </div>
                  </div>
                  <div className="flex-1 h-0.5 bg-muted mx-4 relative rounded-full">
                    <div className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full ${step >= 3 ? 'w-full' : 'w-0'}`} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${step === 3 ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-md' : step > 3 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      3
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paso 3</span>
                      <span className={`text-[11px] font-bold transition-colors ${step === 3 ? 'text-primary' : 'text-muted-foreground'}`}>Identidad y Público</span>
                    </div>
                  </div>
                </div>
                {/* 2. Tarjeta premium del asistente de IA */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent border border-primary/20 p-5 shadow-inner animate-in fade-in duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -z-10" />
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20 animate-bounce-slow">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">Asistente de Inicio</span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {step === 1 ? 'Paso 1 de 3' : step === 2 ? 'Paso 2 de 3' : 'Paso 3 de 3'}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-foreground">
                        {step === 1 ? 'Definir perfil e identidad de marca' : step === 2 ? 'Vincular canales de contacto' : 'Definir identidad y público'}
                      </h5>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
                        {step === 1 
                          ? 'Ingresa el nombre de tu negocio y una descripción de tu marca. La IA analizará la descripción para generar la estrategia y el perfil del negocio automáticamente.'
                          : step === 2 
                            ? 'Completa los teléfonos, ubicación, sitio web y redes sociales de tu marca.'
                            : 'Define el tono de voz, la personalidad y el tipo de público al que te diriges para orientar mejor los copies y contenidos.'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {singleStep || step === 1 ? (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Nombre del Negocio" help="El nombre comercial oficial de tu marca." />
                      <FormControl>
                        <Input placeholder="Ej. Acme Inc." {...field} className="h-11 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Descripción" help="Resumen de tu negocio, productos y misión." />
                      <FormControl>
                        <Textarea 
                          placeholder="Describe brevemente a qué se dedica el negocio..." 
                          className="resize-none h-32 rounded-xl" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {singleStep && (
                  <>
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <LabelHelp label="Sitio Web" help="La IA extraerá información de aquí si la proporcionas." />
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="https://mi-negocio.com" {...field} className="h-11 pl-10 rounded-xl" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="phoneNumbers"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Phone className="h-3 w-3" /> Teléfonos</FormLabel>
                                <FormControl>
                                <Input placeholder="+51 987 654 321" {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Ubicación</FormLabel>
                                <FormControl>
                                <Input placeholder="Ciudad, País" {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-dashed">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Redes Sociales</span>
                        <div className="grid grid-cols-3 gap-3">
                            <FormField
                                control={form.control}
                                name="socialLinks.facebook"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input placeholder="Facebook" {...field} className="h-9 pl-9 text-xs rounded-lg" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="socialLinks.instagram"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input placeholder="Instagram" {...field} className="h-9 pl-9 text-xs rounded-lg" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="socialLinks.tiktok"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <TikTokIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input placeholder="TikTok" {...field} className="h-9 pl-9 text-xs rounded-lg" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {!singleStep && step === 2 ? (
              <div className="space-y-4 relative animate-in fade-in slide-in-from-right-4 duration-300">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Sitio Web" help="La IA extraerá información de aquí si la proporcionas." />
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="https://mi-negocio.com" {...field} className="h-11 pl-10 rounded-xl" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phoneNumbers"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Phone className="h-3 w-3" /> Teléfonos</FormLabel>
                            <FormControl>
                            <Input placeholder="+51 987 654 321" {...field} className="h-11 rounded-xl" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Ubicación</FormLabel>
                            <FormControl>
                            <Input placeholder="Ciudad, País" {...field} className="h-11 rounded-xl" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-dashed">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Redes Sociales (Opcional)</span>
                    <div className="grid grid-cols-3 gap-3">
                        <FormField
                            control={form.control}
                            name="socialLinks.facebook"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input placeholder="Facebook" {...field} className="h-9 pl-9 text-xs rounded-lg" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="socialLinks.instagram"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input placeholder="Instagram" {...field} className="h-9 pl-9 text-xs rounded-lg" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="socialLinks.tiktok"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <TikTokIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input placeholder="TikTok" {...field} className="h-9 pl-9 text-xs rounded-lg" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
              </div>
            ) : null}

            {!singleStep && step === 3 ? (
              <div className="space-y-4 relative animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="brandVoice.tone"
                      render={({ field }) => (
                      <FormItem>
                          <LabelHelp label="Tono de Marca" help="Ej. Alegre, Formal, Informativo." />
                          <FormControl>
                          <Input 
                              placeholder="Ej. Profesional, Cercano (separado por comas)" 
                              value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                              onChange={(e) => field.onChange(e.target.value.split(",").map((s: string) => s.trim()))}
                              className="h-11 rounded-xl"
                          />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="brandVoice.personality"
                      render={({ field }) => (
                      <FormItem>
                          <LabelHelp label="Personalidad" help="Ej. Innovadora, Confiable." />
                          <FormControl>
                          <Input 
                              placeholder="Ej. Experto, Amigable" 
                              value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                              onChange={(e) => field.onChange(e.target.value.split(",").map((s: string) => s.trim()))}
                              className="h-11 rounded-xl"
                          />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                </div>
                <FormField
                    control={form.control}
                    name="targetAudience.demographics"
                    render={({ field }) => (
                    <FormItem>
                        <LabelHelp label="Demografía" help="Edad, ubicación, género." />
                        <FormControl>
                        <Textarea 
                            placeholder="Ej. Mujeres de 25 a 45 años en la ciudad de Lima..." 
                            className="resize-none h-24 rounded-xl"
                            {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="targetAudience.psychographics"
                    render={({ field }) => (
                    <FormItem>
                        <LabelHelp label="Psicografía" help="Intereses, valores y hábitos." />
                        <FormControl>
                        <Textarea 
                            placeholder="Ej. Valoran los productos ecológicos, tienen rutinas apresuradas..." 
                            className="resize-none h-24 rounded-xl"
                            {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            ) : null}

          </div>
        ) : (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="basic" className="rounded-lg font-bold text-xs uppercase tracking-tight">Básico</TabsTrigger>
              <TabsTrigger value="brand" className="rounded-lg font-bold text-xs uppercase tracking-tight">Estrategia</TabsTrigger>
              <TabsTrigger value="audience" className="rounded-lg font-bold text-xs uppercase tracking-tight">Público</TabsTrigger>
              <TabsTrigger value="contact" className="rounded-lg font-bold text-xs uppercase tracking-tight">Contacto</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-2">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <LabelHelp label="Nombre del Negocio" help="El nombre comercial oficial de tu marca." />
                        <FormControl>
                            <Input placeholder="Ej. Acme Inc." {...field} className="h-11 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                        <FormItem>
                        <LabelHelp label="Industria" help="Sector al que pertenece tu negocio." />
                        <FormControl>
                            <Input placeholder="Ej. Tecnología, Educación, Retail..." {...field} className="h-11 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <LabelHelp label="Descripción" help="Resumen de tu negocio y misión." />
                        <FormControl>
                            <Textarea 
                            placeholder="Describe a qué se dedica el negocio..." 
                            className="resize-none h-24 rounded-xl" 
                            {...field} 
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </TabsContent>

            <TabsContent value="brand" className="space-y-4 py-2">
                <FormField
                    control={form.control}
                    name="brandVoice.tone"
                    render={({ field }) => (
                    <FormItem>
                        <LabelHelp label="Tono de Marca" help="Ej. Alegre, Formal, Informativo." />
                        <FormControl>
                        <Input 
                            placeholder="Ej. Profesional, Cercano (separado por comas)" 
                            value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                            onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))}
                            className="h-11 rounded-xl"
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="brandVoice.personality"
                    render={({ field }) => (
                    <FormItem>
                        <LabelHelp label="Personalidad" help="Ej. Innovadora, Confiable." />
                        <FormControl>
                        <Input 
                            placeholder="Ej. Experto, Amigable" 
                            value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                            onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))}
                            className="h-11 rounded-xl"
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </TabsContent>

            <TabsContent value="audience" className="space-y-4 py-2">
                <FormField
                    control={form.control}
                    name="targetAudience.demographics"
                    render={({ field }) => (
                    <FormItem>
                        <LabelHelp label="Demografía" help="Edad, ubicación, género." />
                        <FormControl>
                        <Textarea 
                            placeholder="Edad, ubicación..." 
                            className="resize-none h-24 rounded-xl"
                            {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="targetAudience.psychographics"
                    render={({ field }) => (
                    <FormItem>
                        <LabelHelp label="Psicografía" help="Intereses, valores y hábitos." />
                        <FormControl>
                        <Textarea 
                            placeholder="Intereses, motivaciones..." 
                            className="resize-none h-24 rounded-xl"
                            {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 py-2">
                <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                        <FormItem>
                        <LabelHelp label="Sitio Web" help="URL principal de tu negocio o marca." />
                        <FormControl>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                <Input placeholder="https://www.tu-sitio.com" {...field} className="h-11 pl-10 rounded-xl" />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phoneNumbers"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Phone className="h-3 w-3" /> Teléfonos</FormLabel>
                            <FormControl>
                            <Input placeholder="+51 987 654 321" {...field} className="h-11 rounded-xl" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><MapPin className="h-3 w-3" /> Ubicación</FormLabel>
                            <FormControl>
                            <Input placeholder="Ciudad, País" {...field} className="h-11 rounded-xl" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-dashed mt-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Redes Sociales</span>
                    <FormField
                        control={form.control}
                        name="socialLinks.facebook"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormControl>
                                    <div className="relative">
                                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input placeholder="Link de Facebook" {...field} className="h-11 pl-10 rounded-xl" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="socialLinks.instagram"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative">
                                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input placeholder="Link de Instagram" {...field} className="h-11 pl-10 rounded-xl" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="socialLinks.tiktok"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative">
                                        <TikTokIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input placeholder="Link de TikTok" {...field} className="h-11 pl-10 rounded-xl" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </TabsContent>
          </Tabs>
        )}
        <DialogFooter className="mt-8 gap-2 sm:gap-0">
          {useAI && (step === 2 || step === 3 || step === 4) && !singleStep && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(step - 1)} 
                disabled={loading} 
                className="rounded-xl h-11 px-6"
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Atrás
              </Button>
          )}
          
          <Button 
            type="submit" 
            disabled={loading} 
            className={`${useAI ? "flex-1 h-11" : "h-11 px-8"} rounded-xl font-bold`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {useAI ? "Generando y creando..." : "Guardando..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {singleStep ? (
                    <>Siguiente <ChevronRight className="h-4 w-4 ml-1" /></>
                ) : useAI && !isEditing ? (
                    (step === 1 || step === 2 || step === 3) ? (
                        <>Siguiente <ChevronRight className="h-4 w-4 ml-1" /></>
                    ) : (
                        <><Sparkles className="h-4 w-4" /> Generar con IA y Crear</>
                    )
                ) : (
                    isEditing ? "Actualizar Negocio" : "Crear Negocio"
                )}
              </span>
            )}
          </Button>
        </DialogFooter>
        </form>
      </Form>
    </TooltipProvider>
  );
}
