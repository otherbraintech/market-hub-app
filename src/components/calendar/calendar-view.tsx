"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Clock,
  Copy,
  Check,
  Trash2,
  Megaphone,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Video,
  Image as ImageIcon,
  Layers,
  ArrowLeft,
  Loader2,
  Edit,
  Save,
  X
} from "lucide-react";
import { toast } from "sonner";
import { 
  deleteContentAction, 
  updateCalendarContentAction, 
  generateCampaignCalendarAction,
  createContentAction
} from "@/actions/content";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface ContentItem {
  id: string;
  campaignId: string | null;
  campaign?: { name: string } | null;
  type: string; // POST, STORY, REEL, VIDEO, CAROUSEL
  format: string | null; // IMAGE, VIDEO
  title: string;
  body: string | null; // script/visual description
  caption: string | null; // publication copy
  hashtags: any; // string[]
  scheduledAt: string | null; // ISO string
  channel: string | null; // FACEBOOK, INSTAGRAM, TIKTOK, LINKEDIN, YOUTUBE
  promptUsed: string | null;
}

interface CalendarViewProps {
  businessId: string;
  businessName: string;
  campaigns: { id: string; name: string }[];
  initialContents: ContentItem[];
}

const monthsSpanish = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const channelMeta: Record<string, { label: string; icon: React.ReactNode; styles: string; badge: string }> = {
  INSTAGRAM: {
    label: "Instagram",
    icon: <Instagram className="h-3 w-3" />,
    styles: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100/50 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30",
    badge: "bg-pink-100 text-pink-850 border-pink-250 dark:bg-pink-950 dark:text-pink-400",
  },
  FACEBOOK: {
    label: "Facebook",
    icon: <Facebook className="h-3 w-3" />,
    styles: "bg-blue-50 text-blue-700 border-blue-250 hover:bg-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    badge: "bg-blue-100 text-blue-850 border-blue-250 dark:bg-blue-950 dark:text-blue-400",
  },
  TIKTOK: {
    label: "TikTok",
    icon: <Globe className="h-3 w-3" />,
    styles: "bg-zinc-900 text-zinc-100 border-zinc-800 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-800",
    badge: "bg-zinc-900 text-zinc-100 border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900",
  },
  LINKEDIN: {
    label: "LinkedIn",
    icon: <Linkedin className="h-3 w-3" />,
    styles: "bg-indigo-50 text-indigo-750 border-indigo-200 hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
    badge: "bg-indigo-100 text-indigo-850 border-indigo-250 dark:bg-indigo-950 dark:text-indigo-400",
  },
  YOUTUBE: {
    label: "YouTube",
    icon: <Youtube className="h-3 w-3" />,
    styles: "bg-red-50 text-red-750 border-red-200 hover:bg-red-100/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
    badge: "bg-red-100 text-red-850 border-red-250 dark:bg-red-950 dark:text-red-400",
  },
};

const planningLoadingStates = [
  "Analizando las metas de la campaña...",
  "Recuperando informes de marca y de la competencia...",
  "Gemini 2.0 está estructurando la línea de contenido...",
  "Redactando copies y ganchos persuasivos para tu audiencia...",
  "Estableciendo prompts para el diseño visual de cada publicación...",
  "Distribuyendo las fechas y horas a lo largo de tu calendario editorial...",
];

