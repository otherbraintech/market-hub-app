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

const formatLocaleNumber = (val: any): string => {
  if (val === undefined || val === null) return "N/D";
  const num = Number(val);
  if (isNaN(num)) return typeof val === "string" ? val.trim() : val.toString();
  return num.toLocaleString('es-ES');
};

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

function enrichBrandData(data: ReportData, positioningText: string, channelName?: string): ReportData {
  const text = (positioningText || "").toLowerCase();
  const channel = (channelName || "").toUpperCase();
  
  // Detectar nicho
  const isBakery = text.includes("torta") || text.includes("pasteler") || text.includes("reposter") || text.includes("dulce") || text.includes("postre") || text.includes("horneado");
  const isFood = isBakery || text.includes("comida") || text.includes("restaurante") || text.includes("fast food") || text.includes("alimento") || text.includes("delivery") || text.includes("sabor");
  
  const enriched = { ...data };

  // 1. Personalidad de Marca
  if (!enriched.brand_personality || enriched.brand_personality.length === 0) {
    if (isBakery) {
      enriched.brand_personality = ["Cercana", "Tradicionalista", "Festiva", "Amigable", "Detallista"];
    } else if (isFood) {
      enriched.brand_personality = ["Práctica", "Accesible", "Dinámica", "Confiable", "Orientada al servicio"];
    } else {
      enriched.brand_personality = ["Profesional", "Moderna", "Confiable", "Directa", "Accesible"];
    }
  }

  // 2. Tono Emocional
  if (!enriched.emotional_tone || enriched.emotional_tone.length === 0) {
    if (isBakery) {
      enriched.emotional_tone = ["Festivo", "Alegre", "Acogedor", "Familiar", "Divertido"];
    } else if (isFood) {
      enriched.emotional_tone = ["Entusiasta", "Informal", "Expectante", "Directo"];
    } else {
      enriched.emotional_tone = ["Profesional", "Informativo", "Cercano", "Convincente"];
    }
  }

  // 3. Fortalezas (completar si hay menos de 3)
  if (!enriched.strengths || enriched.strengths.length < 3) {
    const defaultStrengths = isBakery 
      ? [
          "Fuerte atractivo visual centrado en repostería fina",
          "Propuesta de valor clara en sabor tradicional y accesibilidad",
          "Canal de conversión directa y atención personalizada por WhatsApp"
        ]
      : isFood
        ? [
            "Enfoque directo en rapidez de atención y conveniencia local",
            "Precios competitivos adaptados al mercado",
            "Facilidad de contacto telefónico y mensajería instantánea"
          ]
        : [
            "Presencia digital activa con múltiples vías de comunicación",
            "Identidad corporativa coherente en canales consultados",
            "Enfoque claro en la satisfacción del cliente de zona"
          ];
    
    enriched.strengths = [
      ...(enriched.strengths || []),
      ...defaultStrengths
    ].slice(0, 5);
  }

  // 4. Debilidades (completar si hay menos de 3)
  if (!enriched.weaknesses || enriched.weaknesses.length < 3) {
    const defaultWeaknesses = isBakery
      ? [
          "Ausencia de catálogo interactivo auto-gestionable integrado",
          "Baja consistencia en campañas y publicaciones periódicas en feed",
          "Limitados testimonios de clientes directamente visibles"
        ]
      : [
          "Dependencia de plataformas de contacto externas sin automatización",
          "Falta de optimización SEO local y enlaces directos estructurados",
          "Poca interactividad orientada a incrementar el engagement de red social"
        ];
    
    enriched.weaknesses = [
      ...(enriched.weaknesses || []),
      ...defaultWeaknesses
    ].slice(0, 5);
  }

  // 5. Audiencia Objetivo
  if (!enriched.target_audience || enriched.target_audience.length === 0) {
    if (isBakery) {
      enriched.target_audience = [
        "Familias y organizadores de eventos en Santa Cruz",
        "Amantes de los postres y repostería artesanal",
        "Clientes locales buscando tortas para celebraciones especiales"
      ];
    } else if (isFood) {
      enriched.target_audience = [
        "Consumidores locales buscando comida rápida y productos de paso",
        "Clientes que priorizan precios accesibles y conveniencia",
        "Habitantes de zonas aledañas interesados en envíos rápidos"
      ];
    } else {
      enriched.target_audience = [
        "Consumidores locales en busca de soluciones rápidas",
        "Usuarios de dispositivos móviles y redes sociales locales",
        "Clientes recurrentes de servicios zonales directos"
      ];
    }
  }

  // 6. Recomendaciones Estratégicas (completar si hay menos de 3)
  if (!enriched.strategic_recommendations || enriched.strategic_recommendations.length < 3) {
    const defaultRecommendations = isBakery
      ? [
          "Configurar respuestas rápidas de WhatsApp Business para automatizar la toma de pedidos.",
          "Crear dinámicas y sorteos semanales para fomentar la interacción en publicaciones.",
          "Añadir un enlace directo Linktree agrupando menú, catálogo y ubicación."
        ]
      : [
          "Implementar campañas locales de anuncios pagados en Meta dirigidos a un radio de 5km.",
          "Asegurar la consistencia de horarios y canales de atención actualizados en el perfil.",
          "Incentivar a tus clientes actuales a dejar opiniones y social proof."
        ];

    enriched.strategic_recommendations = [
      ...(enriched.strategic_recommendations || []),
      ...defaultRecommendations
    ].slice(0, 5);
  }

  return enriched;
}

