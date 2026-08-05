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
  CheckCircle2
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
import { toast } from "sonner";

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

export function CivicDatesView({ initialDates }: CivicDatesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filtrar fechas en memoria
  const filteredDates = useMemo(() => {
    return initialDates.filter((item) => {
      // Filtro Categoría
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      // Filtro Mes
      if (selectedMonth !== "ALL" && !item.date.startsWith(`${selectedMonth}-`)) {
        return false;
      }
      // Filtro Región
      if (selectedRegion !== "ALL" && item.region.toUpperCase() !== selectedRegion.toUpperCase()) {
        return false;
      }
      // Búsqueda por texto
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
  }, [initialDates, selectedCategory, selectedMonth, selectedRegion, searchTerm]);

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
  const totalCount = initialDates.length;
  const santaCruzCount = initialDates.filter(d => d.region === "SANTA_CRUZ").length;
  const comercialCount = initialDates.filter(d => d.category === "COMERCIAL").length;
  const highPriorityCount = initialDates.filter(d => d.importance >= 8).length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* BANNER HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 text-[10px] font-black uppercase tracking-wider">
                🇧🇴 Bolivia & Santa Cruz
              </Badge>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                Motor de Calendario IA
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Banco de Fechas Cívicas & Festividades
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Catálogo completo de efemérides patrias, fechas comerciales, festividades religiosas y eventos regionales cruceños para alimentar tu estrategia de contenido en redes sociales.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
              <span className="text-xl font-black text-white block">{totalCount}</span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Total Fechas</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
              <span className="text-xl font-black text-cyan-300 block">{santaCruzCount}</span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Santa Cruz</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
              <span className="text-xl font-black text-emerald-300 block">{comercialCount}</span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Comerciales</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
              <span className="text-xl font-black text-amber-300 block">{highPriorityCount}</span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Alta Prioridad</span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Búsqueda */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar fecha, hashtag, descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
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
          <div className="md:col-span-2">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Todas las Regiones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Todas las Regiones</SelectItem>
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

          {/* Toggle de Vista */}
          <div className="md:col-span-1 flex items-center justify-end gap-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-10 w-10 rounded-xl"
              title="Vista en cuadrícula"
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-10 w-10 rounded-xl"
              title="Vista en lista comprimida"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Resumen de filtros activos */}
        {(selectedCategory !== "ALL" || selectedMonth !== "ALL" || selectedRegion !== "ALL" || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t text-[11px] text-muted-foreground flex-wrap">
            <span className="font-bold">Filtros activos:</span>
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
            Prueba ajustando los filtros de búsqueda, categoría o mes para encontrar efemérides.
          </p>
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

                  {/* VISTA GRID O LISTA */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => {
                        const meta = categoryMeta[item.category] || categoryMeta.CIVICA;
                        const formattedDate = formatDateNice(item.date);
                        const isSantaCruz = item.region.toUpperCase() === "SANTA_CRUZ";

                        return (
                          <Card 
                            key={item.id} 
                            className={`border-l-4 ${meta.borderClass} hover:shadow-md transition-all duration-200 group relative overflow-hidden`}
                          >
                            <CardContent className="p-5 space-y-3">
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

                                <Badge variant="outline" className={`text-[10px] font-black gap-1 shrink-0 ${meta.badgeClass}`}>
                                  {meta.icon}
                                  <span>{meta.label}</span>
                                </Badge>
                              </div>

                              {/* Nombre Principal */}
                              <div>
                                <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                  {item.name}
                                </h3>
                                {item.description && (
                                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              {/* Prioridad + Región Badge */}
                              <div className="flex items-center justify-between pt-2 border-t text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[9px] font-black uppercase ${isSantaCruz ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300" : "bg-muted text-muted-foreground"}`}
                                  >
                                    📍 {item.region.replace("_", " ")}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-1 text-amber-500 font-bold" title={`Prioridad ${item.importance}/10`}>
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span>{item.importance}/10</span>
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
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    /* VISTA LISTA COMPRIMIDA */
                    <div className="bg-card border rounded-2xl overflow-hidden divide-y shadow-sm">
                      {items.map((item) => {
                        const meta = categoryMeta[item.category] || categoryMeta.CIVICA;
                        const formattedDate = formatDateNice(item.date);
                        const isSantaCruz = item.region.toUpperCase() === "SANTA_CRUZ";

                        return (
                          <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="h-10 w-24 shrink-0 bg-muted/30 border rounded-xl flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-black text-primary uppercase">{formattedDate}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-black text-foreground truncate">{item.name}</h4>
                                  <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${meta.badgeClass}`}>
                                    {meta.label}
                                  </Badge>
                                </div>
                                {item.description && (
                                  <p className="text-[10.5px] text-muted-foreground truncate mt-0.5">{item.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                              <Badge variant="outline" className="text-[9px] font-bold">
                                📍 {item.region}
                              </Badge>
                              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span>{item.importance}/10</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
