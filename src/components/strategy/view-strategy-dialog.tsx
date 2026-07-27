"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Target, Users, Megaphone, Compass, Download } from "lucide-react";
import { toast } from "sonner";

interface ViewStrategyDialogProps {
  strategy: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    objectives: any;
    personas: any;
    funnelStages: any;
    channels: any;
    business?: {
      name: string;
    };
  };
}

function safeParseJsonArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function safeParseJsonObject(val: any): any {
  if (!val) return null;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function ViewStrategyDialog({ strategy }: ViewStrategyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse JSON data safely
  const objectives = safeParseJsonArray(strategy.objectives);
  const personas = safeParseJsonArray(strategy.personas);
  const funnelStages = safeParseJsonArray(strategy.funnelStages);
  const channels = safeParseJsonArray(strategy.channels);

  const executiveP2P = safeParseJsonObject((strategy as any).executiveSummaryP2P);
  const benchmark2026 = safeParseJsonObject((strategy as any).assetAuditBenchmarking2026);
  const seoAeo = safeParseJsonObject((strategy as any).nextGenVisibilitySeoAeo);
  const convCare = safeParseJsonObject((strategy as any).conversionSocialCare);
  const techStack = safeParseJsonObject((strategy as any).techStackProductivity);

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.");
      return;
    }

    const brandName = strategy.business?.name || "Mi Negocio";
    const strategyName = strategy.name || "Estrategia de Marketing";
    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    // Objectives HTML
    let objectivesHtml = "";
    if (objectives && objectives.length > 0) {
      objectivesHtml = `
        <div class="section-card">
          <h2>1. Objetivos SMART</h2>
          <div class="objectives-grid">
            ${objectives.map((obj: any) => `
              <div class="card obj-card">
                <div class="card-header">
                  <div class="card-title">${obj.name || "Objetivo"}</div>
                  <span class="badge ${obj.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}">${obj.status || 'PENDIENTE'}</span>
                </div>
                <div class="card-body">
                  <p><strong>Específico (S):</strong> ${obj.specific || ""}</p>
                  <p><strong>Medible (M):</strong> ${obj.measurable || ""}</p>
                  <p><strong>Meta:</strong> ${obj.targetValue || ""} ${obj.unit || ""}</p>
                  <p><strong>Plazo:</strong> ${obj.deadline || ""}</p>
                  ${obj.timeBound ? `<p><strong>Temporal (T):</strong> ${obj.timeBound}</p>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Buyer Personas HTML
    let personasHtml = "";
    if (personas && personas.length > 0) {
      personasHtml = `
        <div class="section-card">
          <h2>2. Público Objetivo (Buyer Personas)</h2>
          <div class="personas-grid">
            ${personas.map((p: any) => `
              <div class="card persona-card">
                <div class="card-header bg-accent">
                  <div class="card-title">${p.name || "Persona"}</div>
                  <span class="demographics">${p.demographics || ""}</span>
                </div>
                <div class="card-body">
                  <p><strong>Objetivos y Deseos:</strong><br>${p.goals || "No definidos"}</p>
                  <p><strong>Puntos de Dolor:</strong><br>${p.painPoints || "No definidos"}</p>
                  ${p.communication ? `
                    <div class="sub-info">
                      ${p.communication.tone ? `<p><strong>Tono:</strong> ${p.communication.tone}</p>` : ""}
                      ${p.communication.triggers ? `<p><strong>Triggers:</strong> ${p.communication.triggers}</p>` : ""}
                      ${p.communication.topics ? `<p><strong>Temas de interés:</strong> ${p.communication.topics}</p>` : ""}
                    </div>
                  ` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Funnel Stages HTML
    let funnelHtml = "";
    if (funnelStages && funnelStages.length > 0) {
      funnelHtml = `
        <div class="section-card">
          <h2>3. Fases del Funnel de Ventas</h2>
          <div class="funnel-list">
            ${funnelStages.map((stage: any, idx: number) => `
              <div class="funnel-item">
                <div class="funnel-number">${idx + 1}</div>
                <div class="funnel-content">
                  <div class="funnel-name">${stage.name || ""}</div>
                  <div class="funnel-desc">${stage.description || ""}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Channels HTML
    let channelsHtml = "";
    if (channels && channels.length > 0) {
      channelsHtml = `
        <div class="section-card">
          <h2>4. Plan de Canales y Frecuencia</h2>
          <div class="channels-grid">
            ${channels.map((ch: any) => `
              <div class="card channel-card">
                <div class="card-header">
                  <div class="card-title">${ch.name || ""}</div>
                  <span class="badge badge-channel">${ch.type || "SOCIAL"}</span>
                </div>
                <div class="card-body">
                  ${ch.frequency ? `<p><strong>Frecuencia:</strong> ${ch.frequency}</p>` : ""}
                  ${ch.notes ? `<p class="notes"><strong>Notas:</strong> <em>${ch.notes}</em></p>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${strategyName} - ${brandName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;750;800&display=swap');
            @page {
              margin: 10mm 10mm;
              size: A4 portrait;
            }
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 20px;
              line-height: 1.45;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header-container {
              border-bottom: 2px solid #8b5cf6;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .header-container h1 {
              margin: 0 0 6px 0;
              font-size: 22px;
              color: #1e1b4b;
              font-weight: 800;
              letter-spacing: -0.025em;
            }
            .metadata-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              font-size: 12px;
              color: #64748b;
            }
            h2 {
              color: #1e1b4b;
              font-size: 16px;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 6px;
              margin-top: 0;
              margin-bottom: 14px;
              font-weight: 700;
              page-break-after: avoid;
              break-after: avoid;
            }
            .description-box {
              font-size: 12px;
              line-height: 1.5;
              color: #475569;
              background: #f8fafc;
              padding: 14px 18px;
              border-left: 4px solid #8b5cf6;
              border-radius: 8px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .section-card {
              margin-bottom: 22px;
              page-break-inside: auto;
              break-inside: auto;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              overflow: hidden;
              background: #fff;
              margin-bottom: 12px;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .card-header {
              padding: 10px 14px;
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .card-header.bg-accent {
              background: #eef2ff;
              border-bottom-color: #e0e7ff;
            }
            .card-title {
              font-weight: 750;
              font-size: 13px;
              color: #1e1b4b;
            }
            .card-body {
              padding: 12px 14px;
              font-size: 11px;
              color: #334155;
            }
            .card-body p {
              margin: 0 0 6px 0;
            }
            .card-body p:last-child {
              margin-bottom: 0;
            }
            .badge {
              padding: 2px 7px;
              border-radius: 4px;
              font-size: 8.5px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-completed { background: #dcfce7; color: #166534; }
            .badge-pending { background: #fef3c7; color: #92400e; }
            .badge-channel { background: #f1f5f9; color: #475569; }
            .demographics {
              font-size: 10px;
              color: #4f46e5;
              font-weight: 600;
            }
            .sub-info {
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px dashed #e2e8f0;
            }
            .objectives-grid, .personas-grid, .channels-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            @media (max-width: 600px) {
              .objectives-grid, .personas-grid, .channels-grid {
                grid-template-columns: 1fr;
              }
            }
            .funnel-list {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .funnel-item {
              display: flex;
              gap: 10px;
              padding: 12px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              align-items: flex-start;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .funnel-number {
              width: 22px;
              height: 22px;
              background: #8b5cf6;
              color: #fff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 11px;
              flex-shrink: 0;
            }
            .funnel-content {
              font-size: 11px;
            }
            .funnel-name {
              font-weight: 700;
              color: #1e1b4b;
              margin-bottom: 2px;
            }
            .funnel-desc {
              color: #475569;
            }
            .notes {
              color: #64748b;
              background: #fafafa;
              padding: 6px 8px;
              border-radius: 6px;
              border-left: 2px solid #cbd5e1;
            }
            @media print {
              body {
                padding: 0 !important;
              }
              .section-card {
                page-break-inside: auto !important;
                break-inside: auto !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1>Plan Estratégico: ${strategyName}</h1>
            <div class="metadata-grid">
              <div><strong>Negocio:</strong> ${brandName}</div>
              <div style="text-align: right;"><strong>Fecha:</strong> ${dateStr}</div>
            </div>
          </div>

          ${strategy.description ? `
            <div class="description-box">
              <strong>Descripción General:</strong><br>
              ${strategy.description.replace(/\n/g, '<br>')}
            </div>
          ` : ""}

          ${objectivesHtml}
          ${personasHtml}
          ${funnelHtml}
          ${channelsHtml}

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 cursor-pointer">
          <Eye className="h-3.5 w-3.5" />
          Ver Datos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {strategy.name}
                <Badge variant={strategy.isActive ? "default" : "secondary"} className="ml-2">
                  {strategy.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Estrategia de marketing para {strategy.business?.name || "tu negocio"}.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="gap-2 text-violet-750 dark:text-violet-400 border-violet-200 dark:border-slate-800 bg-violet-50/50 dark:bg-slate-900 hover:bg-violet-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto pr-3 mt-4 max-h-[60vh] space-y-6">
          <div className="space-y-6 pb-4">
            {strategy.description && (
              <div className="py-3 px-4 bg-muted/45 rounded-lg text-xs text-slate-700 dark:text-slate-350 border border-muted/70">
                <span className="font-bold block mb-1 text-slate-800 dark:text-slate-200">Descripción / Visión general:</span>
                {strategy.description}
              </div>
            )}

            {/* PILAR 1: RESUMEN P2P / PLM */}
            {executiveP2P && (
              <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-200/60 dark:border-purple-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                  <span>👥</span> 1. Identidad P2P (People-Led Marketing)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground pt-1">
                  <div>
                    <strong className="text-foreground block mb-0.5">Filosofía PLM:</strong>
                    <p className="leading-relaxed">{executiveP2P.philosophy || "Transición de marketing corporativo a comunicación liderada por personas reales."}</p>
                  </div>
                  <div>
                    <strong className="text-foreground block mb-0.5">Propuesta de Valor Auténtica:</strong>
                    <p className="leading-relaxed">{executiveP2P.valueProposition || "Conexión basada en experiencias auténticas de clientes."}</p>
                  </div>
                </div>
              </div>
            )}

            {/* PILAR 2: BENCHMARKING 2026 */}
            {benchmark2026 && (
              <div className="p-4 bg-indigo-50/30 dark:bg-slate-900/80 rounded-xl border border-indigo-200/50 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                    <span>📊</span> 2. Benchmarking de Engagement 2026 (El Deber Ser)
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{benchmark2026.profileHealth || "Auditado"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-background p-2.5 rounded-lg border text-center">
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase block">Facebook</span>
                    <span className="text-xs font-black text-foreground">{benchmark2026.benchmarks2026?.facebook || "0.15%"}</span>
                  </div>
                  <div className="bg-background p-2.5 rounded-lg border text-center">
                    <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase block">Instagram</span>
                    <span className="text-xs font-black text-foreground">{benchmark2026.benchmarks2026?.instagram || "0.48%"}</span>
                  </div>
                  <div className="bg-background p-2.5 rounded-lg border text-center">
                    <span className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase block">TikTok</span>
                    <span className="text-xs font-black text-foreground">{benchmark2026.benchmarks2026?.tiktok || "2.60% - 3.73%"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* PILAR 6, 7 & 8: VISIBILIDAD, CONVERSIÓN Y TECH STACK */}
            {(seoAeo || convCare || techStack) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {seoAeo && (
                  <div className="p-3.5 bg-background rounded-xl border space-y-1.5 text-xs">
                    <span className="font-bold text-violet-700 dark:text-violet-400 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <span>🔍</span> 6. Visibilidad SEO + AEO
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      <strong>Formatos IG:</strong> {seoAeo.instagramFormats?.carouselsTarget || "Carousels (10.15%)"} y {seoAeo.instagramFormats?.reelsTarget || "Reels (37.8%)"}
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      <strong>AEO:</strong> {seoAeo.aeoOptimization || "Citaciones en ChatGPT, Gemini y Perplexity."}
                    </p>
                  </div>
                )}
                {(convCare || techStack) && (
                  <div className="p-3.5 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 space-y-1.5 text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <span>💬</span> 7 & 8. Conversión & Stack IA
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      <strong>Customer Care:</strong> {convCare?.agenticAiCustomerCare || "Respuesta automática al 50% de dudas preventa con IA Agéntica."}
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                      • {techStack?.weeklyTimeSavings || "Ahorro de hasta 12 horas semanales por automatización."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN OBJETIVOS */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-violet-850 dark:text-violet-400 border-b pb-1.5">
                <Target className="h-4.5 w-4.5 text-violet-600" />
                Objetivos SMART
              </h3>
              {objectives.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-6">No hay objetivos registrados.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {objectives.map((obj: any, idx: number) => (
                    <Card key={idx} className="border shadow-none bg-violet-50/5">
                      <CardHeader className="p-3.5 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200">{obj.name}</CardTitle>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold text-violet-750 bg-violet-50/50 border-violet-200 shrink-0">
                            {obj.status || "PENDIENTE"}
                          </Badge>
                        </div>
                        <CardDescription className="text-[11px] mt-1 text-slate-700 dark:text-slate-355 font-medium leading-relaxed">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">Específico (S): </span>
                          {obj.specific}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3.5 pt-0 space-y-1.5 text-[11px] text-muted-foreground border-t border-muted/50 bg-muted/5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-bold text-foreground">Meta:</span> {obj.targetValue} {obj.unit || ""}
                          </div>
                          <div>
                            <span className="font-bold text-foreground">Plazo:</span> {obj.deadline || "Sin plazo"}
                          </div>
                        </div>
                        {obj.measurable && (
                          <div className="pt-1 border-t border-dashed border-muted/50">
                            <span className="font-bold text-foreground">Medible (M):</span> {obj.measurable}
                          </div>
                        )}
                        {obj.timeBound && (
                          <div>
                            <span className="font-bold text-foreground">Temporal (T):</span> {obj.timeBound}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN BUYER PERSONAS */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-855 dark:text-indigo-400 border-b pb-1.5">
                <Users className="h-4.5 w-4.5 text-indigo-650" />
                Público Objetivo (Buyer Personas)
              </h3>
              {personas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-6">No hay Buyer Personas registrados.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {personas.map((p: any, idx: number) => (
                    <Card key={idx} className="border shadow-none overflow-hidden bg-indigo-50/5">
                      <CardHeader className="bg-muted/10 p-3.5 pb-2 border-b">
                        <CardTitle className="text-xs font-bold text-indigo-850 dark:text-indigo-400">{p.name}</CardTitle>
                        <CardDescription className="text-[10px] mt-0.5 leading-relaxed text-slate-700 dark:text-slate-300">
                          {p.demographics}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3.5 space-y-2.5 text-[11px]">
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">Objetivos y Deseos:</span>
                          <p className="text-muted-foreground leading-relaxed">{p.goals || "No definidas"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">Puntos de Dolor (Pain Points):</span>
                          <p className="text-muted-foreground leading-relaxed">{p.painPoints || "No definidos"}</p>
                        </div>
                        {p.communication && (
                          <div className="space-y-1.5 mt-2.5 pt-2.5 border-t border-dashed border-muted">
                            {p.communication.tone && (
                              <div>
                                <span className="font-bold text-foreground">Tono de Voz:</span>
                                <span className="text-muted-foreground ml-1.5">{p.communication.tone}</span>
                              </div>
                            )}
                            {p.communication.triggers && (
                              <div>
                                <span className="font-bold text-foreground">Disparadores (Triggers):</span>
                                <span className="text-muted-foreground ml-1.5">{p.communication.triggers}</span>
                              </div>
                            )}
                            {p.communication.topics && (
                              <div>
                                <span className="font-bold text-foreground block">Temas de Interés:</span>
                                <span className="text-muted-foreground mt-0.5 block italic">{p.communication.topics}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN FUNNEL */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b pb-1.5">
                <Compass className="h-4.5 w-4.5 text-violet-600" />
                Fases del Funnel de Ventas
              </h3>
              {funnelStages.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-6">No hay fases del funnel definidas.</p>
              ) : (
                <div className="space-y-2">
                  {funnelStages.map((stage: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-slate-50/10 hover:bg-slate-50/20 transition-colors">
                      <div className="h-6 w-6 rounded-full bg-violet-600/10 text-violet-750 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{stage.name}</h4>
                        <p className="text-muted-foreground leading-normal">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN CANALES */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-violet-850 dark:text-violet-400 border-b pb-1.5">
                <Megaphone className="h-4.5 w-4.5 text-violet-600" />
                Plan de Canales y Frecuencia de Publicación
              </h3>
              {channels.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-6">No hay canales de comunicación configurados.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {channels.map((ch: any, idx: number) => (
                    <Card key={idx} className="border shadow-none bg-violet-50/5">
                      <CardHeader className="p-3 pb-1.5">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200">{ch.name}</CardTitle>
                          <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-violet-100/50 text-violet-700">
                            {ch.type || "SOCIAL"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground space-y-1">
                        {ch.frequency && (
                          <div>
                            <span className="font-semibold text-foreground">Frecuencia:</span> {ch.frequency}
                          </div>
                        )}
                        {ch.notes && (
                          <div className="mt-1 pt-1 border-t border-dashed border-muted">
                            <span className="font-semibold text-foreground block mb-0.5 text-[10px]">Notas:</span>
                            <p className="italic text-[10px] leading-tight">{ch.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