function normalizeReportData(data: any, channel?: string): ReportData {
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
  if (Array.isArray(data) && data.length > 0) {
    processedData = data[0].output || data[0];
  }

  // Verificar si es estructura de reporte consolidado (executiveSummary o marketPosition)
  const isConsolidated = !!processedData.executiveSummary || !!processedData.marketPosition || !!processedData.strategicRecommendations;
  if (isConsolidated) {
    const marketPos = processedData.marketPosition || {};
    const channelStrat = processedData.channelStrategy || {};
    
    // Mapear recomendaciones de forma limpia
    const recsList: string[] = [];
    if (Array.isArray(processedData.strategicRecommendations)) {
      processedData.strategicRecommendations.forEach((r: any) => {
        if (r && typeof r === 'object') {
          recsList.push(`${r.action || ''} [Impacto: ${r.expectedImpact || ''} | Prioridad: ${r.priority || ''}] (${r.timeline || ''})`);
        } else if (typeof r === 'string') {
          recsList.push(r);
        }
      });
    }

    return {
      strengths: Array.isArray(processedData.strengths) ? processedData.strengths : [],
      weaknesses: Array.isArray(processedData.weaknesses) ? processedData.weaknesses : [],
      seo_signals: Array.isArray(processedData.opportunities) ? processedData.opportunities.map((o: string) => `Oportunidad: ${o}`) : [],
      opportunities: Array.isArray(processedData.opportunities) ? processedData.opportunities : [],
      emotional_tone: Array.isArray(processedData.threats) ? processedData.threats : [], // Usar amenazas aquí
      target_audience: Array.isArray(processedData.nextSteps) ? processedData.nextSteps : [],
      ux_observations: processedData.executiveSummary ? [processedData.executiveSummary] : [],
      confidence_score: 0.95,
      brand_personality: channelStrat.contentStrategy ? [channelStrat.contentStrategy] : [],
      marketing_tactics: Array.isArray(channelStrat.recommendedChannels) ? channelStrat.recommendedChannels : [],
      market_positioning: marketPos.currentPosition || marketPos.value_proposition || "Posicionamiento Consolidado",
      strategic_recommendations: recsList
    };
  }

  // Verificar si es estructura de TikTok
  const isTikTokStructure = !!processedData.profile && (!!processedData.engagement || !!processedData.business_signals || !!processedData.content_analysis);

  if (isTikTokStructure) {
    const profile = processedData.profile || {};
    const engagement = processedData.engagement || {};
    const bizSignals = processedData.business_signals || {};
    const content = processedData.content_analysis || {};
    const compInsights = processedData.competitive_insights || {};
    const dQuality = processedData.data_quality || {};

    const generatedRecommendations: string[] = [];
    if (bizSignals.whatsapp_present === false) {
      generatedRecommendations.push("Vincular un enlace directo a WhatsApp en el perfil de TikTok para facilitar la conversión directa.");
    }
    if (bizSignals.website_present === false) {
      generatedRecommendations.push("Agregar un enlace al sitio web oficial en la bio para derivar tráfico cualificado.");
    }
    if (engagement.engagement_level === "low" || engagement.engagement_level === "bajo") {
      generatedRecommendations.push("Mejorar la tasa de interacción usando ganchos en los primeros 3 segundos y respondiendo comentarios con videos.");
    } else {
      generatedRecommendations.push("Mantener la consistencia en los pilares de contenido identificados para consolidar el engagement actual.");
    }
    if (bizSignals.contact_cta === false) {
      generatedRecommendations.push("Habilitar los botones de contacto en el perfil de creador/empresa para consultas comerciales.");
    }
    if (Array.isArray(content.hashtags) && content.hashtags.length < 5) {
      generatedRecommendations.push("Diversificar el uso de hashtags locales y de nicho para optimizar el posicionamiento en el algoritmo de búsqueda.");
    } else {
      generatedRecommendations.push("Optimizar la descripción de los videos (SEO de TikTok) incluyendo palabras clave en los primeros caracteres.");
    }

    return {
      strengths: Array.isArray(compInsights.strengths) ? compInsights.strengths : [],
      weaknesses: Array.isArray(compInsights.weaknesses) ? compInsights.weaknesses : [],
      seo_signals: Array.isArray(content.hashtags) ? content.hashtags.map((h: string) => `#${h}`) : [],
      opportunities: Array.isArray(compInsights.opportunities) ? compInsights.opportunities : [],
      emotional_tone: [],
      target_audience: Array.isArray(content.primary_topics) ? content.primary_topics : [],
      ux_observations: [
        `Sitio Web: ${bizSignals.website_present ? "Presente en perfil" : "No enlazado"}`,
        `WhatsApp: ${bizSignals.whatsapp_present ? "Enlazado" : "No enlazado"}`,
        `Cuenta Comercial: ${bizSignals.commerce_account ? "Sí" : "No"}`,
        `CTA de Contacto: ${bizSignals.contact_cta ? "Habilitado" : "No habilitado"}`
      ],
      confidence_score: typeof dQuality.confidence_score === "number" ? dQuality.confidence_score : 1.0,
      brand_personality: [],
      marketing_tactics: Array.isArray(bizSignals.commercial_signals) ? bizSignals.commercial_signals : [],
      market_positioning: profile.bio || "Perfil de TikTok",
      strategic_recommendations: generatedRecommendations
    };
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
  const isFacebookStructure = !!processedData.social_intelligence || 
                              !!processedData.brand_positioning || 
                              !!processedData.strategic_diagnostics ||
                              !!processedData.facebook_presence;
  
  if (isFacebookStructure) {
    const fbPres = processedData.facebook_presence || {};
    const socialIntel = processedData.social_intelligence || {};
    const brandPos = processedData.brand_positioning || {};
    const channels = processedData.conversion_channels || {};
    const diagnostics = processedData.strategic_diagnostics || {};
    const compObs = processedData.competitive_observations || {};
    const dQuality = processedData.data_quality || {};
    const community = processedData.community_analysis || {};
    const reputation = processedData.reputation_analysis || {};
    const bizIntel = processedData.business_intelligence || {};

    // Obtener métricas
    const followers = fbPres.audience_metrics?.followers || socialIntel.audience_size || "N/D";
    const adsActivos = (bizIntel.advertising_active || socialIntel.active_marketing_ads) ? "Sí" : "No";
    const category = fbPres.business_category || brandPos.niche || "N/D";

    // Extraer fortalezas cooperativamente
    const strengths = [
      ...(Array.isArray(diagnostics.strengths) ? diagnostics.strengths : []),
      ...(Array.isArray(compObs.main_strengths) ? compObs.main_strengths : []),
      ...(Array.isArray(processedData.strengths) ? processedData.strengths : [])
    ].filter(Boolean);

    // Extraer debilidades
    const weaknesses = [
      ...(Array.isArray(diagnostics.weaknesses) ? diagnostics.weaknesses : []),
      ...(Array.isArray(compObs.main_weaknesses) ? compObs.main_weaknesses : []),
      ...(Array.isArray(processedData.weaknesses) ? processedData.weaknesses : [])
    ].filter(Boolean);

    // Extraer recomendaciones
    const rawRecs = processedData.actionable_recommendations || diagnostics.recommendations || processedData.strategic_recommendations || [];
    const recs: string[] = Array.isArray(rawRecs) ? rawRecs : [];

    // Fallbacks si están vacías
    if (recs.length === 0) {
      if (bizIntel.phone_contact_available === false) {
        recs.push("Añadir un número de teléfono de contacto visible en la página de Facebook.");
      }
      if (bizIntel.website_present === false) {
        recs.push("Enlazar el sitio web oficial en la sección de información del perfil.");
      }
      if (recs.length === 0) {
        recs.push("Publicar contenido interactivo de manera constante para aumentar el nivel de interacción actual.");
        recs.push("Aprovechar la presencia comercial activa y anuncios para dirigir tráfico al canal de conversión principal.");
      }
    }

    const res = {
      strengths: strengths.length > 0 ? strengths : ["Presencia activa en redes sociales"],
      weaknesses: weaknesses.length > 0 ? weaknesses : ["Falta de consistencia o catálogo interactivo directo en la página principal"],
      seo_signals: [
        `Seguidores: ${followers}`,
        `Anuncios Activos: ${adsActivos}`,
        `Categoría: ${category}`
      ],
      opportunities: Array.isArray(compObs.differentiators) ? compObs.differentiators : [],
      emotional_tone: Array.isArray(socialIntel.emotional_tone) ? socialIntel.emotional_tone : (Array.isArray(brandPos.emotional_tone) ? brandPos.emotional_tone : []),
      target_audience: Array.isArray(brandPos.target_audience) ? brandPos.target_audience : (Array.isArray(socialIntel.target_audience) ? socialIntel.target_audience : []),
      ux_observations: [
        ...(Array.isArray(fbPres.brand_maturity_indicators) ? fbPres.brand_maturity_indicators : []),
        channels.conversion_friction ? `Fricción de Conversión: ${channels.conversion_friction}` : null,
        channels.main_channel ? `Canal Principal: ${channels.main_channel}` : null
      ].filter(Boolean),
      confidence_score: typeof dQuality.confidence_score === "number" ? dQuality.confidence_score : 0.9,
      brand_personality: Array.isArray(socialIntel.brand_personality) ? socialIntel.brand_personality : (Array.isArray(brandPos.brand_personality) ? brandPos.brand_personality : []),
      marketing_tactics: [
        ...(Array.isArray(bizIntel.commercial_signals) ? bizIntel.commercial_signals : []),
        brandPos.niche ? `Nicho: ${brandPos.niche}` : null
      ].filter(Boolean),
      market_positioning: fbPres.brand_summary || brandPos.value_proposition || fbPres.brand_name || socialIntel.page_name || "Perfil de Facebook",
      strategic_recommendations: recs
    };
    return enrichBrandData(res, res.market_positioning, channel);
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

    const res = {
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
    return enrichBrandData(res, res.market_positioning, channel);
  }

  // Estructura clásica
  const res = {
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
  return enrichBrandData(res, res.market_positioning, channel);
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
  if (Array.isArray(rawData) && rawData.length > 0) {
    processedRawData = rawData[0].output || rawData[0];
  }

  const data = normalizeReportData(rawData, channel);
  const isInstagramStructure = (!!processedRawData?.instagram_presence || !!processedRawData?.engagement_analysis || !!processedRawData?.content_analysis) && channel !== "TIKTOK";
  const isFacebookStructure = (!!processedRawData?.social_intelligence || !!processedRawData?.brand_positioning || !!processedRawData?.strategic_diagnostics) && channel !== "TIKTOK";
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

    if (processedRawData?.profile) {
      if (tiktokFollowers === "N/D") tiktokFollowers = processedRawData.profile.followers !== undefined ? formatLocaleNumber(processedRawData.profile.followers) : "N/D";
      if (tiktokLikes === "N/D") tiktokLikes = processedRawData.profile.total_likes !== undefined ? formatLocaleNumber(processedRawData.profile.total_likes) : "N/D";
      if (tiktokVideos === "N/D") tiktokVideos = processedRawData.profile.total_videos !== undefined ? formatLocaleNumber(processedRawData.profile.total_videos) : "N/D";
      if (tiktokUsername === "N/D") tiktokUsername = processedRawData.profile.username || "N/D";
    }

    if (processedRawData?.engagement) {
      if (tiktokAverageViews === "N/D") tiktokAverageViews = processedRawData.engagement.views !== undefined ? formatLocaleNumber(processedRawData.engagement.views) : "N/D";
    }

    const firstItem = Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : null;
    const author = processedRawData?.authorMeta || firstItem?.authorMeta;
    if (author) {
      if (tiktokFollowers === "N/D") tiktokFollowers = author.fans !== undefined ? formatLocaleNumber(author.fans) : "N/D";
      if (tiktokLikes === "N/D") tiktokLikes = author.heart !== undefined ? formatLocaleNumber(author.heart) : "N/D";
      if (tiktokVideos === "N/D") tiktokVideos = author.video !== undefined ? formatLocaleNumber(author.video) : "N/D";
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
      
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[80vh] flex flex-col bg-slate-50/95 backdrop-blur-md border-slate-200/60 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="border-b border-slate-200/60 px-6 py-4 shrink-0">
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Facebook-specific metrics */}
          {isFacebookStructure && (
            <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-gradient-to-r from-blue-50 via-cyan-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Métricas de Facebook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <span className="text-xs text-slate-400 block mb-1">Seguidores</span>
                    <p className="text-lg font-bold text-slate-700">
                      {processedRawData?.social_intelligence?.audience_size || 
                       processedRawData?.facebook_presence?.audience_metrics?.followers || 
                       'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-cyan-100">
                    <span className="text-xs text-slate-400 block mb-1">Engagement</span>
                    <p className="text-lg font-bold text-slate-700">
                      {processedRawData?.social_intelligence?.engagement_level || 
                       processedRawData?.community_analysis?.current_activity_level || 
                       'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <span className="text-xs text-slate-400 block mb-1">Anuncios en Meta</span>
                    <p className={`text-lg font-bold ${(processedRawData?.social_intelligence?.active_marketing_ads || processedRawData?.business_intelligence?.advertising_active) ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {(processedRawData?.social_intelligence?.active_marketing_ads || processedRawData?.business_intelligence?.advertising_active) ? 'Activos' : 'Inactivos'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-cyan-100">
                    <span className="text-xs text-slate-400 block mb-1">Nicho / Categoría</span>
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {processedRawData?.brand_positioning?.niche || 
                       processedRawData?.facebook_presence?.business_category || 
                       'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TikTok-specific metrics */}
          {isTikTok && (
            <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-gradient-to-r from-slate-900/10 via-slate-800/5 to-white dark:from-slate-800/20 dark:via-slate-900/10 dark:to-slate-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <TikTokIcon className="h-4 w-4" />
                  Métricas de TikTok
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas de Perfil */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Métricas del Perfil</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Seguidores</span>
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{tiktokFollowers}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Me gusta totales</span>
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{tiktokLikes}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Videos Publicados</span>
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{tiktokVideos}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Siguiendo</span>
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                        {processedRawData?.profile?.following !== undefined ? formatLocaleNumber(processedRawData.profile.following) : "N/D"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Métricas del Video Analizado */}
                {processedRawData?.engagement && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Desempeño del Último Contenido</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Visualizaciones</span>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                          {processedRawData.engagement.views !== undefined ? formatLocaleNumber(processedRawData.engagement.views) : "N/D"}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Me gusta</span>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                          {processedRawData.engagement.likes !== undefined ? formatLocaleNumber(processedRawData.engagement.likes) : "N/D"}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Compartidos</span>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                          {processedRawData.engagement.shares !== undefined ? formatLocaleNumber(processedRawData.engagement.shares) : "N/D"}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Comentarios</span>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                          {processedRawData.engagement.comments !== undefined ? formatLocaleNumber(processedRawData.engagement.comments) : "N/D"}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800 col-span-2 md:col-span-1">
                        <span className="text-xs text-slate-400 block mb-1">Engagement</span>
                        <p className={`text-sm font-bold uppercase ${
                          processedRawData.engagement.engagement_level === "high" || processedRawData.engagement.engagement_level === "alto"
                            ? "text-emerald-600"
                            : processedRawData.engagement.engagement_level === "medium" || processedRawData.engagement.engagement_level === "medio"
                              ? "text-blue-600"
                              : "text-amber-600"
                        } mt-1`}>
                          {processedRawData.engagement.engagement_level || "N/D"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instagram-specific metrics */}
          {isInstagramStructure && (
            <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-gradient-to-r from-pink-50 via-purple-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-pink-600 uppercase tracking-wider flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Métricas de Instagram
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const followers = processedRawData?.instagram_presence?.audience_size?.followers || 
                                      processedRawData?.engagement_analysis?.social_proof_signals?.find((s: string) => s.toLowerCase().includes('seguidor')) ||
                                      processedRawData?.engagement_analysis?.social_proof_signals?.[0];
                    const posts = processedRawData?.instagram_presence?.audience_size?.posts_count;
                    const following = processedRawData?.instagram_presence?.audience_size?.following;
                    const engagement = processedRawData?.engagement_analysis?.engagement_level || 
                                       processedRawData?.engagement_analysis?.current_activity_level || 
                                       processedRawData?.community_analysis?.current_activity_level;

                    const hasFollowers = followers && followers !== 'N/A' && followers !== 'N/D';
                    const hasPosts = posts && posts !== 'N/A' && posts !== 'N/D';
                    const hasFollowing = following && following !== 'N/A' && following !== 'N/D';
                    const hasEngagement = engagement && engagement !== 'N/A' && engagement !== 'N/D';

                    return (
                      <>
                        {hasFollowers && (
                          <div className="bg-white rounded-lg p-3 border border-pink-100">
                            <span className="text-xs text-slate-400 block mb-1">Seguidores</span>
                            <p className="text-lg font-bold text-slate-700">{followers}</p>
                          </div>
                        )}
                        {hasPosts && (
                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <span className="text-xs text-slate-400 block mb-1">Publicaciones</span>
                            <p className="text-lg font-bold text-slate-700">{posts}</p>
                          </div>
                        )}
                        {hasFollowing && (
                          <div className="bg-white rounded-lg p-3 border border-pink-100">
                            <span className="text-xs text-slate-400 block mb-1">Siguiendo</span>
                            <p className="text-lg font-bold text-slate-700">{following}</p>
                          </div>
                        )}
                        {hasEngagement && (
                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <span className="text-xs text-slate-400 block mb-1">Engagement</span>
                            <p className="text-sm font-bold text-slate-700 truncate">{engagement}</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
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
            <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-gradient-to-br from-slate-50 via-white to-white border-l-4 border-l-slate-400">
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
              {(data.brand_personality.length > 0 || data.emotional_tone.length > 0 || (data.market_positioning && data.market_positioning !== "Sin posicionamiento especificado")) && (
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Compass className="h-4 w-4 text-violet-500" />
                      Posicionamiento en el Mercado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.market_positioning && (
                      <p className="text-lg font-semibold text-slate-700 leading-relaxed">
                        "{data.market_positioning}"
                      </p>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-4">
                      {data.brand_personality.length > 0 && (
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
                      )}
                      {data.emotional_tone.length > 0 && (
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
 
              {/* 2. FORTALEZAS Y DEBILIDADES */}
              {data.strengths.length > 0 && (
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
              )}
 
              {data.weaknesses.length > 0 && (
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
              )}
 
              {/* 3. AUDIENCIA Y UX */}
              {data.target_audience.length > 0 && (
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
              )}
 
              {data.ux_observations.length > 0 && (
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
              )}
 
              {/* 4. SEO Y MARKETING */}
              {data.seo_signals.length > 0 && (
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
              )}
 
              {data.marketing_tactics.length > 0 && (
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
              )}
 
              {/* 5. RECOMENDACIONES ESTRATÉGICAS */}
              {data.strategic_recommendations.length > 0 && (
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-gradient-to-br from-violet-50 via-white to-white border-l-4 border-l-violet-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-violet-700 uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Recomendaciones Estratégicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              )}
            </>
          )}

          {isFacebookStructure && (
            <>
              {/* 1. PROPUESTA DE VALOR */}
              {data.market_positioning && data.market_positioning !== "Sin posicionamiento especificado" && (
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Compass className="h-4 w-4 text-blue-500" />
                      Propuesta de Valor de Facebook
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base font-semibold text-slate-700 leading-relaxed">
                      "{data.market_positioning}"
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 2. FORTALEZAS Y DEBILIDADES */}
              {data.strengths.length > 0 && (
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
              )}

              {data.weaknesses.length > 0 && (
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
              )}

              {/* 3. CANALES Y CONVERSIÓN */}
              <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-white">
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
                      {processedRawData?.conversion_channels?.conversion_friction || 
                       (processedRawData?.business_intelligence?.conversion_signals?.length > 0 ? "Baja" : "N/D")}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Canal Principal de Ventas</span>
                    <Badge variant="secondary" className="mt-1 text-sm bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-none px-2.5 py-0.5 font-medium">
                      {processedRawData?.conversion_channels?.main_channel || 
                       (processedRawData?.business_intelligence?.website_present ? "Sitio Web" : "Facebook Direct")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 5. RECOMENDACIONES ESTRATÉGICAS */}
              {data.strategic_recommendations.length > 0 && (
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-sm bg-gradient-to-br from-blue-50 via-white to-white border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Recomendaciones Estratégicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              )}
            </>
          )}
          
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
