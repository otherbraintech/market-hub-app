import { Image as ImageIcon } from "lucide-react";
import { getSelectedBusinessId, getBusinesses } from "@/actions/business";
import { listMediaAssetsAction } from "@/actions/media";
import { MediaLibraryClient } from "./client-page";

export default async function MediaPage() {
  const selectedBusinessId = await getSelectedBusinessId();
  const allBusinesses = await getBusinesses();

  if (!selectedBusinessId || allBusinesses.length === 0) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona o crea un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Accede a los assets y contenido generado por IA seleccionando primero un negocio.
        </p>
      </div>
    );
  }

  const activeBusiness = allBusinesses.find(b => b.id === selectedBusinessId) || allBusinesses[0];

  // Cargar assets en el servidor para evitar flashes de contenido vacío
  const res = await listMediaAssetsAction(activeBusiness.id);
  const initialAssets = res.success && res.assets ? res.assets : [];
  const initialCounts = {
    videoCount: res.success ? (res.videoCount ?? 0) : 0,
    imageCount: res.success ? (res.imageCount ?? 0) : 0,
    total: res.success ? (res.total ?? 0) : 0
  };

  const initialLogo = res.success && res.logo ? res.logo : (activeBusiness.logo || null);
  const initialBrandColors = res.success && res.brandColors ? res.brandColors : [];

  return (
    <div className="p-8 space-y-8">
      <MediaLibraryClient 
        businessId={activeBusiness.id} 
        activeBusiness={{
          id: activeBusiness.id,
          name: activeBusiness.name,
          logo: activeBusiness.logo
        }}
        allBusinesses={allBusinesses.map(b => ({
          id: b.id,
          name: b.name,
          logo: b.logo
        }))}
        initialAssets={initialAssets} 
        initialCounts={initialCounts} 
        initialLogo={initialLogo}
        initialBrandColors={initialBrandColors}
      />
    </div>
  );
}
