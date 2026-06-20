"use client";

import { useState } from "react";
import { CreateBusinessDialog } from "./create-business-dialog";
import { Sparkles, ArrowDown, X, HelpCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyBusinessState() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const showOverlay = isOverlayOpen && !isDialogOpen;

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed rounded-3xl bg-card/40 border-primary/20 text-center p-8 relative overflow-hidden shadow-inner">
      {/* Elementos de fondo decorativos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="p-5 rounded-2xl bg-primary/10 mb-6 shadow-sm border border-primary/20">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>

      <h3 className="text-2xl font-black tracking-tight text-foreground uppercase italic mb-2">
        ¡Bienvenido a MarketHub!
      </h3>
      <p className="text-muted-foreground mb-8 max-w-md text-sm font-medium">
        Para comenzar a diseñar campañas, optimizar tus publicaciones y analizar la competencia, primero necesitamos crear el perfil de tu marca o empresa.
      </p>

      <Button onClick={() => setIsOverlayOpen(true)} variant="outline" className="rounded-xl font-bold h-11 px-6 gap-2">
        <HelpCircle className="h-4 w-4 text-primary" /> Ver Asistente de Inicio
      </Button>

      {/* Capa oscura de tutorial (Backdrop Spotlight) */}
      {isOverlayOpen && (
        <div className={`fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isDialogOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <div className="bg-card w-full max-w-lg rounded-[32px] border border-primary/25 shadow-2xl p-8 relative flex flex-col items-center text-center shadow-primary/5">
            {/* Botón de cerrar */}
            <button 
              onClick={() => setIsOverlayOpen(false)}
              className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              aria-label="Cerrar tutorial"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icono animado */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="h-16 w-16 bg-primary/10 border-2 border-primary/30 rounded-2xl flex items-center justify-center relative">
                <Target className="h-8 w-8 text-primary animate-bounce-slow" />
              </div>
            </div>

            {/* Contenido de texto */}
            <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Paso obligatorio</span>
            <h4 className="text-2xl font-black text-foreground tracking-tight mb-3">
              Crea tu primer negocio
            </h4>
            <p className="text-sm text-muted-foreground font-medium max-w-sm mb-8 leading-relaxed">
              Diseñemos tu estrategia de marca, segmentación de buyer personas y funnels en solo segundos utilizando Inteligencia Artificial.
            </p>

            {/* Flecha animada apuntando al botón */}
            <div className="flex flex-col items-center gap-1.5 mb-4 animate-bounce">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Presiona aquí</span>
              <ArrowDown className="h-4 w-4 text-primary" />
            </div>

            {/* Botón de creación con el modal del formulario */}
            <div className="w-full sm:w-auto scale-110">
              <CreateBusinessDialog isTutorialActive={true} onOpenChange={setIsDialogOpen} />
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS Inline para la animación lenta */}
      <style jsx global>{`
        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
