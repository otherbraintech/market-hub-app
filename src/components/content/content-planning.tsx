"use client";

import { useState } from "react";
import { deleteContentAction, updateContentStatusAction } from "@/actions/content";
import { ContentForm } from "./content-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Sparkles,
  Layout,
  Loader2,
  MoreHorizontal,
  Trash,
  Edit,
  Plus,
  CheckCircle2,
  Clock,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  generateContentIdeasAction, 
  generateCopyAction, 
  generateMediaAction 
} from "@/actions/content";

interface ContentPlanningProps {
  businessId: string;
  strategyId: string | null;
  contents: (any & { campaign?: { name: string } | null, socialAccount?: { accountName: string } | null })[];
  campaigns: { id: string, name: string }[];
  products: { id: string, name: string }[];
  socialAccounts: { id: string, accountName: string, channel: any }[];
}

const statusColors: Record<any, string> = {
  IDEA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  SCHEDULED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  PUBLISHING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PUBLISHED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  GENERATING: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 animate-pulse",
  ARCHIVED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
};

const statusLabels: Record<any, string> = {
  IDEA: "Idea",
  DRAFT: "Borrador",
  REVIEW: "En Revisión",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHING: "Publicando...",
  PUBLISHED: "Publicado",
  FAILED: "Fallido",
  GENERATING: "IA Generando...",
  ARCHIVED: "Archivado",
};

