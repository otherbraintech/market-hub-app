"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Search, 
  Sparkles, 
  Loader2, 
  Flame, 
  Music, 
  Hash, 
  BarChart3, 
  Newspaper, 
  Code, 
  Check, 
  Copy, 
  Radio, 
  Compass, 
  Zap,
  Globe,
  Share2,
  Info,
  Layers,
  Calendar,
  Volume2,
  Video,
  Clapperboard,
  ShieldCheck,
  Play,
  FileText,
  Tag
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { exploreTrendsAction, getRegisteredNichesAction } from "@/actions/trends-explorer";

function formatStatusSpanish(status?: string): string {
  if (!status) return "Estado: En Auge";
  const s = status.toLowerCase();
  if (s === "pico") return "Estado: En Pico Viral";
  if (s === "emergente") return "Estado: Emergente";
  if (s === "en auge" || s === "auge") return "Estado: En Auge";
  return `Estado: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
}

export default function TrendsExplorerPage() {
  const [niche, setNiche] = useState("Restaurantes & Gastronomía");
  const [platform, setPlatform] = useState<"tiktok" | "instagram" | "facebook">("tiktok");
  const [region, setRegion] = useState("BO");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [quickNiches, setQuickNiches] = useState<string[]>([
    "Restaurantes & Gastronomía",
    "Salud, Clínicas & Spa",
    "Moda, Ropa & Boutique",
    "Bienes Raíces & Inmobiliaria",
    "Gimnasios & Fitness",
    "Tecnología & Software"
  ]);

  const handleFetchTrends = async (targetNiche = niche, targetPlatform = platform, targetRegion = region) => {
    if (!targetNiche.trim()) {
      toast.error("Por favor ingresa un rubro o nicho para explorar.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await exploreTrendsAction({
        niche: targetNiche,
        platform: targetPlatform,
        region: targetRegion
      });

      if (res.success && res.data) {
        setResults(res.data);
        toast.success(`Tendencias de ${targetNiche} (${targetPlatform.toUpperCase()}) cargadas correctamente`);
      } else {
        toast.error(res.error || "Error al conectar con OB-Tendencias API Engine");
      }
    } catch (err: any) {
      toast.error("Ocurrió un fallo de conexión con el servicio de tendencias.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Cargar nichos dinámicos registrados en la base de datos (negocios y tendencias guardadas)
    getRegisteredNichesAction().then((res) => {
      if (res.success && Array.isArray(res.niches) && res.niches.length > 0) {
        setQuickNiches(res.niches);
      }
    }).catch(e => console.error("Error fetching registered niches:", e));

    // Cargar tendencias iniciales al entrar
    handleFetchTrends("Restaurantes & Gastronomía", "tiktok", "BO");
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    toast.success("System Prompt copiado al portapapeles");
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header de la Pantalla */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 font-semibold px-2.5 py-0.5">
              <Radio className="h-3 w-3 mr-1.5 animate-pulse text-cyan-500" /> OB-Tendencias AI Engine 2026.4
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
              Gemini 2.5 Flash + OpenRouter + Google Search Grounding
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
            Motor de Tendencias TikTok & Redes Sociales <TrendingUp className="h-8 w-8 text-cyan-500" />
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm md:text-base max-w-3xl">
            Interfaz de inspección en vivo de la documentación oficial de <span className="font-semibold text-foreground">OB-Tendencias API</span>. Extrae ganchos virales (0-1.7s), audios en auge, hashtags 30/70, conceptos de video, SEO social y efemérides en tiempo real.
          </p>
        </div>
      </div>

      {/* Panel de Filtros y Búsqueda */}
      <Card className="border border-cyan-500/20 bg-gradient-to-br from-card via-card to-cyan-500/5 shadow-xl shadow-cyan-500/5">
        <CardContent className="p-6 space-y-6">
          {/* Selector de Plataforma */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Plataforma Objetivo:</span>
            <div className="flex items-center gap-2">
              <Button
                variant={platform === "tiktok" ? "default" : "outline"}
                size="sm"
                className={platform === "tiktok" ? "bg-black hover:bg-neutral-900 text-white font-bold gap-1.5" : ""}
                onClick={() => { setPlatform("tiktok"); handleFetchTrends(niche, "tiktok", region); }}
              >
                <Video className="h-4 w-4 text-cyan-400" /> TikTok
              </Button>
              <Button
                variant={platform === "instagram" ? "default" : "outline"}
                size="sm"
                className={platform === "instagram" ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-1.5" : ""}
                onClick={() => { setPlatform("instagram"); handleFetchTrends(niche, "instagram", region); }}
              >
                <Sparkles className="h-4 w-4" /> Instagram Reels
              </Button>
              <Button
                variant={platform === "facebook" ? "default" : "outline"}
                size="sm"
                className={platform === "facebook" ? "bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5" : ""}
                onClick={() => { setPlatform("facebook"); handleFetchTrends(niche, "facebook", region); }}
              >
                <Share2 className="h-4 w-4" /> Facebook
              </Button>
            </div>
          </div>

          {/* Formulario de Nicho y Región */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rubro / Nicho de Mercado</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Ej: Restaurantes, Salud, Moda, Bienes Raíces..."
                  className="pl-9 bg-background h-11 border-border/60 focus:border-cyan-500 font-medium text-base"
                />
              </div>
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Región / País</label>
              <select
                value={region}
                onChange={(e) => { setRegion(e.target.value); handleFetchTrends(niche, platform, e.target.value); }}
                className="w-full h-11 px-3 rounded-md bg-background border border-border/60 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="BO">🇧🇴 Bolivia (BO)</option>
                <option value="MX">🇲🇽 México (MX)</option>
                <option value="CO">🇨🇴 Colombia (CO)</option>
                <option value="AR">🇦🇷 Argentina (AR)</option>
                <option value="ES">🇪🇸 España (ES)</option>
                <option value="US">🇺🇸 Estados Unidos (US)</option>
                <option value="CL">🇨🇱 Chile (CL)</option>
                <option value="PE">🇵🇪 Perú (PE)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <Button
                onClick={() => handleFetchTrends()}
                disabled={isLoading}
                className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Consultar API
              </Button>
            </div>
          </div>

          {/* Tags rápidos */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Filtros rápidos:</span>
            {quickNiches.map((qn) => (
              <Badge
                key={qn}
                variant="secondary"
                className="cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-600 transition-colors py-1 px-2.5 text-xs font-medium"
                onClick={() => { setNiche(qn); handleFetchTrends(qn, platform, region); }}
              >
                {qn}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estado de Carga */}
      {isLoading && (
        <Card className="border border-cyan-500/20 p-12 text-center bg-card/60 backdrop-blur">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
              <Zap className="absolute inset-0 m-auto h-6 w-6 text-cyan-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Conectando a OB-Tendencias API Engine...</h3>
              <p className="text-sm text-muted-foreground">Extrayendo ganchos virales, audios en auge, noticias RSS y métricas del algoritmo para <span className="font-semibold text-foreground">{niche}</span> ({platform.toUpperCase()})</p>
            </div>
          </div>
        </Card>
      )}

      {/* Resultados de Tendencias */}
      {!isLoading && results && (
        <div className="space-y-6">
          {/* Status Bar con Contador de Extracción Mensual */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 text-xs md:text-sm shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-500" />
                <span>Fuentes: <strong className="text-foreground">{results.sourcesUsed}</strong></span>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold gap-1 py-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                Frecuencia: Mensual (1ro de cada mes)
              </Badge>
              {results.daysRemaining && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold gap-1 py-1">
                  ⏳ Próximo autodisparo: En {results.daysRemaining} {results.daysRemaining === 1 ? "día" : "días"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={results.isCached ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"}>
                {results.isCached ? "⚡ SnapShot Cacheado PostgreSQL (<10ms)" : "✨ Extracción Live IA Engine"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFetchTrends(niche, platform, region)}
                className="h-7 text-xs font-bold gap-1 border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10"
              >
                <Sparkles className="h-3 w-3" /> Refrescar Ahora
              </Button>
            </div>
          </div>

          {/* Banner de Integración Interna */}
          <Card className="border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-500 shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-sm">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  ¿Cómo utiliza MarketHub este Banco de Tendencias internamente?
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Esta información no exige pasos extra al usuario final, sino que <strong>se inyecta automáticamente en los prompts de los agentes de IA</strong>: nutre el análisis FODA de la <strong>Etapa 1 (Auditoría)</strong>, los 8 pilares de la <strong>Etapa 3 (Estrategia Growth)</strong> y los ganchos de 1.7s en el <strong>Calendario Editorial (Etapa 5)</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pestañas de Visualización Completa de Tendencias */}
          <Tabs defaultValue="hooks" className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1.5 bg-muted/60 rounded-xl gap-1">
              <TabsTrigger value="hooks" className="py-2.5 text-xs font-bold gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-500" /> Ganchos Virales
              </TabsTrigger>
              <TabsTrigger value="music" className="py-2.5 text-xs font-bold gap-1.5">
                <Music className="h-3.5 w-3.5 text-purple-500" /> Audios en Auge
              </TabsTrigger>
              <TabsTrigger value="viralConcept" className="py-2.5 text-xs font-bold gap-1.5">
                <Clapperboard className="h-3.5 w-3.5 text-pink-500" /> Concepto Viral
              </TabsTrigger>
              <TabsTrigger value="hashtags" className="py-2.5 text-xs font-bold gap-1.5">
                <Hash className="h-3.5 w-3.5 text-cyan-500" /> Hashtags (30/70)
              </TabsTrigger>
              <TabsTrigger value="algorithm" className="py-2.5 text-xs font-bold gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-500" /> Algoritmo & Pilares
              </TabsTrigger>
              <TabsTrigger value="news" className="py-2.5 text-xs font-bold gap-1.5">
                <Newspaper className="h-3.5 w-3.5 text-blue-500" /> Noticias & Efemérides
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Ganchos Virales */}
            <TabsContent value="hooks" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" /> Ganchos Virales Probados (0-1.7s) & Patrones de Interrupción
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10.5px] font-bold">
                      ⚡ Alimenta: Etapa 1 (Banco de Datos) & Etapa 5 (Calendario)
                    </Badge>
                  </div>
                </div>
                <Badge variant="secondary">{results.hooks?.length || 0} Ganchos Extraídos</Badge>
              </div>

              {results.hooks && results.hooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.hooks.map((hk: any, idx: number) => (
                    <Card key={idx} className="border border-border/60 hover:border-orange-500/40 transition-all bg-card/80 flex flex-col justify-between">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-xs font-bold">
                            {hk.category || "Curiosidad / Revelación"}
                          </Badge>
                          {hk.lifecycle_status && (
                            <Badge variant="outline" className={`text-[10px] font-extrabold tracking-wider ${
                              hk.lifecycle_status === 'pico' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            }`}>
                              {formatStatusSpanish(hk.lifecycle_status)}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-black leading-snug mt-2 text-foreground">
                          "{hk.text}"
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs md:text-sm flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          {hk.pattern_interrupt && (
                            <div className="p-2.5 rounded-lg bg-muted/60">
                              <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider mb-0.5">Patrón de Interrupción Visual:</span>
                              <span className="font-medium text-foreground">{hk.pattern_interrupt}</span>
                            </div>
                          )}
                          {hk.execution_tips && (
                            <p className="text-muted-foreground leading-relaxed text-xs">
                              💡 <strong className="text-foreground">Tip de Ejecución:</strong> {hk.execution_tips}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/40 text-xs">
                          {hk.suggested_cta ? (
                            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold">
                              <span>CTA Sugerido:</span>
                              <span className="bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold text-[11px]">{hk.suggested_cta}</span>
                            </div>
                          ) : <div />}
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] font-bold">
                            ⚡ Influye en: Etapa 1 & Etapa 5
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  No se encontraron ganchos específicos para este nicho. Se aplican ganchos de curiosidad por defecto.
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: Audios & Música (TikTok Sound Hub) */}
            <TabsContent value="music" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Music className="h-5 w-5 text-purple-500" /> TikTok Sound Hub: Audios de Nicho, Top Global & Memes
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10.5px] font-bold">
                      🖼️ Alimenta: Etapa 2 (Activos Gráficos) & Etapa 5 (Calendario)
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Audios del Nicho */}
                <Card className="border border-purple-500/20 flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <Volume2 className="h-4 w-4" /> Audios Destacados del Nicho
                        </CardTitle>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[9.5px] font-bold">
                          🖼️ Influye en: Etapa 2 & 5
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">Pistas virales específicas para {niche}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.music && results.music.length > 0 ? (
                        results.music.map((m: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{m.name}</span>
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] font-bold">
                                {formatStatusSpanish(m.audio_phase || m.lifecycle_status)}
                              </Badge>
                            </div>
                            {m.artist && <div className="text-muted-foreground">{m.artist}</div>}
                            {m.adoption_velocity && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                                ⚡ Velocidad: {m.adoption_velocity}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Pistas del nicho sintetizadas automáticamente por IA.</p>
                      )}
                    </CardContent>
                  </div>
                </Card>

                {/* Top 10 Música Global */}
                <Card className="border border-cyan-500/20 flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                          <Radio className="h-4 w-4" /> Top 10 Música Global TikTok
                        </CardTitle>
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-[9.5px] font-bold">
                          🖼️ Influye en: Etapa 2 & 5
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">Motor de Tendencias Globales</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.generalMusic && results.generalMusic.length > 0 ? (
                        results.generalMusic.map((gm: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg bg-muted/50 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-foreground">{gm.name}</div>
                              <div className="text-muted-foreground text-[11px]">{gm.artist || "Tendencia Global"}</div>
                            </div>
                            <Badge className="bg-cyan-500/10 text-cyan-600 text-[10px]">Top Viral</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                          <div className="font-bold text-foreground">Flowers - Miley Cyrus</div>
                          <div className="font-bold text-foreground">Ella Baila Sola - Eslabon Armado</div>
                          <div className="text-[10px]">Top tendencias globales activas</div>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>

                {/* Top Memes & Clips Cortos */}
                <Card className="border border-pink-500/20 flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-pink-600 dark:text-pink-400">
                          <Sparkles className="h-4 w-4" /> Memes & Clips Cortos (5-15s)
                        </CardTitle>
                        <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/20 text-[9.5px] font-bold">
                          🖼️ Influye en: Etapa 2 & 5
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">Audios de comedia y transiciones rápidas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.shortViralAudios && results.shortViralAudios.length > 0 ? (
                        results.shortViralAudios.map((sa: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1 text-xs">
                            <div className="flex items-center justify-between font-bold text-foreground">
                              <span>{sa.name}</span>
                              <Badge className="bg-pink-500/10 text-pink-600 text-[10px] font-mono">{sa.duration_seconds || "8s"}</Badge>
                            </div>
                            {sa.recommended_usage && (
                              <p className="text-muted-foreground text-[11px] leading-snug">{sa.recommended_usage}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-xs">
                          <div className="font-bold text-foreground">It's Corn Kid Meme (8s)</div>
                          <p className="text-muted-foreground text-[11px]">Transición cómica revelando el producto o plato del día.</p>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: Concepto Viral & Script Idea */}
            <TabsContent value="viralConcept" className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-pink-500" /> Concepto de Video Viral & Guion Estructurado
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 text-[10.5px] font-bold">
                      📢 Alimenta: Etapa 4 (Campañas) & Etapa 5 (Calendario)
                    </Badge>
                  </div>
                </div>
              </div>

              {results.viralVideoConcept ? (
                <Card className="border border-pink-500/30 bg-gradient-to-br from-card via-card to-pink-500/5 shadow-xl">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 text-xs font-extrabold uppercase">
                        ⭐ Concepto de Video Viral Destacado
                      </Badge>
                      <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/20 text-[10px] font-bold">
                        📢 Influye en: Etapa 4 (Campañas) & Etapa 5 (Calendario)
                      </Badge>
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-black mt-2 text-foreground">
                      "{results.viralVideoConcept.title || "El secreto que nadie conoce de este negocio"}"
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-muted/60 space-y-2">
                        <h4 className="font-bold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider">
                          <Clapperboard className="h-4 w-4 text-pink-500" /> Desglose Visual por Segundos
                        </h4>
                        <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">
                          {results.viralVideoConcept.visual_breakdown || "0-2s: Close-up impactante. 2-5s: Reacción sincera. 5-15s: Proceso de preparación en cámara rápida."}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-muted/60 space-y-2">
                        <h4 className="font-bold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider">
                          <Video className="h-4 w-4 text-cyan-500" /> Estilo de Edición Sugerido
                        </h4>
                        <p className="text-muted-foreground leading-relaxed text-xs md:text-sm">
                          {results.viralVideoConcept.editing_style || "Jump cuts rápidos con transición de zoom + música viral de fondo al 20% de volumen."}
                        </p>
                      </div>
                    </div>

                    {results.viralVideoConcept.why_it_went_viral && (
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs md:text-sm space-y-1">
                        <strong className="text-purple-600 dark:text-purple-400 block font-bold">🧠 ¿Por qué funciona en el algoritmo TikTok 2026?</strong>
                        <p className="text-muted-foreground">{results.viralVideoConcept.why_it_went_viral}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  Generación de concepto de video viral disponible para el nicho {niche}.
                </Card>
              )}
            </TabsContent>

            {/* TAB 4: Hashtags & SEO Social */}
            <TabsContent value="hashtags" className="space-y-6">
              <Card className="border border-cyan-500/20">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Hash className="h-5 w-5 text-cyan-500" /> Estrategia de Hashtags (30% Nicho / 70% Viral)
                      </CardTitle>
                      <CardDescription>Mezcla óptima recomendada por los algoritmos de TikTok para equilibrar posicionamiento y alcance orgánico</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-[10.5px] font-bold">
                          ⚡ Alimenta: Etapa 1 (Banco de Datos) & Etapa 5 (Calendario)
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-[10px] font-bold">
                      ⚡ Influye en: Etapa 1 & Etapa 5
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {results.hashtags && results.hashtags.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {results.hashtags.map((h: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center gap-2 text-sm shadow-sm">
                          <span className="font-extrabold text-cyan-600 dark:text-cyan-400">#{h.tag}</span>
                          {h.category && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 uppercase font-semibold">
                              {h.category}
                            </Badge>
                          )}
                          {h.volume_metrics && (
                            <span className="text-[10px] text-muted-foreground border-l border-border pl-2">{h.volume_metrics}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-sm py-1.5 px-3">#{niche.replace(/\s+/g, '')}</Badge>
                      <Badge variant="outline" className="text-sm py-1.5 px-3">#viral</Badge>
                      <Badge variant="outline" className="text-sm py-1.5 px-3">#fyp</Badge>
                      <Badge variant="outline" className="text-sm py-1.5 px-3">#tendencia2026</Badge>
                    </div>
                  )}

                  {results.socialSeo && (
                    <div className="p-4 rounded-xl bg-muted/60 space-y-3 text-xs md:text-sm">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                          <Search className="h-4 w-4 text-cyan-500" /> Optimización Social SEO para TikTok
                        </h4>
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-[10px] font-bold">
                          ⚡ Influye en: Etapa 1 & 5
                        </Badge>
                      </div>
                      {results.socialSeo.suggested_filename && (
                        <p><strong className="text-muted-foreground">Nombre de archivo sugerido:</strong> <code className="bg-background px-2 py-0.5 rounded border text-cyan-600 font-mono">{results.socialSeo.suggested_filename}</code></p>
                      )}
                      {results.socialSeo.caption_structure && (
                        <p><strong className="text-muted-foreground">Estructura del Caption:</strong> {results.socialSeo.caption_structure}</p>
                      )}
                      {results.socialSeo.tiktok_search_keywords && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <strong className="text-muted-foreground mr-1">Palabras clave de búsqueda TikTok:</strong>
                          {results.socialSeo.tiktok_search_keywords.map((kw: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[11px]">{kw}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: Algoritmo & Pilares */}
            <TabsContent value="algorithm" className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" /> Reglas del Algoritmo 2026 & Pilares Estratégicos
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10.5px] font-bold">
                      🎯 Alimenta: Etapa 3 (Estrategia Growth) & Etapa 4 (Campañas)
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tarjetas de Métricas Reina */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Métrica Reina {platform.toUpperCase()}
                      </CardTitle>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9.5px] font-bold">
                        🎯 Influye en: Etapa 3 & 4
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-black">
                      {results.algorithmicRecommendations?.queen_metric?.name || "Tasa de Reproducción (Rewatch Rate)"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Objetivo: <strong className="text-foreground">{results.algorithmicRecommendations?.queen_metric?.target || ">2.0 bucles por usuario"}</strong>
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground pt-1 border-t border-border/40">
                      💡 {results.algorithmicRecommendations?.queen_metric?.strategy || "Bucle perfecto visual en 7-15s"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-blue-500/30 bg-blue-500/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Ventana Óptima de Publicación
                      </CardTitle>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[9.5px] font-bold">
                        🎯 Influye en: Etapa 3 & 4
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-black">
                      {results.algorithmicRecommendations?.optimal_posting_window || "18:00 - 21:00"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Zona horaria: <strong className="text-foreground">UTC-4 / Región {results.region}</strong>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-purple-500/30 bg-purple-500/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Ritmo de Edición (Pacing)
                      </CardTitle>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[9.5px] font-bold">
                        🎯 Influye en: Etapa 3 & 4
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-lg font-bold">
                      {results.algorithmicRecommendations?.edit_pacing || "Cortes cada 1-2s en los primeros 3s"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Evitar zonas UI de TikTok (15% superior/inferior).
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pilares Estratégicos */}
              {results.contentPillars && results.contentPillars.length > 0 && (
                <Card className="border border-border/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-500" /> Pilares Estratégicos de Contenido (2026)
                      </CardTitle>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9.5px] font-bold">
                        🎯 Influye en: Etapa 3 & Etapa 4
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.contentPillars.map((p: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-muted/50 space-y-2 border border-border/40 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between font-bold">
                              <span>{p.pillar}</span>
                              <Badge className="bg-emerald-500/10 text-emerald-600">{p.percentage}%</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                            {p.best_formats && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {p.best_formats.map((fmt: string, fIdx: number) => (
                                  <Badge key={fIdx} variant="outline" className="text-[10px]">{fmt}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="pt-2 border-t border-border/30 flex justify-end">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold">
                              🎯 Influye en: Etapa 3 & 4
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 6: Noticias RSS & Efemérides Patrias */}
            <TabsContent value="news" className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-blue-500" /> Noticias del Nicho (RSS) & Efemérides Patrias Próximas
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10.5px] font-bold">
                      ⚡ Alimenta: Etapa 1 (Banco de Datos) & Etapa 4 (Campañas)
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Efemérides & Días Festivos */}
              {results.upcomingEvents && results.upcomingEvents.length > 0 && (
                <Card className="border border-amber-500/30 bg-amber-500/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Calendar className="h-5 w-5" /> Efemérides y Días Festivos Próximos
                      </CardTitle>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9.5px] font-bold">
                        ⚡ Influye en: Etapa 1 & 4
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.upcomingEvents.map((ev: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-card border border-amber-500/20 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span>{ev.event}</span>
                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300">{ev.date}</Badge>
                        </div>
                        <p className="text-muted-foreground">{ev.relevance_to_niche}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Noticias RSS */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-blue-500" /> Feed de Noticias RSS (Últimos 30 días)
                </h3>

                {results.news && results.news.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.news.map((nw: any, i: number) => (
                      <Card key={i} className="border border-border/60 flex flex-col justify-between">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span className="font-semibold text-blue-500">{nw.source || "Google News RSS"}</span>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[9.5px] font-bold">
                              ⚡ Influye en: Etapa 1 & 4
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-bold text-foreground leading-snug">
                            {nw.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                          <p className="text-muted-foreground leading-relaxed">
                            {nw.snippet}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    No se registran noticias de alto impacto en las últimas 24h para este nicho.
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
