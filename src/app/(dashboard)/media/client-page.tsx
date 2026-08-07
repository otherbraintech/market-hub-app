"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  FileVideo, 
  Sparkles, 
  Plus, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  FileImage,
  Palette,
  Layers,
  RefreshCw,
  X,
  Building2,
  ChevronDown,
  Eye,
  ExternalLink,
  ZoomIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
} from "@/components/ui/alert-dialog";
import { 
  listMediaAssetsAction, 
  createMediaAssetAction, 
  deleteMediaAssetAction, 
  updateBusinessLogoAction,
  updateBusinessBrandColorsAction
} from "@/actions/media";
import { setSelectedBusinessAction } from "@/actions/business";
import { toast } from "sonner";

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const num = parseInt(hex.replace("#", ""), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function colorDistance(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Extracción cromática inteligente mediante HTML5 Canvas (Client-side)
 * Prioriza los tonos visualmente más DISTINTOS (salto de distancia en espacio RGB).
 */
function extractDominantColorsFromImage(imageSrc: string, colorCount = 5): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(["#0F172A", "#3B82F6", "#10B981"]);

        const width = Math.min(150, img.width || 150);
        const height = Math.min(150, img.height || 150);
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const colorBuckets: { [hex: string]: number } = {};
        let totalValidPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Omitir píxeles transparentes
          if (a < 50) continue;

          // Agrupar píxeles en pasos de 16
          const qR = Math.round(r / 16) * 16;
          const qG = Math.round(g / 16) * 16;
          const qB = Math.round(b / 16) * 16;

          const hex = `#${((1 << 24) + (qR << 16) + (qG << 8) + qB).toString(16).slice(1).toUpperCase()}`;
          colorBuckets[hex] = (colorBuckets[hex] || 0) + 1;
          totalValidPixels++;
        }

        // Solo considerar colores significativos (que representen al menos el 1.5% del total)
        const minPixelCount = Math.max(5, Math.floor(totalValidPixels * 0.015));

        const sortedHexes = Object.keys(colorBuckets)
          .filter(hex => colorBuckets[hex] >= minPixelCount)
          .sort((a, b) => colorBuckets[b] - colorBuckets[a]);

        // PASO 1: Priorizar tonos con alta distancia cromática entre sí (distintos primero)
        const result: string[] = [];
        const primaryThreshold = 60; // Distancia cromática sustancial entre colores distintos

        for (const hex of sortedHexes) {
          if (result.length >= colorCount) break;
          const isDistinct = result.every(
            (selectedHex) => colorDistance(hex, selectedHex) >= primaryThreshold
          );
          if (isDistinct) {
            result.push(hex);
          }
        }

        // PASO 2: Si sólo hay 1 color principal, relajar suavemente el umbral a 35 para capturar un color secundario real
        if (result.length < 2) {
          const secondaryThreshold = 35;
          for (const hex of sortedHexes) {
            if (result.length >= colorCount) break;
            if (!result.includes(hex)) {
              const isDistinctEnough = result.every(
                (selectedHex) => colorDistance(hex, selectedHex) >= secondaryThreshold
              );
              if (isDistinctEnough) {
                result.push(hex);
              }
            }
          }
        }

        if (result.length === 0) resolve(["#0F172A", "#3B82F6", "#10B981"]);
        else resolve(result.slice(0, colorCount));
      } catch (err) {
        console.error("Error al extraer paleta cromática:", err);
        resolve(["#0F172A", "#3B82F6", "#10B981"]);
      }
    };
    img.onerror = () => {
      resolve(["#0F172A", "#3B82F6", "#10B981"]);
    };
    img.src = imageSrc;
  });
}

interface MediaAsset {
  id: string;
  type: "IMAGE" | "VIDEO";
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  category?: string;
  formatCategory?: string;
  createdAt: string;
}

interface BusinessItem {
  id: string;
  name: string;
  logo?: string | null;
}