export function CalendarView({
  businessId,
  businessName,
  campaigns,
  initialContents,
}: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Filtro de Campaña
  const queryCampaignId = searchParams.get("campaignId");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(queryCampaignId || "all");
  
  const [contents, setContents] = useState<ContentItem[]>(initialContents);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (queryCampaignId && initialContents.length > 0) {
      const campContents = initialContents.filter(c => c.campaignId === queryCampaignId);
      if (campContents.length > 0 && campContents[0].scheduledAt) {
        return new Date(campContents[0].scheduledAt);
      }
    }
    return new Date();
  });
  
  // Estados para ver y editar contenido
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null);
  const [copiedType, setCopiedType] = useState<"copy" | "prompt" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Estado local para formulario de edición
  const [editForm, setEditForm] = useState({
    title: "",
    channels: ["INSTAGRAM"] as string[],
    type: "POST",
    format: "IMAGE",
    scheduledAt: "",
    caption: "",
    body: "",
    promptUsed: "",
  });

  // Estados para planificar con IA
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningCampaignId, setPlanningCampaignId] = useState("");
  const [planningQuantity, setPlanningQuantity] = useState(8);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);

  // Sincronizar contenidos del prop cuando cambian en el servidor
  useEffect(() => {
    setContents(initialContents);
  }, [initialContents]);

  // Rotador de frases para el planificador IA
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlanning) {
      interval = setInterval(() => {
        setLoadingTextIdx((prev) => (prev + 1) % planningLoadingStates.length);
      }, 3500);
    } else {
      setLoadingTextIdx(0);
    }
    return () => clearInterval(interval);
  }, [isPlanning]);

  // Autorelleno de campaña al abrir planificación
  useEffect(() => {
    if (isPlanModalOpen) {
      if (selectedCampaignId !== "all") {
        setPlanningCampaignId(selectedCampaignId);
      } else if (campaigns.length > 0) {
        setPlanningCampaignId(campaigns[0].id);
      }
    }
  }, [isPlanModalOpen, selectedCampaignId, campaigns]);

  // Sincronizar el formulario de edición al seleccionar/ver una publicación
  useEffect(() => {
    if (viewingContent) {
      setEditForm({
        title: viewingContent.title,
        channels: viewingContent.channel ? [viewingContent.channel] : ["INSTAGRAM"],
        type: viewingContent.type,
        format: viewingContent.format || "IMAGE",
        scheduledAt: viewingContent.scheduledAt 
          ? format(new Date(viewingContent.scheduledAt), "yyyy-MM-dd'T'HH:mm") 
          : "",
        caption: viewingContent.caption || "",
        body: viewingContent.body || "",
        promptUsed: viewingContent.promptUsed || "",
      });
      if (viewingContent.id === "new-draft") {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    }
  }, [viewingContent]);

  // Guardar edición
  const handleSaveEdit = async () => {
    if (!viewingContent) return;
    setIsSavingEdit(true);
    try {
      const scheduledD = editForm.scheduledAt ? new Date(editForm.scheduledAt) : null;
      
      const res = await updateCalendarContentAction(
        viewingContent.id,
        {
          title: editForm.title,
          channels: editForm.channels,
          type: editForm.type,
          format: editForm.format,
          scheduledAt: scheduledD,
          caption: editForm.caption,
          body: editForm.body,
          promptUsed: editForm.promptUsed,
        },
        businessId
      );

      if (res.success && res.content) {
        toast.success("¡Publicaciones actualizadas correctamente!");
        
        // Actualizar estado local al instante para evitar parpadeos
        setContents(prev => 
          prev.map(item => 
            item.id === viewingContent.id 
              ? { 
                  ...item, 
                  title: editForm.title,
                  channel: editForm.channels[0] || "INSTAGRAM",
                  type: editForm.type,
                  format: editForm.format,
                  scheduledAt: scheduledD ? scheduledD.toISOString() : null,
                  caption: editForm.caption,
                  body: editForm.body,
                  promptUsed: editForm.promptUsed
                } 
              : item
          )
        );

        setViewingContent(null);
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo actualizar el contenido.");
      }
    } catch (e) {
      toast.error("Error al procesar la edición.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Generar calendario con IA
  const handlePlanCalendarWithIA = async () => {
    if (!planningCampaignId) {
      toast.error("Por favor, selecciona una campaña.");
      return;
    }
    setIsPlanning(true);
    try {
      const res = await generateCampaignCalendarAction(planningCampaignId, {
        quantity: Number(planningQuantity),
        businessId
      });

      if (res.success) {
        toast.success(res.message);
        setIsPlanModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo planificar el calendario.");
      }
    } catch (err) {
      toast.error("Error de red al planificar con IA.");
    } finally {
      setIsPlanning(false);
    }
  };

  // Navegación de mes
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  const handleCopyToClipboard = (text: string, type: "copy" | "prompt") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success(type === "copy" ? "¡Copy copiado!" : "¡Prompt copiado!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDeleteContent = async (id: string) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta publicación?");
    if (!confirmDelete) return;

    try {
      const res = await deleteContentAction(id, businessId);
      if (res.success) {
        setContents(prev => prev.filter(item => item.id !== id));
        setViewingContent(null);
        toast.success("Publicación eliminada correctamente.");
      } else {
        toast.error(res.error || "No se pudo eliminar el contenido.");
      }
    } catch (err) {
      toast.error("Error de base de datos.");
    }
  };

  // Generar Celdas de Calendario
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  let startDayOfWeek = firstDayOfMonth.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Ajustar a Lunes inicio

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const gridCells = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    gridCells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }
  for (let i = 1; i <= totalDaysInMonth; i++) {
    gridCells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  const totalGridSize = gridCells.length > 35 ? 42 : 35;
  const nextPaddingCount = totalGridSize - gridCells.length;
  for (let i = 1; i <= nextPaddingCount; i++) {
    gridCells.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return (
    <>
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario Editorial: {businessName}</h1>
          <p className="text-muted-foreground text-sm">Organiza tu contenido en {businessName} y programa con asistencia inteligente.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Campaña */}
          <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-xl shadow-sm h-9">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Filtrar:</span>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-[180px] h-6 border-0 p-0 text-xs focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Todas las campañas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todas las campañas</SelectItem>
                {campaigns.map((camp) => (
                  <SelectItem key={camp.id} value={camp.id} className="text-xs">
                    {camp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Navegación del Mes */}
          <div className="flex items-center gap-1.5 bg-card border p-1 rounded-xl shadow-sm h-9">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-bold text-xs px-2 whitespace-nowrap min-w-[100px] text-center uppercase tracking-wider text-foreground/90">
              {monthsSpanish[month]} {year}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-bold" onClick={handleGoToToday}>
              Hoy
            </Button>
          </div>

          {/* Planificar con IA */}
          <Button 
            onClick={() => setIsPlanModalOpen(true)}
            className="gradient-primary relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-sm border-0 group px-4 py-2 font-semibold h-9 text-xs"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300 animate-pulse shrink-0" />
            Planificar con IA
          </Button>
        </div>
      </div>

      {/* CONTENEDOR DEL CALENDARIO */}
      <div className="flex-1 min-h-[500px] overflow-hidden flex flex-col bg-card border rounded-2xl shadow-md card-shadow">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b bg-muted/20 select-none shrink-0">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-black uppercase tracking-widest text-muted-foreground/85 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {gridCells.map((cell, index) => {
            const isToday = format(cell.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            const dayContents = contents.filter((item) => {
              if (!item.scheduledAt) return false;
              const scheduledDate = new Date(item.scheduledAt);
              const matchesDate =
                scheduledDate.getFullYear() === cell.date.getFullYear() &&
                scheduledDate.getMonth() === cell.date.getMonth() &&
                scheduledDate.getDate() === cell.date.getDate();
              if (!matchesDate) return false;
              if (selectedCampaignId !== "all" && item.campaignId !== selectedCampaignId) return false;
              return true;
            });

            const handleAddPlan = () => {
              const scheduledDateString = format(cell.date, "yyyy-MM-dd") + "T10:00";
              setViewingContent({
                id: "new-draft",
                campaignId: selectedCampaignId !== "all" ? selectedCampaignId : null,
                campaign: null,
                type: "POST",
                format: "IMAGE",
                title: "",
                body: "",
                caption: "",
                hashtags: [],
                scheduledAt: new Date(scheduledDateString).toISOString(),
                channel: "INSTAGRAM",
                promptUsed: ""
              });
              setEditForm({
                title: "",
                channels: ["INSTAGRAM"],
                type: "POST",
                format: "IMAGE",
                scheduledAt: scheduledDateString,
                caption: "",
                body: "",
                promptUsed: ""
              });
              setIsEditing(true);
            };

            return (
              <div
                key={index}
                onClick={handleAddPlan}
                className={`border-r border-b p-2 min-h-[100px] flex flex-col gap-1.5 transition-all relative group/cell hover:bg-muted/10 last:border-r-0 cursor-pointer ${
                  cell.isCurrentMonth ? "bg-background" : "bg-muted/5 opacity-40"
                }`}
              >
                <div className="flex justify-between items-center select-none">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isToday ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground"}`}>
                    {cell.date.getDate()}
                  </span>
                  <div className="flex items-center gap-1">
                    {dayContents.length > 0 && (
                      <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                        {dayContents.length} {dayContents.length === 1 ? "post" : "posts"}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPlan();
                      }}
                      className="opacity-0 group-hover/cell:opacity-100 transition-opacity bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950 p-1 rounded-md text-[10px] font-bold"
                      title="Agregar Planificación Diaria"
                    >
                      + Plan
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {dayContents.map((post) => {
                    const ch = (post.channel || "INSTAGRAM").toUpperCase();
                    const meta = channelMeta[ch] || channelMeta.INSTAGRAM;
                    const pubTime = post.scheduledAt ? format(new Date(post.scheduledAt), "HH:mm") : "";

                    return (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingContent(post);
                        }}
                        className={`group px-2 py-1.5 rounded-lg border text-[10px] font-semibold flex items-center justify-between gap-1.5 cursor-pointer transition-all duration-300 shadow-sm hover:scale-[1.02] hover:shadow ${meta.styles}`}
                        title={`${post.title} (${pubTime})`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="shrink-0 opacity-80">{meta.icon}</span>
                          <span className="font-bold text-foreground/80 shrink-0">{pubTime}</span>
                          <span className="truncate leading-none">{post.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DIÁLOGO DETALLES Y EDICIÓN DE PUBLICACIÓN */}
      <Dialog open={!!viewingContent} onOpenChange={(open) => !open && setViewingContent(null)}>
        {viewingContent && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border border-muted/20 rounded-2xl shadow-2xl p-0 bg-background flex flex-col">
            {/* Cabecera modal */}
            <div className="p-6 border-b border-muted/20 bg-muted/5 space-y-3 shrink-0">
              <DialogTitle className="sr-only">Detalles y Configuración de Publicación</DialogTitle>
              <DialogDescription className="sr-only">Formulario para previsualizar y editar el contenido programado</DialogDescription>
              
              <div className="flex flex-wrap items-center gap-2">
                {editForm.channels.map((ch) => {
                  const meta = channelMeta[ch] || channelMeta.INSTAGRAM;
                  return (
                    <Badge
                      key={ch}
                      variant="outline"
                      className={`text-[9px] font-bold border ${meta.badge}`}
                    >
                      <span className="mr-1">
                        {meta.icon}
                      </span>
                      {ch}
                    </Badge>
                  );
                })}
                
                <Badge variant="outline" className="text-[9px] font-bold border-muted-foreground/20 text-muted-foreground bg-muted/10">
                  {editForm.format === "VIDEO" ? (
                    <Video className="h-3 w-3 mr-1" />
                  ) : (
                    <ImageIcon className="h-3 w-3 mr-1" />
                  )}
                  {editForm.type === "CAROUSEL" ? "CAROUSEL (Carrousel)" : editForm.type}
                </Badge>

                {editForm.scheduledAt && (
                  <Badge variant="outline" className="text-[9px] font-bold border-blue-200 text-blue-700 bg-blue-50/50 dark:border-blue-900 dark:text-blue-400">
                    <Clock className="h-3 w-3 mr-1" />
                    Programado: {format(new Date(editForm.scheduledAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </Badge>
                )}
              </div>

              {!isEditing ? (
                <>
                  <h3 className="text-xl font-black tracking-tight text-foreground leading-snug">
                    {editForm.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-none">
                    Campaña: {viewingContent.campaign?.name || "Sin campaña vinculada"}
                  </p>
                </>
              ) : (
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                  <Edit className="h-3.5 w-3.5" /> MODO EDICIÓN ACTIVO
                </div>
              )}
            </div>

            {/* Cuerpo del Dialog */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {!isEditing ? (
                // MODO LECTURA ESTÁTICA
                <div className="space-y-6">
                  {/* COPY */}
                  {editForm.caption && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                          Texto de la Publicación (Copy / Caption)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(editForm.caption || "", "copy")}
                          className="h-7 text-[10px] font-semibold gap-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                          {copiedType === "copy" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                          {copiedType === "copy" ? "Copiado" : "Copiar Copy"}
                        </Button>
                      </div>
                      <div className="relative bg-muted/5 border border-muted/20 p-4 rounded-xl text-xs leading-relaxed text-justify text-foreground/90 whitespace-pre-line font-medium">
                        {editForm.caption}
                      </div>
                    </div>
                  )}

                  {/* GUION / storyboard */}
                  {editForm.body && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-muted/25 pb-1">
                        {editForm.format === "VIDEO" ? "Guion de Video / Storyboard" : "Concepto Visual del Diseño"}
                      </span>
                      <div className="bg-muted/5 border border-muted/20 rounded-xl p-4 text-xs leading-relaxed text-justify text-foreground/90 whitespace-pre-line font-medium">
                        {editForm.body}
                      </div>
                    </div>
                  )}

                  {/* PROMPT */}
                  {(() => {
                    const hasValidPrompt = (() => {
                      if (!editForm.promptUsed) return false;
                      const clean = editForm.promptUsed.trim().toLowerCase();
                      if (
                        clean === "" || 
                        clean === "n/a" || 
                        clean === "n/a." || 
                        clean === "n.a." || 
                        clean === "none" || 
                        clean === "none." || 
                        clean === "no aplica" || 
                        clean === "no aplica." || 
                        clean === "no disponible" || 
                        clean === "no disponible." || 
                        clean === "n / a" ||
                        clean.startsWith("n/a") ||
                        clean.startsWith("no aplica")
                      ) {
                        return false;
                      }
                      return true;
                    })();
                    
                    return hasValidPrompt ? (
                      <div className="space-y-2 bg-blue-500/5 dark:bg-blue-950/10 p-4 rounded-xl border border-blue-500/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                            AI Image Generation Prompt (Midjourney / DALL-E)
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(editForm.promptUsed || "", "prompt")}
                            className="h-7 text-[10px] font-semibold gap-1 text-blue-655 hover:bg-blue-100/50"
                          >
                            {copiedType === "prompt" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                            {copiedType === "prompt" ? "Copiado" : "Copiar Prompt"}
                          </Button>
                        </div>
                        <div className="bg-background border p-3 rounded-lg text-xs leading-relaxed text-foreground/80 italic font-mono select-all mt-1">
                          {editForm.promptUsed}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                // MODO EDICIÓN DINÁMICA
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Título de la publicación</label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))}
                      className="text-xs h-9 focus-visible:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2 sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Redes Sociales (Múltiple)</label>
                      <div className="flex flex-wrap gap-1.5 p-1.5 bg-muted/20 rounded-lg border border-muted/30">
                        {Object.keys(channelMeta).map((ch) => {
                          const meta = channelMeta[ch];
                          const isSelected = editForm.channels.includes(ch);
                          return (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => {
                                setEditForm(p => {
                                  let newChannels = [...p.channels];
                                  if (newChannels.includes(ch)) {
                                    // Mantener al menos uno seleccionado
                                    if (newChannels.length > 1) {
                                      newChannels = newChannels.filter(c => c !== ch);
                                    } else {
                                      toast.error("Debes seleccionar al menos un canal.");
                                    }
                                  } else {
                                    newChannels.push(ch);
                                  }
                                  return { ...p, channels: newChannels };
                                });
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold border transition-all select-none ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-background text-muted-foreground border-muted-foreground/20 hover:bg-muted/10"
                              }`}
                            >
                              {meta.icon}
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Tipo</label>
                      <Select 
                        value={editForm.type} 
                        onValueChange={(val) => setEditForm(p => ({ ...p, type: val }))}
                      >
                        <SelectTrigger className="text-xs h-9 bg-background">
                           <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {["POST", "STORY", "REEL", "VIDEO", "CAROUSEL"].map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">
                              {t === "CAROUSEL" ? "CAROUSEL (Carrousel)" : t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Formato</label>
                      <Select 
                        value={editForm.format} 
                        onValueChange={(val) => setEditForm(p => ({ ...p, format: val }))}
                      >
                        <SelectTrigger className="text-xs h-9 bg-background">
                          <SelectValue placeholder="Formato" />
                        </SelectTrigger>
                        <SelectContent>
                          {["IMAGE", "VIDEO", "TEXT", "LINK"].map((f) => (
                            <SelectItem key={f} value={f} className="text-xs">
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 sm:col-span-4">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Programación</label>
                      <Input
                        type="datetime-local"
                        value={editForm.scheduledAt}
                        onChange={(e) => setEditForm(p => ({ ...p, scheduledAt: e.target.value }))}
                        className="text-xs h-9 focus-visible:ring-blue-600 px-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Texto de la Publicación (Copy / Caption)</label>
                    <Textarea
                      value={editForm.caption}
                      onChange={(e) => setEditForm(p => ({ ...p, caption: e.target.value }))}
                      className="text-xs min-h-[100px] leading-relaxed focus-visible:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Guion / Storyboard / Concepto Visual</label>
                    <Textarea
                      value={editForm.body}
                      onChange={(e) => setEditForm(p => ({ ...p, body: e.target.value }))}
                      className="text-xs min-h-[100px] leading-relaxed focus-visible:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">AI Prompt para Imágenes (Midjourney / DALL-E)</label>
                    <Textarea
                      value={editForm.promptUsed}
                      onChange={(e) => setEditForm(p => ({ ...p, promptUsed: e.target.value }))}
                      className="text-xs min-h-[70px] leading-relaxed focus-visible:ring-blue-600 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Acciones en el footer */}
            <div className="p-4 border-t border-muted/20 bg-muted/5 flex justify-between items-center shrink-0">
              {!isEditing ? (
                <>
                  <div className="flex gap-2">
                    {viewingContent.id !== "new-draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContent(viewingContent.id)}
                        className="text-xs text-red-650 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-semibold gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50/50"
                    >
                      <Edit className="h-4 w-4" /> Editar Publicación
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setViewingContent(null)}
                      className="text-xs font-semibold"
                    >
                      Cerrar Detalles
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (viewingContent.id === "new-draft") {
                        setViewingContent(null);
                      } else {
                        setIsEditing(false);
                      }
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Cancelar
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    disabled={isSavingEdit || !editForm.title}
                    onClick={async () => {
                      if (viewingContent.id === "new-draft") {
                        setIsSavingEdit(true);
                        try {
                          const scheduledD = editForm.scheduledAt ? new Date(editForm.scheduledAt) : null;
                          const campId = selectedCampaignId !== "all" ? selectedCampaignId : (campaigns[0]?.id || "");
                          
                          const res = await createContentAction({
                            title: editForm.title,
                            type: editForm.type as any,
                            format: editForm.format as any,
                            channel: editForm.channels[0] as any,
                            campaignId: campId,
                            productId: "",
                            socialAccountId: "",
                            body: editForm.body,
                            caption: editForm.caption,
                            hashtags: [],
                            scheduledAt: scheduledD,
                            status: "DRAFT" as any,
                            mediaUrl: "",
                            businessId
                          });

                          if (res.success && res.content) {
                            toast.success("¡Planificación diaria creada con éxito!");
                            
                            // Si se seleccionaron más canales además del primero
                            if (editForm.channels.length > 1) {
                              const otherChannels = editForm.channels.slice(1);
                              await updateCalendarContentAction(
                                res.content.id,
                                {
                                  title: editForm.title,
                                  channels: editForm.channels,
                                  type: editForm.type,
                                  format: editForm.format,
                                  scheduledAt: scheduledD,
                                  caption: editForm.caption,
                                  body: editForm.body,
                                  promptUsed: editForm.promptUsed
                                },
                                businessId
                              );
                            }

                            setViewingContent(null);
                            setIsEditing(false);
                            router.refresh();
                          } else {
                            toast.error(res.error || "Error al crear la planificación.");
                          }
                        } catch (err: any) {
                          toast.error("Error al guardar planificación.");
                        } finally {
                          setIsSavingEdit(false);
                        }
                      } else {
                        await handleSaveEdit();
                      }
                    }}
                    className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
                  >
                    {isSavingEdit ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* DIÁLOGO GENERACIÓN CALENDARIO CON IA */}
      <Dialog open={isPlanModalOpen} onOpenChange={(open) => !open && setIsPlanModalOpen(false)}>
        <DialogContent className="max-w-md border border-muted/20 rounded-2xl shadow-2xl p-0 bg-background flex flex-col">
          {isPlanning ? (
            // PANTALLA DE CARGA PLANIFICADOR IA
            <div className="flex flex-col items-center justify-center p-12 min-h-[350px] text-center space-y-6">
              <DialogTitle className="sr-only">Planificando Calendario con IA</DialogTitle>
              <DialogDescription className="sr-only">Proceso automatizado de diseño editorial</DialogDescription>
              <div className="relative flex items-center justify-center">
                <div className="absolute h-14 w-14 rounded-full border-4 border-blue-600/20 animate-ping" />
                <div className="relative h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg animate-spin">
                  <Loader2 className="h-5 w-5 text-white animate-spin duration-1000" />
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                  Estructurando Calendario Editorial
                </h3>
                <p className="text-xs text-muted-foreground/90 font-medium h-8 animate-fade-in transition-all">
                  {planningLoadingStates[loadingTextIdx]}
                </p>
                <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-500" 
                    style={{ width: `${((loadingTextIdx + 1) / planningLoadingStates.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // FORMULARIO PLANIFICADOR IA
            <>
              <div className="p-6 border-b border-muted/20 bg-muted/5 space-y-1">
                <DialogTitle className="text-lg font-bold flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                  Planificación Editorial con IA
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Genera una secuencia estratégica de publicaciones asociadas a tu campaña.
                </DialogDescription>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Campaña de Referencia</label>
                  <Select value={planningCampaignId} onValueChange={setPlanningCampaignId}>
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Selecciona una campaña" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((camp) => (
                        <SelectItem key={camp.id} value={camp.id} className="text-xs">
                          {camp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Número de Publicaciones a generar</label>
                  <Select 
                    value={planningQuantity.toString()} 
                    onValueChange={(val) => setPlanningQuantity(Number(val))}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Selecciona cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 8, 12, 15, 20].map((num) => (
                        <SelectItem key={num} value={num.toString()} className="text-xs">
                          {num} publicaciones distribuidas
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                    Se distribuirán uniformemente a lo largo de las fechas definidas de la campaña.
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-muted/20 bg-muted/5 flex justify-end gap-2.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsPlanModalOpen(false)}
                  className="text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handlePlanCalendarWithIA}
                  disabled={!planningCampaignId}
                  className="gradient-primary text-xs font-semibold h-9 shadow-sm"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300 shrink-0" />
                  Generar Calendario IA
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
