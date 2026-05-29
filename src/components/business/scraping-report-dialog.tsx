"use client";

import React from 'react';
import { 
  CheckCircle2, XCircle, Lightbulb, Target, 
  Smile, Compass, BarChart3, Search, 
  TrendingUp, Users, Brain, Sparkles, Instagram, AlertCircle,
  Facebook
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

// TikTok Icon SVG
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

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

function normalizeReportData(data: any): ReportData {
  if (!data) {
    return {
      strengths: [],
      weaknesses: [],
      seo_signals: [],
      opportunities: [],
      emotional_tone: [],
      target_audience: [],
      ux_observations: [],
      confidence_score: 0,
      brand_personality: [],
      marketing_tactics: [],
      market_positioning: "Sin posicionamiento especificado",
      strategic_recommendations: []
    };
  }

  // Handle new array structure with output field
  let processedData = data;
  if (Array.isArray(data) && data.length > 0 && data[0].output) {
    processedData = data[0].output;
  }

  // Verificar si es estructura de Instagram
  const isInstagramStructure = !!processedData.instagram_presence || !!processedData.engagement_analysis || !!processedData.content_analysis;
  
  if (isInstagramStructure) {
    const instaPresence = processedData.instagram_presence || {};
    const branding = processedData.branding_analysis || {};
    const content = processedData.content_analysis || {};
    const engagement = processedData.engagement_analysis || {};
    const compObs = processedData.competitive_observations || {};
    const bizSignals = processedData.business_signals || {};
    const dQuality = processedData.data_quality || {};

    return {
      strengths: Array.isArray(compObs.main_strengths) ? compObs.main_strengths : [],
      weaknesses: Array.isArray(compObs.main_weaknesses) ? compObs.main_weaknesses : [],
      seo_signals: Array.isArray(instaPresence.local_presence_signals) ? instaPresence.local_presence_signals : [],
      opportunities: Array.isArray(compObs.differentiators) ? compObs.differentiators : [],
      emotional_tone: Array.isArray(branding.emotional_tone) ? branding.emotional_tone : [],
      target_audience: Array.isArray(content.audience_interaction_signals) ? content.audience_interaction_signals : [],
      ux_observations: Array.isArray(instaPresence.profile_maturity_indicators) ? instaPresence.profile_maturity_indicators : [],
      confidence_score: typeof dQuality.confidence_score === "number" ? dQuality.confidence_score : 0.5,
      brand_personality: Array.isArray(branding.brand_personality) ? branding.brand_personality : [],
      marketing_tactics: Array.isArray(bizSignals.commercial_signals) ? bizSignals.commercial_signals : [],
      market_positioning: branding.brand_positioning_indicators?.[0] || instaPresence.brand_summary || "Instagram activo con presencia digital",
      strategic_recommendations: Array.isArray(compObs.main_strengths) ? compObs.main_strengths.slice(0, 5) : []
    };
  }

  // Verificar si es la estructura de Facebook
  const isFacebookStructure = !!processedData.social_intelligence || !!processedData.brand_positioning || !!processedData.strategic_diagnostics;
  
  if (isFacebookStructure) {
    const socialIntel = processedData.social_intelligence || {};
    const brandPos = processedData.brand_positioning || {};
    const channels = processedData.conversion_channels || {};
    const diagnostics = processedData.strategic_diagnostics || {};
    const recs = processedData.actionable_recommendations || [];

    return {
      strengths: Array.isArray(diagnostics.strengths) ? diagnostics.strengths : [],
      weaknesses: Array.isArray(diagnostics.weaknesses) ? diagnostics.weaknesses : [],
      seo_signals: [
        `Seguidores: ${socialIntel.audience_size || 'N/D'}`,
        `Anuncios Activos: ${socialIntel.active_marketing_ads ? 'Sí' : 'No'}`,
        `Antigüedad: ${socialIntel.seniority_years || 'N/D'} años`
      ],
      opportunities: [],
      emotional_tone: [],
      target_audience: [],
      ux_observations: [
        `Fricción de Conversión: ${channels.conversion_friction || 'N/D'}`,
        `Canal Principal: ${channels.main_channel || 'N/D'}`
      ],
      confidence_score: 0.9,
      brand_personality: [],
      marketing_tactics: [
        `Nicho: ${brandPos.niche || 'N/D'}`
      ],
      market_positioning: brandPos.value_proposition || socialIntel.page_name || "Perfil de Facebook",
      strategic_recommendations: Array.isArray(recs) ? recs : []
    };
  }

  // Verificar si es la estructura nueva
  const isNewestStructure = !!processedData.brand_identity || !!processedData.business_insights || !!processedData.website_analysis;
  
  if (isNewestStructure) {
    const bIdentity = processedData.brand_identity || {};
    const wAnalysis = processedData.website_analysis || {};
    const mSignals = processedData.marketing_signals || {};
    const bInsights = processedData.business_insights || {};
    const dQuality = processedData.data_quality || {};
    
    // Obtener debilidades y vacíos de información para generar recomendaciones si no existen
    const mainWeaknesses = bInsights.main_weaknesses || [];
    const missingInfo = dQuality.missing_information || [];
    
    // Generar recomendaciones dinámicas similares a client-page.tsx
    const generatedRecommendations: string[] = [];
    const weaknessesStr = mainWeaknesses.join(" ").toLowerCase();
    const missingStr = missingInfo.join(" ").toLowerCase();
    
    // Branding recs
    if (weaknessesStr.includes("branding") || weaknessesStr.includes("marca") || missingStr.includes("social")) {
      generatedRecommendations.push("Fortalecer tu identidad de marca con storytelling enfocado en tu valor y diferenciación.");
    } else {
      generatedRecommendations.push("Definir una propuesta de valor única y posicionamiento estratégico frente a competidores locales.");
    }
    
    // Marketing/Contacto recs
    if (weaknessesStr.includes("contacto") || missingStr.includes("contacto") || weaknessesStr.includes("teléfono") || weaknessesStr.includes("email")) {
      generatedRecommendations.push("Configurar botones de contacto directos como WhatsApp en tu página para mejorar la captación.");
    } else {
      generatedRecommendations.push("Implementar promociones de temporada y darlas a conocer en canales digitales locales.");
    }
    
    // SEO recs
    if (weaknessesStr.includes("seo") || missingStr.includes("metadatos") || missingStr.includes("títulos")) {
      generatedRecommendations.push("Optimizar títulos y metadatos de tu sitio web para búsquedas locales relevantes.");
    } else {
      generatedRecommendations.push("Optimizar imágenes y velocidad de carga móvil para aumentar tu indexación orgánica.");
    }
    
    // UX recs
    if (weaknessesStr.includes("producto") || weaknessesStr.includes("catálogo")) {
      generatedRecommendations.push("Estructurar un catálogo digital detallado y visualmente atractivo de todos tus productos.");
    } else {
      generatedRecommendations.push("Asegurar una velocidad de carga y navegación fluidas en dispositivos móviles.");
    }
    
    // Conversion recs
    if (weaknessesStr.includes("carrito") || weaknessesStr.includes("checkout") || weaknessesStr.includes("commerce")) {
      generatedRecommendations.push("Integrar un botón rápido de pedidos vía WhatsApp para automatizar las conversiones de compra.");
    } else {
      generatedRecommendations.push("Crear llamadas a la acción (CTAs) claras y persuasivas en toda la página.");
    }

    const recs = processedData.strategic_recommendations || {};
    const brandingRecs = recs.branding_recommendations || [];
    const marketingRecs = recs.marketing_recommendations || [];
    const seoRecs = recs.seo_recommendations || [];
    const uxRecs = recs.ux_recommendations || [];
    const convRecs = recs.conversion_recommendations || [];
    
    const finalRecs = [
      ...(brandingRecs.length > 0 ? brandingRecs : [generatedRecommendations[0]]),
      ...(marketingRecs.length > 0 ? marketingRecs : [generatedRecommendations[1]]),
      ...(seoRecs.length > 0 ? seoRecs : [generatedRecommendations[2]]),
      ...(uxRecs.length > 0 ? uxRecs : [generatedRecommendations[3]]),
      ...(convRecs.length > 0 ? convRecs : [generatedRecommendations[4]])
    ];

    return {
      strengths: Array.isArray(bInsights.main_strengths) ? bInsights.main_strengths : [],
      weaknesses: Array.isArray(bInsights.main_weaknesses) ? bInsights.main_weaknesses : [],
      seo_signals: Array.isArray(mSignals.seo_signals) ? mSignals.seo_signals : [],
      opportunities: Array.isArray(bInsights.differentiators) ? bInsights.differentiators : [],
      emotional_tone: Array.isArray(bIdentity.emotional_tone) ? bIdentity.emotional_tone : [],
      target_audience: Array.isArray(bIdentity.target_audience) ? bIdentity.target_audience : [],
      ux_observations: Array.isArray(wAnalysis.ux_observations) ? wAnalysis.ux_observations : [],
      confidence_score: typeof dQuality.confidence_score === "number" ? dQuality.confidence_score : 0.5,
      brand_personality: Array.isArray(bIdentity.brand_personality) ? bIdentity.brand_personality : [],
      marketing_tactics: Array.isArray(mSignals.marketing_tactics) ? mSignals.marketing_tactics : [],
      market_positioning: bIdentity.market_positioning || "Sin posicionamiento especificado",
      strategic_recommendations: finalRecs
    };
  }

  // Estructura clásica
  return {
    strengths: Array.isArray(processedData.strengths) ? processedData.strengths : (Array.isArray(processedData.products) ? processedData.products : []),
    weaknesses: Array.isArray(processedData.weaknesses) ? processedData.weaknesses : (Array.isArray(processedData.promotions) ? processedData.promotions : []),
    seo_signals: Array.isArray(processedData.seo_signals) ? processedData.seo_signals : [],
    opportunities: Array.isArray(processedData.opportunities) ? processedData.opportunities : [],
    emotional_tone: Array.isArray(processedData.emotional_tone) ? processedData.emotional_tone : [],
    target_audience: Array.isArray(processedData.target_audience) ? processedData.target_audience : [],
    ux_observations: Array.isArray(processedData.ux_observations) ? processedData.ux_observations : [],
    confidence_score: typeof processedData.confidence_score === "number" ? processedData.confidence_score : 0.5,
    brand_personality: Array.isArray(processedData.brand_personality) ? processedData.brand_personality : [],
    marketing_tactics: Array.isArray(processedData.marketing_tactics) ? processedData.marketing_tactics : [],
    market_positioning: processedData.market_positioning || processedData.title || "Sin posicionamiento especificado",
    strategic_recommendations: Array.isArray(processedData.strategic_recommendations) 
      ? processedData.strategic_recommendations 
      : (Array.isArray(processedData.recommendations) ? processedData.recommendations : [])
  };
}

export function ScrapingReportDialog({ 
  data: rawData, 
  channel,
  triggerText = "Ver Informe",
  triggerClassName = "hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
}: { 
  data: any; 
  channel?: string;
  triggerText?: string;
  triggerClassName?: string;
}) {
  // Handle new array structure with output field
  let processedRawData = rawData;
  if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].output) {
    processedRawData = rawData[0].output;
  }

  const data = normalizeReportData(rawData);
  const isInstagramStructure = !!processedRawData?.instagram_presence || !!processedRawData?.engagement_analysis || !!processedRawData?.content_analysis;
  const isFacebookStructure = !!processedRawData?.social_intelligence || !!processedRawData?.brand_positioning || !!processedRawData?.strategic_diagnostics;
  const isTikTok = channel === "TIKTOK";

  let tiktokFollowers = "N/D";
  let tiktokLikes = "N/D";
  let tiktokVideos = "N/D";
  let tiktokAverageViews = "N/D";
  let tiktokUsername = "N/D";

  if (isTikTok) {
    const seoSignals = data.seo_signals || processedRawData?.seo_signals || processedRawData?.marketing_signals?.seo_signals;
    if (Array.isArray(seoSignals)) {
      seoSignals.forEach((signal: string) => {
        const sigLower = signal.toLowerCase();
        if (sigLower.includes("seguidor")) {
          const parts = signal.split(":");
          tiktokFollowers = parts.length > 1 ? parts[1].trim() : signal;
        } else if (sigLower.includes("me gusta")) {
          const parts = signal.split(":");
          tiktokLikes = parts.length > 1 ? parts[1].trim() : signal;
        } else if (sigLower.includes("video") || sigLower.includes("publica")) {
          const parts = signal.split(":");
          tiktokVideos = parts.length > 1 ? parts[1].trim() : signal;
        } else if (sigLower.includes("visualiza") || sigLower.includes("promedio")) {
          const parts = signal.split(":");
          tiktokAverageViews = parts.length > 1 ? parts[1].trim() : signal;
        }
      });
    }

    if (processedRawData?.tiktok_presence) {
      if (tiktokFollowers === "N/D") tiktokFollowers = processedRawData.tiktok_presence.followers?.toString() || "N/D";
      if (tiktokLikes === "N/D") tiktokLikes = processedRawData.tiktok_presence.likes?.toString() || "N/D";
      if (tiktokVideos === "N/D") tiktokVideos = processedRawData.tiktok_presence.videos_count?.toString() || "N/D";
      tiktokUsername = processedRawData.tiktok_presence.username || "N/D";
    }

    const firstItem = Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : null;
    const author = processedRawData?.authorMeta || firstItem?.authorMeta;
    if (author) {
      if (tiktokFollowers === "N/D") tiktokFollowers = author.fans !== undefined ? author.fans.toLocaleString() : "N/D";
      if (tiktokLikes === "N/D") tiktokLikes = author.heart !== undefined ? author.heart.toLocaleString() : "N/D";
      if (tiktokVideos === "N/D") tiktokVideos = author.video !== undefined ? author.video.toLocaleString() : "N/D";
      if (tiktokUsername === "N/D") tiktokUsername = author.name || author.nickName || "N/D";
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={`gap-2 bg-white border-slate-200 text-slate-700 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98] ${triggerClassName}`}>
          <BarChart3 className="h-4 w-4 text-violet-500" />
          {triggerText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50/95 backdrop-blur-md border-slate-200/60 shadow-2xl">
        <DialogHeader className="border-b border-slate-200/60 pb-4 mb-4">
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-violet-500" />
              {isInstagramStructure ? 'Análisis de Instagram' : isFacebookStructure ? 'Análisis de Facebook' : isTikTok ? 'Análisis de TikTok' : 'Análisis de Inteligencia de Marca'}
            </DialogTitle>
            
            {/* Fiabilidad del Análisis */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium uppercase tracking-wider">Fiabilidad del Análisis:</span>
              <span className={`font-semibold px-2.5 py-0.5 rounded-full ${
                data.confidence_score >= 0.85 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
                  : data.confidence_score >= 0.7 
                    ? "bg-blue-50 text-blue-700 border border-blue-200/60" 
                    : data.confidence_score >= 0.5 
                      ? "bg-amber-50 text-amber-700 border border-amber-200/60" 
                      : "bg-rose-50 text-rose-700 border border-rose-200/60"
              }`}>
                {data.confidence_score >= 0.85 
                  ? `Excelente (${Math.round(data.confidence_score * 100)}%)` 
                  : data.confidence_score >= 0.7 
                    ? `Alta (${Math.round(data.confidence_score * 100)}%)` 
                    : data.confidence_score >= 0.5 
                      ? `Moderada (${Math.round(data.confidence_score * 100)}%)` 
                      : `Baja / Limitada (${Math.round(data.confidence_score * 100)}%)`
                }
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Facebook-specific metrics */}
          {isFacebookStructure && (
            <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-gradient-to-r from-blue-50 via-cyan-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Métricas de Facebook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <span className="text-xs text-slate-400 block mb-1">Seguidores / Likes</span>
                    <p className="text-lg font-bold text-slate-700">{processedRawData?.social_intelligence?.audience_size || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-cyan-100">
                    <span className="text-xs text-slate-400 block mb-1">Engagement</span>
                    <p className="text-lg font-bold text-slate-700">{processedRawData?.social_intelligence?.engagement_level || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <span className="text-xs text-slate-400 block mb-1">Anuncios en Meta</span>
                    <p className={`text-lg font-bold ${processedRawData?.social_intelligence?.active_marketing_ads ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {processedRawData?.social_intelligence?.active_marketing_ads ? 'Activos' : 'Inactivos'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-cyan-100">
                    <span className="text-xs text-slate-400 block mb-1">Nicho</span>
                    <p className="text-sm font-bold text-slate-700 truncate">{processedRawData?.brand_positioning?.niche || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TikTok-specific metrics */}
          {isTikTok && (
            <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-gradient-to-r from-slate-900/10 via-slate-800/5 to-white dark:from-slate-800/20 dark:via-slate-900/10 dark:to-slate-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <TikTokIcon className="h-4 w-4" />
                  Métricas de TikTok
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Seguidores</span>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{tiktokFollowers}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Me gusta</span>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{tiktokLikes}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Videos</span>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{tiktokVideos}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Visualizaciones Promedio</span>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{tiktokAverageViews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instagram-specific metrics */}
          {isInstagramStructure && (
            <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-gradient-to-r from-pink-50 via-purple-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-pink-600 uppercase tracking-wider flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Métricas de Instagram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-pink-100">
                    <span className="text-xs text-slate-400 block mb-1">Seguidores</span>
                    <p className="text-lg font-bold text-slate-700">{processedRawData?.instagram_presence?.audience_size?.followers || processedRawData?.engagement_analysis?.social_proof_signals?.[0] || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <span className="text-xs text-slate-400 block mb-1">Publicaciones</span>
                    <p className="text-lg font-bold text-slate-700">{processedRawData?.instagram_presence?.audience_size?.posts_count || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-pink-100">
                    <span className="text-xs text-slate-400 block mb-1">Siguiendo</span>
                    <p className="text-lg font-bold text-slate-700">{processedRawData?.instagram_presence?.audience_size?.following || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <span className="text-xs text-slate-400 block mb-1">Engagement</span>
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {processedRawData?.engagement_analysis?.engagement_level || 
                       processedRawData?.engagement_analysis?.current_activity_level || 
                       processedRawData?.community_analysis?.current_activity_level || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instagram content analysis */}
          {isInstagramStructure && processedRawData?.content_analysis && (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Análisis de Contenido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Temas de Contenido</span>
                  <div className="flex flex-wrap gap-1.5">
                    {processedRawData.content_analysis.content_themes?.map((item: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-none px-2.5 py-0.5 text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Formatos</span>
                  <div className="flex flex-wrap gap-1.5">
                    {processedRawData.content_analysis.content_formats?.map((item: string, i: number) => (
                      <Badge key={i} variant="outline" className="border-purple-200 text-purple-600 px-2.5 py-0.5 text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                {processedRawData.content_analysis.top_hashtags && (
                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Top Hashtags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {processedRawData.content_analysis.top_hashtags?.map((item: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-pink-200 text-pink-600 px-2.5 py-0.5 text-xs">
                          #{item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {processedRawData.content_analysis.posting_behavior && (
                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Comportamiento de Publicación</span>
                    <ul className="space-y-1">
                      {processedRawData.content_analysis.posting_behavior?.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600 flex gap-2">
                          <span className="text-purple-500">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instagram engagement analysis */}
          {isInstagramStructure && processedRawData?.engagement_analysis && (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-pink-700 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Análisis de Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Señales de Prueba Social</span>
                  <ul className="space-y-1">
                    {processedRawData.engagement_analysis.social_proof_signals?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-pink-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Indicadores de Reputación</span>
                  <ul className="space-y-1">
                    {processedRawData.engagement_analysis.reputation_indicators?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-purple-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Indicadores de Comunidad</span>
                  <ul className="space-y-1">
                    {processedRawData.engagement_analysis.community_activity_signals?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-purple-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Indicadores de Lealtad de Audiencia</span>
                  <ul className="space-y-1">
                    {processedRawData.engagement_analysis.audience_loyalty_indicators?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-purple-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instagram business signals */}
          {isInstagramStructure && processedRawData?.business_signals && (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Señales de Negocio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Señales de Confianza</span>
                  <ul className="space-y-1">
                    {processedRawData.business_signals.trust_signals?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-blue-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Señales Comerciales</span>
                  <ul className="space-y-1">
                    {processedRawData.business_signals.commercial_signals?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-blue-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Señales de Conversión</span>
                  <ul className="space-y-1">
                    {processedRawData.business_signals.conversion_signals?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-blue-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instagram profile maturity */}
          {isInstagramStructure && processedRawData?.instagram_presence?.profile_maturity_indicators && (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Indicadores de Madurez del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {processedRawData.instagram_presence.profile_maturity_indicators?.map((item: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 flex gap-2">
                      <span className="text-amber-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Instagram data quality */}
          {isInstagramStructure && processedRawData?.data_quality && (
            <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-gradient-to-br from-slate-50 via-white to-white border-l-4 border-l-slate-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Calidad de los Datos y Limitaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Información Faltante</span>
                  <ul className="space-y-1">
                    {processedRawData.data_quality.missing_information?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-slate-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Limitaciones del Análisis</span>
                  <ul className="space-y-1">
                    {processedRawData.data_quality.analysis_limitations?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-slate-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generic sections - only show if NOT Instagram structure */}
          {!isInstagramStructure && !isFacebookStructure && (
            <>
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
            </>
          )}

          {isFacebookStructure && (
            <>
              {/* 1. PROPUESTA DE VALOR */}
              <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Compass className="h-4 w-4 text-blue-500" />
                    Propuesta de Valor de Facebook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-slate-700 leading-relaxed">
                    "{data.market_positioning}"
                  </p>
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

              {/* 3. CANALES Y CONVERSIÓN */}
              <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-500" />
                    Canales de Conversión
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Fricción de Conversión</span>
                    <Badge variant="secondary" className="mt-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2.5 py-0.5 font-medium">
                      {processedRawData?.conversion_channels?.conversion_friction || "N/D"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Canal Principal de Ventas</span>
                    <Badge variant="secondary" className="mt-1 text-sm bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-none px-2.5 py-0.5 font-medium">
                      {processedRawData?.conversion_channels?.main_channel || "N/D"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 5. RECOMENDACIONES ESTRATÉGICAS */}
              <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-gradient-to-br from-blue-50 via-white to-white border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Recomendaciones Estratégicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {data.strategic_recommendations.map((item, i) => (
                      <div key={i} className="text-sm text-slate-600 flex gap-3 items-start bg-white/60 p-2.5 rounded-lg border border-blue-100/50 shadow-sm">
                        <span className="bg-blue-100 text-blue-700 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
