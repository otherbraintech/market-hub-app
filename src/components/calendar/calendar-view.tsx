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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  X,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { 
  deleteContentAction, 
  updateCalendarContentAction, 
  generateCampaignCalendarAction,
  createContentAction,
  generateSingleContentIdeaAction,
  previewCampaignCalendarAction,
  savePlannedCampaignCalendarAction
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
  campaigns: {
    id: string;
    name: string;
    status: string;
    description?: string | null;
    objective?: string;
    budget?: any;
    targeting?: any;
    startDate?: any;
    endDate?: any;
    channels?: any;
    strategy?: {
      id: string;
      name: string;
      description?: string | null;
      objectives?: any;
      personas?: any;
      funnelStages?: any;
      channels?: any;
      contentPillars?: any;
      postingSchedule?: any;
    } | null;
  }[];
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
    campaignId: "",
  });

  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

  // Estados para planificar con IA
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningCampaignId, setPlanningCampaignId] = useState("");
  const [planningQuantity, setPlanningQuantity] = useState(8);
  const [planningStartDate, setPlanningStartDate] = useState("");
  const [planningEndDate, setPlanningEndDate] = useState("");
  const [planningChannels, setPlanningChannels] = useState<string[]>(["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);
  const [previewPosts, setPreviewPosts] = useState<any[] | null>(null);
  const [isSavingPlanned, setIsSavingPlanned] = useState(false);
  const [activePreviewIdx, setActivePreviewIdx] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [draggedContent, setDraggedContent] = useState<ContentItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Autorelleno de campaña al abrir planificación y auto-selección de fechas
  useEffect(() => {
    if (isPlanModalOpen) {
      const targetCampId = selectedCampaignId !== "all" ? selectedCampaignId : (campaigns[0]?.id || "");
      if (targetCampId) {
        setPlanningCampaignId(targetCampId);
        const camp = campaigns.find(c => c.id === targetCampId);
        if (camp) {
          if (camp.startDate) {
            setPlanningStartDate(format(new Date(camp.startDate), "yyyy-MM-dd"));
          } else {
            setPlanningStartDate("");
          }
          if (camp.endDate) {
            setPlanningEndDate(format(new Date(camp.endDate), "yyyy-MM-dd"));
          } else {
            setPlanningEndDate("");
          }
          
          if (camp.channels) {
            try {
              const parsed = Array.isArray(camp.channels) ? camp.channels : JSON.parse(camp.channels as string);
              if (Array.isArray(parsed)) {
                const active = parsed
                  .map((ch: any) => {
                    if (typeof ch === "string") return ch.toUpperCase();
                    if (ch && typeof ch === "object") {
                      const platform = (ch.platform || ch.name || "").toUpperCase();
                      return ch.isActive !== false ? platform : null;
                    }
                    return null;
                  })
                  .filter(Boolean) as string[];
                const filtered = active.filter((c: string) => ["FACEBOOK", "INSTAGRAM", "TIKTOK"].includes(c));
                setPlanningChannels(filtered.length > 0 ? filtered : ["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
              } else {
                setPlanningChannels(["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
              }
            } catch (e) {
              console.error(e);
              setPlanningChannels(["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
            }
          } else {
            setPlanningChannels(["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
          }
        }
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
        campaignId: viewingContent.campaignId || (selectedCampaignId !== "all" ? selectedCampaignId : (campaigns[0]?.id || "")),
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

    if (viewingContent.id.startsWith("sim-")) {
      const idx = activePreviewIdx !== null ? activePreviewIdx : parseInt(viewingContent.id.split("-")[1]);
      if (!isNaN(idx) && previewPosts) {
        const scheduledD = editForm.scheduledAt ? new Date(editForm.scheduledAt).toISOString() : null;
        
        handleUpdatePreviewPost(idx, "title", editForm.title);
        handleUpdatePreviewPost(idx, "channel", editForm.channels[0] || "INSTAGRAM");
        handleUpdatePreviewPost(idx, "type", editForm.type);
        handleUpdatePreviewPost(idx, "format", editForm.format);
        handleUpdatePreviewPost(idx, "scheduledAt", scheduledD);
        handleUpdatePreviewPost(idx, "caption", editForm.caption);
        handleUpdatePreviewPost(idx, "body", editForm.body);
        handleUpdatePreviewPost(idx, "promptUsed", editForm.promptUsed);
        
        toast.success("¡Publicación simulada actualizada en memoria!");
        setViewingContent(null);
        setIsEditing(false);
        setActivePreviewIdx(null);
      }
      return;
    }

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
          campaignId: editForm.campaignId || null,
        },
        businessId
      );

      if (res.success && res.content) {
        toast.success("¡Publicaciones actualizadas correctamente!");
        
        // Buscar el nombre de la campaña seleccionada localmente para actualizarlo en la lista
        const matchingCampaign = campaigns.find(c => c.id === editForm.campaignId);
        
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
                  promptUsed: editForm.promptUsed,
                  campaignId: editForm.campaignId || null,
                  campaign: matchingCampaign ? { name: matchingCampaign.name } : null
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
        businessId,
        startDate: planningStartDate || undefined,
        endDate: planningEndDate || undefined,
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

  // Generar la previsualización en memoria del planificador IA
  const handleGeneratePreview = async () => {
    if (!planningCampaignId) {
      toast.error("Por favor, selecciona una campaña.");
      return;
    }
    setIsPlanning(true);
    setPreviewPosts(null);
    try {
      const res = await previewCampaignCalendarAction(planningCampaignId, {
        quantity: Number(planningQuantity),
        businessId,
        startDate: planningStartDate || undefined,
        endDate: planningEndDate || undefined,
      });

      if (res.success && res.posts) {
        const replicateEl = document.getElementById("replicateChannels") as HTMLInputElement;
        const shouldReplicate = replicateEl ? replicateEl.checked : true;

        if (shouldReplicate) {
          const activeChannels = planningChannels.filter(c => ["INSTAGRAM", "FACEBOOK", "TIKTOK"].includes(c));
          
          let expandedPosts: any[] = [];
          res.posts.forEach((post: any) => {
            expandedPosts.push({ ...post });
            
            activeChannels.forEach((ch) => {
              if (ch !== post.channel) {
                expandedPosts.push({
                  ...post,
                  channel: ch,
                  id: post.id ? `${post.id}-${ch}` : undefined
                });
              }
            });
          });
          setPreviewPosts(expandedPosts);
        } else {
          setPreviewPosts(res.posts);
        }
        // Navegar automáticamente al mes del primer post generado
        if (res.posts.length > 0 && res.posts[0].scheduledAt) {
          const firstPostDate = new Date(res.posts[0].scheduledAt);
          setCurrentDate(firstPostDate);
        }

        setIsPlanModalOpen(false); // CERRAR MODAL Y VOLVER A LA PÁGINA PRINCIPAL
        toast.success("¡Previsualización generada! Los posts simulados se muestran en el calendario.");
      } else {
        toast.error(res.error || "No se pudo generar la previsualización.");
      }
    } catch (err) {
      toast.error("Error al generar la previsualización con la IA.");
    } finally {
      setIsPlanning(false);
    }
  };

  // Guardar todas las publicaciones previsualizadas en lote
  const handleSavePlanned = async () => {
    if (!previewPosts || previewPosts.length === 0) {
      toast.error("No hay publicaciones en la previsualización para guardar.");
      return;
    }
    setIsSavingPlanned(true);
    try {
      const res = await savePlannedCampaignCalendarAction(businessId, planningCampaignId, previewPosts);
      if (res.success) {
        toast.success(res.message);
        setPreviewPosts(null);
        setIsPlanModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Error al aplicar la planificación al calendario.");
      }
    } catch (err) {
      toast.error("Error al conectar con el servidor para guardar.");
    } finally {
      setIsSavingPlanned(false);
    }
  };

  const handleRemovePreviewPost = (idx: number) => {
    setPreviewPosts(prev => prev ? prev.filter((_, i) => i !== idx) : null);
  };

  const handleUpdatePreviewPost = (idx: number, field: string, value: any) => {
    setPreviewPosts(prev => {
      if (!prev) return null;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleAddPreviewPost = () => {
    const defaultDate = planningStartDate 
      ? new Date(planningStartDate + "T10:00").toISOString() 
      : new Date().toISOString();
    
    const newPost = {
      title: "Nueva Publicación",
      type: "POST",
      format: "IMAGE",
      channel: "INSTAGRAM",
      body: "Concepto visual o storyboard de la publicación",
      caption: "Texto de la publicación (Copy / Caption)",
      promptUsed: "",
      scheduledAt: defaultDate
    };
    setPreviewPosts(prev => prev ? [...prev, newPost] : [newPost]);
  };

  // Generar publicación individual con IA
  const handleGenerateSingleIdea = async () => {
    if (!editForm.campaignId) {
      toast.error("Por favor, selecciona una campaña primero para generar la idea con IA.");
      return;
    }
    
    setIsGeneratingIdea(true);
    try {
      const targetChannel = editForm.channels[0] || "INSTAGRAM";
      const res = await generateSingleContentIdeaAction(
        editForm.campaignId,
        businessId,
        targetChannel,
        editForm.type,
        editForm.format
      );
      
      if (res.success && res.idea) {
        const idea = res.idea;
        setEditForm(prev => ({
          ...prev,
          title: idea.title,
          type: idea.type,
          format: idea.format,
          channels: prev.channels,
          caption: idea.caption,
          body: idea.body,
          promptUsed: idea.promptUsed,
        }));
        toast.success("¡Idea de publicación generada con éxito por la IA!");
      } else {
        toast.error(res.error || "No se pudo generar la idea de publicación.");
      }
    } catch (e) {
      toast.error("Error de conexión al generar la idea con IA.");
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  // Agrupar contenidos del mes actual por campaña
  const getMonthCampaignPlans = () => {
    const activeMonth = currentDate.getMonth();
    const activeYear = currentDate.getFullYear();

    // Filtrar publicaciones del mes visible
    const monthContents = contents.filter(item => {
      if (!item.scheduledAt) return false;
      const d = new Date(item.scheduledAt);
      return d.getMonth() === activeMonth && d.getFullYear() === activeYear;
    });

    // Agrupar por campaña
    const grouped: Record<string, { campaignName: string; posts: typeof monthContents }> = {};

    // Inicializar para "Sin campaña vinculada"
    grouped["no-campaign"] = {
      campaignName: "Sin campaña vinculada",
      posts: []
    };

    // Inicializar campañas del negocio
    campaigns.forEach(c => {
      grouped[c.id] = {
        campaignName: c.name,
        posts: []
      };
    });

    monthContents.forEach(post => {
      const key = post.campaignId && grouped[post.campaignId] ? post.campaignId : "no-campaign";
      grouped[key].posts.push(post);
    });

    // Ordenar los posts de cada campaña por fecha de programación
    Object.keys(grouped).forEach(key => {
      grouped[key].posts.sort((a, b) => {
        const da = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const db = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return da - db;
      });
    });

    // Retornar solo las agrupaciones que tengan posts
    return Object.entries(grouped)
      .filter(([_, data]) => data.posts.length > 0)
      .map(([id, data]) => ({
        campaignId: id,
        ...data
      }));
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

  const handleDeleteContent = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDeleteContent = async () => {
    if (!deleteTargetId) return;

    if (deleteTargetId.startsWith("sim-")) {
      const idx = parseInt(deleteTargetId.split("-")[1]);
      if (!isNaN(idx)) {
        handleRemovePreviewPost(idx);
        toast.success("Publicación simulada eliminada.");
      }
      setViewingContent(null);
      setDeleteTargetId(null);
      return;
    }

    try {
      const res = await deleteContentAction(deleteTargetId, businessId);
      if (res.success) {
        setContents(prev => prev.filter(item => item.id !== deleteTargetId));
        setViewingContent(null);
        toast.success("Publicación eliminada correctamente.");
      } else {
        toast.error(res.error || "No se pudo eliminar el contenido.");
      }
    } catch (err) {
      toast.error("Error de base de datos.");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleQuickDelete = async (id: string) => {
    if (id.startsWith("sim-")) {
      const idx = parseInt(id.split("-")[1]);
      if (!isNaN(idx)) {
        handleRemovePreviewPost(idx);
        toast.success("Publicación simulada eliminada.");
      }
      return;
    }

    try {
      const res = await deleteContentAction(id, businessId);
      if (res.success) {
        setContents(prev => prev.filter(item => item.id !== id));
        toast.success("Publicación eliminada correctamente.");
      } else {
        toast.error(res.error || "No se pudo eliminar el contenido.");
      }
    } catch (err) {
      toast.error("Error de base de datos.");
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, content: ContentItem) => {
    setDraggedContent(content);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", content.id);
  };

  const handleDragEnd = () => {
    setDraggedContent(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    
    if (!draggedContent) return;

    // Si es una publicación simulada
    if (draggedContent.id.startsWith("sim-")) {
      const idx = parseInt(draggedContent.id.split("-")[1]);
      if (!isNaN(idx) && previewPosts) {
        const newScheduledAt = format(targetDate, "yyyy-MM-dd'T'HH:mm");
        const originalTime = draggedContent.scheduledAt 
          ? format(new Date(draggedContent.scheduledAt), "HH:mm") 
          : "10:00";
        const newScheduledDateTime = `${format(targetDate, "yyyy-MM-dd")}T${originalTime}`;
        
        handleUpdatePreviewPost(idx, "scheduledAt", new Date(newScheduledDateTime).toISOString());
        toast.success("Publicación simulada movida a nueva fecha.");
      }
      setDraggedContent(null);
      return;
    }

    // Si es una publicación real de la base de datos
    try {
      const originalTime = draggedContent.scheduledAt 
        ? format(new Date(draggedContent.scheduledAt), "HH:mm") 
        : "10:00";
      const newScheduledDateTime = `${format(targetDate, "yyyy-MM-dd")}T${originalTime}`;
      
      const res = await updateCalendarContentAction(
        draggedContent.id,
        {
          title: draggedContent.title,
          channels: draggedContent.channel ? [draggedContent.channel] : ["INSTAGRAM"],
          type: draggedContent.type,
          format: draggedContent.format || "IMAGE",
          scheduledAt: new Date(newScheduledDateTime),
          caption: draggedContent.caption || "",
          body: draggedContent.body || "",
          promptUsed: draggedContent.promptUsed || "",
          campaignId: draggedContent.campaignId || null,
        },
        businessId
      );

      if (res.success) {
        toast.success("Publicación movida a nueva fecha.");
        
        // Actualizar estado local
        setContents(prev => 
          prev.map(item => 
            item.id === draggedContent.id 
              ? { 
                  ...item, 
                  scheduledAt: new Date(newScheduledDateTime).toISOString()
                } 
              : item
          )
        );
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo mover la publicación.");
      }
    } catch (err) {
      toast.error("Error al mover la publicación.");
    } finally {
      setDraggedContent(null);
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
      {/* BANNER DE PREVISUALIZACIÓN ACTIVA */}
      {previewPosts && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-dashed border-amber-300 dark:border-amber-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-xl text-amber-600 dark:text-amber-400">
              <Sparkles className="h-5 w-5 animate-spin duration-3000" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">Modo Previsualización Activo</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Se han generado <strong>{previewPosts.length}</strong> publicaciones en memoria. Puedes hacer clic en los posts simulados en el calendario para editarlos, arrastrar o borrarlos antes de aplicar.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreviewPosts(null);
                toast.success("Previsualización descartada.");
              }}
              className="text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-900"
            >
              Descartar
            </Button>
            <Button
              onClick={handleSavePlanned}
              disabled={isSavingPlanned}
              className="gradient-primary text-xs font-bold h-9 shadow-md text-white"
            >
              {isSavingPlanned ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Guardando en Base de Datos...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Confirmar y Guardar ({previewPosts.length})
                </>
              )}
            </Button>
          </div>
        </div>
      )}
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

          {/* Botón de Modo Edición */}
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`h-9 text-xs font-semibold gap-1.5 ${isEditMode ? "bg-red-600 hover:bg-red-700 text-white" : "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/20"}`}
          >
            {isEditMode ? (
              <>
                <X className="h-3.5 w-3.5" />
                Salir de Edición
              </>
            ) : (
              <>
                <Edit className="h-3.5 w-3.5" />
                Modo Edición
              </>
            )}
          </Button>

          {/* Drawer de Resumen de Planificación por Campaña */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline"
                className="h-9 text-xs font-semibold gap-1.5 border-violet-200 text-violet-755 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-305 dark:hover:bg-violet-950/20"
              >
                <Layers className="h-4 w-4 text-violet-650" />
                <span>Resumen de Campañas</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] sm:max-w-md md:max-w-lg overflow-y-auto flex flex-col p-0">
              <SheetHeader className="p-6 bg-muted/5 border-b border-muted/20 shrink-0">
                <SheetTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Calendar className="h-4.5 w-4.5 text-violet-600" />
                  <span>Resumen Editorial: {monthsSpanish[month]} {year}</span>
                </SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground">
                  Visualiza la distribución del contenido programado para cada campaña de este mes.
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {getMonthCampaignPlans().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                    <Calendar className="h-8 w-8 opacity-20" />
                    <span className="text-xs font-bold">Sin publicaciones en este mes</span>
                    <span className="text-[10px] opacity-80 max-w-[200px]">Usa el asistente IA para generar o añade publicaciones de forma manual.</span>
                  </div>
                ) : (
                  getMonthCampaignPlans().map((group) => (
                    <div key={group.campaignId} className="space-y-3">
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="text-xs font-black tracking-tight text-foreground uppercase truncate max-w-[250px]">
                          {group.campaignName}
                        </span>
                        <Badge variant="secondary" className="text-[9px] font-black bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 shrink-0">
                          {group.posts.length} {group.posts.length === 1 ? "publicación" : "publicaciones"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 pr-1">
                        {group.posts.map((post) => {
                          const ch = (post.channel || "INSTAGRAM").toUpperCase();
                          const meta = channelMeta[ch] || channelMeta.INSTAGRAM;
                          const pubDate = post.scheduledAt ? new Date(post.scheduledAt) : null;
                          const formattedTime = pubDate ? format(pubDate, "d 'de' MMM, HH:mm", { locale: es }) : "Sin fecha";
                          
                          return (
                            <div 
                              key={post.id} 
                              onClick={() => {
                                setViewingContent(post);
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] font-semibold transition-all hover:scale-[1.01] hover:shadow-sm cursor-pointer ${meta.styles}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="shrink-0">{meta.icon}</span>
                                <div className="truncate leading-tight">
                                  <p className="font-bold truncate">{post.title}</p>
                                  <p className="text-[9px] opacity-80 mt-0.5">{post.type} • {post.format || "IMAGE"}</p>
                                </div>
                              </div>
                              <span className="text-[9.5px] font-bold bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-md shrink-0 border border-current/20">
                                {formattedTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>

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
            const cellDateStr = format(cell.date, "yyyy-MM-dd");
            
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

            const simulatedPosts = previewPosts
              ? previewPosts.map((p, idx) => ({ ...p, originalIndex: idx })).filter(p => {
                  if (!p.scheduledAt) return false;
                  return format(new Date(p.scheduledAt), "yyyy-MM-dd") === cellDateStr;
                })
              : [];

            const handleAddPlan = () => {
              const scheduledDateString = format(cell.date, "yyyy-MM-dd") + "T10:00";
              
              if (previewPosts) {
                const defaultPost = {
                  title: "Nueva Publicación",
                  type: "POST",
                  format: "IMAGE",
                  channel: "INSTAGRAM",
                  body: "Concepto visual o storyboard de la publicación",
                  caption: "Texto de la publicación (Copy / Caption)",
                  promptUsed: "",
                  scheduledAt: new Date(scheduledDateString).toISOString()
                };
                
                setPreviewPosts(prev => {
                  const next = prev ? [...prev, defaultPost] : [defaultPost];
                  const newIdx = next.length - 1;
                  setActivePreviewIdx(newIdx);
                  
                  setTimeout(() => {
                    setViewingContent({
                      id: `sim-${newIdx}`,
                      campaignId: planningCampaignId || null,
                      type: defaultPost.type,
                      format: defaultPost.format,
                      title: defaultPost.title,
                      body: defaultPost.body,
                      caption: defaultPost.caption,
                      hashtags: [],
                      scheduledAt: defaultPost.scheduledAt,
                      channel: defaultPost.channel,
                      promptUsed: defaultPost.promptUsed
                    });
                  }, 0);
                  
                  return next;
                });
                return;
              }

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
                promptUsed: "",
                campaignId: selectedCampaignId !== "all" ? selectedCampaignId : (campaigns[0]?.id || ""),
              });
              setIsEditing(true);
            };

            const totalPostsCount = dayContents.length + simulatedPosts.length;

            return (
              <div
                key={index}
                onClick={handleAddPlan}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, cell.date)}
                className={`border-r border-b p-2 min-h-[100px] flex flex-col gap-1.5 transition-all relative group/cell hover:bg-muted/10 last:border-r-0 cursor-pointer ${
                  cell.isCurrentMonth ? "bg-background" : "bg-muted/5 opacity-40"
                } ${draggedContent ? 'hover:bg-blue-50/50' : ''}`}
              >
                <div className="flex justify-between items-center select-none">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isToday ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground"}`}>
                    {cell.date.getDate()}
                  </span>
                  <div className="flex items-center gap-1">
                    {totalPostsCount > 0 && (
                      <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                        {totalPostsCount} {totalPostsCount === 1 ? "post" : "posts"}
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
                  {/* Renderizar posts reales de BBDD */}
                  {dayContents.map((post) => {
                    const ch = (post.channel || "INSTAGRAM").toUpperCase();
                    const meta = channelMeta[ch] || channelMeta.INSTAGRAM;
                    const pubTime = post.scheduledAt ? format(new Date(post.scheduledAt), "HH:mm") : "";

                    return (
                      <div
                        key={post.id}
                        draggable={!isEditMode}
                        onDragStart={(e) => !isEditMode && handleDragStart(e, post)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditMode) {
                            handleQuickDelete(post.id);
                          } else {
                            setViewingContent(post);
                          }
                        }}
                        className={`group/item px-2 py-1.5 rounded-lg border text-[10px] font-semibold flex items-center justify-between gap-1.5 cursor-pointer transition-all duration-300 shadow-sm hover:scale-[1.02] hover:shadow ${meta.styles} ${draggedContent?.id === post.id ? 'opacity-50' : ''} ${isEditMode ? 'hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800' : ''}`}
                        title={`${isEditMode ? 'Click para eliminar' : `${post.title} (${pubTime})`}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="shrink-0 opacity-80">{meta.icon}</span>
                          <span className="font-bold opacity-90 shrink-0">{pubTime}</span>
                          <span className="truncate leading-none">{post.title}</span>
                        </div>
                        {isEditMode && (
                          <Trash2 className="h-3 w-3 text-red-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}

                  {/* Renderizar posts de Simulación / Previsualización */}
                  {simulatedPosts.map((post) => {
                    const ch = (post.channel || "INSTAGRAM").toUpperCase();
                    const meta = channelMeta[ch] || channelMeta.INSTAGRAM;
                    const pubTime = post.scheduledAt ? format(new Date(post.scheduledAt), "HH:mm") : "";
                    const simulatedContent = {
                      id: `sim-${post.originalIndex}`,
                      campaignId: planningCampaignId || null,
                      type: post.type,
                      format: post.format || "IMAGE",
                      title: post.title,
                      body: post.body || "",
                      caption: post.caption || "",
                      hashtags: [],
                      scheduledAt: post.scheduledAt || null,
                      channel: post.channel || "INSTAGRAM",
                      promptUsed: post.promptUsed || ""
                    };

                    return (
                      <div
                        key={`sim-${post.originalIndex}`}
                        draggable={!isEditMode}
                        onDragStart={(e) => !isEditMode && handleDragStart(e, simulatedContent)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditMode) {
                            handleQuickDelete(`sim-${post.originalIndex}`);
                          } else {
                            setActivePreviewIdx(post.originalIndex);
                            setViewingContent(simulatedContent);
                          }
                        }}
                        className={`group/item px-2 py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-between gap-1.5 cursor-pointer transition-all duration-300 shadow-md hover:scale-[1.02] hover:shadow-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 animate-pulse ${draggedContent?.id === `sim-${post.originalIndex}` ? 'opacity-50' : ''} ${isEditMode ? 'hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800' : ''}`}
                        title={`${isEditMode ? 'Click para eliminar' : `[Simulado] ${post.title} (${pubTime})`}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="shrink-0 text-amber-500">{meta.icon}</span>
                          <span className="font-bold opacity-95 shrink-0 text-amber-700 dark:text-amber-400">{pubTime}</span>
                          <span className="truncate leading-none">{post.title}</span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {!isEditMode && <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />}
                          {isEditMode && <Trash2 className="h-3 w-3 text-red-500 shrink-0" />}
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
                    const getPromptsArray = (promptText: string | null) => {
                      if (!promptText) return [];
                      const text = promptText.trim();
                      
                      // Detect slide-based prompt
                      const regex = /(?:Slide|Diapositiva|Paso|Imagen)?\s*(\d+)\s*[:.-]\s*([\s\S]*?)(?=(?:Slide|Diapositiva|Paso|Imagen)?\s*\d+\s*[:.-]|$)/gi;
                      const matches = [...text.matchAll(regex)];
                      
                      if (matches.length > 0) {
                        return matches.map(m => ({
                          label: `Slide ${m[1]}`,
                          prompt: m[2].trim()
                        })).filter(item => item.prompt.length > 0);
                      }
                      
                      // Try splitting by lines starting with numbers
                      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                      const numberedLines = lines.filter(l => /^\d+[\s.:-]/.test(l));
                      if (numberedLines.length > 1) {
                        return numberedLines.map((line, idx) => {
                          const clean = line.replace(/^\d+[\s.:-]\s*/, '').trim();
                          return {
                            label: `Slide ${idx + 1}`,
                            prompt: clean
                          };
                        });
                      }

                      // Fallback to single prompt
                      const clean = text.toLowerCase();
                      if (["", "n/a", "none", "no aplica", "n.a.", "no disponible", "n / a", "none."].includes(clean)) {
                        return [];
                      }
                      return [{ label: "Imagen de Portada / Post", prompt: text }];
                    };

                    const prompts = getPromptsArray(editForm.promptUsed);
                    const isCarousel = editForm.type === "CAROUSEL";
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-muted/25 pb-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                            {isCarousel ? "Prompts de Generación para Carrusel" : "Prompt de Generación para Imagen (IA)"}
                          </span>
                        </div>
                        
                        {prompts.length === 0 ? (
                          // Prompt no disponible / vacío
                          <div className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/10 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                              <div className="text-left">
                                <p className="text-xs font-bold text-foreground">Sin Prompt asignado</p>
                                <p className="text-[10px] text-muted-foreground">Esta publicación no cuenta con un prompt de imagen por IA detallado.</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(true);
                              }}
                              className="text-[10px] font-bold h-8 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Editar y Generar Prompt
                            </Button>
                          </div>
                        ) : (
                          // Render prompts list
                          <div className="space-y-3">
                            {prompts.map((p, idx) => (
                              <div key={idx} className="bg-blue-500/5 dark:bg-blue-950/10 p-3.5 rounded-xl border border-blue-500/10 space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9.5px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                                    {p.label}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyToClipboard(p.prompt, "prompt")}
                                    className="h-6 text-[9.5px] font-semibold gap-1 text-blue-655 hover:bg-blue-100/50 px-1.5"
                                  >
                                    {copiedType === "prompt" ? <Check className="h-2.5 w-2.5 text-green-650" /> : <Copy className="h-2.5 w-2.5" />}
                                    Copiar Prompt
                                  </Button>
                                </div>
                                <div className="bg-background border p-2.5 rounded-lg text-xs leading-relaxed text-foreground/80 italic font-mono select-all">
                                  {p.prompt}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                // MODO EDICIÓN DINÁMICA
                <div className="space-y-4">
                  {/* Vincular campaña y Generación IA */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3.5 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-violet-750 dark:text-violet-300 block mb-1">
                        Campaña de Referencia
                      </label>
                      <Select 
                        value={editForm.campaignId} 
                        onValueChange={(val) => setEditForm(p => ({ ...p, campaignId: val }))}
                      >
                        <SelectTrigger className="text-xs h-9 bg-background border-violet-200/50">
                          <SelectValue placeholder="Selecciona una campaña..." />
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
                    <Button
                      type="button"
                      onClick={handleGenerateSingleIdea}
                      disabled={isGeneratingIdea || !editForm.campaignId}
                      className="w-full text-xs font-semibold h-9 gradient-primary border-0 shadow-sm relative overflow-hidden group gap-1.5"
                    >
                      {isGeneratingIdea ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                          Generar con IA
                        </>
                      )}
                    </Button>
                  </div>
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
                  </div>

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
      <Dialog open={isPlanModalOpen && !previewPosts} onOpenChange={(open) => {
        if (!open) {
          setIsPlanModalOpen(false);
        }
      }}>
        <DialogContent className="w-[92vw] max-w-5xl max-h-[85vh] border border-muted/20 rounded-2xl shadow-2xl p-0 bg-background flex flex-col transition-all duration-300 overflow-hidden">
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
            // FORMULARIO PLANIFICADOR IA CON PANEL DE CONTEXTO
            <>
              <div className="p-6 border-b border-muted/20 bg-muted/5 space-y-1">
                <DialogTitle className="text-lg font-bold flex items-center gap-1.5 text-foreground">
                  <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                  Planificación Editorial con IA
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Genera una secuencia estratégica de publicaciones asociadas a tu campaña.
                </DialogDescription>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] divide-y md:divide-y-0 md:divide-x divide-muted/20 bg-background overflow-hidden flex-1 min-h-0">
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Campaña de Referencia</label>
                    <Select 
                      value={planningCampaignId} 
                      onValueChange={(val) => {
                        setPlanningCampaignId(val);
                        const camp = campaigns.find(c => c.id === val);
                        if (camp) {
                          setPlanningStartDate(camp.startDate ? format(new Date(camp.startDate), "yyyy-MM-dd") : "");
                          setPlanningEndDate(camp.endDate ? format(new Date(camp.endDate), "yyyy-MM-dd") : "");
                          
                          if (camp.channels) {
                            try {
                              const parsed = Array.isArray(camp.channels) ? camp.channels : JSON.parse(camp.channels as string);
                              if (Array.isArray(parsed)) {
                                const active = parsed
                                  .map((ch: any) => {
                                    if (typeof ch === "string") return ch.toUpperCase();
                                    if (ch && typeof ch === "object") {
                                      const platform = (ch.platform || ch.name || "").toUpperCase();
                                      return ch.isActive !== false ? platform : null;
                                    }
                                    return null;
                                  })
                                  .filter(Boolean) as string[];
                                const filtered = active.filter((c: string) => ["FACEBOOK", "INSTAGRAM", "TIKTOK"].includes(c));
                                setPlanningChannels(filtered.length > 0 ? filtered : ["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
                              } else {
                                setPlanningChannels(["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
                              }
                            } catch (e) {
                              console.error(e);
                              setPlanningChannels(["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
                            }
                          } else {
                            setPlanningChannels(["INSTAGRAM", "FACEBOOK", "TIKTOK"]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue placeholder="Selecciona una campaña" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((camp) => {
                          const statusLabels: Record<string, string> = {
                            ACTIVE: "Activa",
                            SCHEDULED: "Programada",
                            DRAFT: "Borrador",
                            PAUSED: "Pausada",
                            COMPLETED: "Completada",
                          };
                          const label = statusLabels[camp.status] || camp.status;
                          return (
                            <SelectItem key={camp.id} value={camp.id} className="text-xs">
                              {camp.name} <span className="text-[10px] text-muted-foreground ml-1">({label})</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Canales de Difusión</label>
                    <div className="flex flex-wrap gap-1.5 p-1.5 bg-muted/20 rounded-lg border border-muted/30">
                      {["INSTAGRAM", "FACEBOOK", "TIKTOK"].map((ch) => {
                        const meta = channelMeta[ch];
                        const isChecked = planningChannels.includes(ch);
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => {
                              setPlanningChannels(prev => 
                                prev.includes(ch) 
                                  ? (prev.length > 1 ? prev.filter(c => c !== ch) : prev) 
                                  : [...prev, ch]
                              );
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-all select-none ${
                              isChecked
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-background text-muted-foreground border-muted-foreground/20 hover:bg-muted/10"
                            }`}
                          >
                            {meta?.icon}
                            {meta?.label || ch}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Fecha de Inicio (Opcional)</label>
                      <Input
                        type="date"
                        value={planningStartDate}
                        onChange={(e) => setPlanningStartDate(e.target.value)}
                        className="text-xs h-9 focus-visible:ring-blue-600 px-2"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Fecha Fin (Opcional)</label>
                      <Input
                        type="date"
                        value={planningEndDate}
                        onChange={(e) => setPlanningEndDate(e.target.value)}
                        className="text-xs h-9 focus-visible:ring-blue-600 px-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Nº Publicaciones a Generar</label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={planningQuantity}
                        onChange={(e) => setPlanningQuantity(Math.max(1, Number(e.target.value)))}
                        className="text-xs h-9 focus-visible:ring-blue-600 px-2"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (planningStartDate && planningEndDate) {
                            const days = Math.max(1, Math.round((new Date(planningEndDate).getTime() - new Date(planningStartDate).getTime()) / (1000 * 60 * 60 * 24))) + 1;
                            setPlanningQuantity(days);
                            toast.success(`Establecido a 1 publicación por día (${days} posts en total)`);
                          } else {
                            toast.error("Por favor, selecciona Fecha de Inicio y Fecha Fin primero.");
                          }
                        }}
                        className="text-[10px] h-9 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                      >
                        Autocalcular 1 post/día
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-950/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10.5px] font-bold text-foreground block">
                          Replicar en múltiples canales
                        </span>
                        <span className="text-[9.5px] text-muted-foreground block text-left">
                          Duplica cada publicación generada en todos los canales activos de la campaña
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        id="replicateChannels"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        defaultChecked={true}
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: CONTEXTO Y ESTRATEGIA */}
                <div className="p-6 bg-muted/5 flex flex-col space-y-4 overflow-y-auto">
                  {(() => {
                    const currentCamp = campaigns.find(c => c.id === planningCampaignId);
                    if (!currentCamp) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-xs font-semibold">Sin campaña seleccionada</p>
                          <p className="text-[10px] text-muted-foreground/75">
                            Selecciona una campaña de referencia a la izquierda para cargar su estrategia e información de contexto para la IA.
                          </p>
                        </div>
                      );
                    }

                    const objectiveTranslations: Record<string, string> = {
                      AWARENESS: "Reconocimiento de Marca (Awareness)",
                      ENGAGEMENT: "Interacción / Engagement",
                      TRAFFIC: "Tráfico de Visitas",
                      LEADS: "Generación de Clientes Potenciales",
                      SALES: "Ventas / Conversión",
                      RETENTION: "Retención / Fidelización",
                    };

                    let targetingObj: any = null;
                    if (currentCamp.targeting) {
                      try {
                        targetingObj = typeof currentCamp.targeting === "string"
                          ? JSON.parse(currentCamp.targeting)
                          : currentCamp.targeting;
                      } catch (e) {}
                    }

                    let strategyObjectives: any = null;
                    if (currentCamp.strategy?.objectives) {
                      try {
                        strategyObjectives = typeof currentCamp.strategy.objectives === "string"
                          ? JSON.parse(currentCamp.strategy.objectives)
                          : currentCamp.strategy.objectives;
                      } catch (e) {}
                    }

                    let contentPillars: any = null;
                    if (currentCamp.strategy?.contentPillars) {
                      try {
                        contentPillars = typeof currentCamp.strategy.contentPillars === "string"
                          ? JSON.parse(currentCamp.strategy.contentPillars)
                          : currentCamp.strategy.contentPillars;
                      } catch (e) {}
                    }

                    return (
                      <div className="space-y-4 text-left">
                        {/* Campaña Info */}
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Contexto de la Campaña
                          </h4>
                          <div className="bg-background border border-muted/20 p-3 rounded-xl space-y-2.5 shadow-sm">
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Nombre</span>
                              <span className="text-xs font-bold text-foreground">{currentCamp.name}</span>
                            </div>
                            
                            {currentCamp.description && (
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Descripción</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">{currentCamp.description}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-muted/10">
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Objetivo</span>
                                <Badge variant="secondary" className="text-[9.5px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                  {objectiveTranslations[currentCamp.objective || ""] || currentCamp.objective}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Presupuesto</span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  {currentCamp.budget ? `$${Number(currentCamp.budget).toLocaleString()}` : "No definido"}
                                </span>
                              </div>
                            </div>

                            {/* Canales activos de la campaña */}
                            {(() => {
                              let campChannels: { platform: string; isActive: boolean }[] = [];
                              try {
                                const parsed = typeof currentCamp.channels === "string"
                                  ? JSON.parse(currentCamp.channels)
                                  : currentCamp.channels;
                                if (Array.isArray(parsed)) {
                                  campChannels = parsed.filter((ch: any) => ch && ch.isActive);
                                }
                              } catch (e) {}

                              if (campChannels.length === 0) return null;

                              return (
                                <div className="pt-1.5 border-t border-muted/10">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Canales de Distribución</span>
                                  <div className="flex flex-wrap gap-1">
                                    {campChannels.map((ch: any, idx: number) => {
                                      const platform = (ch.platform || "").toUpperCase();
                                      const meta = channelMeta[platform];
                                      return (
                                        <Badge key={idx} variant="outline" className={`text-[9px] font-semibold gap-1 ${meta?.badge || ""}`}>
                                          {meta?.icon}
                                          {meta?.label || platform}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Segmentación Info */}
                        {targetingObj && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              Segmentación de Audiencia
                            </h4>
                            <div className="bg-background border border-muted/20 p-3 rounded-xl space-y-2.5 shadow-sm">
                              {targetingObj.locations && (
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Ubicaciones</span>
                                  <span className="text-xs text-foreground font-medium">
                                    {Array.isArray(targetingObj.locations) ? targetingObj.locations.join(", ") : targetingObj.locations}
                                  </span>
                                </div>
                              )}
                              
                              {targetingObj.ageRange && (
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Rango de Edad</span>
                                  <span className="text-xs text-foreground font-medium">{targetingObj.ageRange} años</span>
                                </div>
                              )}

                              {targetingObj.interests && (
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Intereses Clave</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(Array.isArray(targetingObj.interests) 
                                      ? targetingObj.interests 
                                      : String(targetingObj.interests).split(",")
                                    ).map((interest: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-[9px] font-medium text-muted-foreground border-muted-foreground/20">
                                        {interest.trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Estrategia Info */}
                        {currentCamp.strategy && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              Estrategia de Marketing Asociada
                            </h4>
                            <div className="bg-background border border-muted/20 p-3 rounded-xl space-y-2.5 shadow-sm">
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Estrategia</span>
                                <span className="text-xs font-bold text-foreground">{currentCamp.strategy.name}</span>
                              </div>

                              {currentCamp.strategy.description && (
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Enfoque Estratégico</span>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{currentCamp.strategy.description}</p>
                                </div>
                              )}

                              {strategyObjectives && (
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Objetivos del Negocio</span>
                                  <div className="space-y-2 mt-1">
                                    {(Array.isArray(strategyObjectives) ? strategyObjectives : [strategyObjectives]).map((obj: any, idx: number) => {
                                      if (typeof obj === "string") {
                                        return <p key={idx} className="text-xs text-muted-foreground leading-relaxed">• {obj}</p>;
                                      }
                                      return (
                                        <div key={idx} className="bg-muted/10 border border-muted/15 rounded-lg p-2.5 space-y-1.5">
                                          {(obj.title || obj.name || obj.description) && (
                                            <span className="text-[10.5px] font-bold text-foreground block">
                                              {obj.title || obj.name || obj.description}
                                            </span>
                                          )}
                                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                                            {obj.metric && (
                                              <span className="text-[9px] text-muted-foreground">
                                                <span className="font-semibold">Métrica:</span> {obj.metric}
                                              </span>
                                            )}
                                            {obj.target && (
                                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                Meta: {obj.target}
                                              </span>
                                            )}
                                            {obj.timeframe && (
                                              <span className="text-[9px] text-muted-foreground">
                                                <span className="font-semibold">Plazo:</span> {obj.timeframe}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {contentPillars && (
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Pilares de Contenido</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(Array.isArray(contentPillars) ? contentPillars : [contentPillars]).map((pillar: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-[9px] font-semibold bg-indigo-50/50 text-indigo-750 border-indigo-100 dark:bg-indigo-950/10 dark:text-indigo-400 dark:border-indigo-950/30">
                                        {typeof pillar === "string" ? pillar : (pillar.name || pillar.title || JSON.stringify(pillar))}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
                  onClick={handleGeneratePreview}
                  disabled={!planningCampaignId}
                  className="gradient-primary text-xs font-semibold h-9 shadow-sm"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300 shrink-0" />
                  Previsualizar Planificación
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMACIÓN SHADCN DE ELIMINACIÓN */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="border border-muted/20 rounded-2xl shadow-2xl bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              ¿Estás completamente seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Esta acción no se puede deshacer. Se eliminará permanentemente esta publicación del calendario editorial y de la base de datos de tu negocio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs font-semibold rounded-lg h-9">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteContent}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg h-9 shadow-sm"
            >
              Eliminar publicación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
