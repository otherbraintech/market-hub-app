import { Image as ImageIcon } from "lucide-react";
import { getSelectedBusinessId } from "@/actions/business";
import { listMediaAssetsAction } from "@/actions/media";
import { MediaLibraryClient } from "./client-page";

export default async function MediaPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Accede a los assets y contenido generado por IA seleccionando primero un negocio.
        </p>
      </div>
    );
  }

  // Cargar assets en el servidor para evitar flashes de contenido vacío
  const res = await listMediaAssetsAction(selectedBusinessId);
  const initialAssets = res.success && res.assets ? res.assets : [];
  const initialCounts = {
    videoCount: res.success ? (res.videoCount ?? 0) : 0,
    imageCount: res.success ? (res.imageCount ?? 0) : 0,
    total: res.success ? (res.total ?? 0) : 0
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Catálogo Multimedia Privado</h1>
        <p className="text-muted-foreground text-sm">Gestiona tus recursos, imágenes de productos y videos de catálogo encriptados de forma privada con Obefile.</p>
      </div>

      <MediaLibraryClient 
        businessId={selectedBusinessId} 
        initialAssets={initialAssets} 
        initialCounts={initialCounts} 
      />
    </div>
  );
}
