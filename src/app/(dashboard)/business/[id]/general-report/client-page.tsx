'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Download, TrendingUp, Users, Globe, Facebook, Instagram as InstagramIcon, Linkedin, Youtube, Search, Sparkles, CheckCircle2, AlertCircle, Target, Lightbulb } from 'lucide-react';

interface BusinessReportData {
  businessId: string;
  businessName: string;
  generatedAt: string;
  businessSummary: {
    info: {
      id: string;
      name: string;
      website: string | null;
      phoneNumbers: string | null;
      location: string | null;
    };
    reports: Array<{
      channel: string;
      url: string;
      data: any;
      completedAt: string | null;
    }>;
  };
  metadata: {
    totalBusinessReports: number;
    channelsAnalyzed: string[];
    activeChannelsCount: number;
  };
}

interface BusinessGeneralReportClientProps {
  businessId: string;
  businessName: string;
}

export function BusinessGeneralReportClient({ businessId, businessName }: BusinessGeneralReportClientProps) {
  const router = useRouter();
  const [reportData, setReportData] = useState<BusinessReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [consolidatedAnalysis, setConsolidatedAnalysis] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [businessId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/business/${businessId}/general-report`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      
      const data = await response.json();
      setReportData(data);
      if (data.consolidatedAnalysis) {
        setConsolidatedAnalysis(data.consolidatedAnalysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const generateConsolidatedAnalysis = async () => {
    try {
      setGeneratingAnalysis(true);
      const response = await fetch(`/api/business/${businessId}/consolidated-analysis`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }
      
      const data = await response.json();
      setConsolidatedAnalysis(data.analysis);
    } catch (err) {
      console.error('Error generating analysis:', err);
      alert('Error al generar el análisis consolidado');
    } finally {
      setGeneratingAnalysis(false);
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
      case 'LINKEDIN': return 'bg-blue-700/10 text-blue-700 border-blue-700/20';
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
                <h1 className="text-2xl font-bold">Informe General de Mi Negocio</h1>
                <p className="text-sm text-muted-foreground">{businessName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={generateConsolidatedAnalysis}
                disabled={generatingAnalysis}
              >
                {generatingAnalysis ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Análisis IA
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
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Canales Analizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{reportData.metadata.channelsAnalyzed.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Canales Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{reportData.metadata.activeChannelsCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Generado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">
                  {new Date(reportData.generatedAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consolidated AI Analysis */}
        {consolidatedAnalysis && (
          <Card className="bg-gradient-to-br from-violet-50 via-white to-white border-l-4 border-l-violet-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                Análisis Consolidado con IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Resumen Ejecutivo
                </h3>
                <p className="text-sm leading-relaxed">{consolidatedAnalysis.executiveSummary}</p>
              </div>

              {/* Market Position */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Posición Actual</h4>
                  <p className="text-sm">{consolidatedAnalysis.marketPosition?.currentPosition}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Ventaja Competitiva</h4>
                  <p className="text-sm">{consolidatedAnalysis.marketPosition?.competitiveAdvantage}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Oportunidad de Mercado</h4>
                  <p className="text-sm">{consolidatedAnalysis.marketPosition?.marketGap}</p>
                </div>
              </div>

              {/* SWOT Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Fortalezas
                  </h4>
                  <ul className="space-y-1">
                    {consolidatedAnalysis.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-emerald-600">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                  <h4 className="text-sm font-semibold text-rose-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Debilidades
                  </h4>
                  <ul className="space-y-1">
                    {consolidatedAnalysis.weaknesses?.map((w: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-rose-600">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Oportunidades
                  </h4>
                  <ul className="space-y-1">
                    {consolidatedAnalysis.opportunities?.map((o: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-blue-600">•</span> {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Amenazas
                  </h4>
                  <ul className="space-y-1">
                    {consolidatedAnalysis.threats?.map((t: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-amber-600">•</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strategic Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Recomendaciones Estratégicas
                </h3>
                <div className="space-y-3">
                  {consolidatedAnalysis.strategicRecommendations?.map((rec: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-4 border">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold">{rec.category}</span>
                        <Badge variant={rec.priority === 'alta' ? 'default' : rec.priority === 'media' ? 'secondary' : 'outline'}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{rec.action}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Impacto: {rec.expectedImpact}</span>
                        <span>Timeline: {rec.timeline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel Strategy */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Estrategia de Canales
                </h3>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Canales Recomendados:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {consolidatedAnalysis.channelStrategy?.recommendedChannels?.map((channel: string, i: number) => (
                        <Badge key={i} variant="outline">{channel}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Estrategia de Contenido:</span>
                    <p className="text-sm mt-1">{consolidatedAnalysis.channelStrategy?.contentStrategy}</p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
                <h3 className="text-sm font-semibold text-violet-800 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Próximos Pasos
                </h3>
                <ul className="space-y-1">
                  {consolidatedAnalysis.nextSteps?.map((step: string, i: number) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-violet-600 font-bold">{i + 1}.</span> {step}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Sitio Web</span>
                  {reportData.businessSummary.info.website ? (
                    <a 
                      href={reportData.businessSummary.info.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {reportData.businessSummary.info.website}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">No configurado</span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Teléfono</span>
                  <p className="text-sm">{reportData.businessSummary.info.phoneNumbers || 'No configurado'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Ubicación</span>
                  <p className="text-sm">{reportData.businessSummary.info.location || 'No configurado'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">ID</span>
                  <p className="text-sm font-mono text-muted-foreground">{reportData.businessSummary.info.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channels Analyzed */}
        <Card>
          <CardHeader>
            <CardTitle>Canales Analizados</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.metadata.channelsAnalyzed.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No hay canales analizados aún</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reportData.metadata.channelsAnalyzed.map((channel) => (
                  <Badge key={channel} variant="outline" className={getChannelColor(channel)}>
                    <span className="mr-1">{getChannelIcon(channel)}</span>
                    {channel}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Channel Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Canales del Negocio</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.businessSummary.reports.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No hay análisis de canales disponibles</p>
            ) : (
              <div className="space-y-4">
                {reportData.businessSummary.reports.map((report, index) => {
                  const dataObj = typeof report.data === 'string' ? JSON.parse(report.data) : report.data;
                  const isInstagram = !!dataObj.instagram_presence || !!dataObj.engagement_analysis;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(report.channel)}
                          <Badge variant="outline" className={getChannelColor(report.channel)}>
                            {report.channel}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {report.completedAt ? new Date(report.completedAt).toLocaleDateString('es-ES') : 'N/D'}
                        </span>
                      </div>
                      
                      {isInstagram && dataObj.instagram_presence && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div className="bg-pink-50 rounded p-2">
                            <span className="text-xs text-muted-foreground block">Seguidores</span>
                            <p className="font-semibold text-sm">
                            {dataObj.instagram_presence.audience_size?.followers || 
                             dataObj.engagement_analysis?.social_proof_signals?.[0] || 
                             dataObj.competitive_observations?.visibility_indicators?.[0]?.match(/[\d.]+[KkMm]?/)?.[0] || 
                             'N/D'}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded p-2">
                            <span className="text-xs text-muted-foreground block">Publicaciones</span>
                            <p className="font-semibold text-sm">
                              {dataObj.instagram_presence.audience_size?.posts_count || 'N/D'}
                            </p>
                          </div>
                          <div className="bg-pink-50 rounded p-2">
                            <span className="text-xs text-muted-foreground block">Siguiendo</span>
                            <p className="font-semibold text-sm">
                              {dataObj.instagram_presence.audience_size?.following || 'N/D'}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded p-2">
                            <span className="text-xs text-muted-foreground block">Username</span>
                            <p className="font-semibold text-sm truncate">
                              {dataObj.instagram_presence.username || dataObj.instagram_presence.brand_name || 'N/D'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {dataObj.competitive_observations && (
                        <div className="mt-3 space-y-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Fortalezas:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dataObj.competitive_observations.main_strengths?.slice(0, 3).map((s: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Debilidades:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dataObj.competitive_observations.main_weaknesses?.slice(0, 3).map((w: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-rose-50 text-rose-700">
                                  {w}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
