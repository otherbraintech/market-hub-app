'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Download, TrendingUp, Users, Globe, Facebook, Instagram as InstagramIcon, Linkedin, Youtube, Search, Sparkles, CheckCircle2, AlertCircle, Target, Lightbulb, DollarSign, Award, Megaphone, Zap, Heart, FileText, Package, Tag, Handshake, Shield, Palette, BookOpen, Video, Star, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CampaignForm } from '@/components/campaigns/campaign-form';
import { toast } from 'sonner';

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
  if (!trimmed.startsWith('{')) {
    return text;
  }
  
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.executiveSummary) {
      return parsed.executiveSummary;
    }
  } catch (e) {
    console.warn("Standard JSON parse failed in extractor, trying regex/manual extraction", e);
  }
  
  try {
    const cleaned = cleanJsonString(trimmed);
    const parsed = JSON.parse(cleaned);
    if (parsed.executiveSummary) {
      return parsed.executiveSummary;
    }
  } catch (e) {
    console.warn("Cleaned JSON parse failed, trying manual scan...", e);
  }
  
  try {
    const key = '"executiveSummary"';
    const keyIdx = trimmed.indexOf(key);
    if (keyIdx !== -1) {
      let colonIdx = trimmed.indexOf(':', keyIdx + key.length);
      if (colonIdx !== -1) {
        let quoteIdx = trimmed.indexOf('"', colonIdx + 1);
        if (quoteIdx !== -1) {
          const valStart = quoteIdx + 1;
          let valEnd = -1;
          for (let i = valStart; i < trimmed.length; i++) {
            if (trimmed[i] === '"') {
              let backslashes = 0;
              let j = i - 1;
              while (j >= valStart && trimmed[j] === '\\') {
                backslashes++;
                j--;
              }
              if (backslashes % 2 === 0) {
                let nextChar = '';
                for (let k = i + 1; k < trimmed.length; k++) {
                  if (trimmed[k].trim() !== '') {
                    nextChar = trimmed[k];
                    break;
                  }
                }
                if (nextChar === ',' || nextChar === '}' || nextChar === '') {
                  valEnd = i;
                  break;
                }
              }
            }
          }
          
          let rawVal = '';
          if (valEnd !== -1) {
            rawVal = trimmed.substring(valStart, valEnd);
          } else {
            rawVal = trimmed.substring(valStart);
            rawVal = rawVal.replace(/\\?["}\s]*$/, '');
          }
          
          let cleanVal = '';
          for (let i = 0; i < rawVal.length; i++) {
            if (rawVal[i] === '\\') {
              const next = rawVal[i + 1];
              if (next === 'n') {
                cleanVal += '\n';
                i++;
              } else if (next === '"') {
                cleanVal += '"';
                i++;
              } else if (next === 't') {
                cleanVal += '\t';
                i++;
              } else if (next === 'r') {
                cleanVal += '\r';
                i++;
              } else if (next === '\\') {
                cleanVal += '\\';
                i++;
              } else {
                cleanVal += '\\';
              }
            } else {
              cleanVal += rawVal[i];
            }
          }
          return cleanVal;
        }
      }
    }
  } catch (err) {
    console.error("Manual extraction failed:", err);
  }
  
  return text;
}

function extractCompetitorsFromBadJson(text: string): { id: string, strategicAnalysis: string }[] {
  const list: { id: string, strategicAnalysis: string }[] = [];
  try {
    let searchStart = 0;
    while (true) {
      const idKey = '"id"';
      const idIdx = text.indexOf(idKey, searchStart);
      if (idIdx === -1) break;
      
      let colonIdx = text.indexOf(':', idIdx + idKey.length);
      if (colonIdx === -1) break;
      
      let quoteStart = text.indexOf('"', colonIdx + 1);
      if (quoteStart === -1) break;
      
      let quoteEnd = text.indexOf('"', quoteStart + 1);
      while (quoteEnd !== -1 && text[quoteEnd - 1] === '\\') {
        quoteEnd = text.indexOf('"', quoteEnd + 1);
      }
      if (quoteEnd === -1) break;
      
      const compId = text.substring(quoteStart + 1, quoteEnd);
      
      const stratKey = '"strategicAnalysis"';
      const stratIdx = text.indexOf(stratKey, quoteEnd);
      if (stratIdx === -1) break;
      
      let stratColonIdx = text.indexOf(':', stratIdx + stratKey.length);
      if (stratColonIdx === -1) break;
      
      let stratQuoteStart = text.indexOf('"', stratColonIdx + 1);
      if (stratQuoteStart === -1) break;
      
      let stratQuoteEnd = -1;
      for (let i = stratQuoteStart + 1; i < text.length; i++) {
        if (text[i] === '"' && text[i - 1] !== '\\') {
          let nextChar = '';
          for (let k = i + 1; k < text.length; k++) {
            if (text[k].trim() !== '') {
              nextChar = text[k];
              break;
            }
          }
          if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === '') {
            stratQuoteEnd = i;
            break;
          }
        }
      }
      
      let rawStrat = '';
      if (stratQuoteEnd !== -1) {
        rawStrat = text.substring(stratQuoteStart + 1, stratQuoteEnd);
        searchStart = stratQuoteEnd + 1;
      } else {
        rawStrat = text.substring(stratQuoteStart + 1);
        rawStrat = rawStrat.replace(/\\?["}\]\s]*$/, '');
        searchStart = text.length;
      }
      
      let cleanStrat = '';
      for (let i = 0; i < rawStrat.length; i++) {
        if (rawStrat[i] === '\\') {
          const next = rawStrat[i + 1];
          if (next === 'n') {
            cleanStrat += '\n';
            i++;
          } else if (next === '"') {
            cleanStrat += '"';
            i++;
          } else if (next === 't') {
            cleanStrat += '\t';
            i++;
          } else if (next === 'r') {
            cleanStrat += '\r';
            i++;
          } else if (next === '\\') {
            cleanStrat += '\\';
            i++;
          } else {
            cleanStrat += '\\';
          }
        } else {
          cleanStrat += rawStrat[i];
        }
      }
      
      list.push({ id: compId, strategicAnalysis: cleanStrat });
      
      if (searchStart >= text.length) break;
    }
  } catch (err) {
    console.error("Error extracting competitors manually:", err);
  }
  return list;
}

interface MarkdownBlock {
  type: 'p' | 'h2' | 'h3' | 'h4' | 'ul' | 'ol' | 'card';
  content?: string;
  items?: string[];
  cardKey?: string;
  cardValue?: string;
}

interface StructuredExecutiveSummary {
  panoramaGlobal?: {
    resumen: string;
    digitalizacion: string;
    branding: string;
    interaccion: string;
    observacionesClave: string[];
  };
  analisisCanales?: {
    canal: string;
    dominio: string;
    tacticasConversion: string[];
    enfoqueContenido: string;
  }[];
  oportunidadesGaps?: {
    necesidadesNoResueltas: string;
    formatosDesatendidos: string;
    oportunidadesCrecimiento: {
      titulo: string;
      impacto: string;
      accion: string;
    }[];
  };
  estrategiaPosicionamiento?: {
    propuestaValor: string;
    anguloComunicacion: string;
    guiaVozTono: string[];
    pilaresStorytelling: string[];
  };
  estrategiaContenidos?: {
    pilaresContenido: string[];
    frecuenciaCanal: string[];
    formatosClave: {
      formato: string;
      descripcion: string;
    }[];
  };
  tacticasConversionPrecios?: {
    estrategiaPrecios: string;
    incentivosVenta: string[];
  };
}

interface GeneralReportData {
  businessId: string;
  businessName: string;
  generatedAt: string;
  executiveSummary: any;
  competitors: Array<{
    id: string;
    name: string | null;
    website: string | null;
    facebook: string | null;
    instagram: string | null;
    tiktok: string | null;
    linkedin: string | null;
    youtube: string | null;
    seoGoogle: string | null;
    reports: any[];
    insights: {
      totalFollowers: number;
      totalPosts: number;
      avgEngagement: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      contentThemes: string[];
      postingFrequency: string;
      audienceDemographics: any;
      topPerformingContent: any[];
      contentStrategy: any;
      brandVoice: string[];
      marketingTactics: string[];
      customerEngagement: any;
      competitiveAdvantages: string[];
      marketPositioning: string;
      pricingStrategy: string;
      uniqueSellingPoints: string[];
      websiteAnalysis: any;
      seoStrategy: string[];
      advertisingApproach: string[];
      customerService: string[];
      productOfferings: string[];
      promotions: string[];
      partnerships: string[];
      communityBuilding: string[];
      brandConsistency: string[];
      visualIdentity: string[];
      storytellingApproach: string[];
      contentFormats: string[];
      engagementTactics: string[];
      growthStrategy: string[];
      targetAudience: string[];
      valueProposition: string[];
      differentiation: string[];
      strategicAnalysis?: any;
    };
  }>;
  metadata: {
    totalCompetitors: number;
    totalCompetitorReports: number;
    channelsAnalyzed: string[];
  };
  isSavedReport?: boolean;
  savedAt?: string;
}

interface GeneralReportClientProps {
  businessId: string;
  businessName: string;
}

export function GeneralReportClient({ businessId, businessName }: GeneralReportClientProps) {
  const router = useRouter();
  const [reportData, setReportData] = useState<GeneralReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);
  const [activeSubs, setActiveSubs] = useState<Record<string, string>>({});
  const [importingCampaign, setImportingCampaign] = useState<any | null>(null);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);

  const handleImportCampaign = (title: string, blocks: MarkdownBlock[]) => {
    // Extract campaign details
    const cleanedName = title.replace(/^campa[ñn]a\s+\d+:\s*/i, '').trim();
    
    let description = "";
    let objective: "AWARENESS" | "ENGAGEMENT" | "TRAFFIC" | "LEADS" | "SALES" | "RETENTION" = "AWARENESS";
    let channels: any[] = [];
    
    blocks.forEach((block) => {
      if (block.type === 'card' && block.cardKey && block.cardValue) {
        description += `**${block.cardKey}**: ${block.cardValue}\n\n`;
        
        const keyLower = block.cardKey.toLowerCase();
        const valueLower = block.cardValue.toLowerCase();
        
        if (keyLower.includes('objetivo')) {
          if (valueLower.includes('convers') || valueLower.includes('ventas') || valueLower.includes('vender') || valueLower.includes('comercial')) {
            objective = "SALES";
          } else if (valueLower.includes('tráfico') || valueLower.includes('trafico') || valueLower.includes('visitas')) {
            objective = "TRAFFIC";
          } else if (valueLower.includes('leads') || valueLower.includes('registro') || valueLower.includes('prospectos')) {
            objective = "LEADS";
          } else if (valueLower.includes('interacción') || valueLower.includes('interaccion') || valueLower.includes('engagement') || valueLower.includes('comunidad')) {
            objective = "ENGAGEMENT";
          } else if (valueLower.includes('retención') || valueLower.includes('retencion') || valueLower.includes('fideliza') || valueLower.includes('lealtad')) {
            objective = "RETENTION";
          }
        }
        
        if (keyLower.includes('canal')) {
          const possibleChannels = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube'];
          possibleChannels.forEach((plat) => {
            if (valueLower.includes(plat)) {
              channels.push({ platform: plat.toUpperCase(), isActive: true });
            }
          });
        }
      } else if (block.type === 'p' && block.content) {
        description += `${block.content}\n\n`;
      } else if (block.type === 'ul' && block.items) {
        block.items.forEach((item) => {
          description += `- ${item}\n`;
        });
        description += `\n`;
      }
    });

    if (channels.length === 0) {
      channels = [{ platform: 'INSTAGRAM', isActive: true }];
    }

    setImportingCampaign({
      name: cleanedName,
      description: description.trim(),
      objective: objective,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      budget: 0,
      channels: channels,
      status: "DRAFT"
    });
    setIsCampaignDialogOpen(true);
  };

  const loadingMessages = [
    "Recopilando datos de canales scrapeados...",
    "Analizando presencia y posicionamiento de la competencia...",
    "Identificando oportunidades y gaps en el mercado...",
    "Diseñando pautas de tono y voz de marca diferenciada...",
    "Analizando tácticas de conversión de canales de competidores...",
    "Estructurando matriz de precios y propuesta de valor...",
    "Generando informe analítico consolidado..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generatingReport) {
      setCurrentMessageIdx(0);
      interval = setInterval(() => {
        setCurrentMessageIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [generatingReport]);

  // Helper to extract key bold phrases as visual highlights
  const extractHighlights = (text: string) => {
    if (!text) return [];
    const regex = /\*\*(.*?)\*\*/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const phrase = match[1]?.trim();
      if (phrase && phrase.length > 8 && phrase.length < 80 && !phrase.includes(':')) {
        matches.push(phrase);
      }
    }
    return Array.from(new Set(matches)).slice(0, 4);
  };

  // Helper to parse markdown-like text to React elements
  const parseMarkdown = (text: string, sectionId?: string) => {
    if (!text) return null;
    
    // Style configurations for custom cards
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
      return { icon: Lightbulb, colorClass: "text-slate-600 dark:text-slate-400", bgClass: "bg-slate-500/5 dark:bg-slate-900/10", borderClass: "border-l-4 border-l-slate-400 border-slate-100 dark:border-slate-800" };
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
        }
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
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
        }
        else if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s/, '');
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.type === 'ol') {
            lastBlock.items!.push(content);
          } else {
            blocks.push({ type: 'ol', items: [content] });
          }
        }
        else {
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
                  <div key={cardIdx} className={`p-4 rounded-xl border ${style.borderClass} ${style.bgClass} shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-4.5 w-4.5 ${style.colorClass}`} />
                        <span className={`text-xs font-extrabold uppercase tracking-wider ${style.colorClass}`}>{card.cardKey}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed pl-1 whitespace-pre-line">
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
              <ul key={idx} className="list-disc pl-5 mb-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                {block.items?.map((item, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{parseBoldText(item)}</li>
                ))}
              </ul>
            );
          } else if (block.type === 'ol') {
            rendered.push(
              <ol key={idx} className="list-decimal pl-5 mb-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                {block.items?.map((item, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{parseBoldText(item)}</li>
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

    const blocks = parseMarkdownToBlocks(text);
    const hasSubsections = sectionId && blocks.some(b => b.type === 'h4');
    
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
          {intro.length > 0 && (
            <div className="space-y-3">
              {renderBlocks(intro)}
            </div>
          )}
          
          {subsections.length > 0 && (
            <div className="space-y-6 mt-6">
              {subsections.map((sub, subIdx) => {
                let Icon = Megaphone;
                const lowerTitle = sub.title.toLowerCase();
                if (lowerTitle.includes('campaña 1') || lowerTitle.includes('campana 1')) Icon = Target;
                else if (lowerTitle.includes('campaña 2') || lowerTitle.includes('campana 2')) Icon = Heart;
                else if (lowerTitle.includes('campaña 3') || lowerTitle.includes('campana 3')) Icon = Zap;
                else if (lowerTitle.includes('perfil')) Icon = Award;
                
                const isCampaign = lowerTitle.includes('campaña') || lowerTitle.includes('campana');

                return (
                  <div
                    key={subIdx}
                    className="bg-slate-50/50 p-6 rounded-xl border border-slate-150 shadow-sm animate-in fade-in duration-300"
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <h4 className="text-base font-extrabold text-slate-900">
                          {sub.title}
                        </h4>
                      </div>
                      {isCampaign && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs font-bold border-blue-200 hover:border-blue-500 text-blue-600 hover:text-blue-700 bg-blue-50/30"
                          onClick={() => handleImportCampaign(sub.title, sub.blocks)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Crear Campaña
                        </Button>
                      )}
                    </div>
                    {renderBlocks(sub.blocks)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return renderBlocks(blocks);
  };

  useEffect(() => {
    fetchReport();
  }, [businessId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/competitors/${businessId}/general-report`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      
      const rawData = await response.json();
      
      // Clean up executive summary if it has markdown code blocks or is JSON
      if (rawData && rawData.executiveSummary) {
        let text = rawData.executiveSummary;
        
        if (typeof text === 'string') {
          let textTrimmed = text.trim();
          
          // Handle markdown code block wrappers
          if (textTrimmed.startsWith('```')) {
            textTrimmed = textTrimmed.replace(/^```(?:json)?\s*/i, '');
            textTrimmed = textTrimmed.replace(/\s*```$/, '');
            textTrimmed = textTrimmed.trim();
          }
          
          if (textTrimmed.startsWith('{')) {
            try {
              const parsed = JSON.parse(textTrimmed);
              if (parsed.executiveSummary) {
                rawData.executiveSummary = parsed.executiveSummary;
              } else {
                rawData.executiveSummary = parsed;
              }
              
              if (parsed.competitors && Array.isArray(rawData.competitors) && Array.isArray(rawData.competitors)) {
                rawData.competitors = rawData.competitors.map((comp: any) => {
                  const matched = parsed.competitors.find((c: any) => c.id === comp.id);
                  if (matched && matched.strategicAnalysis) {
                    return {
                      ...comp,
                      insights: {
                        ...comp.insights,
                        strategicAnalysis: matched.strategicAnalysis
                      }
                    };
                  }
                  return comp;
                });
              }
            } catch (e) {
              console.warn("JSON parsing failed in fetchReport, falling back to legacy manual extraction", e);
              // Legacy manual parsing fallback if AI returned bad JSON format
              const parsedSummary = extractExecutiveSummaryFromBadJson(textTrimmed);
              rawData.executiveSummary = parsedSummary;
              
              const extractedComps = extractCompetitorsFromBadJson(textTrimmed);
              if (extractedComps.length > 0 && Array.isArray(rawData.competitors)) {
                rawData.competitors = rawData.competitors.map((comp: any) => {
                  const matched = extractedComps.find(c => c.id === comp.id);
                  if (matched && matched.strategicAnalysis) {
                    return {
                      ...comp,
                      insights: {
                        ...comp.insights,
                        strategicAnalysis: matched.strategicAnalysis
                      }
                    };
                  }
                  return comp;
                });
              }
            }
          } else {
            rawData.executiveSummary = textTrimmed;
          }
        }
      }
      
      setReportData(rawData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading report');
    } finally {
      setLoading(false);
    }
  };


  const generateSavedReport = async () => {
    try {
      setGeneratingReport(true);
      const response = await fetch(`/api/competitors/${businessId}/generate-general-report`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate saved report');
      }
      
      const data = await response.json();
      // Refresh the report to show the saved version
      await fetchReport();
    } catch (err) {
      console.error('Error generating saved report:', err);
      alert('Error al generar el informe general guardado');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toUpperCase()) {
      case 'FACEBOOK': return <Facebook className="h-4 w-4" />;
      case 'INSTAGRAM': return <InstagramIcon className="h-4 w-4" />;
      case 'LINKEDIN': return <Linkedin className="h-4 w-4" />;
      case 'YOUTUBE': return <Youtube className="h-4 w-4" />;
      case 'WEBSITE': return <Globe className="h-4 w-4" />;
      case 'SEO': return <Search className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel.toUpperCase()) {
      case 'FACEBOOK': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'INSTAGRAM': return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'LINKEDIN': return 'bg-blue-600/10 text-blue-700 border-blue-600/20';
      case 'YOUTUBE': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'WEBSITE': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'SEO': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando informe general...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchReport} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/10">
      {/* Loading Overlay */}
      {generatingReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-2 border-indigo-100 shadow-2xl bg-white/95 animate-in fade-in-50 zoom-in-95 duration-200">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Sparkles className="h-6 w-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Generando Informe General</h3>
                <p className="text-sm text-slate-500 font-medium h-10 animate-pulse transition-all duration-300">
                  {loadingMessages[currentMessageIdx]}
                </p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${((currentMessageIdx + 1) / loadingMessages.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">Esto puede tomar entre 15 y 30 segundos mientras la IA realiza el análisis estratégico.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Informe General de Competencia</h1>
                <p className="text-sm text-muted-foreground">{businessName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={generateSavedReport}
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Informe General
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchReport}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Saved Report Indicator */}
        {reportData.isSavedReport && (
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-l-emerald-500">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Informe General Guardado</p>
                  <p className="text-xs text-emerald-700">
                    Generado el {reportData.savedAt ? new Date(reportData.savedAt).toLocaleString('es-ES') : 'N/D'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Competidores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{reportData.metadata.totalCompetitors}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reportes de Competidores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{reportData.metadata.totalCompetitorReports}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Canales Analizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold">{reportData.metadata.channelsAnalyzed.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Executive Summary */}
        {reportData.executiveSummary && (
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl font-black text-blue-950">
                <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
                Análisis y Resumen Estratégico de Competidores
              </CardTitle>
              <p className="text-sm text-blue-700/70 mt-1">Informe completo y detallado del análisis competitivo consolidado.</p>
            </CardHeader>
            <CardContent>
              {(() => {
                const text = reportData.executiveSummary;
                if (!text) return null;

                // 1. STRUCTURED JSON OBJECT RENDERING
                if (typeof text === 'object') {
                  const data = text as StructuredExecutiveSummary;

                  return (
                    <div className="space-y-8">
                      {/* Section 1: Panorama Global */}
                      <div className="bg-white/85 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 backdrop-blur-sm space-y-6">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pb-3 border-b flex items-center gap-2">
                          <Globe className="h-5 w-5 text-blue-500" />
                          1. Panorama Competitivo Global
                        </h3>
                        
                        {data.panoramaGlobal ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-2 bg-gradient-to-br from-blue-50/40 to-indigo-50/40 dark:from-blue-950/5 dark:to-indigo-950/5 p-5 rounded-xl border border-blue-100/30 dark:border-blue-900/10">
                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-2">Resumen de Situación</h4>
                                <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                                  {data.panoramaGlobal.resumen}
                                </p>
                              </div>
                              <div className="space-y-3">
                                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex items-center justify-between shadow-sm">
                                  <span className="text-xs font-bold text-slate-500">Nivel de Digitalización</span>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-extrabold">{data.panoramaGlobal.digitalizacion}</Badge>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex items-center justify-between shadow-sm">
                                  <span className="text-xs font-bold text-slate-500">Sofisticación de Marca</span>
                                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 font-extrabold">{data.panoramaGlobal.branding}</Badge>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex items-center justify-between shadow-sm">
                                  <span className="text-xs font-bold text-slate-500">Interacción / Engagement</span>
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-extrabold">{data.panoramaGlobal.interaccion}</Badge>
                                </div>
                              </div>
                            </div>
                            
                            {data.panoramaGlobal.observacionesClave && data.panoramaGlobal.observacionesClave.length > 0 && (
                              <div className="bg-indigo-50/30 dark:bg-indigo-950/5 p-5 rounded-xl border border-indigo-100/40">
                                <h5 className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                  <Award className="h-4 w-4 text-indigo-600" />
                                  Observaciones Clave del Mercado
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {data.panoramaGlobal.observacionesClave.map((obs, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 shadow-sm flex gap-3 items-start hover:shadow-md transition-all duration-200">
                                      <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">
                                        {i + 1}
                                      </span>
                                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                                        {obs}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Datos de panorama global no disponibles.</p>
                        )}
                      </div>

                      {/* Section 2: Canales de Competencia */}
                      <div className="bg-white/85 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 backdrop-blur-sm space-y-6">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pb-3 border-b flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-500" />
                          2. Análisis de Canales Digitales de la Competencia
                        </h3>
                        
                        {data.analisisCanales && data.analisisCanales.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.analisisCanales.map((c, i) => {
                              const icon = getChannelIcon(c.canal);
                              const colorClass = getChannelColor(c.canal);
                              return (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs ${colorClass}`}>
                                        {icon}
                                        {c.canal}
                                      </div>
                                      <Badge className={`font-extrabold text-[10px] ${
                                        c.dominio.toUpperCase() === 'ALTO' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                        c.dominio.toUpperCase() === 'MEDIO' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                                        'bg-slate-500 hover:bg-slate-600 text-white'
                                      }`}>
                                        Dominio: {c.dominio}
                                      </Badge>
                                    </div>
                                    
                                    <div className="space-y-4">
                                      <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fórmula de Contenido</span>
                                        <p className="text-xs text-slate-700 dark:text-slate-355 font-bold mt-1">
                                          {c.enfoqueContenido}
                                        </p>
                                      </div>
                                      
                                      {c.tacticasConversion && c.tacticasConversion.length > 0 && (
                                        <div>
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Tácticas de Conversión</span>
                                          <ul className="space-y-1.5">
                                            {c.tacticasConversion.map((tac, idx) => (
                                              <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5 leading-relaxed">
                                                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                                                <span>{tac}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Análisis de canales no disponible.</p>
                        )}
                      </div>

                      {/* Section 3: Oportunidades y Gaps */}
                      <div className="bg-white/85 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 backdrop-blur-sm space-y-6">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pb-3 border-b flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-blue-500" />
                          3. Matriz de Oportunidades y Gaps en el Mercado
                        </h3>
                        
                        {data.oportunidadesGaps ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-rose-50/50 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/10 p-5 rounded-2xl flex gap-4">
                                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-600 h-fit shrink-0">
                                  <AlertCircle className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-rose-950 dark:text-rose-455">Dolores o Necesidades Desatendidas</h4>
                                  <p className="text-xs text-rose-900/90 dark:text-slate-355 leading-relaxed font-semibold">
                                    {data.oportunidadesGaps.necesidadesNoResueltas}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="bg-amber-50/50 dark:bg-amber-950/5 border border-amber-100 dark:border-amber-900/10 p-5 rounded-2xl flex gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 h-fit shrink-0">
                                  <Zap className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-amber-950 dark:text-amber-455">Formatos / Canales Ignorados</h4>
                                  <p className="text-xs text-amber-900/90 dark:text-slate-355 leading-relaxed font-semibold">
                                    {data.oportunidadesGaps.formatosDesatendidos}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {data.oportunidadesGaps.oportunidadesCrecimiento && data.oportunidadesGaps.oportunidadesCrecimiento.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  <Sparkles className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                                  Oportunidades de Crecimiento Prioritarias
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {data.oportunidadesGaps.oportunidadesCrecimiento.map((op, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-150 p-5 rounded-2xl shadow-sm space-y-3 hover:shadow-md transition-all duration-300">
                                      <div className="flex items-center justify-between">
                                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">{op.titulo}</h5>
                                        <Badge className={`font-extrabold text-[9px] ${
                                          op.impacto.toUpperCase() === 'ALTO' ? 'bg-red-100 text-red-800 border-red-200' :
                                          op.impacto.toUpperCase() === 'MEDIO' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                          'bg-slate-100 text-slate-800 border-slate-200'
                                        } border`}>
                                          Impacto: {op.impacto}
                                        </Badge>
                                      </div>
                                      <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-100/30">
                                        <span className="text-[10px] font-bold text-blue-600 block">Acción Recomendada</span>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed font-semibold">
                                          {op.accion}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Matriz de oportunidades no disponible.</p>
                        )}
                      </div>

                      {/* Section 4: Posicionamiento */}
                      <div className="bg-white/85 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 backdrop-blur-sm space-y-6">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pb-3 border-b flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-500" />
                          4. Estrategia de Posicionamiento y Diferenciación
                        </h3>
                        
                        {data.estrategiaPosicionamiento ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-5 rounded-2xl border border-blue-100/50 shadow-sm flex flex-col justify-between">
                                <div>
                                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest block mb-2">Propuesta de Valor Sugerida</span>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-300 leading-relaxed">
                                    {data.estrategiaPosicionamiento.propuestaValor}
                                  </p>
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-5 rounded-2xl border border-indigo-100/50 shadow-sm flex flex-col justify-between">
                                <div>
                                  <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest block mb-2">Ángulo de Comunicación Clave</span>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-300 leading-relaxed">
                                    {data.estrategiaPosicionamiento.anguloComunicacion}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {data.estrategiaPosicionamiento.guiaVozTono && data.estrategiaPosicionamiento.guiaVozTono.length > 0 && (
                                <div className="p-5 rounded-xl border border-slate-150 bg-slate-50/50 shadow-sm">
                                  <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <Megaphone className="h-4.5 w-4.5 text-indigo-600" />
                                    Guía de Voz y Tono
                                  </h5>
                                  <ul className="space-y-2">
                                    {data.estrategiaPosicionamiento.guiaVozTono.map((guideline, idx) => (
                                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-355 flex items-start gap-2.5 leading-relaxed font-semibold">
                                        <span className="h-5 w-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{idx+1}</span>
                                        <span>{guideline}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {data.estrategiaPosicionamiento.pilaresStorytelling && data.estrategiaPosicionamiento.pilaresStorytelling.length > 0 && (
                                <div className="p-5 rounded-xl border border-slate-150 bg-slate-50/50 shadow-sm">
                                  <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                                    Ganchos de Storytelling
                                  </h5>
                                  <ul className="space-y-2">
                                    {data.estrategiaPosicionamiento.pilaresStorytelling.map((pilar, idx) => (
                                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-355 flex items-start gap-2.5 leading-relaxed font-semibold">
                                        <span className="text-blue-500 font-bold shrink-0 mt-0.5 text-base leading-none">★</span>
                                        <span>{pilar}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Estrategia de posicionamiento no disponible.</p>
                        )}
                      </div>

                      {/* Section 5: Estrategia de Contenidos */}
                      <div className="bg-white/85 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 backdrop-blur-sm space-y-6">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pb-3 border-b flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          5. Estrategia de Contenidos y Guía de Formatos
                        </h3>
                        
                        {data.estrategiaContenidos ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {data.estrategiaContenidos.pilaresContenido && data.estrategiaContenidos.pilaresContenido.length > 0 && (
                                <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 shadow-sm">
                                  <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Pilares de Contenido Recomendados</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {data.estrategiaContenidos.pilaresContenido.map((pilar, idx) => (
                                      <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100 text-xs py-1.5 px-3 rounded-lg font-bold">
                                        {pilar}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {data.estrategiaContenidos.frecuenciaCanal && data.estrategiaContenidos.frecuenciaCanal.length > 0 && (
                                <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 shadow-sm">
                                  <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Frecuencia de Publicación Recomendada</h5>
                                  <ul className="space-y-2.5">
                                    {data.estrategiaContenidos.frecuenciaCanal.map((freq, idx) => (
                                      <li key={idx} className="text-xs text-slate-700 dark:text-slate-350 flex items-center gap-2 font-bold">
                                        <Globe className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span>{freq}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            {data.estrategiaContenidos.formatosClave && data.estrategiaContenidos.formatosClave.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  <Video className="h-4.5 w-4.5 text-blue-500" />
                                  Formatos Estrella Recomendados
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {data.estrategiaContenidos.formatosClave.map((format, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-150 p-4 rounded-xl shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-200">
                                      <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-600 shrink-0">
                                        <Video className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{format.formato}</h5>
                                        <p className="text-xs text-slate-650 dark:text-slate-400 mt-1 leading-relaxed font-semibold">
                                          {format.descripcion}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Estrategia de contenidos no disponible.</p>
                        )}
                      </div>

                      {/* Section 6: Precios y Conversión */}
                      <div className="bg-white/85 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 backdrop-blur-sm space-y-6">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pb-3 border-b flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-blue-500" />
                          6. Tácticas de Conversión y Precios
                        </h3>
                        
                        {data.tacticasConversionPrecios ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-indigo-50/30 dark:bg-indigo-950/5 border border-indigo-100 p-5 rounded-2xl space-y-3 shadow-sm">
                              <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-400 flex items-center gap-2">
                                <DollarSign className="h-4.5 w-4.5 text-indigo-600" />
                                Estrategia de Precios Recomendada
                              </h4>
                              <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-bold">
                                {data.tacticasConversionPrecios.estrategiaPrecios}
                              </p>
                            </div>
                            
                            {data.tacticasConversionPrecios.incentivosVenta && data.tacticasConversionPrecios.incentivosVenta.length > 0 && (
                              <div className="bg-emerald-50/30 dark:bg-emerald-950/5 border border-emerald-100 p-5 rounded-2xl space-y-3 shadow-sm">
                                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-400 flex items-center gap-2">
                                  <Tag className="h-4.5 w-4.5 text-emerald-600" />
                                  Incentivos de Conversión y Venta
                                </h4>
                                <ul className="space-y-2">
                                  {data.tacticasConversionPrecios.incentivosVenta.map((inc, idx) => (
                                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-350 flex items-start gap-2 leading-relaxed font-semibold">
                                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                      <span>{inc}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Tácticas de conversión y precios no disponibles.</p>
                        )}
                      </div>
                    </div>
                  );
                }

                // 2. LEGACY MARKDOWN STRING FALLBACK RENDERING
                // Dividir el texto por las cabeceras "## "
                const parts = text.split(/(?:^|\n)##\s+/);
                const sections: { id: string, title: string, fullTitle: string, content: string }[] = [];
                let mainTitle = "";
                let introText = "";
                
                parts.forEach((part: string, index: number) => {
                  if (!part.trim()) return;
                  
                  if (index === 0) {
                    const lines = part.split('\n');
                    const h1Line = lines.find(l => l.trim().startsWith('# '));
                    if (h1Line) {
                      mainTitle = h1Line.replace('# ', '').replace(/\*/g, '').trim();
                    }
                    introText = lines.filter(l => !l.trim().startsWith('# ')).join('\n').trim();
                    introText = introText
                      .replace(/navegando por las pestañas (inferiores|de abajo)?/gi, 'a continuación')
                      .replace(/navegando por las pestañas/gi, 'a continuación')
                      .replace(/en las pestañas inferiores/gi, 'a continuación')
                      .replace(/por las pestañas inferiores/gi, 'a continuación')
                      .replace(/a través de las pestañas/gi, 'a continuación')
                      .replace(/usando las pestañas/gi, 'a continuación')
                      .replace(/en las pestañas/gi, 'a continuación');
                  } else {
                    const lines = part.split('\n');
                    const title = lines[0].trim();
                    const content = lines.slice(1).join('\n');
                    
                    // Limpiar título (quitar números como "1. ")
                    const cleanTitle = title.replace(/^\d+\.\s*/, '').replace(/\*/g, '');
                    
                    sections.push({
                      id: `tab-${index}`,
                      title: cleanTitle.length > 28 ? cleanTitle.substring(0, 28) + "..." : cleanTitle,
                      fullTitle: cleanTitle,
                      content: content
                    });
                  }
                });

                if (sections.length === 0) {
                  return (
                    <div className="prose prose-sm max-w-none text-slate-800 bg-white/50 p-6 rounded-xl border border-blue-100">
                      {mainTitle && <h2 className="text-xl font-bold text-blue-900 mb-4">{mainTitle}</h2>}
                      {parseMarkdown(text)}
                    </div>
                  );
                }

                return (
                  <div className="space-y-8">
                    {/* Header Info / Intro section above tabs */}
                    {(mainTitle || introText) && (
                      <div className="bg-white/60 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 backdrop-blur-sm shadow-sm">
                        {mainTitle && (
                          <h2 className="text-xl font-extrabold text-blue-900 dark:text-blue-400 tracking-tight">
                            {mainTitle}
                          </h2>
                        )}
                        {introText && (
                          <div className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed mt-2 whitespace-pre-line">
                            {parseMarkdown(introText)}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-8">
                      {sections.map(s => {
                        const highlights = extractHighlights(s.content);
                        return (
                          <div key={s.id} className="bg-white/80 dark:bg-slate-900/60 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 backdrop-blur-sm transition-all duration-300 space-y-6">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white pb-3 border-b flex items-center gap-2">
                              <Target className="h-5 w-5 text-blue-500" />
                              {s.fullTitle}
                            </h3>

                            {highlights.length > 0 && (
                              <div className="mb-6 bg-blue-500/5 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-500/10 dark:border-blue-500/5">
                                <h5 className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                  <Lightbulb className="h-4 w-4 text-amber-500" />
                                  Puntos Clave / Resumen Rápido
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {highlights.map((h, i) => (
                                    <div key={i} className="flex items-start gap-2 bg-white/90 dark:bg-slate-900/90 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-500/30 transition-all duration-200">
                                      <span className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</span>
                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-355 leading-tight">{h}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 space-y-3">
                              {parseMarkdown(s.content, s.id)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Competitors Detailed Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis Detallado de Competidores</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No hay competidores configurados</p>
            ) : (
              <div className="space-y-8">
                {reportData.competitors.map((competitor) => (
                  <div key={competitor.id} className="border-2 rounded-xl p-6 space-y-6">
                    {/* Competitor Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-xl">{competitor.name || 'Sin nombre'}</h3>
                        {competitor.website && (
                          <a 
                            href={competitor.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {competitor.website}
                          </a>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        {competitor.reports.length} análisis
                      </Badge>
                    </div>
                    
                    {/* Social Channels */}
                    <div className="flex flex-wrap gap-2">
                      {competitor.facebook && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          <Facebook className="h-3 w-3 mr-1" />
                          Facebook
                        </Badge>
                      )}
                      {competitor.instagram && (
                        <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/20">
                          <InstagramIcon className="h-3 w-3 mr-1" />
                          Instagram
                        </Badge>
                      )}
                      {competitor.tiktok && (
                        <Badge variant="outline" className="bg-black/10 text-black border-black/20">
                          TikTok
                        </Badge>
                      )}
                      {competitor.linkedin && (
                        <Badge variant="outline" className="bg-blue-600/10 text-blue-700 border-blue-600/20">
                          <Linkedin className="h-3 w-3 mr-1" />
                          LinkedIn
                        </Badge>
                      )}
                      {competitor.youtube && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                          <Youtube className="h-3 w-3 mr-1" />
                          YouTube
                        </Badge>
                      )}
                      {competitor.seoGoogle && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Search className="h-3 w-3 mr-1" />
                          SEO
                        </Badge>
                      )}
                    </div>
                    
                    {/* Key Metrics */}
                    {(competitor.insights.totalFollowers > 0 || competitor.insights.totalPosts > 0) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">Total Seguidores</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-900">{competitor.insights.totalFollowers.toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-medium text-purple-800">Total Publicaciones</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-900">{competitor.insights.totalPosts.toLocaleString()}</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="h-4 w-4 text-pink-600" />
                            <span className="text-xs font-medium text-pink-800">Engagement</span>
                          </div>
                          <p className="text-lg font-bold text-pink-900">{competitor.insights.avgEngagement || 'N/D'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-800">Frecuencia</span>
                          </div>
                          <p className="text-sm font-bold text-green-900">{competitor.insights.postingFrequency || 'N/D'}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Market Positioning */}
                    {competitor.insights.marketPositioning && (
                      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
                        <h4 className="text-sm font-semibold text-violet-800 mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Posicionamiento en el Mercado
                        </h4>
                        <p className="text-sm text-violet-900 leading-relaxed">{competitor.insights.marketPositioning}</p>
                      </div>
                    )}

                    {/* Perfil Estratégico (AI Generated) */}
                    {competitor.insights.strategicAnalysis && (
                      <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50/50 rounded-xl p-5 border border-indigo-100 shadow-sm">
                        <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2 pb-2 border-b border-indigo-100/50">
                          <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                          Análisis de Estrategia y Posicionamiento
                        </h4>
                        <div className="text-slate-700 space-y-1">
                          {typeof competitor.insights.strategicAnalysis === 'object' ? (
                            (() => {
                              const sa = competitor.insights.strategicAnalysis as {
                                desempenoCanales?: string[];
                                debilidadesGaps?: string[];
                                planContramedida?: string[];
                              };
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {sa.desempenoCanales && sa.desempenoCanales.length > 0 && (
                                    <div className="p-4 rounded-xl bg-white/90 border border-slate-150 shadow-sm space-y-2">
                                      <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Desempeño en Canales</span>
                                      <ul className="space-y-1.5">
                                        {sa.desempenoCanales.map((pt, idx) => (
                                          <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5 font-medium">
                                            <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                                            <span>{pt}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {sa.debilidadesGaps && sa.debilidadesGaps.length > 0 && (
                                    <div className="p-4 rounded-xl bg-white/90 border border-slate-150 shadow-sm space-y-2">
                                      <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">Debilidades y Gaps</span>
                                      <ul className="space-y-1.5">
                                        {sa.debilidadesGaps.map((pt, idx) => (
                                          <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5 font-medium">
                                            <span className="text-rose-500 font-bold shrink-0 mt-0.5">✗</span>
                                            <span>{pt}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {sa.planContramedida && sa.planContramedida.length > 0 && (
                                    <div className="p-4 rounded-xl bg-white/90 border border-slate-150 shadow-sm space-y-2">
                                      <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Acción de Contramedida</span>
                                      <ul className="space-y-1.5">
                                        {sa.planContramedida.map((pt, idx) => (
                                          <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5 font-medium">
                                            <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                                            <span>{pt}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            parseMarkdown(competitor.insights.strategicAnalysis)
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Strengths and Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {competitor.insights.strengths.length > 0 && (
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                          <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Fortalezas ({competitor.insights.strengths.length})
                          </h4>
                          <ul className="space-y-2">
                            {competitor.insights.strengths.slice(0, 5).map((s, i) => (
                              <li key={i} className="text-sm flex gap-2 text-emerald-900">
                                <span className="text-emerald-600 font-bold">✓</span> {s}
                              </li>
                            ))}
                            {competitor.insights.strengths.length > 5 && (
                              <li className="text-xs text-emerald-700 italic">+{competitor.insights.strengths.length - 5} más...</li>
                            )}
                          </ul>
                        </div>
                      )}
                      {competitor.insights.weaknesses.length > 0 && (
                        <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                          <h4 className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Debilidades ({competitor.insights.weaknesses.length})
                          </h4>
                          <ul className="space-y-2">
                            {competitor.insights.weaknesses.slice(0, 5).map((w, i) => (
                              <li key={i} className="text-sm flex gap-2 text-rose-900">
                                <span className="text-rose-600 font-bold">✗</span> {w}
                              </li>
                            ))}
                            {competitor.insights.weaknesses.length > 5 && (
                              <li className="text-xs text-rose-700 italic">+{competitor.insights.weaknesses.length - 5} más...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Competitive Advantages */}
                    {competitor.insights.competitiveAdvantages.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Ventajas Competitivas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.competitiveAdvantages.map((adv, i) => (
                            <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                              {adv}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Unique Selling Points */}
                    {competitor.insights.uniqueSellingPoints.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Puntos de Venta Únicos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.uniqueSellingPoints.map((usp, i) => (
                            <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                              {usp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Content Themes */}
                    {competitor.insights.contentThemes.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Temas de Contenido
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.contentThemes.map((theme, i) => (
                            <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Brand Voice */}
                    {competitor.insights.brandVoice.length > 0 && (
                      <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                        <h4 className="text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                          <Megaphone className="h-4 w-4" />
                          Voz de Marca
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.brandVoice.map((voice, i) => (
                            <Badge key={i} variant="secondary" className="bg-pink-100 text-pink-800 border-pink-300">
                              {voice}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Marketing Tactics */}
                    {competitor.insights.marketingTactics.length > 0 && (
                      <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                        <h4 className="text-sm font-semibold text-cyan-800 mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Tácticas de Marketing
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.marketingTactics.map((tactic, i) => (
                            <li key={i} className="text-sm flex gap-2 text-cyan-900">
                              <span className="text-cyan-600">→</span> {tactic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Strategic Recommendations */}
                    {competitor.insights.recommendations.length > 0 && (
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                        <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Recomendaciones Estratégicas ({competitor.insights.recommendations.length})
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.recommendations.slice(0, 5).map((rec, i) => (
                            <li key={i} className="text-sm flex gap-2 text-orange-900">
                              <span className="text-orange-600 font-bold">{i + 1}.</span> {rec}
                            </li>
                          ))}
                          {competitor.insights.recommendations.length > 5 && (
                            <li className="text-xs text-orange-700 italic">+{competitor.insights.recommendations.length - 5} recomendaciones más...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {/* Pricing Strategy */}
                    {competitor.insights.pricingStrategy && (
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Estrategia de Precios
                        </h4>
                        <p className="text-sm text-slate-900">{competitor.insights.pricingStrategy}</p>
                      </div>
                    )}
                    
                    {/* SEO Strategy */}
                    {competitor.insights.seoStrategy && competitor.insights.seoStrategy.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Estrategia SEO
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.seoStrategy.map((strategy, i) => (
                            <li key={i} className="text-sm flex gap-2 text-green-900">
                              <span className="text-green-600">→</span> {strategy}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Advertising Approach */}
                    {competitor.insights.advertisingApproach && competitor.insights.advertisingApproach.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                          <Megaphone className="h-4 w-4" />
                          Enfoque Publicitario
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.advertisingApproach.map((approach, i) => (
                            <li key={i} className="text-sm flex gap-2 text-orange-900">
                              <span className="text-orange-600">→</span> {approach}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Customer Service */}
                    {competitor.insights.customerService && competitor.insights.customerService.length > 0 && (
                      <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                        <h4 className="text-sm font-semibold text-teal-800 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Servicio al Cliente
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.customerService.map((service, i) => (
                            <li key={i} className="text-sm flex gap-2 text-teal-900">
                              <span className="text-teal-600">→</span> {service}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Product Offerings */}
                    {competitor.insights.productOfferings && competitor.insights.productOfferings.length > 0 && (
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <h4 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Ofertas de Productos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.productOfferings.map((offering, i) => (
                            <Badge key={i} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-300">
                              {offering}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Promotions */}
                    {competitor.insights.promotions && competitor.insights.promotions.length > 0 && (
                      <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                        <h4 className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Promociones Activas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.promotions.map((promo, i) => (
                            <Badge key={i} variant="secondary" className="bg-rose-100 text-rose-800 border-rose-300">
                              {promo}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Partnerships */}
                    {competitor.insights.partnerships && competitor.insights.partnerships.length > 0 && (
                      <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
                        <h4 className="text-sm font-semibold text-violet-800 mb-3 flex items-center gap-2">
                          <Handshake className="h-4 w-4" />
                          Alianzas y Colaboraciones
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.partnerships.map((partnership, i) => (
                            <li key={i} className="text-sm flex gap-2 text-violet-900">
                              <span className="text-violet-600">→</span> {partnership}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Community Building */}
                    {competitor.insights.communityBuilding && competitor.insights.communityBuilding.length > 0 && (
                      <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                        <h4 className="text-sm font-semibold text-cyan-800 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                            Construcción de Comunidad
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.communityBuilding.map((tactic, i) => (
                            <li key={i} className="text-sm flex gap-2 text-cyan-900">
                              <span className="text-cyan-600">→</span> {tactic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Brand Consistency */}
                    {competitor.insights.brandConsistency && competitor.insights.brandConsistency.length > 0 && (
                      <div className="bg-fuchsia-50 rounded-lg p-4 border border-fuchsia-200">
                        <h4 className="text-sm font-semibold text-fuchsia-800 mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Consistencia de Marca
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.brandConsistency.map((item, i) => (
                            <Badge key={i} variant="secondary" className="bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Visual Identity */}
                    {competitor.insights.visualIdentity && competitor.insights.visualIdentity.length > 0 && (
                      <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                        <h4 className="text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Identidad Visual
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.visualIdentity.map((element, i) => (
                            <Badge key={i} variant="secondary" className="bg-pink-100 text-pink-800 border-pink-300">
                              {element}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Storytelling Approach */}
                    {competitor.insights.storytellingApproach && competitor.insights.storytellingApproach.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Enfoque de Storytelling
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.storytellingApproach.map((approach, i) => (
                            <li key={i} className="text-sm flex gap-2 text-amber-900">
                              <span className="text-amber-600">→</span> {approach}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Content Formats */}
                    {competitor.insights.contentFormats && competitor.insights.contentFormats.length > 0 && (
                      <div className="bg-lime-50 rounded-lg p-4 border border-lime-200">
                        <h4 className="text-sm font-semibold text-lime-800 mb-3 flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Formatos de Contenido
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.contentFormats.map((format, i) => (
                            <Badge key={i} variant="secondary" className="bg-lime-100 text-lime-800 border-lime-300">
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Engagement Tactics */}
                    {competitor.insights.engagementTactics && competitor.insights.engagementTactics.length > 0 && (
                      <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                        <h4 className="text-sm font-semibold text-sky-800 mb-3 flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Tácticas de Engagement
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.engagementTactics.map((tactic, i) => (
                            <li key={i} className="text-sm flex gap-2 text-sky-900">
                              <span className="text-sky-600">→</span> {tactic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Growth Strategy */}
                    {competitor.insights.growthStrategy && competitor.insights.growthStrategy.length > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Estrategia de Crecimiento
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.growthStrategy.map((strategy, i) => (
                            <li key={i} className="text-sm flex gap-2 text-emerald-900">
                              <span className="text-emerald-600">→</span> {strategy}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Target Audience */}
                    {competitor.insights.targetAudience && competitor.insights.targetAudience.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Audiencia Objetivo
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {competitor.insights.targetAudience.map((audience, i) => (
                            <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                              {audience}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Value Proposition */}
                    {competitor.insights.valueProposition && competitor.insights.valueProposition.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Propuesta de Valor
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.valueProposition.map((value, i) => (
                            <li key={i} className="text-sm flex gap-2 text-yellow-900">
                              <span className="text-yellow-600">→</span> {value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Differentiation */}
                    {competitor.insights.differentiation && competitor.insights.differentiation.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Diferenciación
                        </h4>
                        <ul className="space-y-2">
                          {competitor.insights.differentiation.map((diff, i) => (
                            <li key={i} className="text-sm flex gap-2 text-red-900">
                              <span className="text-red-600">→</span> {diff}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Campaña Sugerida por IA</DialogTitle>
            <DialogDescription>
              Ajusta los detalles de la campaña sugerida por la IA antes de guardarla.
            </DialogDescription>
          </DialogHeader>
          {importingCampaign && (
            <CampaignForm
              businessId={businessId}
              defaultValues={importingCampaign}
              onSuccess={() => {
                setIsCampaignDialogOpen(false);
                setImportingCampaign(null);
                toast.success("Campaña creada con éxito");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
