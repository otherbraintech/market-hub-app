'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Download, TrendingUp, Users, Globe, Facebook, Instagram as InstagramIcon, Linkedin, Youtube, Search, Sparkles, CheckCircle2, AlertCircle, Target, Lightbulb, DollarSign, Award, Megaphone, Zap, Heart, FileText, Package, Tag, Handshake, Shield, Palette, BookOpen, Video, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GeneralReportData {
  businessId: string;
  businessName: string;
  generatedAt: string;
  executiveSummary: string;
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
      strategicAnalysis?: string;
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

  const loadingMessages = [
    "Recopilando datos de canales scrapeados...",
    "Analizando posicionamiento de la competencia...",
    "Identificando oportunidades y gaps en el mercado...",
    "Diseñando pautas de tono y voz de marca...",
    "Generando propuestas de campañas de marketing...",
    "Redactando ejemplos de copys publicitarios listos para usar...",
    "Estructurando informe de consultoría premium..."
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

  // Helper to parse markdown-like text to React elements
  const parseMarkdown = (text: string) => {
    if (!text) return null;
    
    // Split into paragraphs / blocks
    const lines = text.split('\n');
    let insideList = false;
    let listType: 'ul' | 'ol' | null = null;
    const elements: React.JSX.Element[] = [];
    let currentListItems: React.JSX.Element[] = [];

    const flushList = (key: string | number) => {
      if (currentListItems.length > 0) {
        if (listType === 'ul') {
          elements.push(<ul key={`list-${key}`} className="list-disc pl-5 mb-4 space-y-1">{...currentListItems}</ul>);
        } else if (listType === 'ol') {
          elements.push(<ol key={`list-${key}`} className="list-decimal pl-5 mb-4 space-y-1">{...currentListItems}</ol>);
        }
        currentListItems = [];
        insideList = false;
        listType = null;
      }
    };

    const parseBoldText = (txt: string) => {
      const parts = txt.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part);
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('### ')) {
        flushList(idx);
        elements.push(<h4 key={idx} className="text-base font-bold text-slate-800 mt-4 mb-2">{parseBoldText(trimmed.replace('### ', ''))}</h4>);
      } else if (trimmed.startsWith('## ')) {
        flushList(idx);
        elements.push(<h3 key={idx} className="text-lg font-extrabold text-slate-955 mt-6 mb-3 border-b pb-2">{parseBoldText(trimmed.replace('## ', ''))}</h3>);
      } else if (trimmed.startsWith('# ')) {
        flushList(idx);
        elements.push(<h2 key={idx} className="text-xl font-black text-blue-900 mt-8 mb-4">{parseBoldText(trimmed.replace('# ', ''))}</h2>);
      }
      // Unordered lists
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (insideList && listType !== 'ul') {
          flushList(idx);
        }
        insideList = true;
        listType = 'ul';
        const content = trimmed.substring(2);
        currentListItems.push(<li key={`li-${idx}`} className="text-sm text-slate-700 leading-relaxed">{parseBoldText(content)}</li>);
      }
      // Ordered lists
      else if (/^\d+\.\s/.test(trimmed)) {
        if (insideList && listType !== 'ol') {
          flushList(idx);
        }
        insideList = true;
        listType = 'ol';
        const content = trimmed.replace(/^\d+\.\s/, '');
        currentListItems.push(<li key={`li-${idx}`} className="text-sm text-slate-700 leading-relaxed">{parseBoldText(content)}</li>);
      }
      // Empty lines
      else if (trimmed === '') {
        flushList(idx);
      }
      // Regular paragraphs
      else {
        flushList(idx);
        elements.push(<p key={idx} className="text-sm text-slate-700 leading-relaxed mb-3">{parseBoldText(trimmed)}</p>);
      }
    });

    flushList('final');
    return elements;
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
      
      // Clean up executive summary if it has markdown code blocks
      if (rawData && rawData.executiveSummary) {
        let text = rawData.executiveSummary.trim();
        if (text.startsWith('```')) {
          text = text.replace(/^```(?:json)?\s*/i, '');
          text = text.replace(/\s*```$/, '');
        }
        rawData.executiveSummary = text;
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
                Resumen Estratégico y Propuesta de Campañas
              </CardTitle>
              <p className="text-sm text-blue-700/70 mt-1">Explora el análisis detallado navegando por las pestañas inferiores.</p>
            </CardHeader>
            <CardContent>
              {(() => {
                const text = reportData.executiveSummary;
                if (!text) return null;
                
                // Dividir el texto por las cabeceras "## "
                const parts = text.split(/(?:^|\n)##\s+/);
                const sections: { id: string, title: string, content: string }[] = [];
                
                parts.forEach((part, index) => {
                  if (!part.trim()) return;
                  
                  const lines = part.split('\n');
                  let title = "Introducción";
                  let content = part;
                  
                  if (index > 0) {
                    title = lines[0].trim();
                    content = lines.slice(1).join('\n');
                  } else {
                    const h1Match = part.match(/^#\s+(.+)$/m);
                    if (h1Match) title = "Resumen Global";
                  }
                  
                  // Limpiar título (quitar números como "1. ")
                  const cleanTitle = title.replace(/^\d+\.\s*/, '').replace(/\*/g, '');
                  
                  sections.push({
                    id: `tab-${index}`,
                    title: cleanTitle.length > 35 ? cleanTitle.substring(0, 35) + "..." : cleanTitle,
                    fullTitle: cleanTitle,
                    content: content
                  });
                });

                if (sections.length <= 1) {
                  return (
                    <div className="prose prose-sm max-w-none text-slate-800 bg-white/50 p-6 rounded-xl border border-blue-100">
                      {parseMarkdown(text)}
                    </div>
                  );
                }

                return (
                  <Tabs defaultValue={sections[0].id} className="w-full mt-2">
                    <TabsList className="w-full flex flex-wrap h-auto p-1.5 bg-blue-900/5 justify-start mb-6 rounded-xl border border-blue-100/50">
                      {sections.map(s => (
                        <TabsTrigger 
                          key={s.id} 
                          value={s.id}
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:font-bold text-xs sm:text-sm py-2.5 px-4 transition-all"
                        >
                          {s.title}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {sections.map(s => (
                      <TabsContent key={s.id} value={s.id} className="focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white/60 rounded-xl p-5 sm:p-7 shadow-sm border border-blue-100 backdrop-blur-sm">
                           <h3 className="text-xl font-extrabold text-blue-950 mb-5 pb-3 border-b border-blue-100/60 flex items-center gap-2">
                             <Target className="h-5 w-5 text-blue-500" />
                             {s.fullTitle}
                           </h3>
                           <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-2">
                             {parseMarkdown(s.content)}
                           </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
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
                        <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                          Análisis de Estrategia y Posicionamiento
                        </h4>
                        <div className="text-slate-700 space-y-1">
                          {parseMarkdown(competitor.insights.strategicAnalysis)}
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
    </div>
  );
}
