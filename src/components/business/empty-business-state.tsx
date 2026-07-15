"use client";

import { BusinessForm } from "./business-form";
import { Target } from "lucide-react";

export function EmptyBusinessState() {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Tarjeta de bienvenida premium */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent border border-primary/20 p-8 shadow-inner animate-in fade-in duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <div className="h-14 w-14 bg-primary/15 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20 animate-bounce-slow">
            <Target className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary px-3 py-1 rounded-full inline-block">
              Paso Obligatorio
            </span>
            <h3 className="text-2xl font-black text-foreground tracking-tight italic uppercase">
              Crea tu primer negocio
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
              Diseñemos tu estrategia de marca, segmentación de buyer personas y funnels en solo segundos utilizando Inteligencia Artificial.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card/60 backdrop-blur-md rounded-3xl border p-6 md:p-8 card-shadow">
        <BusinessForm isTutorialActive={true} />
      </div>

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
