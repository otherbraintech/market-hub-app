"use client";

import React, { useState, useEffect } from "react";
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
  FileImage
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { listMediaAssetsAction, createMediaAssetAction, deleteMediaAssetAction, purgeOldInspirationAssetsAction } from "@/actions/media";
import { toast } from "sonner";

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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

interface MediaLibraryClientProps {
  businessId: string;
  initialAssets: MediaAsset[];
  initialCounts: {
    videoCount: number;
    imageCount: number;
    total: number;
  };
}

export function MediaLibraryClient({ businessId, initialAssets, initialCounts }: MediaLibraryClientProps) {
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
  const [counts, setCounts] = useState(initialCounts);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"nicho" | "web" | "manual">("manual");
  const [selectedFormatCategory, setSelectedFormatCategory] = useState<"ART" | "CAROUSEL" | "REEL" | "VIDEO">("ART");

  const fetchAssets = async () => {
    const res = await listMediaAssetsAction(businessId);
    if (res.success && res.assets) {
      setAssets(res.assets);
      setCounts({
        videoCount: res.videoCount ?? 0,
        imageCount: res.imageCount ?? 0,
        total: res.total ?? 0
      });
    }
  };

  const handlePurge = async () => {
    try {
      const res = await purgeOldInspirationAssetsAction(businessId);
      if (res.success) {
        toast.success(res.message);
        await fetchAssets();
      } else {
        toast.error(res.error || "No se pudo depurar el almacenamiento");
      }
    } catch (e) {
      toast.error("Error al ejecutar depuración de storage");
    }
  };

  const handleUploadFile = async (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      toast.error("Solo puedes subir imágenes o videos.");
      return;
    }

    const type = isVideo ? "VIDEO" : "IMAGE";

    // Client-side limit check
    if (type === "VIDEO" && counts.videoCount >= 5) {
      toast.error("Límite alcanzado: Máximo 5 videos en el plan básico.");
      return;
    }
    if (type === "IMAGE" && counts.imageCount >= 50) {
      toast.error("Límite alcanzado: Máximo 50 imágenes en el plan básico.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Simular progreso de subida a Obefile
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 20;
        });
      }, 100);

      // Creamos una URL simulada en base a objectURL o un servicio mockup público
      const mockUrl = URL.createObjectURL(file);
      
      const res = await createMediaAssetAction({
        businessId,
        type,
        filename: file.name,
        url: mockUrl,
        mimeType: file.type,
        size: file.size
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (res.success) {
        toast.success("Archivo subido con éxito a Obefile.");
        await fetchAssets();
      } else {
        toast.error(res.error || "No se pudo subir el archivo.");
      }
    } catch (err) {
      toast.error("Error al procesar la subida.");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("¿Estás seguro de que deseas eliminar este archivo?");
    if (!confirm) return;

    try {
      const res = await deleteMediaAssetAction(id, businessId);
      if (res.success) {
        toast.success("Asset eliminado correctamente.");
        await fetchAssets();
      } else {
        toast.error(res.error || "Error al eliminar.");
      }
    } catch (err) {
      toast.error("Error de base de datos.");
    }
  };

  // Helper para generar archivos simulados rápidamente y validar límites
  const handleAddMockAsset = async (type: "IMAGE" | "VIDEO") => {
    const count = type === "VIDEO" ? counts.videoCount : counts.imageCount;
    const limit = type === "VIDEO" ? 5 : 50;

    if (count >= limit) {
      toast.error(`Límite alcanzado para ${type === "VIDEO" ? "videos" : "imágenes"}.`);
      return;
    }

    setUploading(true);
    try {
      const extension = type === "VIDEO" ? "mp4" : "jpg";
      const mime = type === "VIDEO" ? "video/mp4" : "image/jpeg";
      const size = type === "VIDEO" ? 15000000 : 850000;
      const index = count + 1;
      const name = `${type.toLowerCase()}-muestra-${index}.${extension}`;
      
      const mockUrls = type === "VIDEO" 
        ? [
            "https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-into-a-grinder-40545-large.mp4",
            "https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-40546-large.mp4"
          ]
        : [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
            "https://images.unsplash.com/photo-1472214222541-d510753a4707",
            "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d"
          ];

      const url = mockUrls[index % mockUrls.length];

      const res = await createMediaAssetAction({
        businessId,
        type,
        filename: name,
        url,
        mimeType: mime,
        size
      });

      if (res.success) {
        toast.success(`Muestra de ${type === "VIDEO" ? "video" : "imagen"} añadida.`);
        await fetchAssets();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Error al generar muestra.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Indicadores de límites del plan */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border bg-muted/10 relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{counts.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Archivos catalogados en Obefile</p>
          </CardContent>
        </Card>

        <Card className="border bg-muted/10 relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Imágenes ({counts.imageCount}/50)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-black">{counts.imageCount}</div>
            <Progress value={(counts.imageCount / 50) * 100} className="h-1.5 bg-emerald-100 dark:bg-emerald-950" />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
              <span>Límite: 50 imágenes</span>
              <button 
                onClick={() => handleAddMockAsset("IMAGE")}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
              >
                + Añadir Demo
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-muted/10 relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Videos ({counts.videoCount}/5)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-black">{counts.videoCount}</div>
            <Progress value={(counts.videoCount / 5) * 100} className="h-1.5 bg-blue-100 dark:bg-blue-950" />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
              <span>Límite: 5 videos</span>
              <button 
                onClick={() => handleAddMockAsset("VIDEO")}
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
              >
                + Añadir Demo
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cargador Dropzone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${
          dragActive ? "border-primary bg-primary/5" : "border-muted bg-card hover:bg-muted/5"
        }`}
      >
        <Upload className="h-8 w-8 text-muted-foreground mb-4 animate-bounce duration-3000" />
        <h3 className="text-sm font-bold mb-1">Arrastra tus archivos aquí</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">
          Soporta imágenes (PNG, JPG) y videos (MP4). Los archivos se encriptan de forma privada en Obefile.
        </p>

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*,video/*"
          />
          <Button asChild size="sm" className="gradient-primary text-xs font-bold shadow-md cursor-pointer">
            <label htmlFor="file-upload">
              Seleccionar Archivo
            </label>
          </Button>
        </div>

        {uploading && (
          <div className="w-full max-w-xs mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span>Subiendo a Obefile...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}
      </div>

      {/* Grid de Contenidos */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Assets Catalogados</h3>
        {assets.length === 0 ? (
          <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <ImageIcon className="h-8 w-8 opacity-20" />
            <span className="text-xs font-bold">Tu catálogo privado está vacío</span>
            <span className="text-[10px] opacity-80">Sube imágenes de tus productos o videos cortos para alimentar la IA.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {assets.map((asset) => {
              const isVideo = asset.type === "VIDEO";
              return (
                <div key={asset.id} className="group relative aspect-square rounded-xl border overflow-hidden bg-muted flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                  {/* Vista previa */}
                  <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center bg-zinc-900">
                    {isVideo ? (
                      <video src={asset.url} className="w-full h-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                    )}

                    {/* Icono de tipo */}
                    <div className="absolute top-2 left-2 bg-black/60 p-1.5 rounded-lg text-white">
                      {isVideo ? <FileVideo className="h-3 w-3" /> : <FileImage className="h-3 w-3" />}
                    </div>

                    {/* Overlay de acciones */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8 rounded-lg"
                        onClick={() => handleDelete(asset.id)}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Nombre y Peso */}
                  <div className="bg-background p-2 text-[10px] leading-tight border-t">
                    <p className="font-bold truncate text-foreground/90">{asset.filename}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{formatBytes(asset.size)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
