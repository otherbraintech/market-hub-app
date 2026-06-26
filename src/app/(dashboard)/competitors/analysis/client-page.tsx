"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sparkles, Globe, Loader2, Plus, Facebook, Instagram, ChevronRight, ChevronLeft, FileText,
  Users, ThumbsUp, MessageSquare, Activity, Flame, MapPin, Award, ShieldCheck,
  Megaphone, Zap, Eye, Compass, Briefcase, TrendingUp, Heart, Target,
  AlertCircle, Star, Linkedin, Youtube, Search, RefreshCw, CheckCircle2, Lightbulb, Smile
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const getPlatformTheme = (channel: string) => {
  const c = channel?.toUpperCase();
  if (c === "FACEBOOK") {
    return {
      gradient: "from-blue-600/10 via-blue-500/5 to-cyan-500/5 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-cyan-950/10",
      border: "border-blue-500/20 dark:border-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
      accent: "blue"
    };
  }
  if (c === "INSTAGRAM") {
    return {
      gradient: "from-purple-600/10 via-pink-500/5 to-orange-500/5 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-orange-950/10",
      border: "border-pink-500/20 dark:border-pink-500/10",
      text: "text-pink-600 dark:text-pink-400",
      iconBg: "bg-pink-500/10",
      accent: "pink"
    };
  }
  if (c === "TIKTOK") {
    return {
      gradient: "from-slate-900/20 via-slate-800/10 to-slate-700/10 dark:from-slate-800/20 dark:via-slate-900/10 dark:to-slate-950/10",
      border: "border-slate-700/20 dark:border-slate-700/10",
      text: "text-slate-900 dark:text-slate-100",
      iconBg: "bg-slate-900/10 dark:bg-white/10",
      accent: "slate"
    };
  }
  if (c === "LINKEDIN") {
    return {
      gradient: "from-blue-700/10 via-blue-600/5 to-blue-500/5 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-blue-950/10",
      border: "border-blue-700/20 dark:border-blue-700/10",
      text: "text-blue-700 dark:text-blue-400",
      iconBg: "bg-blue-700/10",
      accent: "blue"
    };
  }
  if (c === "YOUTUBE") {
    return {
      gradient: "from-red-600/10 via-red-500/5 to-red-400/5 dark:from-red-950/20 dark:via-red-900/10 dark:to-red-950/10",
      border: "border-red-600/20 dark:border-red-600/10",
      text: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-600/10",
      accent: "red"
    };
  }
  if (c === "SEO_GOOGLE") {
    return {
      gradient: "from-green-600/10 via-green-500/5 to-emerald-500/5 dark:from-green-950/20 dark:via-green-900/10 dark:to-emerald-950/10",
      border: "border-green-600/20 dark:border-green-600/10",
      text: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-600/10",
      accent: "green"
    };
  }
  return {
    gradient: "from-slate-500/10 to-slate-400/5 dark:from-slate-800/20 dark:to-slate-900/10",
    border: "border-slate-500/20 dark:border-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-500/10",
    accent: "slate"
  };
};

const parseSocialMetric = (val: any): number | null => {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    let clean = val.trim().toLowerCase();
    let multiplier = 1;
    if (clean.endsWith("k")) {
      multiplier = 1000;
      clean = clean.slice(0, -1);
    } else if (clean.endsWith("m")) {
      multiplier = 1000000;
      clean = clean.slice(0, -1);
    }
    if (multiplier > 1) {
      clean = clean.replace(/,/g, ".");
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? null : Math.round(parsed * multiplier);
    } else {
      clean = clean.replace(/[\s]/g, "");
      const parsed = parseInt(clean.replace(/[.,]/g, ""), 10);
      return isNaN(parsed) ? null : parsed;
    }
  }
  return null;
};

const formatSocialMetric = (val: any) => {
  const num = parseSocialMetric(val);
  if (num === null) {
    return typeof val === "string" ? val.trim() : "N/D";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
};

const normalizeReportData = (rawReportData: any) => {
  if (!rawReportData) return null;
  let dataObj = typeof rawReportData === "string" ? JSON.parse(rawReportData) : rawReportData;
  
  // Si es un array de objetos con "output", y éstos contienen "page_overview" o estructuras de Facebook extraídas
  if (Array.isArray(dataObj) && dataObj.length > 0 && dataObj.every(item => item && typeof item === "object" && "output" in item)) {
    const outputs = dataObj.map((item: any) => item.output).filter(Boolean);
    
    // Si los outputs tienen el formato nuevo (page_overview, engagement_summary, etc.)
    if (outputs.length > 0 && outputs[0].page_overview) {
      const totalReactions = outputs.reduce((acc: number, curr: any) => acc + (curr.engagement_summary?.total_reactions || 0), 0);
      const totalComments = outputs.reduce((acc: number, curr: any) => acc + (curr.engagement_summary?.total_comments || 0), 0);
      const brandName = outputs.find((o: any) => o.page_overview?.brand_name)?.page_overview?.brand_name || "";
      const pageUrl = outputs.find((o: any) => o.page_overview?.page_url)?.page_overview?.page_url || "";
      
      const products = Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.main_products_or_services || []))).filter(Boolean);
      const topics = Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.common_topics || []))).filter(Boolean);
      const growthOps = Array.from(new Set(outputs.flatMap((o: any) => o.marketing_insights?.growth_opportunities || []))).filter(Boolean);
      const campaigns = Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.main_campaigns_detected || []))).filter(Boolean);
      const contentRecs = Array.from(new Set(outputs.flatMap((o: any) => o.marketing_insights?.content_recommendations || []))).filter(Boolean);
      const pricingMentions = Array.from(new Set(outputs.flatMap((o: any) => o.commercial_intelligence?.pricing_mentions || []))).filter(Boolean);
      const salesSignals = Array.from(new Set(outputs.flatMap((o: any) => o.commercial_intelligence?.sales_signals || []))).filter(Boolean);
      const conversionStrategies = Array.from(new Set(outputs.flatMap((o: any) => o.commercial_intelligence?.conversion_strategies || []))).filter(Boolean);
      
      const bestPost = outputs.reduce((best: any, curr: any) => {
        const currBest = curr.engagement_summary?.best_performing_post;
        if (!currBest || currBest.reactions === undefined) return best;
        if (!best || (currBest.reactions || 0) > (best.reactions || 0)) {
          return currBest;
        }
        return best;
      }, null);

      // Creamos un objeto consolidado compatible con la interfaz vieja y nueva
      return {
        isAggregatedFacebook: true,
        brand_name: brandName,
        page_url: pageUrl,
        total_reactions: totalReactions,
        total_comments: totalComments,
        total_posts: outputs.length,
        products,
        topics,
        growthOps,
        campaigns,
        contentRecs,
        bestPost,
        
        // Mapeamos para que la UI clásica lo entienda:
        facebook_presence: {
          brand_name: brandName,
          business_category: "Panadería y Pastelería",
          brand_summary: `Canal de Facebook con ${outputs.length} publicaciones analizadas. Temas principales: ${topics.slice(0, 4).join(', ')}. Estilo de comunicación: ${Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.posting_style || []))).slice(0, 3).join(', ')}.`,
          audience_metrics: {
            followers: totalReactions, // Fallback
            talking_about_count: totalComments // Usamos total de comentarios
          }
        },
        reputation_analysis: {
          total_reviews: totalComments,
          recommendation_percentage: 100 // Por defecto
        },
        branding_analysis: {
          brand_personality: Array.from(new Set(outputs.flatMap((o: any) => o.content_analysis?.posting_style || []))),
          emotional_tone: Array.from(new Set(outputs.flatMap((o: any) => o.audience_response?.positive_signals || [])))
        },
        business_intelligence: {
          website_present: true,
          advertising_active: true,
          phone_contact_available: true,
          price_range_indicator: pricingMentions.length > 0 ? pricingMentions[0] : "Bs. Variable",
          conversion_signals: conversionStrategies,
          commercial_signals: salesSignals
        },
        competitive_observations: {
          main_strengths: products.length > 0 ? products : ["Presencia local activa y buen engagement con la audiencia"],
          main_weaknesses: growthOps.length > 0 ? growthOps : ["Optimizar frecuencia de ofertas y variedad de formatos de contenido"],
          customer_perception_indicators: Array.from(new Set(outputs.flatMap((o: any) => o.audience_response?.engagement_drivers || []))),
          differentiators: products
        },
        strategic_recommendations: contentRecs.length > 0 ? contentRecs : ["Incrementar la frecuencia de publicaciones sobre nuevos sabores e interactuar con seguidores"]
      };
    }
  }

  // Si es un array y tiene un output simple en el primer elemento
  if (Array.isArray(dataObj) && dataObj.length > 0) {
    dataObj = dataObj[0].output || dataObj[0];
  }

  // Si es la estructura de TikTok nueva
  if (dataObj && dataObj.profile && (dataObj.engagement || dataObj.business_signals)) {
    const profile = dataObj.profile || {};
    const engagement = dataObj.engagement || {};
    const bizSignals = dataObj.business_signals || {};
    const content = dataObj.content_analysis || {};
    const compInsights = dataObj.competitive_insights || {};
    const dQuality = dataObj.data_quality || {};

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

    dataObj = {
      ...dataObj,
      tiktok_presence: {
        brand_name: profile.display_name || profile.username,
        brand_summary: profile.bio || "Perfil de TikTok",
        followers: profile.followers,
        likes: profile.total_likes,
        videos_count: profile.total_videos,
        username: profile.username
      },
      branding_analysis: {
        brand_positioning_indicators: [profile.bio || "Perfil de TikTok"],
        brand_personality: [],
        emotional_tone: []
      },
      business_intelligence: {
        website_present: bizSignals.website_present,
        whatsapp_present: bizSignals.whatsapp_present,
        advertising_active: false,
        phone_contact_available: bizSignals.whatsapp_present,
        price_range_indicator: "N/D",
        conversion_signals: [
          `Sitio Web: ${bizSignals.website_present ? "Sí" : "No"}`,
          `WhatsApp: ${bizSignals.whatsapp_present ? "Sí" : "No"}`,
          `CTA de Contacto: ${bizSignals.contact_cta ? "Sí" : "No"}`
        ],
        commercial_signals: bizSignals.commercial_signals || []
      },
      community_analysis: {
        current_activity_level: engagement.engagement_level,
        audience_loyalty_indicators: []
      },
      engagement_analysis: {
        engagement_level: engagement.engagement_level,
        social_proof_signals: [
          `Likes: ${engagement.likes || 0}`,
          `Views: ${engagement.views || 0}`,
          `Comments: ${engagement.comments || 0}`
        ]
      },
      competitive_observations: {
        main_strengths: compInsights.strengths || [],
        main_weaknesses: compInsights.weaknesses || [],
        differentiators: compInsights.opportunities || []
      },
      data_quality: {
        confidence_score: dQuality.confidence_score || 1.0,
        missing_information: [],
        analysis_limitations: []
      },
      strategic_recommendations: generatedRecommendations
    };
  }
  
  return dataObj;
};

function cleanJsonString(badJson: string): string {
  let clean = '';
  let inString = false;
  let isEscaped = false;
  for (let i = 0; i < badJson.length; i++) {
    const char = badJson[i];
    if (!inString) {
      if (char === '"') {
        inString = true;
        isEscaped = false;
        clean += char;
      } else {
        clean += char;
      }
    } else {
      if (isEscaped) {
        if (char === '\n') {
          clean += 'n';
        } else {
          clean += char;
        }
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
        clean += char;
      } else if (char === '"') {
        let isRealClosing = false;
        let j = i + 1;
        while (j < badJson.length && /\s/.test(badJson[j])) {
          j++;
        }
        if (j === badJson.length) {
          isRealClosing = true;
        } else {
          const nextChar = badJson[j];
          if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':') {
            isRealClosing = true;
          }
        }
        if (isRealClosing) {
          inString = false;
          clean += char;
        } else {
          clean += '\\"';
        }
      } else if (char === '\n') {
        clean += '\\n';
      } else if (char === '\r') {
        clean += '\\r';
      } else {
        clean += char;
      }
    }
  }
  return clean;
}

function extractExecutiveSummaryFromBadJson(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return text;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.executiveSummary) return parsed.executiveSummary;
  } catch (e) {
    // ignore
  }
  try {
    const cleaned = cleanJsonString(trimmed);
    const parsed = JSON.parse(cleaned);
    if (parsed.executiveSummary) return parsed.executiveSummary;
  } catch (e) {
    // ignore
  }
  return text;
}

interface MarkdownBlock {
  type: 'p' | 'h2' | 'h3' | 'h4' | 'ul' | 'ol' | 'card';
  content?: string;
  items?: string[];
  cardKey?: string;
  cardValue?: string;
}

