import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getSelectedBusinessId } from "@/actions/business";

export default async function CalendarPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          El calendario muestra la programación específica de cada negocio. Selecciona uno para continuar.
        </p>
      </div>
    );
  }
  return (
    <div className="p-8 space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario Editorial</h1>
          <p className="text-muted-foreground">Vista global de todas tus publicaciones programadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          <div className="font-semibold px-4">Febrero 2026</div>
          <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          <Button className="gradient-primary ml-4">Nueva Publicación</Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-card border rounded-xl card-shadow">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => (
            <div key={day} className="p-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">{day}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="border-r border-b p-2 min-h-[120px] hover:bg-muted/10 transition-colors flex flex-col gap-1">
              <span className="text-xs font-medium opacity-50">{i + 1}</span>
              {i === 12 && (
                <div className="bg-blue-100 text-blue-700 p-1 rounded text-[10px] font-medium border border-blue-200 line-clamp-1">
                  Post Instagram (IA)
                </div>
              )}
              {i === 15 && (
                <div className="bg-purple-100 text-purple-700 p-1 rounded text-[10px] font-medium border border-purple-200 line-clamp-1">
                  Blog Post
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
