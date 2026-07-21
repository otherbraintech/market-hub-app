"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Globe, Loader2, Facebook, Instagram, ChevronRight, FileText,
  Users, ThumbsUp, MessageSquare, Activity, Flame, MapPin, Award, ShieldCheck,
  Megaphone, Zap, Eye, Compass, Briefcase, TrendingUp, Heart, Target,
  AlertCircle, Star, Linkedin, Youtube, Search, ArrowLeft, Smile, RefreshCw,
  CheckCircle2, Lightbulb, Download
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScrapingReportDialog } from "@/components/business/scraping-report-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ... existing helper functions would go here (TikTokIcon, parseSocialMetric, etc)

export function BusinessAnalysisClient({ businessId, business, initialAnalyses }: any) {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Banco de Datos: {business.name}</h2>
            <p className="text-muted-foreground text-sm">
              Vista maestra de información, auditoría y análisis competitivo.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${businessId}`}>
            <Button variant="outline" className="gap-2 cursor-pointer transition-all active:scale-[0.98] hover:bg-slate-50">
              <Briefcase className="h-4 w-4" />
              Ver Configuración
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 1. Información del Negocio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-500" />
              1. Información del Negocio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Datos de Registro, Ubicación, Industria, Contacto, Sitio Web Principal, Enfoque y Propuesta de Valor, Identidad de Marca (Tono de voz, Personalidad), Canales Vinculados.</p>
          </CardContent>
        </Card>

        {/* 2. Mapeo de Competencia y Estado Digital */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              2. Mapeo de Competencia y Estado Digital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Identidad de Marca, Tono de voz, Personalidad, Plataformas Activas, Evaluación de Desempeño (Análisis de brechas).</p>
          </CardContent>
        </Card>

        {/* 3. Progreso de Auditoría (Scraping) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              3. Progreso de Auditoría (Scraping)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Estado de Extracción de Datos: Propio y Competidores.</p>
          </CardContent>
        </Card>

        {/* 4. Informe General de Diagnóstico (FODA) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Compass className="h-5 w-5 text-rose-500" />
              4. Informe General de Diagnóstico (FODA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Resumen Ejecutivo, Matriz FODA (Fortalezas, Debilidades, Oportunidades, Amenazas), Posición en el Mercado.</p>
          </CardContent>
        </Card>

        {/* 5. Definición de Público Objetivo (Buyer Personas) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              5. Definición de Público Objetivo (Buyer Personas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Perfiles de Buyer Personas, Puntos de Dolor y Necesidades, Guía de Comunicación.</p>
          </CardContent>
        </Card>

        {/* 6. Matriz comparativa de Métricas (Channels) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-500" />
              6. Matriz comparativa de Métricas (Channels)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Comparación Directa (Mi Negocio vs. Competidores), Benchmarks, Hallazgos Clave de Contenido (Submódulo I, J, K).</p>
          </CardContent>
        </Card>

        {/* 7. Identidad de Marca (People-Led Marketing) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              7. Identidad de Marca (People-Led Marketing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Evaluación de Autenticidad, Calidez vs Frialdad Corporativa, Fomento de Comunidad vs Comunicación Unidireccional.</p>
          </CardContent>
        </Card>

        {/* 8. Análisis del Público y Oportunidad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              8. Análisis del Público y Oportunidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Cálculo de Oportunidad Masiva (Submódulo H - Datos sociodemográficos y vacíos de la competencia).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
