"use client";

import React from "react";
import { 
  Bot, Search, ImageIcon, Target, Megaphone, Calendar, 
  Sparkles, CheckCircle2, ShieldCheck, Zap, Cpu, Layers, ArrowLeft
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AGENT_STAGES = [
  {
    stepNumber: 1,
    title: "1. Banco de Datos & Auditoría Digital",
    description: "Extracción profunda de datos, diagnóstico FODA y radar de tendencias de nicho.",
    leader: "Auditor Principal IA",
    icon: Search,
    color: "#00C9C8",
    agents: [
      {
        name: "Agente Extractor",
        icon: "🕸️",
        role: "Scraping & Ingesta de Datos",
        description: "Extrae métricas, publicaciones y perfilamiento desde Facebook, Instagram, TikTok y el sitio web oficial del negocio."
      },
      {
        name: "Agente Analista FODA",
        icon: "📊",
        role: "Diagnóstico Competitivo",
        description: "Evalúa fortalezas, debilidades, brechas de mercado y posicionamiento frente a competidores directos."
      },
      {
        name: "Agente Radar de Tendencias",
        icon: "🔥",
        role: "Inteligencia de Mercado",
        description: "Monitorea audios virales, hashtags en tendencia y patrones de contenido populares en la industria."
      },
      {
        name: "Agente Redactor",
        icon: "📝",
        role: "Compilación de Diagnóstico",
        description: "Sintetiza los datos recopilados en un informe ejecutivo integral listo para la toma de decisiones."
      }
    ]
  },
  {
    stepNumber: 2,
    title: "2. Activos Visuales e Inspiración",
    description: "Análisis estético de marca, paleta de colores y compilación de galerías gráficas.",
    leader: "Director de Arte IA",
    icon: ImageIcon,
    color: "#3B82F6",
    agents: [
      {
        name: "Agente Paleta & Estética",
        icon: "🎨",
        role: "Dirección de Branding",
        description: "Extrae códigos de color, contraste cromático y guías de estilo para asegurar coherencia visual en todos los artes."
      },
      {
        name: "Agente Moodboard",
        icon: "🖼️",
        role: "Curaduría Visual",
        description: "Organiza activos propios de la marca y referencias de inspiración para nutrir los generadores gráficos."
      }
    ]
  },
  {
    stepNumber: 3,
    title: "3. Estrategia Growth de Marketing",
    description: "Construcción de Buyer Personas, embudos de conversión y los 8 pilares estratégicos.",
    leader: "Chief Growth Officer IA",
    icon: Target,
    color: "#8B5CF6",
    agents: [
      {
        name: "Agente Buyer Persona",
        icon: "👤",
        role: "Arquetipos de Audiencia",
        description: "Define los perfiles psicográficos del cliente ideal, sus motivadores clave y los frenos de compra a neutralizar."
      },
      {
        name: "Agente Funnel & Conversión",
        icon: "🎯",
        role: "Arquitectura de Embudos",
        description: "Diseña la secuencia del recorrido del usuario desde el descubrimiento (ToFu) hasta la fidelización (BoFu)."
      },
      {
        name: "Agente Posicionamiento",
        icon: "📢",
        role: "Voz & Tono de Marca",
        description: "Establece los pilares de comunicación, valores diferenciadores y el tono de voz en las interacciones."
      },
      {
        name: "Agente 8 Pilares Growth",
        icon: "🚀",
        role: "Plan Operativo de Crecimiento",
        description: "Estructura la hoja de ruta estratégica basada en los 8 pilares fundamentales de aceleración de negocios."
      }
    ]
  },
  {
    stepNumber: 4,
    title: "4. Campaña Principal de Marketing",
    description: "Diseño de objetivos comerciales, presupuestos publicitarios y calendarios festivos.",
    leader: "Director de Campañas IA",
    icon: Megaphone,
    color: "#F59E0B",
    agents: [
      {
        name: "Agente Media Planner",
        icon: "💰",
        role: "Presupuestos & Mix de Canales",
        description: "Calcula la distribución óptima del presupuesto publicitario entre Meta Ads, TikTok Ads y canales orgánicos."
      },
      {
        name: "Agente Feriados & Eventos",
        icon: "🇧🇴",
        role: "Fechas Clave de Bolivia",
        description: "Planifica promociones temáticas en feriados patrios y festividades clave (6 de Agosto, 27 de Mayo, etc.)."
      }
    ]
  },
  {
    stepNumber: 5,
    title: "5. Calendario & Plan de Publicaciones",
    description: "Generación autónoma de contenido semanal, copies persuasivos y adaptación a 3 redes sociales.",
    leader: "Editor en Jefe IA",
    icon: Calendar,
    color: "#10B981",
    agents: [
      {
        name: "Agente Copywriter",
        icon: "✍️",
        role: "Persuasión & Hooks",
        description: "Redacta textos cautivadores, ganchos de alta retención, hashtags del sector y llamadas a la acción (CTAs)."
      },
      {
        name: "Agente Adaptador 3 Redes",
        icon: "📱",
        role: "Optimización Multicanal",
        description: "Formatea las piezas para los formatos específicos de Facebook, Instagram (Reels/Carruseles) y TikTok."
      },
      {
        name: "Agente Horarios & Tráfico",
        icon: "⏰",
        role: "Frecuencia & Picos de Alcance",
        description: "Asigna los días y horas ideales de publicación cruzando el tráfico objetivo con los horarios de atención."
      },
      {
        name: "Agente Prompter Visual",
        icon: "🎨",
        role: "Guiones & Prompts de Arte",
        description: "Genera guiones de video y prompts detallados para la creación automática o manual de artes gráficos."
      }
    ]
  }
];

export default function AgentesPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#080E1A] text-foreground p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/business">
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs border-slate-300 dark:border-cyan-500/20 text-slate-700 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-cyan-500/10">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver a Negocios
              </Button>
            </Link>
            <Badge className="bg-slate-100 dark:bg-cyan-500/10 text-slate-700 dark:text-cyan-400 border-slate-200 dark:border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest gap-1">
              <Sparkles className="h-3 w-3" /> Ecosistema Agéntico
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground dark:text-white flex items-center gap-3">
            <Bot className="h-8 w-8 text-slate-700 dark:text-cyan-400 shrink-0" />
            Equipo de Agentes IA Especializados
          </h1>
          <p className="text-sm text-muted-foreground dark:text-slate-400 max-w-3xl mt-1 leading-relaxed">
            OB-MarketHub opera mediante una arquitectura de **15 Agentes Inteligentes** organizados en 5 etapas secuenciales. 
            Cada equipo colabora de forma autónoma para transformar datos brutos en estrategias y publicaciones listas para ejecutar.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-card dark:bg-[#0D1526] border border-border dark:border-cyan-500/20 flex items-center gap-3 shadow-lg">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-cyan-500/10 border border-slate-300 dark:border-cyan-500/30 flex items-center justify-center text-slate-800 dark:text-cyan-400 font-black text-lg">
              15
            </div>
            <div>
              <div className="text-xs font-bold text-foreground dark:text-slate-200">Agentes Activos</div>
              <div className="text-[10px] text-muted-foreground dark:text-cyan-400 font-medium">5 Etapas del Pipeline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Pipeline Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {AGENT_STAGES.map((s) => {
          const Icon = s.icon;
          return (
            <div 
              key={s.stepNumber}
              className="p-3.5 rounded-xl bg-card dark:bg-[#0D1526] border border-border dark:border-slate-800 flex flex-col justify-between transition-all hover:border-indigo-500/30 dark:hover:border-cyan-500/30 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-cyan-400">Etapa {s.stepNumber}</span>
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-cyan-500/10 border border-slate-200 dark:border-cyan-500/20">
                  <Icon className="h-3.5 w-3.5 text-slate-600 dark:text-cyan-400" />
                </div>
              </div>
              <div className="text-sm font-extrabold text-foreground dark:text-slate-100 truncate">{s.leader}</div>
              <div className="text-[10px] text-muted-foreground dark:text-slate-400 font-medium mt-0.5">{s.agents.length} Agentes Especializados</div>
            </div>
          );
        })}
      </div>

      {/* Main Breakdown: 5 Stages */}
      <div className="space-y-6">
        {AGENT_STAGES.map((stage) => {
          const Icon = stage.icon;
          return (
            <Card 
              key={stage.stepNumber} 
              className="bg-card dark:bg-[#0D1526] border border-border dark:border-cyan-500/15 overflow-hidden shadow-lg transition-all hover:border-indigo-500/30 dark:hover:border-cyan-500/30"
            >
              {/* Card Header Banner */}
              <div className="p-4 sm:p-5 border-b border-border dark:border-slate-800/80 bg-muted/20 dark:bg-[#09101E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 border"
                    style={{ backgroundColor: `${stage.color}15`, borderColor: `${stage.color}40`, color: stage.color }}
                  >
                    {stage.stepNumber}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground dark:text-slate-100 flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: stage.color }} />
                      {stage.title}
                    </h2>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 mt-0.5">{stage.description}</p>
                  </div>
                </div>

                <Badge className="self-start sm:self-auto bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-cyan-400 border-slate-200 dark:border-cyan-500/20 text-xs px-3 py-1 font-bold gap-1.5 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" /> Líder: {stage.leader}
                </Badge>
              </div>

              {/* Sub-agents Grid */}
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stage.agents.map((ag, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-muted/30 dark:bg-[#080E1A] border border-border dark:border-slate-800/60 flex flex-col justify-between transition-all hover:border-indigo-500/40 dark:hover:border-cyan-500/40 group hover:shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xl p-2 rounded-xl bg-card dark:bg-[#0D1526] border border-border dark:border-slate-800 group-hover:scale-110 transition-transform">
                            {ag.icon}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-cyan-400 border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-cyan-500/5">
                            {ag.role}
                          </Badge>
                        </div>

                        <h3 className="text-sm font-bold text-foreground dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                          {ag.name}
                        </h3>

                        <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
                          {ag.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-border dark:border-slate-800/40 flex items-center justify-between text-[10px] text-muted-foreground dark:text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" /> Sincronizado
                        </span>
                        <span className="text-muted-foreground dark:text-slate-400">Etapa {stage.stepNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