export function getCategoryLabel(category?: string | null): string {
  if (!category) return "Arte de Inspiración";
  const cat = category.toUpperCase();
  if (cat === "LOGO" || cat === "MANUAL") return "Logotipo de Marca";
  if (cat === "INSPIRATION") return "Arte de Inspiración";
  if (cat === "NICHO_TERCEROS") return "Referencia de Nicho";
  if (cat === "VIDEO") return "Video de Marca";
  return "Arte de Inspiración";
}

interface MediaLibraryClientProps {
  businessId: string;
  activeBusiness?: BusinessItem;
  allBusinesses?: BusinessItem[];
  initialAssets: MediaAsset[];
  initialCounts: {
    videoCount: number;
    imageCount: number;
    total: number;
  };
  initialLogo?: string | null;
  initialBrandColors?: string[];
}

export function MediaLibraryClient({ 
  businessId, 
  activeBusiness,
  allBusinesses = [],
  initialAssets, 
  initialCounts,
  initialLogo = null,
  initialBrandColors = []
}: MediaLibraryClientProps) {
  const router = useRouter();
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
  const [counts, setCounts] = useState(initialCounts);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogo);
  const [brandColors, setBrandColors] = useState<string[]>(initialBrandColors);

  const [loadingInitialData, setLoadingInitialData] = useState(true);

  React.useEffect(() => {
    setLoadingInitialData(true);
    if (initialLogo) setLogoUrl(initialLogo);
    if (initialBrandColors && initialBrandColors.length > 0) setBrandColors(initialBrandColors);
    if (initialAssets && initialAssets.length > 0) setAssets(initialAssets);
    if (initialCounts) setCounts(initialCounts);

    fetchAssets().finally(() => {
      setLoadingInitialData(false);
    });
  }, [businessId]);

  const handleSelectBusiness = async (newId: string) => {
    if (newId === businessId) return;
    toast.info("Cambiando espacio de negocio...");
    await setSelectedBusinessAction(newId);
    router.refresh();
  };
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingInspiration, setUploadingInspiration] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [filterCategory, setFilterCategory] = useState<"ALL" | "LOGO" | "INSPIRATION" | "VIDEO">("ALL");
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<MediaAsset | null>(null);

  const fetchAssets = async () => {
    const res = await listMediaAssetsAction(businessId);
    if (res.success && res.assets) {
      setAssets(res.assets);
      setCounts({
        videoCount: res.videoCount ?? 0,
        imageCount: res.imageCount ?? 0,
        total: res.total ?? 0
      });
      if (res.logo) setLogoUrl(res.logo);
      if (res.brandColors && res.brandColors.length > 0) setBrandColors(res.brandColors);
    }
  };

  /**
   * OPCIÓN 1: Subida de Logotipo Oficial & Extracción Amplia de Paleta
   */
  const handleUploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("El logotipo debe ser una imagen (PNG, JPG, SVG o WEBP).");
      return;
    }

    setUploadingLogo(true);
    toast.info("Subiendo logotipo y analizando paleta de colores...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const obRes = await fetch("/api/upload-ob-files", {
        method: "POST",
        body: formData,
      });
      const obData = await obRes.json();

      if (!obData.success || !obData.url) {
        throw new Error(obData.error || "Error al subir logotipo");
      }

      const cdnUrl = obData.url;
      const extractedColors = await extractDominantColorsFromImage(cdnUrl, 5);

      const res = await updateBusinessLogoAction({
        businessId,
        logoUrl: cdnUrl,
        brandColors: extractedColors,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });

      if (res.success) {
        setLogoUrl(cdnUrl);
        setBrandColors(extractedColors);
        toast.success("¡Logotipo guardado y paleta cromática extraída!");
        await fetchAssets();
      } else {
        toast.error(res.error || "No se pudo guardar el logotipo en la base de datos.");
      }
    } catch (err: any) {
      console.error("Error al procesar logotipo:", err);
      toast.error(err?.message || "Error al procesar el logotipo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  /**
   * Eliminación individual de un color detectado
   */
  const handleRemoveColor = async (indexToRemove: number) => {
    const updated = brandColors.filter((_, idx) => idx !== indexToRemove);
    setBrandColors(updated);
    toast.success("Color eliminado de la paleta");
    await updateBusinessBrandColorsAction(businessId, updated);
  };

  /**
   * Adición manual de un nuevo color
   */
  const handleAddColor = async (hex: string) => {
    const upper = hex.toUpperCase();
    if (brandColors.includes(upper)) {
      toast.info("Este color ya está presente en la paleta.");
      return;
    }
    const updated = [...brandColors, upper];
    setBrandColors(updated);
    toast.success(`Color ${upper} añadido a la paleta`);
    await updateBusinessBrandColorsAction(businessId, updated);
  };

  /**
   * Re-extraer la paleta del logotipo guardado
   */
  const handleReextractPalette = async () => {
    const targetLogo = logoUrl || activeBusiness?.logo;
    if (!targetLogo) return;
    toast.info("Re-analizando paleta cromática del logotipo...");
    const reextracted = await extractDominantColorsFromImage(targetLogo, 5);
    setBrandColors(reextracted);
    await updateBusinessBrandColorsAction(businessId, reextracted);
    toast.success("Paleta de 5 colores dominantes re-extraída con éxito.");
  };

  /**
   * OPCIÓN 2: Subida de Artes de Inspiración & Redes Sociales
   */
  const handleUploadInspirationFile = async (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      toast.error("Solo puedes subir imágenes o videos de inspiración.");
      return;
    }

    const type = isVideo ? "VIDEO" : "IMAGE";

    if (type === "VIDEO" && counts.videoCount >= 5) {
      toast.error("Límite alcanzado: Máximo 5 videos en el plan básico.");
      return;
    }
    if (type === "IMAGE" && counts.imageCount >= 50) {
      toast.error("Límite alcanzado: Máximo 50 imágenes en el plan básico.");
      return;
    }

    setUploadingInspiration(true);
    setUploadProgress(10);

    try {
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? (clearInterval(interval), 90) : prev + 20));
      }, 100);

      const formData = new FormData();
      formData.append("file", file);

      const obRes = await fetch("/api/upload-ob-files", {
        method: "POST",
        body: formData,
      });

      const obData = await obRes.json();

      if (!obData.success || !obData.url) {
        throw new Error(obData.error || "Error al subir el archivo");
      }

      const realUrl = obData.url;

      const res = await createMediaAssetAction({
        businessId,
        type,
        filename: file.name,
        url: realUrl,
        mimeType: file.type,
        size: file.size,
        category: "INSPIRATION",
        formatCategory: isVideo ? "VIDEO" : "ART"
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (res.success) {
        toast.success("Arte de inspiración guardado exitosamente.");
        await fetchAssets();
      } else {
        toast.error(res.error || "No se pudo guardar el recurso.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar la subida.");
    } finally {
      setTimeout(() => {
        setUploadingInspiration(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadInspirationFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = (asset: MediaAsset) => {
    setAssetToDelete(asset);
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await deleteMediaAssetAction(id, businessId);
      if (res.success) {
        toast.success("Recurso gráfico eliminado correctamente.");
        await fetchAssets();
      } else {
        toast.error(res.error || "Error al eliminar el recurso.");
      }
    } catch (err) {
      toast.error("Error de base de datos al eliminar.");
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (filterCategory === "LOGO") return asset.category === "LOGO";
    if (filterCategory === "INSPIRATION") return asset.category === "INSPIRATION" || asset.category === "MANUAL";
    if (filterCategory === "VIDEO") return asset.type === "VIDEO";
    return true;
  });

  const currentLogo = logoUrl || activeBusiness?.logo || assets.find(a => a.category === "LOGO")?.url || null;

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          INDICADOR & SELECTOR DE NEGOCIO ACTIVO
         ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-card to-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-cyan-600 dark:text-cyan-400">Espacio de Negocio Activo</span>
              <Badge variant="outline" className="text-[10px] bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800">
                Sincronizado
              </Badge>
            </div>
            <h2 className="text-base font-black text-foreground">{activeBusiness?.name || "Negocio Seleccionado"}</h2>
          </div>
        </div>

        {allBusinesses.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-medium text-muted-foreground">Cambiar negocio:</span>
            <select
              value={businessId}
              onChange={(e) => handleSelectBusiness(e.target.value)}
              className="h-9 px-3 py-1 text-xs font-bold rounded-lg border border-input bg-background shadow-xs focus:ring-2 focus:ring-cyan-500 focus:outline-hidden cursor-pointer"
            >
              {allBusinesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          OPCIÓN 1: LOGOTIPO & PALETA DE COLORES (CON EDICIÓN Y BOTÓN DE BORRADO)
         ───────────────────────────────────────────────────────────── */}
      <Card className="border border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 via-card to-background dark:from-indigo-950/20 dark:via-card dark:to-background overflow-hidden shadow-md">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-black uppercase tracking-wider gap-1">
                <Palette className="h-3 w-3" /> Opción 1: Branding Oficial
              </Badge>
              <CardTitle className="text-lg font-black text-foreground tracking-tight">
                Logotipo de la Marca & Paleta Cromática
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Sube el logotipo oficial. La Inteligencia de Branding detectará la paleta cromática amplia. Puedes eliminar los tonos que no correspondan pasando el cursor sobre cada color.
              </CardDescription>
            </div>

            <div>
              <input 
                type="file" 
                id="logo-file-upload" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && handleUploadLogo(e.target.files[0])}
                accept="image/*"
                disabled={uploadingLogo}
              />
              <Button asChild disabled={uploadingLogo} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer">
                <label htmlFor="logo-file-upload">
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Analizando Logo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> {currentLogo ? "Cambiar Logotipo" : "Subir Logotipo"}
                    </>
                  )}
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Visualizador del Logo con alta visibilidad y fallback completo */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-indigo-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/90 min-h-[160px] relative group transition-all shadow-inner">
              {currentLogo ? (
                <div className="relative flex flex-col items-center gap-3 w-full">
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center w-full min-h-[100px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={currentLogo} 
                      alt="Logotipo Oficial de Marca" 
                      className="max-h-24 max-w-full object-contain drop-shadow-md" 
                    />
                  </div>
                  <div className="flex items-center justify-between w-full text-[10px]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Logotipo Guardado
                    </span>
                    <a 
                      href={currentLogo} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                    >
                      Ver original ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="h-10 w-10 text-indigo-400/40 mx-auto" />
                  <p className="text-xs font-bold text-muted-foreground">Sin Logotipo Oficial</p>
                  <p className="text-[10px] text-muted-foreground/80 max-w-[200px]">Haz clic en &quot;Subir Logotipo&quot; para cargar el arte original PNG, SVG o JPG.</p>
                </div>
              )}
            </div>

            {/* Visualizador & Gestor de Paleta Cromática */}
            <div className="md:col-span-2 space-y-3 p-4 rounded-xl border bg-card/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Paleta Cromática Personalizable
                </span>
                <div className="flex items-center gap-2">
                  {logoUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleReextractPalette}
                      className="h-6 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 px-2"
                      title="Re-analizar imagen del logotipo para detectar más tonos"
                    >
                      <RefreshCw className="h-2.5 w-2.5 mr-1" /> Re-extraer
                    </Button>
                  )}
                  {brandColors.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {brandColors.length} Tonos
                    </Badge>
                  )}
                </div>
              </div>

              {brandColors.length > 0 ? (
                <div className="space-y-3">
                  {/* Swatches interactivos con botón X en hover */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {brandColors.map((hex, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 group relative">
                        <div 
                          className="h-12 w-14 rounded-xl border border-black/10 shadow-sm transition-transform group-hover:scale-105 flex items-end justify-center pb-1 text-[9px] font-mono font-bold text-white drop-shadow-md relative overflow-hidden"
                          style={{ backgroundColor: hex }}
                        >
                          <span className="truncate px-0.5">{i === 0 ? "Dominante" : `#${i + 1}`}</span>
                          
                          {/* Botón X al hacer hover para eliminar el color */}
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(i)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm"
                            title="Eliminar este color de la paleta"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{hex}</span>
                      </div>
                    ))}

                    {/* Botón para añadir un nuevo color personalizado */}
                    <div className="flex flex-col items-center gap-1">
                      <label className="h-12 w-14 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-muted/30 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                        <Plus className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        <span className="text-[8px] font-bold text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Añadir</span>
                        <input 
                          type="color" 
                          className="sr-only" 
                          onChange={(e) => e.target.value && handleAddColor(e.target.value)}
                        />
                      </label>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">+ Color</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    * Pasa el cursor sobre cualquier color para eliminarlo con <X className="h-3 w-3 inline text-rose-500" /> o presiona + para agregar tonos personalizados.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/40 text-center text-xs text-muted-foreground space-y-2">
                  <p className="font-bold">Paleta aún no configurada</p>
                  <p className="text-[11px]">Sube el logotipo oficial para detectar la paleta o añade colores manualmente con el botón +.</p>
                  <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700">
                    <Plus className="h-3.5 w-3.5" /> Añadir Primer Color
                    <input 
                      type="color" 
                      className="sr-only" 
                      onChange={(e) => e.target.value && handleAddColor(e.target.value)}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* ─────────────────────────────────────────────────────────────
          OPCIÓN 2: ARTES DE REDES SOCIALES E INSPIRACIÓN ESTÉTICA
         ───────────────────────────────────────────────────────────── */}
      <Card className="border border-border bg-card shadow-md">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge variant="outline" className="text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 text-[10px] font-black uppercase tracking-wider gap-1">
                <Layers className="h-3 w-3" /> Opción 2: Inspiración & Artes de Redes
              </Badge>
              <CardTitle className="text-lg font-black text-foreground tracking-tight">
                Artes de Redes Sociales & Recursos de Inspiración
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Sube publicaciones anteriores, carruseles, reels o referencias estéticas para orientar los diseños y copys generados por los agentes de IA.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Métricas de Uso de Plan */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total de Archivos Multimedia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{counts.total}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Archivos catalogados en tu espacio privado</p>
              </CardContent>
            </Card>

            <Card className="border bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Imágenes & Artes ({counts.imageCount}/50)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="text-2xl font-black">{counts.imageCount}</div>
                <Progress value={(counts.imageCount / 50) * 100} className="h-1.5 bg-emerald-100 dark:bg-emerald-950" />
                <span className="text-[10px] text-muted-foreground">Límite: 50 imágenes</span>
              </CardContent>
            </Card>

            <Card className="border bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Videos & Reels ({counts.videoCount}/5)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="text-2xl font-black">{counts.videoCount}</div>
                <Progress value={(counts.videoCount / 5) * 100} className="h-1.5 bg-blue-100 dark:bg-blue-950" />
                <span className="text-[10px] text-muted-foreground">Límite: 5 videos</span>
              </CardContent>
            </Card>
          </div>

          {/* Dropzone para Artes de Inspiración */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all ${
              dragActive ? "border-cyan-500 bg-cyan-500/5" : "border-slate-300 dark:border-slate-800 bg-muted/20 hover:bg-muted/40"
            }`}
          >
            <Upload className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mb-3 animate-bounce duration-3000" />
            <h3 className="text-sm font-bold mb-1">Arrastra tus artes de redes sociales aquí</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-md">
              Soporta imágenes de publicaciones (PNG, JPG) y videos de Reels o TikTok (MP4).
            </p>

            <div className="flex items-center gap-2">
              <input 
                type="file" 
                id="file-upload-inspiration" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && handleUploadInspirationFile(e.target.files[0])}
                accept="image/*,video/*"
                disabled={uploadingInspiration}
              />
              <Button asChild disabled={uploadingInspiration} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md cursor-pointer">
                <label htmlFor="file-upload-inspiration">
                  {uploadingInspiration ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Subiendo archivo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Seleccionar Arte o Video
                    </>
                  )}
                </label>
              </Button>
            </div>

            {uploadingInspiration && (
              <div className="w-full max-w-xs mt-4 space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Procesando archivo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
          </div>

          {/* Galería de Artes e Inspiración subidos */}
          {assets.filter(a => a.category !== "LOGO").length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Artes e Inspiración Guardados ({assets.filter(a => a.category !== "LOGO").length})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {assets.filter(a => a.category !== "LOGO").map((asset) => {
                  const isVideo = asset.type === "VIDEO";
                  return (
                    <div key={asset.id} className="group relative aspect-square rounded-xl border overflow-hidden bg-muted flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                      <div 
                        className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center bg-zinc-900 cursor-pointer"
                        onClick={() => setPreviewAsset(asset)}
                        title="Clic para previsualizar foto en tamaño completo"
                      >
                        {isVideo ? (
                          <video src={asset.url} className="w-full h-full object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                        )}

                        <div className="absolute top-1.5 left-1.5 pointer-events-none">
                          {isVideo ? (
                            <Badge className="bg-blue-600 text-white text-[8px] font-bold px-1 py-0">VIDEO</Badge>
                          ) : (
                            <Badge className="bg-cyan-600 text-white text-[8px] font-bold px-1 py-0">
                              {asset.category === "LOGO" || asset.category === "MANUAL" ? "LOGOTIPO" : "ARTE"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="bg-card p-2 text-[9.5px] leading-tight border-t flex flex-col gap-1.5">
                        <div className="truncate">
                          <p className="font-bold truncate text-foreground">{asset.filename}</p>
                          <p className="text-[8.5px] text-muted-foreground mt-0.5 font-medium">{formatBytes(asset.size)}</p>
                        </div>

                        {/* Botones Ver y Eliminar Visibles Directamente (Sin requerir hover) */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 flex-1 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 font-extrabold text-[10px] gap-1 transition-all rounded-lg cursor-pointer px-1.5"
                            onClick={() => setPreviewAsset(asset)}
                            title="Ver foto en tamaño completo"
                          >
                            <Eye className="h-3 w-3 shrink-0 text-cyan-600 dark:text-cyan-400" /> Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 flex-1 text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 font-extrabold text-[10px] gap-1 transition-all rounded-lg cursor-pointer px-1.5"
                            onClick={() => handleDelete(asset)}
                            title="Eliminar foto"
                          >
                            <Trash2 className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" /> Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Previsualización (Ver Foto / Arte) */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-3xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold pr-6">
              <span className="truncate flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-cyan-500" />
                {previewAsset?.filename}
              </span>
              <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-xs font-black">
                {previewAsset?.type === "VIDEO" ? "VIDEO" : (previewAsset?.category === "LOGO" || previewAsset?.category === "MANUAL" ? "LOGOTIPO DE MARCA" : "ARTE DE INSPIRACIÓN")}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {previewAsset && (
            <div className="space-y-4 py-2">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh] border border-border shadow-inner">
                {previewAsset.type === "VIDEO" ? (
                  <video src={previewAsset.url} controls autoPlay className="max-h-[68vh] w-full object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewAsset.url} alt={previewAsset.filename} className="max-h-[68vh] w-full object-contain" />
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3 pt-2 border-t">
                <div className="flex items-center gap-4 font-semibold">
                  <span><strong>Tamaño:</strong> {formatBytes(previewAsset.size)}</span>
                  <span><strong>Categoría:</strong> {getCategoryLabel(previewAsset.category)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <a 
                    href={previewAsset.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs transition-all shadow-md shadow-cyan-600/30 hover:scale-102 active:scale-98"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ver en Tamaño Completo ↗
                  </a>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const targetAsset = previewAsset;
                      setPreviewAsset(null);
                      handleDelete(targetAsset);
                    }}
                    className="gap-1.5 font-extrabold text-xs px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 hover:scale-102 active:scale-98 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar foto
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación (shadcn AlertDialog) */}
      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-base">
              <AlertCircle className="h-5 w-5 shrink-0" /> ¿Eliminar este recurso gráfico?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Esta acción eliminará permanentemente el archivo <strong className="text-foreground">{assetToDelete?.filename}</strong> de tu biblioteca de marca. Esta operación no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 gap-2">
            <AlertDialogCancel className="font-extrabold text-xs cursor-pointer border-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (assetToDelete) {
                  const targetId = assetToDelete.id;
                  setAssetToDelete(null);
                  confirmDelete(targetId);
                }
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer border-0 shadow-md shadow-rose-600/30"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Sí, Eliminar permanente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
