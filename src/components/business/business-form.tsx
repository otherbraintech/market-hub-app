import { useState } from "react";
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
}

export function BusinessForm({ defaultValues, onSuccess }: BusinessFormProps) {
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(!defaultValues?.id);
  const [step, setStep] = useState(1);
  const isEditing = !!defaultValues?.id;

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

  async function onSubmit(data: BusinessFormValues) {
    if (useAI && step === 1) {
        setStep(2);
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
        });
      } else {
        result = await createBusiness(data);
      }

      if (result.success) {
        toast.success(result.message);
        onSuccess?.();
      } else {
        toast.error(result.error);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isEditing && (
          <div className="flex items-center justify-between mb-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex flex-col">
              <span className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Inteligencia Artificial
              </span>
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                {useAI ? "Generación automática de estrategia activa" : "Configuración manual de estrategia"}
              </span>
            </div>
            <Button 
              type="button" 
              variant={useAI ? "default" : "outline"} 
              size="sm"
              className="h-8 font-bold"
              onClick={() => {
                  setUseAI(!useAI);
                  setStep(1);
              }}
            >
              {useAI ? "Activado" : "Usar IA"}
            </Button>
          </div>
        )}

        {useAI && !isEditing ? (
          <div className="space-y-6 py-2">

            {step === 1 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <LabelHelp label="Sitio Web (Opcional)" help="La IA extraerá información de aquí si la proporcionas." />
                      <FormControl>
                        <Input placeholder="https://mi-negocio.com" {...field} className="h-11 rounded-xl" />
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
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
            )}
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
          {useAI && step === 2 && (
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading} className="rounded-xl h-11 px-6">
                <ChevronLeft className="h-4 w-4 mr-2" /> Atrás
              </Button>
          )}
          
          <Button type="submit" disabled={loading} className={`${useAI ? "flex-1 h-11" : "h-11 px-8"} rounded-xl font-bold`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {useAI ? "Generando y creando..." : "Guardando..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {useAI && !isEditing ? (
                    step === 1 ? (
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
