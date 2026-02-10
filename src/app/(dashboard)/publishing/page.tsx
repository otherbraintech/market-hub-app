import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Share2, Send, CheckCircle2, Clock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { getSelectedBusinessId } from "@/actions/business";

export default async function PublishingPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <Share2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Gestiona la publicación y estado de conexiones de tus redes sociales seleccionando un negocio.
        </p>
      </div>
    );
  }
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publicación Automática</h1>
          <p className="text-muted-foreground">Estado de tus publicaciones en redes sociales.</p>
        </div>
        <Button className="gradient-primary"><Send className="mr-2 h-4 w-4" /> Nueva Publicación</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cola de Publicación</CardTitle>
            <CardDescription>Publicaciones pendientes de salir hoy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors">
               <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                 <Smartphone className="h-6 w-6 text-indigo-600" />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-bold">Lanzamiento Ofertas Especiales</p>
                 <p className="text-xs text-muted-foreground">Instagram · Programado hoy a las 18:00</p>
               </div>
               <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">En Cola</Badge>
             </div>
             
             <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p className="text-sm italic">No hay más publicaciones pendientes para hoy.</p>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Canales Vinculados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Instagram", "Facebook", "TikTok"].map(ch => (
              <div key={ch} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">{ch}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">Conectado</Badge>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-xs" size="sm">Vincular más canales</Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Completado recientemente
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="hover:border-primary/30 transition-all">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground mb-1">Hoy, 10:30 AM · Facebook</p>
                <p className="text-sm font-bold line-clamp-1">Post: Resumen Semanal de Marketing</p>
                <div className="flex items-center gap-2 mt-4">
                   <Badge variant="success" className="h-4 text-[9px]">Enviado</Badge>
                   <span className="text-xs text-muted-foreground">14.2k alcance estimado</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
