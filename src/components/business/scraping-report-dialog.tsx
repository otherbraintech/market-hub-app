"use client";

import React from 'react';
import { 
  CheckCircle2, XCircle, Lightbulb, Target, 
  Smile, Compass, BarChart3, Search, 
  TrendingUp, Users, Brain, Sparkles 
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReportData {
  strengths: string[];
  weaknesses: string[];
  seo_signals: string[];
  opportunities: string[];
  emotional_tone: string[];
  target_audience: string[];
  ux_observations: string[];
  confidence_score: number;
  brand_personality: string[];
  marketing_tactics: string[];
  market_positioning: string;
  strategic_recommendations: string[];
}

export function ScrapingReportDialog({ data }: { data: ReportData }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm transition-all hover:shadow-md">
          <BarChart3 className="h-4 w-4 text-violet-500" />
          Ver Informe de Scraping
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50/95 backdrop-blur-md border-slate-200/60 shadow-2xl">
        <DialogHeader className="border-b border-slate-200/60 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-violet-500" />
                Análisis de Inteligencia de Marca
              </DialogTitle>
              <p className="text-slate-500 text-sm mt-1">Informe generado por IA a partir del scraping del sitio web.</p>
            </div>
            
            {/* Score de Confianza */}
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Confianza</span>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-24 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" 
                    style={{ width: `${data.confidence_score * 100}%` }}
                  />
                </div>
                <span className="font-bold text-slate-700">{Math.round(data.confidence_score * 100)}%</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* 1. POSICIONAMIENTO Y PERSONALIDAD */}
          <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Compass className="h-4 w-4 text-violet-500" />
                Posicionamiento en el Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-700 leading-relaxed">
                "{data.market_positioning}"
              </p>
              
              <div className="mt-4 flex flex-wrap gap-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Personalidad de Marca</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.brand_personality.map((item, i) => (
                      <Badge key={i} variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-100 border-none px-2.5 py-0.5 text-xs font-medium">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Tono Emocional</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.emotional_tone.map((item, i) => (
                      <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-2.5 py-0.5 text-xs font-medium">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. FORTALEZAS Y DEBILIDADES */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2 bg-emerald-50/50 rounded-t-lg">
              <CardTitle className="text-sm font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Fortalezas Identificadas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {data.strengths.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-emerald-500 font-bold">•</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2 bg-rose-50/50 rounded-t-lg">
              <CardTitle className="text-sm font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Debilidades / Áreas de Mejora
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {data.weaknesses.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-rose-500 font-bold">•</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 3. AUDIENCIA Y UX */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Audiencia Objetivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.target_audience.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-blue-500 font-bold">•</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Brain className="h-4 w-4 text-amber-500" />
                Observaciones de UX
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.ux_observations.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-amber-500 font-bold">•</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 4. SEO Y MARKETING */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-500" />
                Señales SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {data.seo_signals.map((item, i) => (
                  <Badge key={i} variant="outline" className="border-slate-200 text-slate-600 px-2.5 py-0.5 text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-500" />
                Tácticas de Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {data.marketing_tactics.map((item, i) => (
                  <Badge key={i} variant="outline" className="border-cyan-100 bg-cyan-50/50 text-cyan-700 px-2.5 py-0.5 text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 5. RECOMENDACIONES ESTRATÉGICAS */}
          <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-gradient-to-br from-violet-50 via-white to-white border-l-4 border-l-violet-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-violet-700 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recomendaciones Estratégicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {data.strategic_recommendations.map((item, i) => (
                  <div key={i} className="text-sm text-slate-600 flex gap-3 items-start bg-white/60 p-2.5 rounded-lg border border-violet-100/50 shadow-sm">
                    <span className="bg-violet-100 text-violet-700 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
