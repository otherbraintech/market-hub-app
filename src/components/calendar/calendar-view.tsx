"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from "lucide-react";
import { toast } from "sonner";
import { deleteContentAction } from "@/actions/content";
import { format } from "date-fns";
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

// Mapper de logos y estilos por canal
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
    icon: <Globe className="h-3 w-3" />, // Genérico, representará TikTok con estilo custom
    styles: "bg-zinc-900 text-zinc-100 border-zinc-800 hover:bg-zinc-800 dark:bg-zinc-955 dark:text-zinc-100 dark:border-zinc-800",
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

export function CalendarView({
  businessId,
  businessName,
  campaigns,
  initialContents,
}: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Si viene una campaña específica en los params, filtrarla por defecto
  const queryCampaignId = searchParams.get("campaignId");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(queryCampaignId || "all");
  
  const [contents, setContents] = useState<ContentItem[]>(initialContents);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Si viene una campaña seleccionada, usar su primer publicación como fecha de enfoque si existe, o usar hoy
    if (queryCampaignId && initialContents.length > 0) {
      const campContents = initialContents.filter(c => c.campaignId === queryCampaignId);
      if (campContents.length > 0 && campContents[0].scheduledAt) {
        return new Date(campContents[0].scheduledAt);
      }
    }
    return new Date();
  });
  
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null);
  const [copiedType, setCopiedType] = useState<"copy" | "prompt" | null>(null);

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

  // Copiar al portapapeles
  const handleCopyToClipboard = (text: string, type: "copy" | "prompt") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success(type === "copy" ? "¡Copy copiado al portapapeles!" : "¡Prompt de imagen copiado!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Eliminar contenido
  const handleDeleteContent = async (id: string) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta publicación del calendario?");
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
      toast.error("Error al conectar con la base de datos.");
      console.error(err);
    }
  };

  // Calendario Dinámico
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  // Ajuste: Lunes es 0, Domingo es 6
  let startDayOfWeek = firstDayOfMonth.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const gridCells = [];

  // Padding mes anterior
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    gridCells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }

  // Mes actual
  for (let i = 1; i <= totalDaysInMonth; i++) {
    gridCells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Padding mes siguiente (múltiplo de 7, total 35 o 42 celdas)
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
          <p className="text-muted-foreground text-sm">Vista de planificación y distribución de contenido inteligente.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Campaña */}
          <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-xl shadow-sm h-9">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Campaña:</span>
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
        </div>
      </div>

      {/* REVOLUCIONARIO CONTENEDOR DEL CALENDARIO */}
      <div className="flex-1 min-h-[500px] overflow-hidden flex flex-col bg-card border rounded-2xl shadow-md card-shadow">
        {/* Cabecera días de la semana */}
        <div className="grid grid-cols-7 border-b bg-muted/20 select-none shrink-0">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-black uppercase tracking-widest text-muted-foreground/80 border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Celdas del Calendario */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {gridCells.map((cell, index) => {
            const isToday = format(cell.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            
            // Filtrar publicaciones para este día de la celda
            const dayContents = contents.filter((item) => {
              if (!item.scheduledAt) return false;
              const scheduledDate = new Date(item.scheduledAt);
              
              // Verificar si cae en el mismo día, mes y año
              const matchesDate =
                scheduledDate.getFullYear() === cell.date.getFullYear() &&
                scheduledDate.getMonth() === cell.date.getMonth() &&
                scheduledDate.getDate() === cell.date.getDate();
                
              if (!matchesDate) return false;

              // Filtrar por campaña si está seleccionado
              if (selectedCampaignId !== "all" && item.campaignId !== selectedCampaignId) {
                return false;
              }

              return true;
            });

            return (
              <div
                key={index}
                className={`border-r border-b p-2 min-h-[100px] flex flex-col gap-1.5 transition-all relative group/cell hover:bg-muted/10 last:border-r-0 ${
                  cell.isCurrentMonth ? "bg-background" : "bg-muted/5 opacity-40"
                }`}
              >
                {/* Indicador de Número de Día */}
                <div className="flex justify-between items-center select-none">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isToday
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayContents.length > 0 && (
                    <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                      {dayContents.length} {dayContents.length === 1 ? "post" : "posts"}
                    </span>
                  )}
                </div>

                {/* Listado de publicaciones programadas */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {dayContents.map((post) => {
                    const ch = (post.channel || "INSTAGRAM").toUpperCase();
                    const meta = channelMeta[ch] || channelMeta.INSTAGRAM;
                    const pubTime = post.scheduledAt ? format(new Date(post.scheduledAt), "HH:mm") : "";

                    return (
                      <div
                        key={post.id}
                        onClick={() => setViewingContent(post)}
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

      {/* DIÁLOGO DETALLES DE PUBLICACIÓN IA */}
      <Dialog open={!!viewingContent} onOpenChange={(open) => !open && setViewingContent(null)}>
        {viewingContent && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border border-muted/20 rounded-2xl shadow-2xl p-0 bg-background flex flex-col">
            {/* Header del Dialog */}
            <div className="p-6 border-b border-muted/20 bg-muted/5 space-y-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold border ${
                    channelMeta[viewingContent.channel || "INSTAGRAM"]?.badge || "bg-pink-100 text-pink-700 border-pink-250"
                  }`}
                >
                  <span className="mr-1">
                    {channelMeta[viewingContent.channel || "INSTAGRAM"]?.icon}
                  </span>
                  {viewingContent.channel}
                </Badge>
                
                <Badge variant="outline" className="text-[9px] font-bold border-muted-foreground/20 text-muted-foreground bg-muted/10">
                  {viewingContent.format === "VIDEO" ? (
                    <Video className="h-3 w-3 mr-1" />
                  ) : (
                    <ImageIcon className="h-3 w-3 mr-1" />
                  )}
                  {viewingContent.type}
                </Badge>

                {viewingContent.scheduledAt && (
                  <Badge variant="outline" className="text-[9px] font-bold border-violet-200 text-violet-700 bg-violet-50/50 dark:border-violet-850 dark:text-violet-400">
                    <Clock className="h-3 w-3 mr-1" />
                    Programado: {format(new Date(viewingContent.scheduledAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg font-black tracking-tight text-foreground leading-snug">
                {viewingContent.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-none">
                Campaña: {viewingContent.campaign?.name || "Sin campaña vinculada"}
              </DialogDescription>
            </div>

            {/* Cuerpo del Dialog */}
            <div className="p-6 space-y-6">
              {/* PUBLICACIÓN COPY (CAPTION) */}
              {viewingContent.caption && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                      Texto de la Publicación (Copy / Caption)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(viewingContent.caption || "", "copy")}
                      className="h-7 text-[10px] font-semibold gap-1 text-violet-650 hover:bg-violet-50"
                    >
                      {copiedType === "copy" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      {copiedType === "copy" ? "Copiado" : "Copiar Copy"}
                    </Button>
                  </div>
                  <div className="relative bg-muted/5 border border-muted/20 p-4 rounded-xl text-xs leading-relaxed text-justify text-foreground/90 whitespace-pre-line font-medium">
                    {viewingContent.caption}
                  </div>
                </div>
              )}

              {/* FORMAT SPECIFIC CONTENT */}
              {viewingContent.format === "VIDEO" ? (
                /* VIDEO SCRIPT */
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-muted/25 pb-1">
                    Guion de Video / Storyboard detallado (Reel / TikTok)
                  </span>
                  
                  <div className="bg-muted/5 border border-muted/20 rounded-xl p-4 space-y-4">
                    {/* Render guion con estructura estilizada */}
                    {viewingContent.body ? (
                      <div className="text-xs space-y-3 font-medium leading-relaxed whitespace-pre-line text-justify text-foreground/90">
                        {viewingContent.body}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No hay guion cargado.</span>
                    )}
                  </div>
                </div>
              ) : (
                /* IMAGE DETAIL */
                <div className="space-y-4">
                  {/* Idea Visual */}
                  {viewingContent.body && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-muted/25 pb-1">
                        Concepto Visual del Diseño / Imagen
                      </span>
                      <p className="text-xs text-muted-foreground/90 leading-relaxed text-justify bg-muted/5 p-4 rounded-xl border border-muted/20 font-medium">
                        {viewingContent.body}
                      </p>
                    </div>
                  )}

                  {/* AI Prompt de Imagen */}
                  {viewingContent.promptUsed && (
                    <div className="space-y-2 bg-violet-50/10 dark:bg-violet-950/10 p-4 rounded-xl border border-violet-100 dark:border-violet-900">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-violet-750 dark:text-violet-300 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                          AI Image Generation Prompt (Midjourney / DALL-E)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(viewingContent.promptUsed || "", "prompt")}
                          className="h-7 text-[10px] font-semibold gap-1 text-violet-650 hover:bg-violet-100/50"
                        >
                          {copiedType === "prompt" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                          {copiedType === "prompt" ? "Copiado" : "Copiar Prompt"}
                        </Button>
                      </div>
                      <div className="bg-background border border-violet-200/50 dark:border-violet-850 p-3 rounded-lg text-xs leading-relaxed text-foreground/80 italic font-mono select-all">
                        {viewingContent.promptUsed}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Acciones en el footer */}
            <div className="p-4 border-t border-muted/20 bg-muted/5 flex justify-between items-center shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteContent(viewingContent.id)}
                className="text-xs text-red-600 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Eliminar Publicación
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingContent(null)}
                className="text-xs font-semibold"
              >
                Cerrar Detalles
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
