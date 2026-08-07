"use client";

import React, { useState, useMemo } from "react";
import { 
  Calendar, 
  Search, 
  MapPin, 
  Sparkles, 
  Tag, 
  Star, 
  Filter, 
  Globe, 
  Flag, 
  ShoppingBag, 
  Church, 
  PartyPopper, 
  Award,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Save,
  CheckCircle2,
  RotateCcw,
  Power,
  EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { upsertCivicDateAction, toggleCivicDateActiveAction, deleteCivicDateAction, resetCivicDatesSeedAction } from "@/actions/civic-dates";

interface CivicDateItem {
  id: string;
  name: string;
  date: string; // "MM-DD"
  fixedYear?: number | null;
  category: "CIVICA" | "COMERCIAL" | "RELIGIOSA" | "CULTURAL" | "REGIONAL" | "INTERNACIONAL";
  region: string;
  description?: string | null;
  importance: number; // 1-10
  hashtags?: any;
  industries?: any;
  isActive: boolean;
}

interface CivicDatesViewProps {
  initialDates: CivicDateItem[];
  isAdmin?: boolean;
}

const monthsSpanish = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const categoryMeta: Record<string, { label: string; icon: React.ReactNode; badgeClass: string; borderClass: string }> = {
  CIVICA: {
    label: "Cívica / Patria",
    icon: <Flag className="h-3.5 w-3.5" />,
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40",
    borderClass: "border-l-red-500",
  },
  COMERCIAL: {
    label: "Comercial / Ventas",
    icon: <ShoppingBag className="h-3.5 w-3.5" />,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
    borderClass: "border-l-emerald-500",
  },
  RELIGIOSA: {
    label: "Religiosa / Tradición",
    icon: <Church className="h-3.5 w-3.5" />,
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40",
    borderClass: "border-l-purple-500",
  },
  CULTURAL: {
    label: "Cultural / Folklore",
    icon: <PartyPopper className="h-3.5 w-3.5" />,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
    borderClass: "border-l-amber-500",
  },
  REGIONAL: {
    label: "Regional / Efeméride",
    icon: <MapPin className="h-3.5 w-3.5" />,
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/40",
    borderClass: "border-l-cyan-500",
  },
  INTERNACIONAL: {
    label: "Internacional",
    icon: <Globe className="h-3.5 w-3.5" />,
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
    borderClass: "border-l-blue-500",
  },
};

function formatDateNice(mmdd: string) {
  if (!mmdd) return "";
  const [m, d] = mmdd.split("-");
  const monthIdx = parseInt(m, 10) - 1;
  const monthName = monthsSpanish[monthIdx]?.label || "";
  return `${parseInt(d, 10)} de ${monthName}`;
}

export function CivicDatesView({ initialDates, isAdmin = false }: CivicDatesViewProps) {
  const [datesList, setDatesList] = useState<CivicDateItem[]>(initialDates);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Estado del Modal de Edición / Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formMonth, setFormMonth] = useState("01");
  const [formDay, setFormDay] = useState("01");
  const [formCategory, setFormCategory] = useState<"CIVICA" | "COMERCIAL" | "RELIGIOSA" | "CULTURAL" | "REGIONAL" | "INTERNACIONAL">("CIVICA");
  const [formRegion, setFormRegion] = useState("BOLIVIA");
  const [formDescription, setFormDescription] = useState("");
  const [formImportance, setFormImportance] = useState(8);
  const [formHashtags, setFormHashtags] = useState("");

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormName("");
    setFormMonth("08");
    setFormDay("06");
    setFormCategory("CIVICA");
    setFormRegion("BOLIVIA");
    setFormDescription("");
    setFormImportance(8);
    setFormHashtags("#diadebolivia, #6deagosto");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CivicDateItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    const [m, d] = item.date.split("-");
    setFormMonth(m || "01");
    setFormDay(d || "01");
    setFormCategory(item.category);
    setFormRegion(item.region);
    setFormDescription(item.description || "");
    setFormImportance(item.importance);
    setFormHashtags(Array.isArray(item.hashtags) ? item.hashtags.join(", ") : "");
    setIsModalOpen(true);
  };

  const handleSaveDate = async () => {
    if (!formName.trim()) {
      toast.error("Ingresa el nombre de la fecha cívica.");
      return;
    }

    const formattedDateStr = `${formMonth.padStart(2, '0')}-${formDay.padStart(2, '0')}`;
    const tagsArr = formHashtags
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith("#") ? t : `#${t}`);

    setIsSaving(true);
    try {
      const res = await upsertCivicDateAction({
        id: editingId || undefined,
        name: formName,
        date: formattedDateStr,
        category: formCategory,
        region: formRegion,
        description: formDescription,
        importance: formImportance,
        hashtags: tagsArr,
      });

      if (res.success && res.data) {
        const savedItem = res.data as CivicDateItem;
        if (editingId) {
          setDatesList(prev => prev.map(d => d.id === editingId ? savedItem : d));
          toast.success("Fecha cívica actualizada correctamente.");
        } else {
          setDatesList(prev => [savedItem, ...prev]);
          toast.success("Fecha cívica creada con éxito.");
        }
        setIsModalOpen(false);
      } else {
        toast.error("No se pudo guardar la fecha cívica.");
      }
    } catch (err) {
      toast.error("Error al procesar la solicitud.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const res = await toggleCivicDateActiveAction(id, nextStatus);
      if (res.success && res.data) {
        setDatesList(prev => prev.map(d => d.id === id ? { ...d, isActive: nextStatus } : d));
        if (nextStatus) {
          toast.success("Fecha cívica restaurada y habilitada correctamente.");
        } else {
          toast.info("Fecha cívica deshabilitada.");
        }
      } else {
        toast.error(res.error || "No se pudo cambiar el estado.");
      }
    } catch (err) {
      toast.error("Error al actualizar el estado de la fecha.");
    }
  };

  const handleDeleteDate = async (id: string) => {
    try {
      const res = await deleteCivicDateAction(id);
      if (res.success) {
        setDatesList(prev => prev.filter(d => d.id !== id));
        toast.success("Fecha cívica eliminada permanentemente.");
      } else {
        toast.error("No se pudo eliminar la fecha.");
      }
    } catch (err) {
      toast.error("Error al eliminar la fecha.");
    }
  };

  const handleResetSeed = async () => {
    setIsResetting(true);
    try {
      const res = await resetCivicDatesSeedAction();
      if (res.success && res.data) {
        setDatesList(res.data as CivicDateItem[]);
        toast.success("Catálogo base de 58 fechas cívicas restaurado con éxito.");
      } else {
        toast.error(res.error || "No se pudo restaurar el catálogo.");
      }
    } catch (err) {
      toast.error("Error al restaurar el catálogo de fechas.");
    } finally {
      setIsResetting(false);
    }
  };

  // Filtrar fechas en memoria
  const filteredDates = useMemo(() => {
    return datesList.filter((item) => {
      if (selectedStatus === "ACTIVE" && item.isActive === false) {
        return false;
      }
      if (selectedStatus === "INACTIVE" && item.isActive !== false) {
        return false;
      }
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (selectedMonth !== "ALL" && !item.date.startsWith(`${selectedMonth}-`)) {
        return false;
      }
      if (selectedRegion !== "ALL" && item.region.toUpperCase() !== selectedRegion.toUpperCase()) {
        return false;
      }
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(query);
        const descMatch = (item.description || "").toLowerCase().includes(query);
        const regionMatch = item.region.toLowerCase().includes(query);
        const hashtagMatch = Array.isArray(item.hashtags) 
          ? item.hashtags.some((h: string) => h.toLowerCase().includes(query))
          : false;
        return nameMatch || descMatch || regionMatch || hashtagMatch;
      }

      return true;
    });
  }, [datesList, selectedCategory, selectedMonth, selectedRegion, selectedStatus, searchTerm]);

  // Agrupar por mes para la vista organizada
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, CivicDateItem[]> = {};
    filteredDates.forEach((item) => {
      const monthKey = item.date.split("-")[0];
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(item);
    });
    return groups;
  }, [filteredDates]);

  // Estadísticas rápidas
  const totalCount = datesList.length;
  const activeCount = datesList.filter(d => d.isActive !== false).length;
  const inactiveCount = datesList.filter(d => d.isActive === false).length;
  const santaCruzCount = datesList.filter(d => d.region === "SANTA_CRUZ").length;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* BANNER HEADER ADAPTABLE A MODO CLARO Y OSCURO */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-6 md:p-8 text-card-foreground shadow-md bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-indigo-500/10">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 text-[10px] font-black uppercase tracking-wider">
                🇧🇴 Bolivia & Santa Cruz
              </Badge>
              <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                Motor de Calendario IA
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Banco de Fechas Cívicas & Festividades
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Catálogo completo de efemérides patrias, fechas comerciales, festividades religiosas y eventos regionales cruceños para alimentar tu estrategia de contenido en redes sociales.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-background/80 border border-border/60 p-2.5 rounded-2xl text-center shadow-xs">
                <span className="text-lg font-black text-foreground block">{totalCount}</span>
                <span className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Total</span>
              </div>
              <div className="bg-background/80 border border-border/60 p-2.5 rounded-2xl text-center shadow-xs">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">{activeCount}</span>
                <span className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Habilitadas</span>
              </div>
              {inactiveCount > 0 && (
                <div className="bg-background/80 border border-border/60 p-2.5 rounded-2xl text-center shadow-xs">
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 block">{inactiveCount}</span>
                  <span className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Deshabilitadas</span>
                </div>
              )}
              <div className="bg-background/80 border border-border/60 p-2.5 rounded-2xl text-center shadow-xs">
                <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 block">{santaCruzCount}</span>
                <span className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">Santa Cruz</span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleResetSeed}
                  disabled={isResetting}
                  className="h-11 px-3 text-xs gap-1.5 rounded-2xl font-bold border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                  title="Restaurar el catálogo original de 58 fechas cívicas"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{isResetting ? "Restaurando..." : "Restaurar Catálogo Base"}</span>
                </Button>

                <Button
                  onClick={handleOpenCreateModal}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-11 px-4 gap-2 rounded-2xl shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Fecha</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Búsqueda */}
          <div className="relative md:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar fecha, hashtag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          {/* Estado (Habilitadas / Deshabilitadas) */}
          <div className="md:col-span-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Todos los Estados</SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">🟢 Solo Habilitadas</SelectItem>
                <SelectItem value="INACTIVE" className="text-xs">🔴 Solo Deshabilitadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoría */}
          <div className="md:col-span-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Todas las Categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Todas las Categorías</SelectItem>
                <SelectItem value="CIVICA" className="text-xs">🇧🇴 Cívica / Patria</SelectItem>
                <SelectItem value="COMERCIAL" className="text-xs">🎁 Comercial / Ventas</SelectItem>
                <SelectItem value="RELIGIOSA" className="text-xs">⛪ Religiosa / Tradición</SelectItem>
                <SelectItem value="CULTURAL" className="text-xs">🎭 Cultural / Folklore</SelectItem>
                <SelectItem value="REGIONAL" className="text-xs">📍 Regional / Efeméride</SelectItem>
                <SelectItem value="INTERNACIONAL" className="text-xs">🌍 Internacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mes */}
          <div className="md:col-span-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Todos los Meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Todos los Meses</SelectItem>
                {monthsSpanish.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Región */}
          <div className="md:col-span-1">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Todas</SelectItem>
                <SelectItem value="BOLIVIA" className="text-xs">Bolivia</SelectItem>
                <SelectItem value="SANTA_CRUZ" className="text-xs">Santa Cruz</SelectItem>
                <SelectItem value="LA_PAZ" className="text-xs">La Paz</SelectItem>
                <SelectItem value="COCHABAMBA" className="text-xs">Cochabamba</SelectItem>
                <SelectItem value="ORURO" className="text-xs">Oruro</SelectItem>
                <SelectItem value="CHUQUISACA" className="text-xs">Sucre</SelectItem>
                <SelectItem value="TARIJA" className="text-xs">Tarija</SelectItem>
                <SelectItem value="BENI" className="text-xs">Beni</SelectItem>
                <SelectItem value="POTOSI" className="text-xs">Potosí</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle de Vista */}
          <div className="md:col-span-1 flex items-center justify-end gap-1">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-10 px-3 text-xs gap-1.5 rounded-xl font-bold"
              title="Vista en Tabla (Predeterminado)"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Tabla</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-10 px-3 text-xs gap-1.5 rounded-xl font-bold"
              title="Vista en Tarjetas"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tarjetas</span>
            </Button>
          </div>
        </div>

        {/* Resumen de filtros activos */}
        {(selectedCategory !== "ALL" || selectedMonth !== "ALL" || selectedRegion !== "ALL" || selectedStatus !== "ALL" || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t text-[11px] text-muted-foreground flex-wrap">
            <span className="font-bold">Filtros activos:</span>
            {selectedStatus !== "ALL" && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                Estado: {selectedStatus === "ACTIVE" ? "🟢 Solo Habilitadas" : "🔴 Solo Deshabilitadas"}
                <span className="cursor-pointer font-bold ml-1" onClick={() => setSelectedStatus("ALL")}>×</span>
              </Badge>
            )}
            {selectedCategory !== "ALL" && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                {categoryMeta[selectedCategory]?.label}
                <span className="cursor-pointer font-bold ml-1" onClick={() => setSelectedCategory("ALL")}>×</span>
              </Badge>
            )}
            {selectedMonth !== "ALL" && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                Mes: {monthsSpanish.find(m => m.value === selectedMonth)?.label}
                <span className="cursor-pointer font-bold ml-1" onClick={() => setSelectedMonth("ALL")}>×</span>
              </Badge>
            )}
            {selectedRegion !== "ALL" && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                Región: {selectedRegion}
                <span className="cursor-pointer font-bold ml-1" onClick={() => setSelectedRegion("ALL")}>×</span>
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                Búsqueda: "{searchTerm}"
                <span className="cursor-pointer font-bold ml-1" onClick={() => setSearchTerm("")}>×</span>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedMonth("ALL");
                setSelectedRegion("ALL");
                setSelectedStatus("ALL");
                setSearchTerm("");
              }}
              className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
            >
              Limpiar todos los filtros
            </Button>
          </div>
        )}
      </div>

      {/* CONTENIDO DE FECHAS */}
      {filteredDates.length === 0 ? (
        <div className="bg-card border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Calendar className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-base font-bold text-foreground">No se encontraron fechas cívicas</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Prueba ajustando los filtros de búsqueda, categoría, estado o mes para encontrar efemérides.
          </p>
          {isAdmin && (
            <Button
              onClick={handleResetSeed}
              disabled={isResetting}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold gap-2 mt-2 rounded-xl"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{isResetting ? "Restaurando..." : "Restaurar Catálogo Base (58 Fechas)"}</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByMonth)
            .sort(([mA], [mB]) => parseInt(mA, 10) - parseInt(mB, 10))
            .map(([monthNum, items]) => {
              const monthName = monthsSpanish.find(m => m.value === monthNum)?.label || `Mes ${monthNum}`;

              return (
                <div key={monthNum} className="space-y-4">
                  {/* Encabezado del Mes */}
                  <div className="flex items-center gap-3 border-b pb-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                      {parseInt(monthNum, 10)}
                    </div>
                    <h2 className="text-base font-black uppercase tracking-wider text-foreground">
                      {monthName}
                    </h2>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {items.length} {items.length === 1 ? "fecha" : "fechas"}
                    </Badge>
                  </div>

                  {/* VISTA TABLA O GRID */}
                  {viewMode === "table" ? (
                    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow className="text-xs font-bold text-muted-foreground">
                            <TableHead className="w-[130px] text-xs font-bold">Fecha</TableHead>
                            <TableHead className="text-xs font-bold">Festividad / Efeméride</TableHead>
                            <TableHead className="w-[150px] text-xs font-bold">Categoría</TableHead>
                            <TableHead className="w-[120px] text-xs font-bold">Región</TableHead>
                            <TableHead className="w-[90px] text-xs font-bold text-center">Prioridad</TableHead>
                            <TableHead className="w-[180px] text-xs font-bold">Hashtags Sugeridos</TableHead>
                            {isAdmin && <TableHead className="w-[110px] text-xs font-bold text-right">Acciones</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => {
                            const meta = categoryMeta[item.category] || categoryMeta.CIVICA;
                            const formattedDate = formatDateNice(item.date);
                            const isSantaCruz = item.region.toUpperCase() === "SANTA_CRUZ";
                            const isInactive = item.isActive === false;

                            return (
                              <TableRow 
                                key={item.id} 
                                className={`hover:bg-muted/30 transition-colors ${isInactive ? "bg-rose-500/5 opacity-70" : ""}`}
                              >
                                <TableCell className="font-extrabold text-xs text-primary whitespace-nowrap">
                                  🗓️ {formattedDate}
                                </TableCell>
                                <TableCell className="max-w-[340px]">
                                  <div className="flex items-center gap-2">
                                    <div className={`font-bold text-xs leading-snug ${isInactive ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                      {item.name}
                                    </div>
                                    {isInactive && (
                                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[9px] font-black uppercase">
                                        Deshabilitada
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <div className="text-[11px] text-muted-foreground truncate max-w-[320px] mt-0.5">{item.description}</div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-[10px] font-bold gap-1 shrink-0 ${meta.badgeClass}`}>
                                    {meta.icon}
                                    <span>{meta.label}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[9.5px] font-bold ${isSantaCruz ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300" : "bg-muted text-muted-foreground"}`}
                                  >
                                    📍 {item.region.replace("_", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <span>{item.importance}/10</span>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[180px]">
                                  {Array.isArray(item.hashtags) && item.hashtags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {item.hashtags.slice(0, 3).map((tag: string, idx: number) => (
                                        <span key={idx} className="text-[9.5px] font-semibold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground italic">-</span>
                                  )}
                                </TableCell>
                                {isAdmin && (
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {isInactive ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleToggleActive(item.id, false)}
                                          className="h-7 px-2.5 text-[10.5px] font-bold gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg"
                                          title="Restaurar y habilitar esta fecha"
                                        >
                                          <RotateCcw className="h-3.5 w-3.5" />
                                          <span>Restaurar</span>
                                        </Button>
                                      ) : (
                                        <>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleOpenEditModal(item)}
                                            className="h-7 w-7 text-muted-foreground hover:text-cyan-600 rounded-lg"
                                            title="Editar Fecha Cívica"
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>

                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggleActive(item.id, true)}
                                            className="h-7 px-2 text-[10px] font-bold gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg"
                                            title="Deshabilitar esta fecha cívica"
                                          >
                                            <EyeOff className="h-3.5 w-3.5" />
                                            <span>Deshabilitar</span>
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    /* VISTA TARJETAS */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => {
                        const meta = categoryMeta[item.category] || categoryMeta.CIVICA;
                        const formattedDate = formatDateNice(item.date);
                        const isSantaCruz = item.region.toUpperCase() === "SANTA_CRUZ";
                        const isInactive = item.isActive === false;

                        return (
                          <Card 
                            key={item.id} 
                            className={`border-l-4 ${meta.borderClass} hover:shadow-md transition-all duration-200 group relative overflow-hidden flex flex-col justify-between ${isInactive ? "bg-rose-500/5 opacity-75 border-dashed" : ""}`}
                          >
                            <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                              <div className="space-y-3">
                                {/* Fila Superior: Fecha Badge + Categoría */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-primary uppercase tracking-wider">
                                      🗓️ {formattedDate}
                                    </span>
                                    {item.fixedYear && (
                                      <span className="text-[9px] text-muted-foreground font-semibold">
                                        Año {item.fixedYear}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {isInactive && (
                                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[9px] font-black uppercase">
                                        Deshabilitada
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className={`text-[10px] font-black gap-1 shrink-0 ${meta.badgeClass}`}>
                                      {meta.icon}
                                      <span>{meta.label}</span>
                                    </Badge>
                                  </div>
                                </div>

                                {/* Nombre Principal */}
                                <div>
                                  <h3 className={`text-sm font-black transition-colors line-clamp-2 ${isInactive ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary"}`}>
                                    {item.name}
                                  </h3>
                                  {item.description && (
                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t">
                                {/* Prioridad + Región Badge + Botones de Acción */}
                                <div className="flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-1.5">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[9px] font-black uppercase ${isSantaCruz ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300" : "bg-muted text-muted-foreground"}`}
                                    >
                                      📍 {item.region.replace("_", " ")}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-amber-500 font-bold" title={`Prioridad ${item.importance}/10`}>
                                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                      <span>{item.importance}/10</span>
                                    </div>
                                    {isAdmin && (
                                      isInactive ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleToggleActive(item.id, false)}
                                          className="h-6 px-2 text-[9.5px] font-bold gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                          title="Restaurar fecha"
                                        >
                                          <RotateCcw className="h-3 w-3" />
                                          <span>Restaurar</span>
                                        </Button>
                                      ) : (
                                        <>
                                          <Button size="icon" variant="ghost" onClick={() => handleOpenEditModal(item)} className="h-6 w-6 text-muted-foreground hover:text-cyan-600" title="Editar">
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button size="icon" variant="ghost" onClick={() => handleToggleActive(item.id, true)} className="h-6 w-6 text-muted-foreground hover:text-rose-600" title="Deshabilitar">
                                            <EyeOff className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Hashtags Sugeridos */}
                                {Array.isArray(item.hashtags) && item.hashtags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {item.hashtags.map((tag: string, idx: number) => (
                                      <span key={idx} className="text-[9.5px] font-semibold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR FECHA CÍVICA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
              {editingId ? <Pencil className="h-5 w-5 text-cyan-500" /> : <Plus className="h-5 w-5 text-cyan-500" />}
              {editingId ? "Editar Fecha Cívica / Efeméride" : "Nueva Fecha Cívica / Efeméride"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configura los detalles de la festividad para alimentar las sugerencias del calendario de contenido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Nombre de la Festividad / Evento</label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ej: Día de la Independencia de Bolivia"
                className="text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Mes</label>
                <Select value={formMonth} onValueChange={setFormMonth}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthsSpanish.map(m => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        {m.label} ({m.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Día del Mes</label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formDay}
                  onChange={e => setFormDay(e.target.value)}
                  className="h-9 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Categoría</label>
                <Select value={formCategory} onValueChange={(val: any) => setFormCategory(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIVICA" className="text-xs">🇧🇴 Cívica / Patria</SelectItem>
                    <SelectItem value="COMERCIAL" className="text-xs">🎁 Comercial / Ventas</SelectItem>
                    <SelectItem value="RELIGIOSA" className="text-xs">⛪ Religiosa / Tradición</SelectItem>
                    <SelectItem value="CULTURAL" className="text-xs">🎭 Cultural / Folklore</SelectItem>
                    <SelectItem value="REGIONAL" className="text-xs">📍 Regional / Efeméride</SelectItem>
                    <SelectItem value="INTERNACIONAL" className="text-xs">🌍 Internacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Región / Departamento</label>
                <Select value={formRegion} onValueChange={setFormRegion}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOLIVIA" className="text-xs">Bolivia (Nacional)</SelectItem>
                    <SelectItem value="SANTA_CRUZ" className="text-xs">Santa Cruz</SelectItem>
                    <SelectItem value="LA_PAZ" className="text-xs">La Paz</SelectItem>
                    <SelectItem value="COCHABAMBA" className="text-xs">Cochabamba</SelectItem>
                    <SelectItem value="ORURO" className="text-xs">Oruro</SelectItem>
                    <SelectItem value="CHUQUISACA" className="text-xs">Chuquisaca / Sucre</SelectItem>
                    <SelectItem value="TARIJA" className="text-xs">Tarija</SelectItem>
                    <SelectItem value="BENI" className="text-xs">Beni</SelectItem>
                    <SelectItem value="POTOSI" className="text-xs">Potosí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Descripción / Relevancia</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Breve reseña del evento y cómo aprovecharlo comercialmente..."
                className="w-full h-20 p-2.5 rounded-lg border border-input bg-background text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Prioridad (1 al 10)</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formImportance}
                  onChange={e => setFormImportance(parseInt(e.target.value, 10) || 5)}
                  className="h-9 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Hashtags Sugeridos (por comas)</label>
                <Input
                  value={formHashtags}
                  onChange={e => setFormHashtags(e.target.value)}
                  placeholder="#diadebolivia, #6deagosto"
                  className="h-9 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveDate}
              disabled={isSaving}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Guardando..." : "Guardar Fecha"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