const parseMarkdown = (text: any) => {
  if (!text) return null;
  let txt = text;
  if (typeof txt !== 'string') {
    if (typeof txt === 'object') {
      if (txt.executiveSummary && typeof txt.executiveSummary === 'string') {
        txt = txt.executiveSummary;
      } else if (txt.panoramaGlobal && typeof txt.panoramaGlobal.resumen === 'string') {
        txt = txt.panoramaGlobal.resumen;
      } else {
        txt = JSON.stringify(txt, null, 2);
      }
    } else {
      txt = String(txt);
    }
  }
  const keyCardStyles: Record<string, { icon: any, colorClass: string, bgClass: string, borderClass: string }> = {
    "objetivo": { icon: Target, colorClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/5 dark:bg-blue-950/10", borderClass: "border-l-4 border-l-blue-500 border-blue-100 dark:border-blue-900/30" },
    "ángulo": { icon: Sparkles, colorClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-500/5 dark:bg-amber-950/10", borderClass: "border-l-4 border-l-amber-500 border-amber-100 dark:border-amber-900/30" },
    "gancho": { icon: Sparkles, colorClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-500/5 dark:bg-amber-950/10", borderClass: "border-l-4 border-l-amber-500 border-amber-100 dark:border-amber-900/30" },
    "copys": { icon: FileText, colorClass: "text-purple-600 dark:text-purple-400", bgClass: "bg-purple-500/5 dark:bg-purple-950/10", borderClass: "border-l-4 border-l-purple-500 border-purple-100 dark:border-purple-900/30" },
    "contenido": { icon: FileText, colorClass: "text-purple-600 dark:text-purple-400", bgClass: "bg-purple-500/5 dark:bg-purple-950/10", borderClass: "border-l-4 border-l-purple-500 border-purple-100 dark:border-purple-900/30" },
    "canal": { icon: Globe, colorClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/5 dark:bg-emerald-950/10", borderClass: "border-l-4 border-l-emerald-500 border-emerald-100 dark:border-emerald-900/30" },
    "distribución": { icon: Globe, colorClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/5 dark:bg-emerald-950/10", borderClass: "border-l-4 border-l-emerald-500 border-emerald-100 dark:border-emerald-900/30" },
    "conversión": { icon: Zap, colorClass: "text-rose-600 dark:text-rose-400", bgClass: "bg-rose-500/5 dark:bg-rose-950/10", borderClass: "border-l-4 border-l-rose-500 border-rose-100 dark:border-rose-900/30" },
    "precio": { icon: DollarSign, colorClass: "text-indigo-600 dark:text-indigo-400", bgClass: "bg-indigo-500/5 dark:bg-indigo-950/10", borderClass: "border-l-4 border-l-indigo-500 border-indigo-100 dark:border-indigo-900/30" },
    "fidelización": { icon: Heart, colorClass: "text-pink-600 dark:text-pink-400", bgClass: "bg-pink-500/5 dark:bg-pink-950/10", borderClass: "border-l-4 border-l-pink-500 border-pink-100 dark:border-pink-900/30" }
  };

  const getCardStyle = (key: string) => {
    const k = key.toLowerCase();
    for (const [pattern, config] of Object.entries(keyCardStyles)) {
      if (k.includes(pattern)) return config;
    }
    return { icon: Lightbulb, colorClass: "text-slate-650 dark:text-slate-400", bgClass: "bg-slate-500/5 dark:bg-slate-900/10", borderClass: "border-l-4 border-l-slate-400 border-slate-100 dark:border-slate-800" };
  };

  const parseBoldText = (txt: string) => {
    const parts = txt.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong> : part);
  };

  const parseMarkdownToBlocks = (txt: string): MarkdownBlock[] => {
    const lines = txt.split('\n');
    const blocks: MarkdownBlock[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('### ')) {
        blocks.push({ type: 'h4', content: trimmed.replace('### ', '') });
      } else if (trimmed.startsWith('## ')) {
        blocks.push({ type: 'h3', content: trimmed.replace('## ', '') });
      } else if (trimmed.startsWith('# ')) {
        blocks.push({ type: 'h2', content: trimmed.replace('# ', '') });
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        const cardMatch = content.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
        if (cardMatch) {
          blocks.push({ type: 'card', cardKey: cardMatch[1].trim(), cardValue: cardMatch[2].trim() });
        } else {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.type === 'ul') {
            lastBlock.items!.push(content);
          } else {
            blocks.push({ type: 'ul', items: [content] });
          }
        }
      } else if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s/, '');
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock.type === 'ol') {
          lastBlock.items!.push(content);
        } else {
          blocks.push({ type: 'ol', items: [content] });
        }
      } else {
        const cardMatch = trimmed.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
        if (cardMatch) {
          blocks.push({ type: 'card', cardKey: cardMatch[1].trim(), cardValue: cardMatch[2].trim() });
        } else {
          blocks.push({ type: 'p', content: trimmed });
        }
      }
    });
    return blocks;
  };

  const renderBlocks = (blocks: MarkdownBlock[]) => {
    const rendered: React.JSX.Element[] = [];
    let currentGridCards: MarkdownBlock[] = [];
    const flushGrid = (key: string | number) => {
      if (currentGridCards.length > 0) {
        rendered.push(
          <div key={`grid-${key}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            {currentGridCards.map((card, cardIdx) => {
              const style = getCardStyle(card.cardKey || '');
              const Icon = style.icon;
              return (
                <div key={cardIdx} className={`p-4 rounded-xl border ${style.borderClass} ${style.bgClass} shadow-sm flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {Icon && <Icon className={`h-4.5 w-4.5 ${style.colorClass}`} />}
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${style.colorClass}`}>{card.cardKey}</span>
                    </div>
                    <p className="text-sm text-slate-705 dark:text-slate-300 leading-relaxed pl-1 whitespace-pre-line">
                      {parseBoldText(card.cardValue || '')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
        currentGridCards = [];
      }
    };

    blocks.forEach((block, idx) => {
      if (block.type === 'card') {
        currentGridCards.push(block);
      } else {
        flushGrid(idx);
        if (block.type === 'p') {
          rendered.push(
            <p key={idx} className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed mb-4 max-w-3xl whitespace-pre-line">
              {parseBoldText(block.content || '')}
            </p>
          );
        } else if (block.type === 'ul') {
          rendered.push(
            <ul key={idx} className="list-disc pl-5 mb-4 space-y-1.5 text-slate-650 dark:text-slate-400">
              {block.items?.map((item, i) => (
                <li key={i} className="text-sm text-slate-750 dark:text-slate-350 leading-relaxed">{parseBoldText(item)}</li>
              ))}
            </ul>
          );
        } else if (block.type === 'ol') {
          rendered.push(
            <ol key={idx} className="list-decimal pl-5 mb-4 space-y-1.5 text-slate-650 dark:text-slate-400">
              {block.items?.map((item, i) => (
                <li key={i} className="text-sm text-slate-750 dark:text-slate-355 leading-relaxed">{parseBoldText(item)}</li>
              ))}
            </ol>
          );
        } else if (block.type === 'h2') {
          rendered.push(<h2 key={idx} className="text-xl font-black text-blue-900 dark:text-blue-400 mt-8 mb-4">{parseBoldText(block.content || '')}</h2>);
        } else if (block.type === 'h3') {
          rendered.push(<h3 key={idx} className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-6 mb-3 border-b pb-2">{parseBoldText(block.content || '')}</h3>);
        } else if (block.type === 'h4') {
          rendered.push(<h4 key={idx} className="text-base font-bold text-slate-800 dark:text-slate-200 mt-5 mb-2">{parseBoldText(block.content || '')}</h4>);
        }
      }
    });

    flushGrid('final');
    return rendered;
  };

  const blocks = parseMarkdownToBlocks(txt);
  const hasSubsections = blocks.some(b => b.type === 'h4');
  if (hasSubsections) {
    const intro: MarkdownBlock[] = [];
    const subsections: { title: string; blocks: MarkdownBlock[] }[] = [];
    let currentSub: { title: string; blocks: MarkdownBlock[] } | null = null;
    blocks.forEach(block => {
      if (block.type === 'h4') {
        currentSub = { title: block.content || '', blocks: [] };
        subsections.push(currentSub);
      } else {
        if (currentSub) {
          currentSub.blocks.push(block);
        } else {
          intro.push(block);
        }
      }
    });
    return (
      <div className="space-y-6">
        {intro.length > 0 && <div className="space-y-3">{renderBlocks(intro)}</div>}
        {subsections.map((sub, subIdx) => {
          let Icon = Megaphone;
          const lowerTitle = sub.title.toLowerCase();
          if (lowerTitle.includes('perfil')) Icon = Award;
          return (
            <div key={subIdx} className="bg-slate-50/50 p-5 rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-1 border-b">
                <Icon className="h-4.5 w-4.5 text-blue-600" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{sub.title}</h4>
              </div>
              {renderBlocks(sub.blocks)}
            </div>
          );
        })}
      </div>
    );
  }
  return renderBlocks(blocks);
};

const DollarSign = (props: any) => (
  <svg xmlns="http://www.w3.org/2050/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export function CompetitorsAnalysisClient({ businessId, businessName, initialCompetitors, myAnalysesByChannel }: any) {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>(initialCompetitors[0]?.id || "");
  const [requestingIdChannel, setRequestingIdChannel] = useState<string | null>(null); // e.g. "comp1_WEBSITE"
  const [comparisonChannel, setComparisonChannel] = useState("WEBSITE");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<any>(null);
  const [showFullGeneralReport, setShowFullGeneralReport] = useState(false);
  const [showFullDiagnostic, setShowFullDiagnostic] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchReport();
  }, [businessId]);

  // Sincronizar el estado con las propiedades del servidor al mutar (ej. borrar)
  useEffect(() => {
    setCompetitors(initialCompetitors);
    // Si el competidor seleccionado ya no existe en la nueva lista, seleccionar el primero disponible
    if (initialCompetitors.length > 0 && !initialCompetitors.some((c: any) => c.id === selectedCompetitorId)) {
      setSelectedCompetitorId(initialCompetitors[0].id);
    }
  }, [initialCompetitors]);



  const fetchReport = async (silent = false) => {
    try {
      if (!silent) {
        setLoadingReport(true);
      }
      const response = await fetch(`/api/competitors/${businessId}/general-report`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        if (data.executiveSummary) {
          let text = data.executiveSummary;
          if (typeof text === 'string') {
            let textTrimmed = text.trim();
            if (textTrimmed.startsWith('```')) {
              textTrimmed = textTrimmed.replace(/^```(?:json)?\s*/i, '');
              textTrimmed = textTrimmed.replace(/\s*```$/, '');
              textTrimmed = textTrimmed.trim();
            }
            if (textTrimmed.startsWith('{')) {
              try {
                const parsed = JSON.parse(textTrimmed);
                setExecutiveSummary(parsed.executiveSummary || parsed);
              } catch (e) {
                const parsed = extractExecutiveSummaryFromBadJson(textTrimmed);
                setExecutiveSummary(parsed);
              }
            } else {
              setExecutiveSummary(text);
            }
          } else {
            setExecutiveSummary(text);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching general report:', err);
    } finally {
      if (!silent) {
        setLoadingReport(false);
      }
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const response = await fetch(`/api/competitors/${businessId}/generate-general-report`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchReport(true);
        toast.success("¡Informe general generado con éxito!");
      } else {
        toast.error("Error al generar el informe general.");
      }
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error("Error al generar el informe general.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const getFlatRecommendations = (reportData: any) => {
    if (!reportData) return [];

    // Si viene el objeto con el wrapper de prisma
    let data = reportData;
    if (reportData.data) {
      data = typeof reportData.data === "string" ? JSON.parse(reportData.data) : reportData.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data[0].output || data[0];
      }
    }

    // Formato directo / consolidado
    if (Array.isArray(data.strategic_recommendations)) return data.strategic_recommendations;
    if (Array.isArray(data.recommendations)) return data.recommendations;
    if (Array.isArray(data.contentRecs)) return data.contentRecs;

    const recs = data.strategic_recommendations || {};

    const brandingRecs = recs.branding_recommendations || [];
    const marketingRecs = recs.marketing_recommendations || [];
    const seoRecs = recs.seo_recommendations || [];
    const uxRecs = recs.ux_recommendations || [];
    const convRecs = recs.conversion_recommendations || [];

    if (brandingRecs.length > 0 || marketingRecs.length > 0 || seoRecs.length > 0 || uxRecs.length > 0 || convRecs.length > 0) {
      return [
        ...brandingRecs,
        ...marketingRecs,
        ...seoRecs,
        ...uxRecs,
        ...convRecs,
      ];
    }

    // Si tiene recomendaciones en texto o listado bajo otros nombres (ej. de Instagram o Facebook)
    if (Array.isArray(data.marketing_insights?.content_recommendations)) {
      return data.marketing_insights.content_recommendations;
    }
    if (Array.isArray(data.marketing_insights?.contentRecs)) {
      return data.marketing_insights.contentRecs;
    }
    if (Array.isArray(data.content_recommendations)) {
      return data.content_recommendations;
    }
    if (Array.isArray(data.strategic_recommendations)) {
      return data.strategic_recommendations;
    }
    if (Array.isArray(data.recommendations)) {
      return data.recommendations;
    }

    const isNewestStructure = !!data.brand_identity || !!data.business_insights || !!data.website_analysis;
    if (isNewestStructure) {
      const bInsights = data.business_insights || {};
      const dQuality = data.data_quality || {};
      const mainWeaknesses = bInsights.main_weaknesses || [];
      const missingInfo = dQuality.missing_information || [];

      const weaknessesStr = mainWeaknesses.join(" ").toLowerCase();
      const missingStr = missingInfo.join(" ").toLowerCase();
      const arr = [];

      if (weaknessesStr.includes("branding") || weaknessesStr.includes("marca") || missingStr.includes("social")) {
        arr.push("Fortalecer tu identidad de marca local con storytelling enfocado en cercanía e historia comunitaria.");
      } else {
        arr.push("Destacar tu propuesta de valor diferenciada (ej. envíos rápidos, ingredientes premium) frente a su posicionamiento estándar.");
      }

      if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
        arr.push("Implementar campañas de generación de prospectos dirigidas a WhatsApp o formularios de contacto de respuesta inmediata.");
      } else {
        arr.push("Promocionar dinámicamente tus productos en la zona de influencia geográfica donde el competidor tiene mayor tracción.");
      }

      if (weaknessesStr.includes("seo") || missingStr.includes("seo") || missingStr.includes("metadatos")) {
        arr.push("Optimizar tus etiquetas meta (Title, Description) con geolocalización clara (ej: 'Tortas en Santa Cruz').");
      } else {
        arr.push("Crear contenido de blog apuntando a las intenciones de búsqueda informativas que ellos están desaprovechando.");
      }

      if (weaknessesStr.includes("producto") || missingStr.includes("producto")) {
        arr.push("Diseñar un catálogo digital intuitivo con fotos en alta resolución e información detallada de cada producto.");
      } else {
        arr.push("Asegurar una velocidad de carga móvil impecable y navegación fluida para capturar el tráfico móvil frustrado de la competencia.");
      }

      if (weaknessesStr.includes("carrito") || weaknessesStr.includes("checkout") || weaknessesStr.includes("commerce")) {
        arr.push("Habilitar un flujo de checkout simple o pedidos vía WhatsApp en 2 clics para superar su falta de e-commerce.");
      } else {
        arr.push("Implementar pop-ups de salida con ofertas exclusivas o descuentos de primera compra para aumentar la tasa de conversión.");
      }

      return arr;
    }

    // Fallback absoluto: si no hay ninguna de las estructuras de arriba, buscar cualquier propiedad que termine en "recommendations" o "recs" y sea un array
    for (const key in data) {
      if (key.toLowerCase().includes("recommendation") || key.toLowerCase().includes("rec")) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
      }
    }

    return [];

    return [];
  };

  const handleRequestAnalysis = async (compId: string, channel: string, url: string) => {
    const key = `${compId}_${channel}`;
    const promise = new Promise(async (resolve, reject) => {
      try {
        setRequestingIdChannel(key);
        const res = await fetch("/api/analysis/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "COMPETITOR",
            entityId: compId,
            channel,
            url,
          }),
        });
        if (res.ok) {
          router.refresh();
          resolve(true);
        } else {
          const errData = await res.json().catch(() => ({}));
          reject(new Error(errData.details || errData.error || "Error al solicitar el análisis."));
        }
      } catch (error: any) {
        reject(error);
      } finally {
        setRequestingIdChannel(null);
      }
    });

    toast.promise(promise, {
      loading: `Enviando sitio de competencia a analizar a n8n...`,
      success: `¡Análisis iniciado! El agente de IA de n8n está escaneando el sitio web en segundo plano.`,
      error: (err: any) => err.message || "Error al iniciar el análisis en n8n.",
    });
  };

  // Extract all cards (competitor + channel combination)
  const cards: any[] = [];
  competitors.forEach((comp: any) => {
    const channelConfigs = [
      { key: "website", name: "WEBSITE", label: "Sitio Web", icon: Globe, color: "text-blue-500", url: comp.website },
      { key: "facebook", name: "FACEBOOK", label: "Facebook", icon: Facebook, color: "text-blue-600", url: comp.facebook },
      { key: "instagram", name: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "text-pink-500", url: comp.instagram },
      { key: "tiktok", name: "TIKTOK", label: "TikTok", icon: TikTokIcon, color: "text-black dark:text-white", url: comp.tiktok },
      { key: "linkedin", name: "LINKEDIN", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", url: comp.linkedin },
      { key: "youtube", name: "YOUTUBE", label: "YouTube", icon: Youtube, color: "text-red-600", url: comp.youtube },
      { key: "seoGoogle", name: "SEO_GOOGLE", label: "SEO Google", icon: Search, color: "text-green-600", url: comp.seoGoogle },
    ];

    channelConfigs.forEach((chConfig) => {
      if (chConfig.url) {
        cards.push({
          competitorId: comp.id,
          competitorName: comp.name,
          channel: chConfig.name,
          label: chConfig.label,
          icon: chConfig.icon,
          color: chConfig.color,
          url: chConfig.url,
          report: comp.reportsByChannel?.[chConfig.name] || null,
        });
      }
    });
  });

  const renderExecutiveSummaryObject = (summaryObj: any) => {
    if (!summaryObj) return null;
    const pg = summaryObj.panoramaGlobal || {};
    const opGaps = summaryObj.oportunidadesGaps || {};
    const estPos = summaryObj.estrategiaPosicionamiento || {};
    const estCont = summaryObj.estrategiaContenidos || {};

    return (
      <div className="space-y-6">
        {/* Resumen Ejecutivo */}
        {pg.resumen && (
          <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100/50">
            <h3 className="text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wider flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Resumen Ejecutivo
            </h3>
            <p className="text-sm text-slate-705 leading-relaxed">{pg.resumen}</p>
          </div>
        )}

        {/* Grid de Panorama Digital */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pg.digitalizacion && (
            <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Digitalización</h4>
              <p className="text-xs text-slate-705 leading-relaxed">{pg.digitalizacion}</p>
            </div>
          )}
          {pg.branding && (
            <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Branding General</h4>
              <p className="text-xs text-slate-705 leading-relaxed">{pg.branding}</p>
            </div>
          )}
          {pg.interaccion && (
            <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interacción y Engagement</h4>
              <p className="text-xs text-slate-705 leading-relaxed">{pg.interaccion}</p>
            </div>
          )}
        </div>

        {/* Observaciones Clave */}
        {pg.observacionesClave && pg.observacionesClave.length > 0 && (
          <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              Observaciones Clave del Mercado
            </h4>
            <ul className="space-y-1.5">
              {pg.observacionesClave.map((o: string, i: number) => (
                <li key={i} className="text-xs text-slate-650 flex gap-1.5 items-start">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Posicionamiento Estratégico y Propuesta de Valor */}
        {estPos.propuestaValor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-emerald-50/30 rounded-xl p-3.5 border border-emerald-100/50">
              <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" />
                Propuesta de Valor Sugerida
              </h4>
              <p className="text-xs text-emerald-950/80 leading-relaxed">{estPos.propuestaValor}</p>
              {estPos.anguloComunicacion && (
                <div className="mt-2.5 pt-2 border-t border-emerald-100/40">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Ángulo recomendado</span>
                  <span className="text-xs text-emerald-900 font-semibold">{estPos.anguloComunicacion}</span>
                </div>
              )}
            </div>

            {/* Dolores y Formatos Desatendidos */}
            <div className="bg-rose-50/30 rounded-xl p-3.5 border border-rose-100/50">
              <h4 className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                Oportunidades de Diferenciación (Brechas)
              </h4>
              {opGaps.necesidadesNoResueltas && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Necesidades no resueltas</span>
                  <p className="text-xs text-rose-950/80 leading-relaxed">{opGaps.necesidadesNoResueltas}</p>
                </div>
              )}
              {opGaps.formatosDesatendidos && (
                <div className="pt-2 border-t border-rose-100/40">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Formatos desatendidos</span>
                  <p className="text-xs text-rose-950/80 leading-relaxed">{opGaps.formatosDesatendidos}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grid de Recomendaciones Clave y Canales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Oportunidades de Crecimiento */}
          {opGaps.oportunidadesCrecimiento && opGaps.oportunidadesCrecimiento.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Oportunidades de Crecimiento
              </h3>
              <div className="space-y-2">
                {opGaps.oportunidadesCrecimiento.map((op: any, i: number) => (
                  <div key={i} className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{op.titulo}</span>
                      <p className="text-xs text-slate-707 leading-relaxed">{op.accion}</p>
                    </div>
                    <Badge variant={op.impacto === 'Alto' ? 'default' : 'secondary'} className="text-[9px] uppercase tracking-wide px-1.5 py-0">
                      Impacto: {op.impacto}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frecuencia y Estrategia de Contenidos */}
          {estCont.pilaresContenido && estCont.pilaresContenido.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Pilares de Contenido Sugeridos
              </h3>
              <div className="bg-blue-50/10 border border-blue-100/50 rounded-xl p-3 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {estCont.pilaresContenido.map((pilar: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50/20">
                      {pilar}
                    </Badge>
                  ))}
                </div>
                {estCont.frecuenciaCanal && estCont.frecuenciaCanal.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Frecuencia por Canal</span>
                    <div className="space-y-1">
                      {estCont.frecuenciaCanal.map((freq: string, i: number) => (
                        <div key={i} className="text-xs text-slate-650 flex gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{freq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Competitors that have a completed report for the active comparison channel
  const completedCompetitors = competitors.filter(
    (c: any) => c.reportsByChannel?.[comparisonChannel]?.status === "COMPLETED" && c.reportsByChannel?.[comparisonChannel]?.data
  );

  const activeMyAnalysis = myAnalysesByChannel?.[comparisonChannel];

  const isAnyRequesting = requestingIdChannel !== null;
  const isAnyPending = cards.some((card: any) => card.report?.status === "PENDING" || card.report?.status === "PROCESSING");
  const isAnyAnalyzing = isAnyRequesting || isAnyPending;


  // Lógica de navegación entre competidores
  const handlePrevCompetitor = () => {
    if (competitors.length === 0) return;
    const currentIndex = competitors.findIndex((c: any) => c.id === selectedCompetitorId);
    const prevIndex = (currentIndex - 1 + competitors.length) % competitors.length;
    setSelectedCompetitorId(competitors[prevIndex].id);
  };

  const handleNextCompetitor = () => {
    if (competitors.length === 0) return;
    const currentIndex = competitors.findIndex((c: any) => c.id === selectedCompetitorId);
    const nextIndex = (currentIndex + 1) % competitors.length;
    setSelectedCompetitorId(competitors[nextIndex].id);
  };

  const selectedCompetitor = competitors.find((c: any) => c.id === selectedCompetitorId);

  // Obtener análisis estratégico individual consolidado o generar un diagnóstico dinámico a partir de sus canales
  const getSelectedCompetitorAnalysis = () => {
    if (!selectedCompetitor) return null;

    // Si tiene un reporte general propio del informe de IA (strategicAnalysis), usarlo directamente
    if (selectedCompetitor.insights?.strategicAnalysis) {
      return selectedCompetitor.insights.strategicAnalysis;
    }

    // Intentar extraer de los reportes del competidor (todos los canales posibles)
    const channelMap: Record<string, { key: string; label: string }> = {
      WEBSITE: { key: "WEBSITE", label: "Sitio Web" },
      FACEBOOK: { key: "FACEBOOK", label: "Facebook" },
      INSTAGRAM: { key: "INSTAGRAM", label: "Instagram" },
      TIKTOK: { key: "TIKTOK", label: "TikTok" },
      LINKEDIN: { key: "LINKEDIN", label: "LinkedIn" },
      YOUTUBE: { key: "YOUTUBE", label: "YouTube" },
      SEO_GOOGLE: { key: "SEO_GOOGLE", label: "SEO Google" },
    };

    const fortalezas: string[] = [];
    const debilidades: string[] = [];
    const recomendaciones: string[] = [];

    // Procesar cada canal que tenga datos completados
    for (const [chKey, chConfig] of Object.entries(channelMap)) {
      const report = selectedCompetitor.reportsByChannel?.[chKey];
      if (!report || report.status !== "COMPLETED" || !report.data) continue;

      const data = normalizeReportData(report.data);
      if (!data) continue;

      const chName = chConfig.label;

      // ══════════════════ FORTALEZAS ══════════════════
      const strengthSources: any[] = [
        data.business_insights?.main_strengths,
        data.business_insights?.differentiators,
        data.ux_analysis?.ux_strengths,
        data.competitive_observations?.main_strengths,
        data.competitive_observations?.differentiators,
        data.competitive_insights?.strengths,
        data.content_analysis?.top_performing_content,
        data.content_analysis?.content_pillars,
        data.branding_analysis?.brand_personality,
        data.engagement_analysis?.social_proof_signals,
        data.community_analysis?.audience_loyalty_indicators,
        data.strengths,
        // Instagram especifico
        data.instagram_presence?.brand_summary ? [data.instagram_presence.brand_summary] : null,
        // Facebook especifico
        data.competitive_observations?.customer_perception_indicators,
        data.products,
        data.topics,
      ];

      for (const src of strengthSources) {
        if (!src) continue;
        const items = Array.isArray(src) ? src : (typeof src === "string" ? [src] : []);
        items.slice(0, 3).forEach((item: any) => {
          if (item && typeof item === "string" && fortalezas.length < 15) {
            fortalezas.push(`${item} (${chName})`);
          }
        });
        if (fortalezas.filter(f => f.endsWith(`(${chName})`)).length >= 3) break;
      }

      // ══════════════════ DEBILIDADES ══════════════════
      const weaknessSources: any[] = [
        data.business_insights?.main_weaknesses,
        data.ux_analysis?.ux_weaknesses,
        data.competitive_observations?.main_weaknesses,
        data.competitive_insights?.weaknesses,
        data.data_quality?.missing_information,
        data.growthOps, // Facebook agregado
        data.weaknesses,
      ];

      for (const src of weaknessSources) {
        if (!src) continue;
        const items = Array.isArray(src) ? src : (typeof src === "string" ? [src] : []);
        items.slice(0, 3).forEach((item: any) => {
          if (item && typeof item === "string" && debilidades.length < 15) {
            debilidades.push(`${item} (${chName})`);
          }
        });
        if (debilidades.filter(d => d.endsWith(`(${chName})`)).length >= 3) break;
      }

      // ══════════════════ RECOMENDACIONES ══════════════════
      const recSources: any[] = [
        data.strategic_recommendations,
        data.recommendations,
        data.contentRecs,
        data.content_recommendations,
        data.marketing_insights?.content_recommendations,
        data.competitive_insights?.opportunities,
        data.growthOps,
      ];

      for (const src of recSources) {
        if (!src) continue;
        const items = Array.isArray(src) ? src : (typeof src === "string" ? [src] : []);
        items.slice(0, 3).forEach((item: any) => {
          if (item && typeof item === "string" && recomendaciones.length < 15) {
            recomendaciones.push(`${item} (${chName})`);
          }
        });
        if (recomendaciones.filter(r => r.endsWith(`(${chName})`)).length >= 3) break;
      }

      // Fallback de recomendaciones basado en debilidades del canal
      if (recomendaciones.filter(r => r.endsWith(`(${chName})`)).length === 0) {
        const chanWeaks = debilidades.filter(d => d.endsWith(`(${chName})`));
        if (chanWeaks.length > 0) {
          recomendaciones.push(`Aprovechar las brechas detectadas en ${chName} de la competencia para diferenciarte con contenido de mayor valor. (${chName})`);
        }
      }
    }

    // Si no hay ninguna información de scraping real, no retornar nada
    if (fortalezas.length === 0 && debilidades.length === 0 && recomendaciones.length === 0) {
      return null;
    }

    return {
      desempenoCanales: fortalezas,
      debilidadesGaps: debilidades,
      planContramedida: recomendaciones
    };
  };

  const strategicAnalysisIndividual = getSelectedCompetitorAnalysis();

  // Filtrar tarjetas para mostrar solo las del competidor seleccionado
  const filteredCards = cards.filter((card: any) => card.competitorId === selectedCompetitorId);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análisis de Competidores: {businessName}</h2>
          <p className="text-muted-foreground text-sm">
            Monitorea y compara los canales digitales de tu competencia.
          </p>
        </div>
      </div>

      {/* Consolidated AI General Report */}
      {loadingReport ? (
        <Card className="border-none shadow-sm bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm text-muted-foreground">Cargando informe general...</p>
          </CardContent>
        </Card>
      ) : executiveSummary ? (
        <Card className="bg-gradient-to-br from-blue-50/40 via-white to-white border-blue-100/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-950">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Informe General de Competidores (IA)
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="gap-2 text-blue-750 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generatingReport ? 'animate-spin' : ''}`} />
              {generatingReport ? 'Generando...' : 'Actualizar Informe'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pb-4">
            <div className={`relative transition-all duration-500 ease-in-out overflow-hidden ${!showFullGeneralReport ? 'max-h-[380px]' : 'max-h-[5000px]'}`}>
              {typeof executiveSummary === 'object' ? renderExecutiveSummaryObject(executiveSummary) : parseMarkdown(executiveSummary)}
              {!showFullGeneralReport && (
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-905 dark:via-slate-905/90 pointer-events-none" />
              )}
            </div>
            <div className="flex justify-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullGeneralReport(!showFullGeneralReport)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                {showFullGeneralReport ? "Ver menos detalles" : "Ver informe completo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-dashed border-blue-200 bg-blue-50/10">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Sparkles className="h-10 w-10 text-blue-400 mb-3 animate-pulse" />
            <h3 className="text-md font-bold text-blue-950">Informe General no generado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Consolida la información de todos los canales de tus competidores para generar un informe estratégico general con inteligencia artificial.
            </p>
            <Button 
              onClick={handleGenerateReport} 
              disabled={generatingReport}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando Informe...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Informe General con IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Subsección: Diagnóstico Particular por Competidor */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-1">
              <Compass className="h-5 w-5 text-blue-500" />
              Diagnóstico Particular por Competidor
            </h3>
            <p className="text-xs text-muted-foreground">
              Navega y visualiza el análisis específico del competidor seleccionado.
            </p>
          </div>

          {/* Selector de Competidores con Flechas */}
          {competitors.length > 0 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 border-muted-foreground/20 hover:bg-muted" 
                onClick={handlePrevCompetitor}
              >
                <ChevronLeft className="h-4 w-4 text-slate-700" />
              </Button>
              <Select 
                value={selectedCompetitorId} 
                onValueChange={(val) => setSelectedCompetitorId(val)}
              >
                <SelectTrigger className="w-[200px] h-9 font-semibold text-slate-800">
                  <SelectValue placeholder="Competidor" />
                </SelectTrigger>
                <SelectContent>
                  {competitors.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="font-medium">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 border-muted-foreground/20 hover:bg-muted" 
                onClick={handleNextCompetitor}
              >
                <ChevronRight className="h-4 w-4 text-slate-700" />
              </Button>
            </div>
          )}
        </div>

        {/* Renderizado de Diagnóstico Estratégico del Competidor Seleccionado */}
        {selectedCompetitor && (
          strategicAnalysisIndividual ? (
            <Card className="bg-gradient-to-br from-indigo-50/20 via-white to-white border-indigo-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-indigo-100/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-md font-bold text-indigo-950 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-650" />
                      Diagnóstico Estratégico: {selectedCompetitor.name} (IA)
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Análisis particular del competidor e insights de posicionamiento.
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="gap-1.5 text-xs text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
                  >
                    <RefreshCw className={`h-3 w-3 ${generatingReport ? 'animate-spin' : ''}`} />
                    Actualizar Informe
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                <div className={`relative transition-all duration-500 ease-in-out overflow-hidden ${!showFullDiagnostic ? 'max-h-[220px]' : 'max-h-[2000px]'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Desempeño de Canales */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Desempeño de Canales
                      </h4>
                      <ul className="space-y-2">
                        {((typeof strategicAnalysisIndividual === 'object' && strategicAnalysisIndividual.desempenoCanales) 
                          ? strategicAnalysisIndividual.desempenoCanales 
                          : []).map((item: string, i: number) => (
                          <li key={i} className="text-xs text-slate-650 leading-relaxed flex items-start gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Debilidades e Identificación de Brechas */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Debilidades e Identificación de Brechas
                      </h4>
                      <ul className="space-y-2">
                        {((typeof strategicAnalysisIndividual === 'object' && strategicAnalysisIndividual.debilidadesGaps) 
                          ? strategicAnalysisIndividual.debilidadesGaps 
                          : []).map((item: string, i: number) => (
                          <li key={i} className="text-xs text-slate-650 leading-relaxed flex items-start gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Plan de Acción Contramedida */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        Plan de Acción Contramedida
                      </h4>
                      <ul className="space-y-2">
                        {((typeof strategicAnalysisIndividual === 'object' && strategicAnalysisIndividual.planContramedida) 
                          ? strategicAnalysisIndividual.planContramedida 
                          : []).map((item: string, i: number) => (
                          <li key={i} className="text-xs text-slate-650 leading-relaxed flex items-start gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {!showFullDiagnostic && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-905 dark:via-slate-905/90 pointer-events-none" />
                  )}
                </div>
                <div className="flex justify-center pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullDiagnostic(!showFullDiagnostic)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                  >
                    {showFullDiagnostic ? "Ver menos detalles" : "Ver diagnóstico completo"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed border-slate-200 bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="h-8 w-8 text-slate-400 mb-2 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-700">Diagnóstico Estratégico no disponible para {selectedCompetitor.name}</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Asegúrate de que este competidor tenga al menos un canal escaneado y completado para extraer fortalezas, debilidades y planes de acción contramedida automáticamente.
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Tarjetas de Análisis ({filteredCards.length})</TabsTrigger>
          <TabsTrigger value="comparison" disabled={completedCompetitors.length === 0 || !activeMyAnalysis}>
            Tabla Comparativa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCards.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl mt-6">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold">Sin canales digitales</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-4">
                    Asegúrate de que tus competidores tengan configurados enlaces a Sitio Web, Facebook, Instagram o TikTok en su perfil para analizarlos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCards.map((card: any, idx: number) => {
                const report = card.report;
                const isPending = report?.status === "PENDING" || report?.status === "PROCESSING";
                const isRequesting = requestingIdChannel === `${card.competitorId}_${card.channel}`;
                const isCompleted = report?.status === "COMPLETED" && report?.data;
                const isError = report?.status === "ERROR";
                const theme = getPlatformTheme(card.channel);

                // Normalize data
                let dataObj: any = null;
                if (report?.data) {
                  dataObj = typeof report.data === "string" ? JSON.parse(report.data) : report.data;
                  if (Array.isArray(dataObj) && dataObj.length > 0) {
                    dataObj = dataObj[0].output || dataObj[0];
                  }
                }

                // TikTok specific metrics extraction
                let tiktokFollowers = "N/D";
                let tiktokLikes = "N/D";
                let tiktokVideos = "N/D";
                let tiktokAverageViews = "N/D";
                let tiktokUsername = "N/D";

                if (card.channel === "TIKTOK" && isCompleted) {
                  const seoSignals = dataObj?.seo_signals || dataObj?.marketing_signals?.seo_signals;
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

                  if (dataObj?.tiktok_presence) {
                    if (tiktokFollowers === "N/D") tiktokFollowers = dataObj.tiktok_presence.followers?.toString() || "N/D";
                    if (tiktokLikes === "N/D") tiktokLikes = dataObj.tiktok_presence.likes?.toString() || "N/D";
                    if (tiktokVideos === "N/D") tiktokVideos = dataObj.tiktok_presence.videos_count?.toString() || "N/D";
                    tiktokUsername = dataObj.tiktok_presence.username || "N/D";
                  }

                  if (dataObj?.profile) {
                    if (tiktokFollowers === "N/D") tiktokFollowers = dataObj.profile.followers !== undefined ? dataObj.profile.followers.toLocaleString() : "N/D";
                    if (tiktokLikes === "N/D") tiktokLikes = dataObj.profile.total_likes !== undefined ? dataObj.profile.total_likes.toLocaleString() : "N/D";
                    if (tiktokVideos === "N/D") tiktokVideos = dataObj.profile.total_videos !== undefined ? dataObj.profile.total_videos.toLocaleString() : "N/D";
                    if (tiktokUsername === "N/D") tiktokUsername = dataObj.profile.username || "N/D";
                  }

                  if (dataObj?.engagement) {
                    if (tiktokAverageViews === "N/D") tiktokAverageViews = dataObj.engagement.views !== undefined ? dataObj.engagement.views.toLocaleString() : "N/D";
                  }

                  if (tiktokFollowers === "N/D" || tiktokLikes === "N/D" || tiktokVideos === "N/D" || tiktokUsername === "N/D") {
                    const rawData = report?.data ? (typeof report.data === "string" ? JSON.parse(report.data) : report.data) : null;
                    const firstItem = Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : null;
                    const author = dataObj?.authorMeta || firstItem?.authorMeta;
                    if (author) {
                      if (tiktokFollowers === "N/D") tiktokFollowers = author.fans !== undefined ? author.fans.toLocaleString() : "N/D";
                      if (tiktokLikes === "N/D") tiktokLikes = author.heart !== undefined ? author.heart.toLocaleString() : "N/D";
                      if (tiktokVideos === "N/D") tiktokVideos = author.video !== undefined ? author.video.toLocaleString() : "N/D";
                      if (tiktokUsername === "N/D") tiktokUsername = author.name || author.nickName || "N/D";
                    }
                  }
                }

                const isInstagramStructure = !!dataObj?.instagram_presence || !!dataObj?.engagement_analysis || !!dataObj?.content_analysis;
                const isFacebookStructure = !!dataObj?.social_intelligence || !!dataObj?.facebook_presence || !!dataObj?.brand_positioning || !!dataObj?.strategic_diagnostics;
                const isWebsiteStructure = !!dataObj?.brand_identity || !!dataObj?.website_analysis || !!dataObj?.business_insights;
                const isConsolidatedStructure = !!dataObj?.marketPosition || !!dataObj?.executiveSummary || !!dataObj?.strategicRecommendations;

                // Extract Instagram specific data
                const socialPresence = dataObj?.instagram_presence || {};
                const engagement = dataObj?.engagement_analysis || {};
                const compObs = dataObj?.competitive_observations || {};

                // Extract Website/Consolidated preview metrics
                let positionVal = "N/D";
                let advantageVal = "N/D";
                let gapVal = "N/D";
                let priorityVal = "N/D";

                if (isWebsiteStructure) {
                  positionVal = dataObj?.brand_identity?.market_positioning || dataObj?.brand_identity?.brand_summary || "N/D";
                  advantageVal = dataObj?.business_insights?.differentiators?.[0] || dataObj?.business_insights?.main_strengths?.[0] || "N/D";
                  gapVal = dataObj?.business_insights?.product_or_service_focus?.[0] || dataObj?.website_analysis?.content_focus?.[0] || "N/D";
                  priorityVal = dataObj?.data_quality?.confidence_score ? `Confianza: ${Math.round(dataObj.data_quality.confidence_score * 100)}%` : "Alta";
                } else if (isConsolidatedStructure) {
                  positionVal = dataObj?.marketPosition?.currentPosition || "N/D";
                  advantageVal = dataObj?.marketPosition?.competitiveAdvantage || "N/D";
                  gapVal = dataObj?.marketPosition?.marketGap || "N/D";
                  priorityVal = dataObj?.channelStrategy?.channelPriorities?.WEBSITE ? `Prioridad Web: ${dataObj.channelStrategy.channelPriorities.WEBSITE}` : "Alta";
                }

                return (
                  <Card key={idx} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-opacity-50 flex flex-col justify-between overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className={`p-2.5 rounded-xl ${theme.gradient} ${theme.border} border shrink-0`}>
                            <card.icon className={`h-5 w-5 ${theme.text}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/85 leading-none mb-1">
                              {card.competitorName}
                            </p>
                            <CardTitle className="text-base font-bold flex items-center gap-1">
                              <span className="truncate">{card.label}</span>
                              {isCompleted && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                              )}
                            </CardTitle>
                            {card.url ? (
                              <a
                                href={card.url.startsWith("http") ? card.url : `https://${card.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground mt-0.5 hover:text-primary hover:underline cursor-pointer transition-colors block truncate max-w-full"
                                title={card.url}
                              >
                                {card.url}
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground mt-0.5 block">N/D</span>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={isCompleted ? "secondary" : isPending ? "secondary" : isError ? "destructive" : "outline"}
                          className={`${isCompleted ? `${theme.gradient} ${theme.text} border ${theme.border}` : ""} pointer-events-none shrink-0 text-[10px] px-2 py-0.5`}
                        >
                          {isPending || isRequesting ? (
                            <>
                              <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                              Analizando
                            </>
                          ) : isCompleted ? (
                            "Completado"
                          ) : isError ? (
                            "Error"
                          ) : (
                            "Pendiente"
                          )}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 min-w-0">
                      {card.channel === "TIKTOK" && isCompleted ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Users className={`h-4 w-4 ${theme.text}`} />
                              <span>Seguidores</span>
                            </div>
                            <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2" title={tiktokFollowers}>{tiktokFollowers}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Heart className={`h-4 w-4 ${theme.text}`} />
                              <span>Likes totales</span>
                            </div>
                            <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2" title={tiktokLikes}>{tiktokLikes}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Activity className={`h-4 w-4 ${theme.text}`} />
                              <span>Engagement</span>
                            </div>
                            <span className="font-semibold text-foreground text-right capitalize truncate flex-1 min-w-0 ml-2" title={dataObj?.engagement?.engagement_level || "N/D"}>
                              {dataObj?.engagement?.engagement_level || "N/D"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Globe className={`h-4 w-4 ${theme.text}`} />
                              <span>Enlaces</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs truncate flex-1 min-w-0 ml-2">
                              {(() => {
                                const web = dataObj?.business_signals?.website_present;
                                const wa = dataObj?.business_signals?.whatsapp_present;
                                if (web && wa) return "Web y WhatsApp";
                                if (web) return "Solo Web";
                                if (wa) return "Solo WhatsApp";
                                return "Ninguno";
                              })()}
                            </span>
                          </div>
                        </div>
                      ) : isFacebookStructure && isCompleted ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Users className={`h-4 w-4 ${theme.text}`} />
                              <span>Seguidores</span>
                            </div>
                            <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2">
                              {(() => {
                                const presence = dataObj?.facebook_presence || {};
                                const metrics = presence.audience_metrics || {};
                                return formatSocialMetric(metrics.followers ?? metrics.likes ?? dataObj?.social_intelligence?.audience_size);
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Activity className={`h-4 w-4 ${theme.text}`} />
                              <span>Actividad (Talking)</span>
                            </div>
                            <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2">
                              {(() => {
                                const presence = dataObj?.facebook_presence || {};
                                const metrics = presence.audience_metrics || {};
                                return formatSocialMetric(metrics.talking_about_count ?? dataObj?.social_intelligence?.engagement_level);
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Briefcase className={`h-4 w-4 ${theme.text}`} />
                              <span>Categoría</span>
                            </div>
                            <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2" title={dataObj?.facebook_presence?.business_category || dataObj?.brand_positioning?.niche || "N/D"}>
                              {dataObj?.facebook_presence?.business_category || dataObj?.brand_positioning?.niche || "N/D"}
                            </span>
                          </div>
                        </div>
                      ) : isInstagramStructure && isCompleted ? (() => {
                        const followers = (() => {
                          const visibility = compObs.visibility_indicators;
                          const socialProof = engagement.social_proof_signals;
                          
                          if (visibility && Array.isArray(visibility)) {
                            for (const indicator of visibility) {
                              if (typeof indicator === 'string' && indicator.toLowerCase().includes('seguidor')) {
                                const match = indicator.match(/[\d.]+[KkMm]?/);
                                if (match) return match[0];
                              }
                            }
                          }
                          
                          if (socialProof && Array.isArray(socialProof)) {
                            for (const signal of socialProof) {
                                if (typeof signal === 'string' && signal.toLowerCase().includes('seguidor')) {
                                  const match = signal.match(/[\d.]+[KkMm]?/);
                                  if (match) return match[0];
                                }
                            }
                          }
                          
                          return socialPresence.audience_size?.followers;
                        })();

                        const posts = socialPresence.audience_size?.posts_count || dataObj.instagram_presence?.audience_size?.posts_count;
                        const following = socialPresence.audience_size?.following || dataObj.instagram_presence?.audience_size?.following;
                        const engagementLevel = dataObj?.engagement_analysis?.engagement_level || 
                                                dataObj?.engagement_analysis?.current_activity_level || 
                                                dataObj?.community_analysis?.current_activity_level;

                        const branding = dataObj?.branding_analysis || {};
                        const brandPersonality = branding.brand_personality || [];
                        const emotionalTone = branding.emotional_tone || [];
                        const category = socialPresence.business_category || socialPresence.business_category_name || dataObj?.instagram_presence?.business_category;

                        const hasFollowers = followers !== undefined && followers !== null && followers !== "" && followers !== "N/D" && followers !== "N/A";
                        const hasPosts = posts !== undefined && posts !== null && posts !== "" && posts !== "N/D" && followers !== "N/A";
                        const hasFollowing = following !== undefined && following !== null && following !== "" && following !== "N/D" && followers !== "N/A";
                        const hasEngagement = engagementLevel !== undefined && engagementLevel !== null && engagementLevel !== "" && engagementLevel !== "N/D" && followers !== "N/A";

                        return (
                          <div className="space-y-2.5">
                            {hasFollowers && (
                              <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                  <Users className={`h-4 w-4 ${theme.text}`} />
                                  <span>Seguidores</span>
                                </div>
                                <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2">{formatSocialMetric(followers)}</span>
                              </div>
                            )}
                            {hasPosts && (
                              <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                  <FileText className={`h-4 w-4 ${theme.text}`} />
                                  <span>Publicaciones</span>
                                </div>
                                <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2">{posts}</span>
                              </div>
                            )}
                            {hasFollowing && (
                              <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                  <Users className={`h-4 w-4 ${theme.text}`} />
                                  <span>Siguiendo</span>
                                </div>
                                <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2">{following}</span>
                              </div>
                            )}
                            {hasEngagement && (
                              <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                  <Activity className={`h-4 w-4 ${theme.text}`} />
                                  <span>Engagement</span>
                                </div>
                                <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2">{engagementLevel}</span>
                              </div>
                            )}
                            {category && (
                              <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                  <Briefcase className={`h-4 w-4 ${theme.text}`} />
                                  <span>Categoría</span>
                                </div>
                                <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2" title={category}>{category}</span>
                              </div>
                            )}
                            {brandPersonality && brandPersonality.length > 0 && (
                              <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                  <Sparkles className={`h-4 w-4 ${theme.text}`} />
                                  <span>Personalidad</span>
                                </div>
                                <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2" title={brandPersonality.join(", ")}>
                                  {brandPersonality.slice(0, 2).join(", ")}
                                </span>
                              </div>
                            )}
                            {emotionalTone && emotionalTone.length > 0 && (
                              <div className="flex items-center justify-between text-sm gap-3 min-w-0">
                                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                  <Smile className={`h-4 w-4 ${theme.text}`} />
                                  <span>Tono Emocional</span>
                                </div>
                                <span className="font-semibold text-foreground text-right truncate flex-1 min-w-0 ml-2" title={emotionalTone.join(", ")}>
                                  {emotionalTone.slice(0, 2).join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })() : (isWebsiteStructure || isConsolidatedStructure) && isCompleted ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Compass className={`h-4 w-4 ${theme.text}`} />
                              <span>Posición</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs truncate flex-1 min-w-0 ml-2" title={positionVal}>
                              {positionVal}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Award className={`h-4 w-4 ${theme.text}`} />
                              <span>Ventaja</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs truncate flex-1 min-w-0 ml-2" title={advantageVal}>
                              {advantageVal}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm pb-1.5 border-b border-border/40 gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Target className={`h-4 w-4 ${theme.text}`} />
                              <span>Enfoque / Brecha</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs truncate flex-1 min-w-0 ml-2" title={gapVal}>
                              {gapVal}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm gap-3 min-w-0">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                              <Zap className={`h-4 w-4 ${theme.text}`} />
                              <span>Estado / Confianza</span>
                            </div>
                            <span className="font-semibold text-foreground text-right text-xs truncate flex-1 min-w-0 ml-2" title={priorityVal}>
                              {priorityVal}
                            </span>
                          </div>
                        </div>
                      ) : isCompleted && dataObj ? (
                        <div className="space-y-2">
                          {dataObj.market_positioning && (
                            <div className="bg-muted/30 rounded p-2 text-sm">
                              <p className="text-xs text-muted-foreground mb-1">Posicionamiento</p>
                              <p className="font-medium line-clamp-2">{dataObj.market_positioning}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          {isPending || isRequesting ? (
                            <p className="text-xs text-slate-400 py-2">
                              Obteniendo datos del canal en segundo plano...
                            </p>
                          ) : isError ? (
                            <div className="flex items-center justify-center gap-2 text-red-500">
                              <AlertCircle className="h-4 w-4" />
                              <span>Error en el análisis</span>
                            </div>
                          ) : (
                            <span>Sin análisis aún</span>
                          )}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-0 flex gap-2">
                      {isCompleted && (
                        <Button
                          onClick={() => setSelectedReport(report)}
                          variant="secondary"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 font-semibold h-8"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Ver informe
                        </Button>
                      )}
                      <Button
                        onClick={() => handleRequestAnalysis(card.competitorId, card.channel, card.url)}
                        disabled={isAnyAnalyzing}
                        variant="outline"
                        size="sm"
                        className={`gap-1.5 text-xs h-8 ${isCompleted ? "flex-1" : "w-full"}`}
                      >
                        {isRequesting || isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {report ? "Reanalizar" : "Analizar canal"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="border border-indigo-100 dark:border-indigo-950/40 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-indigo-950 dark:text-white">
                  <Sparkles className="h-5 w-5 text-indigo-650" />
                  Yo vs Competencia
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Comparativa directa de posicionamiento, fortalezas y recomendaciones estratégicas.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Canal:</span>
                <Select value={comparisonChannel} onValueChange={setComparisonChannel}>
                  <SelectTrigger className="w-[180px] h-9 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                    <SelectValue placeholder="Selecciona canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEBSITE" className="font-medium">Sitio Web</SelectItem>
                    <SelectItem value="FACEBOOK" className="font-medium">Facebook</SelectItem>
                    <SelectItem value="INSTAGRAM" className="font-medium">Instagram</SelectItem>
                    <SelectItem value="TIKTOK" className="font-medium">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {completedCompetitors.length === 0 || !activeMyAnalysis ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Sparkles className="h-10 w-10 text-indigo-300 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-350">Análisis comparativo no disponible para {comparisonChannel}</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
                    Asegúrate de que tanto tu negocio como al menos uno de tus competidores tengan análisis marcados como 'Completado' en este canal.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="block lg:hidden text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mb-1 text-right animate-pulse">
                    ← Desliza horizontalmente para ver la tabla completa →
                  </div>
                  <div className="w-full overflow-x-auto border rounded-xl border-slate-100 dark:border-slate-800 shadow-inner">
                    <Table className="w-full min-w-[850px] table-fixed border-collapse">
                      <TableHeader>
                        <TableRow className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50/70 border-b border-slate-100 dark:border-slate-800">
                          <TableHead className="w-[180px] font-bold text-xs uppercase tracking-wider text-slate-500 py-4 pl-6">Métrica / Aspecto</TableHead>
                          <TableHead className="w-[280px] font-extrabold text-sm text-indigo-700 bg-indigo-50/25 dark:bg-indigo-950/30 dark:text-indigo-400 py-4 px-4 border-x border-slate-100/40 dark:border-slate-800/40 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                              Mi Negocio
                            </div>
                          </TableHead>
                          {completedCompetitors.map((c: any) => (
                            <TableHead key={c.id} className="w-[280px] font-bold text-sm text-slate-800 dark:text-slate-100 py-4 px-4 text-center">{c.name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Posicionamiento */}
                        <TableRow className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/20 transition-colors">
                          <TableCell className="w-[180px] font-extrabold text-xs uppercase tracking-wider text-slate-500 py-5 pl-6 align-top whitespace-normal break-words">Posicionamiento</TableCell>
                          <TableCell className="w-[280px] align-top bg-indigo-50/10 dark:bg-indigo-950/10 text-xs font-semibold text-indigo-950 dark:text-indigo-300 py-5 px-4 leading-relaxed border-x border-slate-100/20 text-center whitespace-normal break-words">
                            {activeMyAnalysis?.data?.brand_identity?.market_positioning || activeMyAnalysis?.data?.competitor_overview?.market_positioning || activeMyAnalysis?.data?.market_positioning || activeMyAnalysis?.data?.title || "No disponible"}
                          </TableCell>
                          {completedCompetitors.map((c: any) => (
                            <TableCell key={c.id} className="w-[280px] align-top text-xs py-5 px-4 text-slate-700 dark:text-slate-300 leading-relaxed text-center font-medium whitespace-normal break-words">
                              {c.reportsByChannel?.[comparisonChannel]?.data?.brand_identity?.market_positioning || c.reportsByChannel?.[comparisonChannel]?.data?.competitor_overview?.market_positioning || c.reportsByChannel?.[comparisonChannel]?.data?.market_positioning || c.reportsByChannel?.[comparisonChannel]?.data?.title || "No disponible"}
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Fortalezas */}
                        <TableRow className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/20 transition-colors">
                          <TableCell className="w-[180px] font-extrabold text-xs uppercase tracking-wider text-slate-500 py-5 pl-6 align-top whitespace-normal break-words">Fortalezas / Productos</TableCell>
                          <TableCell className="w-[280px] align-top bg-indigo-50/10 dark:bg-indigo-950/10 py-5 px-4 border-x border-slate-100/20 whitespace-normal break-words">
                            {(() => {
                              const raw = activeMyAnalysis?.data?.business_insights?.main_strengths || activeMyAnalysis?.data?.ux_analysis?.ux_strengths || activeMyAnalysis?.data?.competitive_insights?.main_strengths || activeMyAnalysis?.data?.strengths || activeMyAnalysis?.data?.products || [];
                              const list = Array.isArray(raw) ? raw : [raw];
                              return (
                                <ul className="space-y-1.5 pl-2">
                                  {list.slice(0, 3).map((p: string, i: number) => (
                                    <li key={i} className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-start gap-1.5 whitespace-normal break-words">
                                      <span className="text-emerald-500 mt-0.5 font-black">•</span>
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              );
                            })()}
                          </TableCell>
                          {completedCompetitors.map((c: any) => (
                            <TableCell key={c.id} className="w-[280px] align-top py-5 px-4 whitespace-normal break-words">
                              {(() => {
                                const data = c.reportsByChannel?.[comparisonChannel]?.data;
                                const raw = data?.business_insights?.main_strengths || data?.ux_analysis?.ux_strengths || data?.competitive_insights?.main_strengths || data?.strengths || data?.products || [];
                                const list = Array.isArray(raw) ? raw : [raw];
                                return (
                                  <ul className="space-y-1.5 pl-2">
                                    {list.slice(0, 3).map((p: string, i: number) => (
                                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-start gap-1.5 whitespace-normal break-words">
                                        <span className="text-slate-400 mt-0.5">•</span>
                                        <span>{p}</span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              })()}
                            </TableCell>
                          ))}
                        </TableRow>
    
                        {/* Debilidades */}
                        <TableRow className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/20 transition-colors">
                          <TableCell className="w-[180px] font-extrabold text-xs uppercase tracking-wider text-slate-500 py-5 pl-6 align-top whitespace-normal break-words">Debilidades / Brechas</TableCell>
                          <TableCell className="w-[280px] align-top bg-indigo-50/10 dark:bg-indigo-950/10 py-5 px-4 border-x border-slate-100/20 whitespace-normal break-words">
                            {(() => {
                              const raw = activeMyAnalysis?.data?.business_insights?.main_weaknesses || activeMyAnalysis?.data?.ux_analysis?.ux_weaknesses || activeMyAnalysis?.data?.competitive_insights?.main_weaknesses || activeMyAnalysis?.data?.weaknesses || activeMyAnalysis?.data?.promotions || [];
                              const list = Array.isArray(raw) ? raw : [raw];
                              return (
                                <ul className="space-y-1.5 pl-2">
                                  {list.slice(0, 3).map((p: string, i: number) => (
                                    <li key={i} className="text-xs text-rose-600 dark:text-rose-450 font-semibold flex items-start gap-1.5 whitespace-normal break-words">
                                      <span className="text-rose-500 mt-0.5 font-black">•</span>
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              );
                            })()}
                          </TableCell>
                          {completedCompetitors.map((c: any) => (
                            <TableCell key={c.id} className="w-[280px] align-top py-5 px-4 whitespace-normal break-words">
                              {(() => {
                                const data = c.reportsByChannel?.[comparisonChannel]?.data;
                                const raw = data?.business_insights?.main_weaknesses || data?.ux_analysis?.ux_weaknesses || data?.competitive_insights?.main_weaknesses || data?.weaknesses || data?.promotions || [];
                                const list = Array.isArray(raw) ? raw : [raw];
                                return (
                                  <ul className="space-y-1.5 pl-2">
                                    {list.slice(0, 3).map((p: string, i: number) => (
                                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-start gap-1.5 whitespace-normal break-words">
                                        <span className="text-slate-400 mt-0.5">•</span>
                                        <span>{p}</span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              })()}
                            </TableCell>
                          ))}
                        </TableRow>
    
                        {/* Recomendaciones */}
                        <TableRow className="hover:bg-slate-50/20 transition-colors">
                          <TableCell className="w-[180px] font-extrabold text-xs uppercase tracking-wider text-slate-500 py-5 pl-6 align-top whitespace-normal break-words">Recomendaciones Clave</TableCell>
                          <TableCell className="w-[280px] align-top bg-indigo-50/10 dark:bg-indigo-950/10 py-5 px-4 border-x border-slate-100/20 whitespace-normal break-words">
                            <ul className="space-y-2.5 pl-2">
                              {getFlatRecommendations(activeMyAnalysis?.data).slice(0, 3).map((r: string, i: number) => (
                                <li key={i} className="text-xs text-indigo-950 dark:text-indigo-350 leading-relaxed font-semibold flex items-start gap-1.5 whitespace-normal break-words">
                                  <ChevronRight className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                          {completedCompetitors.map((c: any) => (
                            <TableCell key={c.id} className="w-[280px] align-top py-5 px-4 whitespace-normal break-words">
                              <ul className="space-y-2.5 pl-2">
                                {getFlatRecommendations(c.reportsByChannel?.[comparisonChannel]?.data).slice(0, 3).map((r: string, i: number) => (
                                  <li key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium flex items-start gap-1.5 whitespace-normal break-words">
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Informe Completo */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[80vh] flex flex-col p-0 overflow-hidden border border-muted/50 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Informe de Inteligencia Competitiva IA
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 text-muted-foreground">
                  Análisis de presencia digital para canal <span className="font-semibold text-blue-500">{selectedReport?.channel}</span> ({selectedReport?.url})
                </DialogDescription>
              </div>
              {selectedReport && (
                <Badge className="bg-green-500 text-white font-bold text-[10px] px-2 py-0.5">
                  LISTO
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedReport?.data && (() => {
              const dataObj = normalizeReportData(selectedReport.data);
              if (!dataObj) return null;
              
              const isNewestStructure = !!dataObj.brand_identity || !!dataObj.business_insights;
              const isNewStructure = !!dataObj.competitor_overview;
              // Detectar estructura social (nueva y antigua)
              const isSocialStructure = !!dataObj.facebook_presence || !!dataObj.instagram_presence || !!dataObj.tiktok_presence || !!dataObj.branding_analysis || !!dataObj.business_intelligence || !!dataObj.community_analysis || !!dataObj.isAggregatedFacebook;
              
              // Detectar estructura específica de Instagram
              const isInstagramStructure = (!!dataObj.instagram_presence || !!dataObj.engagement_analysis || !!dataObj.content_analysis) && selectedReport?.channel !== "TIKTOK";

              if (isNewestStructure || isNewStructure || isSocialStructure) {
                let overview: any = {};
                let mkt: any = {};
                let ux: any = {};
                let insights: any = {};
                let recs: any = {};
                let dataQuality: any = null;

                const socialPresence = dataObj.facebook_presence || dataObj.instagram_presence || dataObj.tiktok_presence || {};
                const branding = dataObj.branding_analysis || {};
                // Nuevo esquema: community_analysis + reputation_analysis + business_intelligence
                const communityAnalysis = dataObj.community_analysis || {};
                const reputationAnalysis = dataObj.reputation_analysis || {};
                const bizSignals = dataObj.business_intelligence || dataObj.business_signals || {};
                const compObs = dataObj.competitive_observations || {};
                const dQualityObj = dataObj.data_quality || {};
                // Normalizar engagement fusionando estructuras antigua y nueva
                const engagement: any = {
                  ...(dataObj.engagement_analysis || {}),
                  engagement_level: communityAnalysis.current_activity_level ?? dataObj.engagement_analysis?.engagement_level,
                  social_proof_signals: reputationAnalysis.social_proof_signals ?? dataObj.engagement_analysis?.social_proof_signals ?? [],
                  reputation_indicators: reputationAnalysis.trust_signals ?? [],
                  audience_loyalty_indicators: communityAnalysis.audience_loyalty_indicators ?? dataObj.engagement_analysis?.audience_loyalty_indicators ?? [],
                  community_activity_signals: communityAnalysis.community_engagement_signals ?? dataObj.engagement_analysis?.community_activity_signals ?? [],
                };

                if (isSocialStructure) {
                  overview = {
                    market_positioning: branding.brand_positioning_indicators?.[0] || `${socialPresence.brand_name || "Canal Social"} - ${socialPresence.business_category || "Presencia Social"}`,
                    brand_summary: socialPresence.brand_summary,
                    brand_personality: branding.brand_personality || [],
                    emotional_tone: branding.emotional_tone || [],
                  };

                  mkt = {
                    marketing_tactics: [
                      ...(bizSignals.advertising_signals || []),
                      ...(bizSignals.platform_usage_maturity || []),
                      ...(branding.communication_style || []),
                    ],
                    conversion_elements: bizSignals.conversion_signals || [],
                    seo_signals: bizSignals.commercial_signals || [],
                    content_strategy: branding.visual_branding_signals || [],
                    social_proof_signals: [
                      ...(bizSignals.trust_signals || []),
                      ...(engagement.social_proof_signals || []),
                    ],
                  };

                  ux = {
                    ux_strengths: compObs.main_strengths || [],
                    ux_weaknesses: compObs.main_weaknesses || [],
                    navigation_observations: socialPresence.local_presence_signals || [],
                    conversion_friction_points: compObs.customer_perception_indicators || [],
                    mobile_experience_observations: socialPresence.brand_maturity_indicators || [],
                  };

                  insights = {
                    differentiation_opportunities: compObs.differentiators || [],
                    market_gaps: dQualityObj.missing_information || [],
                    customer_psychology_insights: branding.brand_personality || [],
                  };

                  recs = dataObj.strategic_recommendations || {
                    branding_recommendations: branding.brand_positioning_indicators || [],
                    marketing_recommendations: bizSignals.advertising_signals || [],
                    seo_recommendations: bizSignals.commercial_signals || [],
                    ux_recommendations: compObs.visibility_indicators || [],
                    conversion_recommendations: bizSignals.conversion_signals || [],
                  };

                  dataQuality = {
                    confidence_score: dQualityObj.confidence_score,
                    missing_information: dQualityObj.missing_information,
                    analysis_limitations: dQualityObj.analysis_limitations,
                  };
                } else if (isNewestStructure) {
                  const bIdentity = dataObj.brand_identity || {};
                  const wAnalysis = dataObj.website_analysis || {};
                  const mSignals = dataObj.marketing_signals || {};
                  const bInsights = dataObj.business_insights || {};
                  const dQuality = dataObj.data_quality || {};

                  overview = {
                    market_positioning: bIdentity.market_positioning,
                    brand_summary: bIdentity.brand_summary,
                    brand_personality: bIdentity.brand_personality,
                    emotional_tone: bIdentity.emotional_tone,
                  };

                  mkt = {
                    marketing_tactics: mSignals.marketing_tactics,
                    conversion_elements: wAnalysis.conversion_elements,
                    seo_signals: mSignals.seo_signals,
                    content_strategy: wAnalysis.content_focus,
                    social_proof_signals: wAnalysis.trust_signals,
                  };

                  ux = {
                    ux_strengths: bInsights.main_strengths,
                    ux_weaknesses: bInsights.main_weaknesses,
                    navigation_observations: wAnalysis.ux_observations,
                    conversion_friction_points: bInsights.customer_experience_indicators,
                    mobile_experience_observations: wAnalysis.navigation_structure,
                  };

                  insights = {
                    differentiation_opportunities: bInsights.differentiators,
                    market_gaps: dQuality.missing_information,
                    customer_psychology_insights: bIdentity.target_audience,
                  };

                  recs = dataObj.strategic_recommendations || {};

                  dataQuality = {
                    confidence_score: dQuality.confidence_score,
                    missing_information: dQuality.missing_information,
                    analysis_limitations: dQuality.analysis_limitations,
                  };
                } else {
                  overview = dataObj.competitor_overview || {};
                  mkt = dataObj.marketing_analysis || {};
                  ux = dataObj.ux_analysis || {};
                  insights = dataObj.competitive_insights || {};
                  recs = dataObj.strategic_recommendations || {};
                }


                const brandingRecs = recs.branding_recommendations || [];
                const marketingRecs = recs.marketing_recommendations || [];
                const seoRecs = recs.seo_recommendations || [];
                const uxRecs = recs.ux_recommendations || [];
                const convRecs = recs.conversion_recommendations || [];

                const finalBranding = brandingRecs.length > 0 ? brandingRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("branding") || weaknessesStr.includes("marca") || missingStr.includes("social")) {
                    arr.push("Fortalecer tu identidad de marca local con storytelling enfocado en cercanía e historia comunitaria.");
                  }
                  if (missingStr.includes("redes") || weaknessesStr.includes("redes")) {
                    arr.push("Lanzar campañas de branding multicanal en Instagram y TikTok para capitalizar su total ausencia en redes.");
                  }
                  if (arr.length === 0) {
                    arr.push("Destacar tu propuesta de valor diferenciada (ej. envíos rápidos, ingredientes premium) frente a su posicionamiento estándar.");
                  }
                  return arr;
                })();

                const finalMarketing = marketingRecs.length > 0 ? marketingRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
                    arr.push("Implementar campañas de generación de prospectos dirigidas a WhatsApp o formularios de contacto de respuesta inmediata.");
                  }
                  if (weaknessesStr.includes("seo") || missingStr.includes("seo")) {
                    arr.push("Lanzar pauta segmentada localmente en Google Ads para keywords clave antes de que resuelvan su SEO.");
                  }
                  if (arr.length === 0) {
                    arr.push("Promocionar dinámicamente tus productos en la zona de influencia geográfica donde el competidor tiene mayor tracción.");
                  }
                  return arr;
                })();

                const finalSeo = seoRecs.length > 0 ? seoRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("seo") || weaknessesStr.includes("seo") || missingStr.includes("metadatos")) {
                    arr.push("Optimizar tus etiquetas meta (Title, Description) con geolocalización clara (ej: 'Tortas en Santa Cruz').");
                    arr.push("Crear contenido de blog apuntando a las intenciones de búsqueda informativas que ellos están desaprovechando.");
                  } else {
                    arr.push("Monitorear sus palabras clave secundarias para superarlos en el ranking de búsquedas locales.");
                  }
                  return arr;
                })();

                const finalUx = uxRecs.length > 0 ? uxRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("producto") || missingStr.includes("producto")) {
                    arr.push("Diseñar un catálogo digital intuitivo con fotos en alta resolución e información detallada de cada producto.");
                  }
                  if (weaknessesStr.includes("contacto") || missingStr.includes("contacto")) {
                    arr.push("Mantener canales de atención y botones de contacto siempre visibles en la cabecera y pie de página de tu web.");
                  }
                  if (arr.length === 0) {
                    arr.push("Asegurar una velocidad de carga móvil impecable y navegación fluida para capturar el tráfico móvil frustrado de la competencia.");
                  }
                  return arr;
                })();

                const finalConversion = convRecs.length > 0 ? convRecs : (() => {
                  const arr = [];
                  const weaknessesStr = (ux.ux_weaknesses || []).join(" ").toLowerCase();
                  const missingStr = (insights.market_gaps || []).join(" ").toLowerCase();
                  if (weaknessesStr.includes("carrito") || weaknessesStr.includes("checkout") || weaknessesStr.includes("commerce")) {
                    arr.push("Habilitar un flujo de checkout simple o pedidos vía WhatsApp en 2 clics para superar su falta de e-commerce.");
                  }
                  if (weaknessesStr.includes("fidelización") || weaknessesStr.includes("loyalty")) {
                    arr.push("Crear un sistema de recompensas o club de lealtad digital para competir frontalmente con su programa de fidelización.");
                  }
                  if (arr.length === 0) {
                    arr.push("Implementar pop-ups de salida con ofertas exclusivas o descuentos de primera compra para aumentar la tasa de conversión.");
                  }
                  return arr;
                })();

                const hasRecommendations = true;

                if (isSocialStructure) {
                  const theme = getPlatformTheme(selectedReport?.channel);
                  const confidenceScore = dQualityObj.confidence_score ?? dataObj.confidence_score;

                  return (
                    <div className="space-y-4">
                      {/* CABECERA SIMPLE */}
                      <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-5 rounded-xl border shadow-sm`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xl font-bold text-foreground">
                                {socialPresence.brand_name || "Nombre del Canal"}
                              </h3>
                              {socialPresence.business_category && (
                                <Badge variant="outline" className={`text-[10px] font-bold ${theme.text} ${theme.iconBg} border-none`}>
                                  {socialPresence.business_category}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              {(socialPresence.brand_summary || "Sin resumen disponible.").replace(/\n/g, " • ")}
                            </p>
                          </div>
                          {confidenceScore != null && confidenceScore > 0 && (
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Confianza IA</span>
                              <Badge className="text-xs font-bold bg-green-500 text-white border-none py-0.5 px-2">
                                {(confidenceScore * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* MÉTRICAS PRINCIPALES */}
                      <div className={`grid grid-cols-2 ${selectedReport?.channel === "FACEBOOK" ? "md:grid-cols-3" : "md:grid-cols-4"} gap-3`}>
                        {selectedReport?.channel === "TIKTOK" ? (
                          <>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Users className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Seguidores</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">
                                {formatSocialMetric(socialPresence.followers)}
                              </p>
                            </div>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Heart className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Me gusta</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">
                                {formatSocialMetric(socialPresence.likes)}
                              </p>
                            </div>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <FileText className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Videos</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">
                                {formatSocialMetric(socialPresence.videos_count)}
                              </p>
                            </div>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <TikTokIcon className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Username</span>
                              </div>
                              <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                                @{socialPresence.username || "N/D"}
                              </p>
                            </div>
                          </>
                        ) : isInstagramStructure ? (
                          <>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Users className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Seguidores</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">
                                {(() => {
                                  const visibility = dataObj.competitive_observations?.visibility_indicators;
                                  const socialProof = dataObj.engagement_analysis?.social_proof_signals;
                                  
                                  // Debug: show raw data
                                  if (visibility && visibility.length > 0) {
                                    console.log('Visibility indicators:', visibility);
                                  }
                                  if (socialProof && socialProof.length > 0) {
                                    console.log('Social proof signals:', socialProof);
                                  }
                                  
                                  // Try to extract followers from visibility_indicators
                                  if (visibility && Array.isArray(visibility)) {
                                    for (const indicator of visibility) {
                                      if (typeof indicator === 'string' && indicator.toLowerCase().includes('seguidor')) {
                                        const match = indicator.match(/[\d.]+[KkMm]?/);
                                        if (match) return match[0];
                                      }
                                    }
                                  }
                                  
                                  // Try to extract from social_proof_signals
                                  if (socialProof && Array.isArray(socialProof)) {
                                    for (const signal of socialProof) {
                                      if (typeof signal === 'string' && signal.toLowerCase().includes('seguidor')) {
                                        const match = signal.match(/[\d.]+[KkMm]?/);
                                        if (match) return match[0];
                                      }
                                    }
                                  }
                                  
                                  // Fallback
                                  return dataObj.instagram_presence?.audience_size?.followers || "N/D";
                                })()}
                              </p>
                            </div>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <FileText className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Publicaciones</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">
                                {socialPresence.audience_size?.posts_count || dataObj.instagram_presence?.audience_size?.posts_count || "N/D"}
                              </p>
                            </div>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Users className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Siguiendo</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">
                                {socialPresence.audience_size?.following || dataObj.instagram_presence?.audience_size?.following || "N/D"}
                              </p>
                            </div>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Instagram className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Username</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground truncate">
                                {socialPresence.username || socialPresence.brand_name || dataObj.instagram_presence?.username || dataObj.instagram_presence?.brand_name || "N/D"}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Users className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Seguidores</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">
                                {formatSocialMetric(socialPresence.audience_metrics?.followers ?? socialPresence.audience_size?.followers)}
                              </p>
                            </div>
                            {selectedReport?.channel !== "FACEBOOK" && (
                              <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <ThumbsUp className={`h-3.5 w-3.5 ${theme.text}`} />
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Likes</span>
                                </div>
                                <p className="text-lg font-semibold text-foreground">
                                  {formatSocialMetric(socialPresence.audience_metrics?.likes ?? socialPresence.audience_size?.likes)}
                                </p>
                              </div>
                            )}
                            <div className={`bg-gradient-to-br ${theme.gradient} ${theme.border} p-3 rounded-lg border shadow-sm`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Activity className={`h-3.5 w-3.5 ${theme.text}`} />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Actividad</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">
                                {formatSocialMetric(socialPresence.audience_metrics?.talking_about_count ?? socialPresence.audience_size?.talking_about)}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 p-3 rounded-lg shadow-sm">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Star className="h-3.5 w-3.5 text-orange-600" />
                                <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Reputación</span>
                              </div>
                              <p className="text-lg font-semibold text-orange-600">
                                {reputationAnalysis.recommendation_percentage != null
                                  ? `${reputationAnalysis.recommendation_percentage}%`
                                  : reputationAnalysis.total_reviews != null
                                    ? formatSocialMetric(reputationAnalysis.total_reviews)
                                    : "N/D"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* INFORMACIÓN ORGANIZADA EN SECCIONES - Grid horizontal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Sección de Presencia */}
                        <Card className="p-4 border border-muted/50 shadow-sm">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4" /> Presencia Local
                          </h4>
                          <div className="space-y-2">
                            {socialPresence.local_presence_signals && socialPresence.local_presence_signals.length > 0 ? (
                              socialPresence.local_presence_signals.map((p: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No se detectaron señales de ubicación física.</p>
                            )}
                          </div>

                          {/* Inteligencia de Negocio inline */}
                          <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 flex items-center gap-2 mb-2 mt-4 pt-3 border-t border-muted/30">
                            <Briefcase className="h-4 w-4" /> Inteligencia de Negocio
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {bizSignals.website_present !== undefined && (
                              <Badge variant={bizSignals.website_present ? "default" : "secondary"} className={`text-[10px] font-bold ${bizSignals.website_present ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                Web: {bizSignals.website_present ? "Sí" : "No"}
                              </Badge>
                            )}
                            {bizSignals.advertising_active !== undefined && (
                              <Badge variant={bizSignals.advertising_active ? "default" : "secondary"} className={`text-[10px] font-bold ${bizSignals.advertising_active ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                Ads: {bizSignals.advertising_active ? "Activa" : "Inactiva"}
                              </Badge>
                            )}
                            {bizSignals.phone_contact_available !== undefined && (
                              <Badge variant={bizSignals.phone_contact_available ? "default" : "secondary"} className={`text-[10px] font-bold ${bizSignals.phone_contact_available ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                Tel: {bizSignals.phone_contact_available ? "Sí" : "No"}
                              </Badge>
                            )}
                            {bizSignals.price_range_indicator && (
                              <Badge variant="outline" className="text-[10px] font-bold border-teal-500/20 bg-teal-500/10 text-teal-700">
                                Precio: {bizSignals.price_range_indicator}
                              </Badge>
                            )}
                            {reputationAnalysis.recommendation_percentage != null && (
                              <Badge variant="outline" className="text-[10px] font-bold border-green-500/20 bg-green-500/10 text-green-700">
                                Rec: {reputationAnalysis.recommendation_percentage}%
                              </Badge>
                            )}
                          </div>
                        </Card>

                        {/* Sección de Fortalezas */}
                        <Card className="p-4 border border-muted/50 shadow-sm">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4" /> Fortalezas
                          </h4>
                          <div className="space-y-2">
                            {compObs.main_strengths && compObs.main_strengths.length > 0 ? (
                              compObs.main_strengths.map((s: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{s}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No se detectaron fortalezas específicas.</p>
                            )}
                          </div>

                          {/* Debilidades inline */}
                          <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 flex items-center gap-2 mb-2 mt-4 pt-3 border-t border-muted/30">
                            <AlertCircle className="h-4 w-4" /> Debilidades
                          </h4>
                          <div className="space-y-2">
                            {compObs.main_weaknesses && compObs.main_weaknesses.length > 0 ? (
                              compObs.main_weaknesses.map((s: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                                  <span>{s}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No se detectaron debilidades específicas.</p>
                            )}
                          </div>
                        </Card>

                        {/* Sección de Recomendaciones */}
                        <Card className="p-4 border border-blue-500/10 bg-blue-500/5 shadow-sm">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4" /> Recomendaciones Clave
                          </h4>
                          <div className="space-y-2">
                            {getFlatRecommendations(dataObj).slice(0, 5).map((rec: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <ChevronRight className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </div>
                            ))}
                            {getFlatRecommendations(dataObj).length === 0 && (
                              <p className="text-xs text-muted-foreground italic">No hay recomendaciones disponibles.</p>
                            )}
                          </div>
                        </Card>
                      </div>

                      {/* CALIDAD Y LIMITACIONES */}
                      {dQualityObj && (dQualityObj.missing_information?.length > 0 || dQualityObj.analysis_limitations?.length > 0) && (
                        <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 space-y-3">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-orange-600 flex items-center gap-2 border-b border-orange-500/10 pb-2">
                            <AlertCircle className="h-4 w-4" /> Calidad de los Datos y Limitaciones
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dQualityObj.missing_information && dQualityObj.missing_information.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">Información Faltante</span>
                                <ul className="space-y-1">
                                  {dQualityObj.missing_information.map((p: string, i: number) => (
                                    <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-normal">
                                      <ChevronRight className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {dQualityObj.analysis_limitations && dQualityObj.analysis_limitations.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">Limitaciones del Análisis</span>
                                <ul className="space-y-1">
                                  {dQualityObj.analysis_limitations.map((p: string, i: number) => (
                                    <li key={i} className="flex gap-1.5 text-xs text-muted-foreground leading-normal">
                                      <ChevronRight className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Panel de Métricas Sociales (exclusivo para canales sociales) */}
                    {isSocialStructure && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {socialPresence.audience_size?.followers && (
                          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 p-4 rounded-xl shadow-sm hover:shadow transition-all">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">Seguidores</span>
                            <span className="text-2xl font-extrabold mt-1 block text-foreground">
                              {isNaN(Number(socialPresence.audience_size.followers))
                                ? socialPresence.audience_size.followers
                                : Number(socialPresence.audience_size.followers).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">{socialPresence.market_scope || "Alcance del canal"}</span>
                          </div>
                        )}
                        {socialPresence.audience_size?.likes && (
                          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border border-indigo-500/10 p-4 rounded-xl shadow-sm hover:shadow transition-all">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">Me gusta (Likes)</span>
                            <span className="text-2xl font-extrabold mt-1 block text-foreground">
                              {isNaN(Number(socialPresence.audience_size.likes))
                                ? socialPresence.audience_size.likes
                                : Number(socialPresence.audience_size.likes).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">{socialPresence.business_category || "Categoría de Negocio"}</span>
                          </div>
                        )}
                        {socialPresence.audience_size?.talking_about && (
                          <div className="relative overflow-hidden bg-gradient-to-br from-teal-500/5 to-emerald-500/5 border border-teal-500/10 p-4 rounded-xl shadow-sm hover:shadow transition-all">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 block">Usuarios activos</span>
                            <span className="text-2xl font-extrabold mt-1 block text-foreground">
                              {isNaN(Number(socialPresence.audience_size.talking_about))
                                ? socialPresence.audience_size.talking_about
                                : Number(socialPresence.audience_size.talking_about).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">Interactuando semanalmente</span>
                          </div>
                        )}
                        {engagement.engagement_level && (
                          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10 p-4 rounded-xl shadow-sm hover:shadow transition-all flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">Engagement</span>
                              <span className="text-xl font-extrabold mt-1 block text-purple-700 dark:text-purple-400">
                                {engagement.engagement_level}
                              </span>
                            </div>
                            {socialPresence.audience_size?.reviews_count && (
                              <span className="text-[9px] text-muted-foreground mt-1 block">
                                Basado en {socialPresence.audience_size.reviews_count} reseñas
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 1. Posicionamiento y Resumen */}
                    <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 space-y-3">
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 mb-1">Posicionamiento en el Mercado</h4>
                        <p className="text-sm font-semibold leading-relaxed text-foreground">
                          {overview.market_positioning || "Sin posicionamiento especificado"}
                        </p>
                      </div>
                      {overview.brand_summary && (
                        <div className="pt-2 border-t border-blue-500/10">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-blue-500 mb-1">Resumen de la Marca</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            {overview.brand_summary}
                          </p>
                        </div>
                      )}
                      {(dQualityObj.confidence_score ?? dataObj.confidence_score) != null && (
                        <div className="flex items-center gap-2 pt-2 border-t border-blue-500/10 mt-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nivel de Confianza IA:</span>
                          <Badge variant="outline" className="text-[10px] font-bold py-0 bg-blue-500/10 border-blue-500/20 text-blue-600">
                            {((dQualityObj.confidence_score ?? dataObj.confidence_score) * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Inteligencia Comercial y Reputación */}
                    {(bizSignals.website_present !== undefined || bizSignals.advertising_active !== undefined || bizSignals.phone_contact_available !== undefined || reputationAnalysis.reputation_summary) && (
                      <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/10 space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 flex items-center gap-2">
                          <Briefcase className="h-4 w-4" /> Inteligencia Comercial y Reputación (Facebook)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {reputationAnalysis.reputation_summary && (
                            <Badge variant="outline" className="text-[10px] font-bold border-teal-500/20 bg-teal-500/10 text-teal-700">
                              Reputación: {reputationAnalysis.reputation_summary}
                            </Badge>
                          )}
                          {reputationAnalysis.recommendation_percentage != null && (
                            <Badge variant="outline" className="text-[10px] font-bold border-green-500/20 bg-green-500/10 text-green-700">
                              Recomendado: {reputationAnalysis.recommendation_percentage}%
                            </Badge>
                          )}
                          {bizSignals.website_present !== undefined && (
                            <Badge variant={bizSignals.website_present ? "default" : "secondary"} className={`text-[10px] font-bold ${bizSignals.website_present ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground"}`}>
                              Sitio Web: {bizSignals.website_present ? "Sí" : "No"}
                            </Badge>
                          )}
                          {bizSignals.advertising_active !== undefined && (
                            <Badge variant={bizSignals.advertising_active ? "default" : "secondary"} className={`text-[10px] font-bold ${bizSignals.advertising_active ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground"}`}>
                              Campañas Activas: {bizSignals.advertising_active ? "Sí" : "No"}
                            </Badge>
                          )}
                          {bizSignals.phone_contact_available !== undefined && (
                            <Badge variant={bizSignals.phone_contact_available ? "default" : "secondary"} className={`text-[10px] font-bold ${bizSignals.phone_contact_available ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground"}`}>
                              Contacto Telefónico: {bizSignals.phone_contact_available ? "Sí" : "No"}
                            </Badge>
                          )}
                          {bizSignals.price_range_indicator && (
                            <Badge variant="outline" className="text-[10px] font-bold border-teal-500/20 bg-teal-500/10 text-teal-700">
                              Rango de Precios: {bizSignals.price_range_indicator}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2. Personalidad y Tono */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overview.brand_personality && overview.brand_personality.length > 0 && (
                        <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 mb-2">Personalidad de Marca</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {overview.brand_personality.map((t: string, i: number) => {
                              const translateTag = (tag: string): string => {
                                const translations: Record<string, string> = {
                                  "friendly": "Amigable",
                                  "interactive": "Interactivo",
                                  "playful": "Juguetón / Lúdico",
                                  "approachable": "Accesible",
                                  "community-focused": "Enfocado en la comunidad",
                                  "fun": "Divertido",
                                  "engaging": "Atractivo / Involucrador",
                                  "welcoming": "Acogedor",
                                  "personalized": "Personalizado"
                                };
                                return translations[tag.toLowerCase().trim()] || tag;
                              };
                              return (
                                <Badge key={i} variant="outline" className="text-[10px] font-bold border-purple-500/20 bg-purple-500/10 text-purple-600">
                                  {translateTag(t)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {overview.emotional_tone && overview.emotional_tone.length > 0 && (
                        <div className="bg-pink-500/5 p-4 rounded-xl border border-pink-500/10">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-pink-600 mb-2">Tono Emocional</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {overview.emotional_tone.map((t: string, i: number) => {
                              const translateTag = (tag: string): string => {
                                const translations: Record<string, string> = {
                                  "friendly": "Amigable",
                                  "interactive": "Interactivo",
                                  "playful": "Juguetón / Lúdico",
                                  "approachable": "Accesible",
                                  "community-focused": "Enfocado en la comunidad",
                                  "fun": "Divertido",
                                  "engaging": "Atractivo / Involucrador",
                                  "welcoming": "Acogedor",
                                  "personalized": "Personalizado"
                                };
                                return translations[tag.toLowerCase().trim()] || tag;
                              };
                              return (
                                <Badge key={i} variant="outline" className="text-[10px] font-bold border-pink-500/20 bg-pink-500/10 text-pink-600">
                                  {translateTag(t)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Análisis de Marketing */}
                    <div className="bg-muted/10 p-5 rounded-xl border border-muted/30 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                        Análisis de Marketing y Conversión
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mkt.marketing_tactics && mkt.marketing_tactics.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-teal-600">Tácticas de Marketing</h4>
                            <ul className="space-y-1">
                              {mkt.marketing_tactics.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mkt.conversion_elements && mkt.conversion_elements.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-600">Elementos de Conversión</h4>
                            <ul className="space-y-1">
                              {mkt.conversion_elements.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mkt.seo_signals && mkt.seo_signals.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Señales SEO</h4>
                            <ul className="space-y-1">
                              {mkt.seo_signals.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mkt.content_strategy && mkt.content_strategy.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-purple-600">Estrategia de Contenidos</h4>
                            <ul className="space-y-1">
                              {mkt.content_strategy.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mkt.social_proof_signals && mkt.social_proof_signals.length > 0 && (
                          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2 pt-2 border-t border-muted/20">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-pink-600">Señales de Prueba Social</h4>
                            <ul className="space-y-1">
                              {mkt.social_proof_signals.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. Análisis de Experiencia de Usuario (UX) */}
                    <div className="bg-muted/10 p-5 rounded-xl border border-muted/30 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Experiencia de Usuario (UX)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ux.ux_strengths && ux.ux_strengths.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-emerald-600">Fortalezas UX</h4>
                            <ul className="space-y-1">
                              {ux.ux_strengths.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {ux.ux_weaknesses && ux.ux_weaknesses.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-600">Debilidades UX</h4>
                            <ul className="space-y-1">
                              {ux.ux_weaknesses.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {ux.navigation_observations && ux.navigation_observations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-600">Observaciones de Navegación</h4>
                            <ul className="space-y-1">
                              {ux.navigation_observations.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ux.conversion_friction_points && ux.conversion_friction_points.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-orange-600">Características de Experiencia (CX)</h4>
                            <ul className="space-y-1">
                              {ux.conversion_friction_points.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ux.mobile_experience_observations && ux.mobile_experience_observations.length > 0 && (
                          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2 pt-2 border-t border-muted/20">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Experiencia Móvil</h4>
                            <ul className="space-y-1">
                              {ux.mobile_experience_observations.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Perspectivas Competitivas (Insights) */}
                    <div className="bg-muted/10 p-5 rounded-xl border border-muted/30 space-y-4">
                      <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b pb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
                        Perspectivas Competitivas y Diferenciación
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {insights.differentiation_opportunities && insights.differentiation_opportunities.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-purple-600">Oportunidades de Diferenciación</h4>
                            <ul className="space-y-1">
                              {insights.differentiation_opportunities.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insights.market_gaps && insights.market_gaps.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-amber-600">Gaps del Mercado</h4>
                            <ul className="space-y-1">
                              {insights.market_gaps.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {insights.customer_psychology_insights && insights.customer_psychology_insights.length > 0 && (
                          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2 pt-2 border-t border-muted/20">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-blue-600">Psicología del Consumidor</h4>
                            <ul className="space-y-1">
                              {insights.customer_psychology_insights.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6. Recomendaciones Estratégicas */}
                    <div className="bg-blue-500/5 p-5 rounded-xl border border-blue-500/10 space-y-4">
                      <h3 className="font-bold text-sm text-blue-600 flex items-center gap-2 border-b pb-2">
                        <Sparkles className="h-4 w-4" />
                        Plan de Recomendaciones Estratégicas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {finalBranding && finalBranding.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-purple-600">Branding</h4>
                            <ul className="space-y-1">
                              {finalBranding.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {finalMarketing && finalMarketing.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-teal-600">Marketing</h4>
                            <ul className="space-y-1">
                              {finalMarketing.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {finalSeo && finalSeo.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-blue-600">SEO</h4>
                            <ul className="space-y-1">
                              {finalSeo.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {finalUx && finalUx.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-amber-600">UX / Experiencia</h4>
                            <ul className="space-y-1">
                              {finalUx.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {finalConversion && finalConversion.length > 0 && (
                          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2 pt-2 border-t border-blue-500/10">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-600">Conversión y E-commerce</h4>
                            <ul className="space-y-1">
                              {finalConversion.map((p: string, i: number) => (
                                <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {dataQuality && (
                      <div className="bg-orange-500/5 p-5 rounded-xl border border-orange-500/10 space-y-4">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-orange-600 flex items-center gap-2 border-b pb-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                          Calidad de Datos y Limitaciones del Análisis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dataQuality.missing_information && dataQuality.missing_information.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-bold text-[10px] uppercase tracking-wider text-orange-600">Información Faltante</h4>
                              <ul className="space-y-1">
                                {dataQuality.missing_information.map((p: string, i: number) => (
                                  <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                    <ChevronRight className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                                    <span>{p}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {dataQuality.analysis_limitations && dataQuality.analysis_limitations.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-600">Limitaciones Detectadas</h4>
                              <ul className="space-y-1">
                                {dataQuality.analysis_limitations.map((p: string, i: number) => (
                                  <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                                    <span>{p}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // FALLBACK A ESTRUCTURA ANTIGUA
              return (
                <div className="space-y-6">
                  {/* Posicionamiento y Score */}
                  <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600">Posicionamiento en el Mercado</h4>
                    <p className="text-sm font-medium leading-relaxed text-foreground">
                      {selectedReport.data.market_positioning || selectedReport.data.title || "Sin posicionamiento"}
                    </p>
                    {selectedReport.data.confidence_score && (
                      <div className="flex items-center gap-2 pt-2 border-t border-blue-500/10 mt-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nivel de Confianza IA:</span>
                        <Badge variant="outline" className="text-[10px] font-bold py-0 bg-blue-500/10 border-blue-500/20 text-blue-600">
                          {selectedReport.data.confidence_score * 100}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Personalidad y Tono */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.data.brand_personality && selectedReport.data.brand_personality.length > 0 && (
                      <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-purple-600 mb-2">Personalidad de Marca</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedReport.data.brand_personality || []).map((t: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-bold border-purple-500/20 bg-purple-500/10 text-purple-600">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedReport.data.emotional_tone && selectedReport.data.emotional_tone.length > 0 && (
                      <div className="bg-pink-500/5 p-4 rounded-xl border border-pink-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-pink-600 mb-2">Tono Emocional</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedReport.data.emotional_tone || []).map((t: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-bold border-pink-500/20 bg-pink-500/10 text-pink-600">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fortalezas y Debilidades */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedReport.data.strengths || selectedReport.data.products) && (
                      <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 mb-3">
                          {selectedReport.data.strengths ? "Fortalezas" : "Productos / Servicios"}
                        </h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.strengths || selectedReport.data.products || []).map((p: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(selectedReport.data.weaknesses || selectedReport.data.promotions) && (
                      <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 mb-3">
                          {selectedReport.data.weaknesses ? "Puntos a mejorar / Debilidades" : "Promociones / Ofertas"}
                        </h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.weaknesses || selectedReport.data.promotions || []).map((p: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Audiencia Objetivo y Tacticas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.data.target_audience && selectedReport.data.target_audience.length > 0 && (
                      <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 mb-3">Audiencia Objetivo</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.target_audience || []).map((t: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedReport.data.marketing_tactics && selectedReport.data.marketing_tactics.length > 0 && (
                      <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-teal-600 mb-3">Tácticas de Marketing</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.marketing_tactics || []).map((t: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Observaciones de UX y Señales de SEO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.data.ux_observations && selectedReport.data.ux_observations.length > 0 && (
                      <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 mb-3">Observaciones de Experiencia (UX)</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.ux_observations || []).map((t: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedReport.data.seo_signals && selectedReport.data.seo_signals.length > 0 && (
                      <div className="bg-slate-500/5 p-4 rounded-xl border border-slate-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">Señales e Indicadores SEO</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.seo_signals || []).map((t: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Oportunidades y Recomendaciones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.data.opportunities && selectedReport.data.opportunities.length > 0 && (
                      <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-yellow-600 mb-3">Oportunidades Estratégicas</h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.opportunities || []).map((o: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(selectedReport.data.strategic_recommendations || selectedReport.data.recommendations) && (
                      <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 mb-3">
                          {selectedReport.data.strategic_recommendations ? "Recomendaciones Estratégicas" : "Recomendaciones"}
                        </h4>
                        <ul className="space-y-2">
                          {(selectedReport.data.strategic_recommendations || selectedReport.data.recommendations || []).map((r: string, i: number) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 text-[9px] font-bold px-1.5 py-0.5 rounded">PENDIENTE</Badge>;
    case "PROCESSING":
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded">PROCESANDO</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-500 text-white hover:bg-green-600 text-[9px] font-bold px-1.5 py-0.5 rounded">LISTO</Badge>;
    case "ERROR":
      return <Badge className="bg-red-500 text-white hover:bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded">ERROR</Badge>;
    default:
      return <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0.5 rounded">{status}</Badge>;
  }
}