export function ContentPlanning({ 
  businessId, 
  strategyId,
  contents, 
  campaigns, 
  products, 
  socialAccounts 
}: ContentPlanningProps) {
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIActive, setIsAIActive] = useState(false);

  async function handleGenerateAI(parameters: any) {
    setIsAIActive(true);
    try {
      const result = await generateContentIdeasAction(businessId, strategyId, parameters);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al conectar con el servicio de IA");
    } finally {
      setIsAIActive(false);
    }
  }

  async function handleGenerateCopy(id: string) {
    const result = await generateCopyAction(id, businessId, { 
      type: "social_post", 
      tone: "professional" 
    });
    if (result.success) toast.success(result.message);
    else toast.error(result.error);
  }

  async function handleGenerateMedia(id: string) {
    const result = await generateMediaAction(id, businessId, { 
      type: "image" 
    });
    if (result.success) toast.success(result.message);
    else toast.error(result.error);
  }

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este contenido?")) {
      const result = await deleteContentAction(id, businessId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    }
  }

  async function handleStatusChange(id: string, status: any) {
    const result = await updateContentStatusAction(id, status, businessId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  }

  const upcomingContents = contents.filter(c => c.status === "SCHEDULED" || c.status === "APPROVED");
  const ideasContents = contents.filter(c => c.status === "IDEA" || c.status === "DRAFT");
  const reviewContents = contents.filter(c => c.status === "REVIEW" || c.status === "GENERATING");
  const historyContents = contents.filter(c => c.status === "PUBLISHED" || c.status === "FAILED");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Planificación de Contenidos</h3>
          <p className="text-sm text-muted-foreground">Gestiona tus publicaciones, ideas y calendario editorial.</p>
        </div>
        <div className="flex gap-2">
          <GenerateIdeasDialog 
            onGenerate={handleGenerateAI}
            loading={isAIActive}
          />
          <Button onClick={() => {
            setEditingContent(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Contenido
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
          <TabsTrigger value="review">Revisión</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all" className="space-y-4">
             {contents.length === 0 ? <EmptyState onAdd={() => setIsDialogOpen(true)} onGenerate={handleGenerateAI} loading={isAIActive} /> : <ContentList items={contents} onEdit={(c) => { setEditingContent(c); setIsDialogOpen(true); }} onDelete={handleDelete} onStatusChange={handleStatusChange} onGenerateCopy={handleGenerateCopy} onGenerateMedia={handleGenerateMedia} />}
          </TabsContent>
          <TabsContent value="upcoming" className="space-y-4">
             {upcomingContents.length === 0 ? <p className="text-center py-20 text-muted-foreground">No hay contenidos programados.</p> : <ContentList items={upcomingContents} onEdit={(c) => { setEditingContent(c); setIsDialogOpen(true); }} onDelete={handleDelete} onStatusChange={handleStatusChange} onGenerateCopy={handleGenerateCopy} onGenerateMedia={handleGenerateMedia} />}
          </TabsContent>
          <TabsContent value="ideas" className="space-y-4">
             {ideasContents.length === 0 ? <p className="text-center py-20 text-muted-foreground">No hay ideas de contenido aún.</p> : <ContentList items={ideasContents} onEdit={(c) => { setEditingContent(c); setIsDialogOpen(true); }} onDelete={handleDelete} onStatusChange={handleStatusChange} onGenerateCopy={handleGenerateCopy} onGenerateMedia={handleGenerateMedia} />}
          </TabsContent>
          <TabsContent value="review" className="space-y-4">
             {reviewContents.length === 0 ? <p className="text-center py-20 text-muted-foreground">No hay contenidos pendientes de revisión.</p> : <ContentList items={reviewContents} onEdit={(c) => { setEditingContent(c); setIsDialogOpen(true); }} onDelete={handleDelete} onStatusChange={handleStatusChange} onGenerateCopy={handleGenerateCopy} onGenerateMedia={handleGenerateMedia} />}
          </TabsContent>
          <TabsContent value="history" className="space-y-4">
             {historyContents.length === 0 ? <p className="text-center py-20 text-muted-foreground">El historial está vacío.</p> : <ContentList items={historyContents} onEdit={(c) => { setEditingContent(c); setIsDialogOpen(true); }} onDelete={handleDelete} onStatusChange={handleStatusChange} onGenerateCopy={handleGenerateCopy} onGenerateMedia={handleGenerateMedia} />}
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingContent(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContent ? "Editar Contenido" : "Crear Nuevo Contenido"}</DialogTitle>
            <DialogDescription>
              Define los detalles de tu publicación para redes sociales o blog.
            </DialogDescription>
          </DialogHeader>
          <ContentForm 
            businessId={businessId}
            campaigns={campaigns}
            products={products}
            socialAccounts={socialAccounts}
            defaultValues={editingContent}
            onSuccess={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ onAdd, onGenerate, loading }: { onAdd: () => void, onGenerate: (params: any) => Promise<void>, loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-lg bg-muted/20 border-dashed p-8 text-center">
      <div className="p-4 rounded-full bg-background mb-4 shadow-sm">
        <Layout className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No hay contenido planificado</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Comienza a crear contenido manualmente o usa nuestra IA para generar una estrategia completa de publicaciones basada en tus productos.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <GenerateIdeasDialog onGenerate={onGenerate} loading={loading} />
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" /> Crear mi primer contenido
        </Button>
      </div>
    </div>
  );
}

function GenerateIdeasDialog({ onGenerate, loading }: { onGenerate: (params: any) => Promise<void>, loading: boolean }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["POST", "REEL", "STORY"]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["INSTAGRAM", "FACEBOOK", "TIKTOK"]);

  const contentTypes = [
    { id: "POST", label: "Post Estático" },
    { id: "REEL", label: "Reel / Video Corto" },
    { id: "STORY", label: "Story" },
    { id: "ARTICLE", label: "Artículo / Blog" },
    { id: "EMAIL", label: "Email Marketing" }
  ];

  const channels = [
    { id: "INSTAGRAM", label: "Instagram" },
    { id: "FACEBOOK", label: "Facebook" },
    { id: "TIKTOK", label: "TikTok" },
    { id: "LINKEDIN", label: "LinkedIn" },
    { id: "TWITTER", label: "Twitter / X" }
  ];

  const handleToggleType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) ? prev.filter(id => id !== typeId) : [...prev, typeId]
    );
  };

  const handleToggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) ? prev.filter(id => id !== channelId) : [...prev, channelId]
    );
  };

  const handleGenerate = async () => {
    await onGenerate({
      quantity,
      contentTypes: selectedTypes,
      channels: selectedChannels,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden sm:flex">
          <Sparkles className="mr-2 h-4 w-4" /> Generar con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Ideas con IA</DialogTitle>
          <DialogDescription>
            Nuestra IA analizará tu estrategia y productos para proponerte nuevas ideas de contenido.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad de ideas</Label>
            <Input 
              id="quantity" 
              type="number" 
              min={1} 
              max={20} 
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value))} 
            />
          </div>

          <div className="space-y-3">
            <Label>Tipos de contenido</Label>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type.id}`} 
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={() => handleToggleType(type.id)}
                  />
                  <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Canales</Label>
            <div className="grid grid-cols-2 gap-2">
              {channels.map((channel) => (
                <div key={channel.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`chan-${channel.id}`} 
                    checked={selectedChannels.includes(channel.id)}
                    onCheckedChange={() => handleToggleChannel(channel.id)}
                  />
                  <Label htmlFor={`chan-${channel.id}`} className="text-sm font-normal cursor-pointer">
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={loading || selectedTypes.length === 0 || selectedChannels.length === 0}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Empezar Generación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContentList({ 
  items, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onGenerateCopy,
  onGenerateMedia
}: { 
  items: any[], 
  onEdit: (item: any) => void, 
  onDelete: (id: string) => void, 
  onStatusChange: (id: string, s: any) => void,
  onGenerateCopy: (id: string) => void,
  onGenerateMedia: (id: string) => void
}) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className={statusColors[item.status as any]}>
                  {statusLabels[item.status as any]}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.scheduledAt ? format(new Date(item.scheduledAt), "d 'de' MMMM, HH:mm", { locale: es }) : "Sin fecha"}
                </span>
                {item.channel && (
                  <Badge variant="secondary" className="text-[10px]">
                    {item.channel}
                  </Badge>
                )}
              </div>
              <h4 className="font-bold text-base mb-1">{item.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.caption || item.body || "Sin descripción."}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
                {item.campaign && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">Campaña:</span> {item.campaign.name}
                  </div>
                )}
                {item.socialAccount && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">Cuenta:</span> {item.socialAccount.accountName}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-muted/30 sm:w-48 p-4 flex flex-col justify-between border-t sm:border-t-0 sm:border-l">
              <div className="flex justify-end sm:justify-start gap-2 mb-4">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 ml-auto">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>IA Magic</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onGenerateCopy(item.id)}>
                      <Sparkles className="mr-2 h-4 w-4 text-orange-500" /> Generar Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGenerateMedia(item.id)}>
                      <Layout className="mr-2 h-4 w-4 text-blue-500" /> Generar Media
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onStatusChange(item.id, "APPROVED")}>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Aprobar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(item.id, "SCHEDULED")}>
                      <Clock className="mr-2 h-4 w-4 text-purple-500" /> Programar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex flex-col gap-2">
                {item.status === "IDEA" || item.status === "DRAFT" ? (
                  <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => onStatusChange(item.id, "REVIEW")}>
                    <Send className="mr-2 h-3 w-3" /> Enviar a Revisión
                  </Button>
                ) : item.status === "APPROVED" ? (
                  <Button variant="outline" size="sm" className="w-full text-xs text-purple-600 border-purple-200" onClick={() => onStatusChange(item.id, "SCHEDULED")}>
                    <Clock className="mr-2 h-3 w-3" /> Programar Publicación
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
