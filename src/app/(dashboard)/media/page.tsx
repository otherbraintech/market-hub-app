import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Upload, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getSelectedBusinessId } from "@/actions/business";

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
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Media</h1>
          <p className="text-muted-foreground">Gestiona tus imágenes, videos y assets generados por IA.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros</Button>
          <Button className="gradient-primary"><Upload className="mr-2 h-4 w-4" /> Subir Archivo</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o etiqueta..." className="pl-10 h-12" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="aspect-square overflow-hidden group cursor-pointer relative">
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button size="sm" variant="secondary" className="h-8 text-xs font-bold">Ver / Usar</Button>
            </div>
            <div className="w-full h-full bg-muted flex items-center justify-center">
               <ImageIcon className="h-8 w-8 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center pt-8">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Los assets generados por IA aparecerán aquí automáticamente.
        </p>
      </div>
    </div>
  );
}
