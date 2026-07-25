import { toast } from "sonner";

const parseJson = (val: any) => {
  if (!val) return null;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  }
  return val;
};

const formatSocialMetric = (val: any): string => {
  if (val === undefined || val === null) return "N/D";
  const num = Number(val);
  if (isNaN(num)) return typeof val === "string" ? val.trim() : val.toString();
  return num.toLocaleString("es-ES");
};

const normalizeReportData = (rawReportData: any) => {
  if (!rawReportData) return null;
  let dataObj = typeof rawReportData === "string" ? JSON.parse(rawReportData) : rawReportData;
  
  if (Array.isArray(dataObj) && dataObj.length > 0 && dataObj.every(item => item && typeof item === "object" && "output" in item)) {
    const outputs = dataObj.map((item: any) => item.output).filter(Boolean);
    
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
      
      return {
        brand_identity: {
          brand_name: brandName,
          market_positioning: outputs[0].page_overview.brand_summary || ""
        },
        data_quality: {
          confidence_score: 0.95,
          missing_information: []
        },
        business_insights: {
          main_strengths: growthOps.slice(0, 3),
          main_weaknesses: contentRecs.slice(0, 2)
        },
        content_analysis: {
          main_products_or_services: products,
          common_topics: topics,
          main_campaigns_detected: campaigns
        },
        marketing_insights: {
          growth_opportunities: growthOps,
          content_recommendations: contentRecs
        },
        commercial_intelligence: {
          pricing_mentions: pricingMentions,
          sales_signals: salesSignals,
          conversion_strategies: conversionStrategies
        },
        engagement: {
          followers_count: totalReactions * 10,
          likes_count: totalReactions,
          engagement_level: "High"
        }
      };
    }
    return dataObj[0]?.output || dataObj[0] || null;
  }
  return dataObj;
};

const getChannelStatus = (entityId: string, channelName: string, isCompetitor: boolean, competitorReports: any[], businessReports: any[]) => {
  const reports = isCompetitor ? competitorReports : businessReports;
  const report = reports.find((r: any) => r.entityId === entityId && r.channel.toUpperCase() === channelName.toUpperCase());
  
  if (!report) return "idle";
  if (report.status === "COMPLETED") return "completed";
  if (report.status === "FAILED") return "failed";
  return "processing";
};

// HEURÍSTICA DE RECOMENDACIONES
const getFlatRecommendations = (reportData: any) => {
  if (!reportData) return [];
  let data = reportData;
  if (reportData.data) {
    data = typeof reportData.data === "string" ? JSON.parse(reportData.data) : reportData.data;
    if (Array.isArray(data) && data.length > 0) {
      data = data[0].output || data[0];
    }
  }
  
  if (Array.isArray(data.strategic_recommendations)) return data.strategic_recommendations;
  if (Array.isArray(data.recommendations)) return data.recommendations;
  if (Array.isArray(data.contentRecs)) return data.contentRecs;

  const isNewestStructure = !!data.brand_identity || !!data.business_insights || !!data.workspace_analysis || !!data.website_analysis;
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

    return arr;
  }

  const recs = data.strategic_recommendations || {};
  const brandingRecs = recs.branding_recommendations || [];
  const marketingRecs = recs.marketing_recommendations || [];
  const seoRecs = recs.seo_recommendations || [];
  const uxRecs = recs.ux_recommendations || [];
  const convRecs = recs.conversion_recommendations || [];

  if (brandingRecs.length > 0 || marketingRecs.length > 0 || seoRecs.length > 0 || uxRecs.length > 0 || convRecs.length > 0) {
    return [...brandingRecs, ...marketingRecs, ...seoRecs, ...uxRecs, ...convRecs];
  }
  if (Array.isArray(data.marketing_insights?.content_recommendations)) {
    return data.marketing_insights.content_recommendations;
  }
  if (Array.isArray(data.content_recommendations)) {
    return data.content_recommendations;
  }
  return [];
};

const getConsolidatedDetails = (reportsMap: Record<string, any>) => {
  let positioning = "No disponible";
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  const chOrder = ["WEBSITE", "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE", "SEO_GOOGLE"];
  
  for (const ch of chOrder) {
    const report = reportsMap?.[ch];
    if (report && report.status === "COMPLETED" && report.data) {
      const rData = typeof report.data === "string" ? JSON.parse(report.data) : report.data;
      let dataObj = Array.isArray(rData) && rData.length > 0 ? (rData[0].output || rData[0]) : rData;
      const pos = dataObj?.brand_identity?.market_positioning || dataObj?.competitor_overview?.market_positioning || dataObj?.market_positioning || dataObj?.title || dataObj?.facebook_presence?.brand_summary || dataObj?.instagram_presence?.brand_summary;
      if (pos && pos !== "Sin posicionamiento especificado" && positioning === "No disponible") {
        positioning = pos;
      }

      const rawStrengths = dataObj?.business_insights?.main_strengths || dataObj?.ux_analysis?.ux_strengths || dataObj?.competitive_insights?.main_strengths || dataObj?.strengths || [];
      const strengthsList = Array.isArray(rawStrengths) ? rawStrengths : [rawStrengths];
      strengthsList.forEach((s: string) => {
        if (s && typeof s === "string" && !strengths.includes(s)) strengths.push(s);
      });

      const rawWeaknesses = dataObj?.business_insights?.main_weaknesses || dataObj?.ux_analysis?.ux_weaknesses || dataObj?.competitive_insights?.main_weaknesses || dataObj?.weaknesses || [];
      const weaknessesList = Array.isArray(rawWeaknesses) ? rawWeaknesses : [rawWeaknesses];
      weaknessesList.forEach((w: string) => {
        if (w && typeof w === "string" && !weaknesses.includes(w)) weaknesses.push(w);
      });

      const recs = getFlatRecommendations(report);
      recs.forEach((r: string) => {
        if (r && typeof r === "string" && !recommendations.includes(r)) recommendations.push(r);
      });
    }
  }

  return {
    positioning,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    recommendations: recommendations.slice(0, 5)
  };
};

const getSelectedCompetitorAnalysis = (selectedComp: any) => {
  if (!selectedComp) return null;

  if (selectedComp.insights?.strategicAnalysis) {
    return selectedComp.insights.strategicAnalysis;
  }

  const channelMap: Record<string, { key: string; label: string }> = {
    WEBSITE: { key: "WEBSITE", label: "Sitio Web" },
    FACEBOOK: { key: "FACEBOOK", label: "Facebook" },
    INSTAGRAM: { key: "INSTAGRAM", label: "Instagram" },
    TIKTOK: { key: "TIKTOK", label: "TikTok" },
  };

  const fortalezas: string[] = [];
  const debilidades: string[] = [];
  const recomendaciones: string[] = [];

  for (const [chKey] of Object.entries(channelMap)) {
    const report = selectedComp.reportsByChannel?.[chKey];
    if (!report || report.status !== "COMPLETED" || !report.data) continue;

    const dataObj = normalizeReportData(report.data);
    if (!dataObj) continue;

    const strengthSources: any[] = [
      dataObj.business_insights?.main_strengths,
      dataObj.business_insights?.differentiators,
      dataObj.ux_analysis?.ux_strengths,
      dataObj.competitive_insights?.main_strengths,
    ];
    strengthSources.forEach((src) => {
      if (Array.isArray(src)) {
        src.forEach((item) => {
          if (item && typeof item === "string" && !fortalezas.includes(item)) fortalezas.push(item);
        });
      } else if (src && typeof src === "string" && !fortalezas.includes(src)) {
        fortalezas.push(src);
      }
    });

    const weaknessSources: any[] = [
      dataObj.business_insights?.main_weaknesses,
      dataObj.ux_analysis?.ux_weaknesses,
      dataObj.competitive_insights?.main_weaknesses,
    ];
    weaknessSources.forEach((src) => {
      if (Array.isArray(src)) {
        src.forEach((item) => {
          if (item && typeof item === "string" && !debilidades.includes(item)) debilidades.push(item);
        });
      } else if (src && typeof src === "string" && !debilidades.includes(src)) {
        debilidades.push(src);
      }
    });

    const recs = getFlatRecommendations(report);
    recs.forEach((r: string) => {
      if (r && typeof r === "string" && !recomendaciones.includes(r)) recomendaciones.push(r);
    });
  }

  return {
    desempenoCanales: fortalezas.slice(0, 4),
    debilidadesGaps: debilidades.slice(0, 4),
    planContramedida: recomendaciones.slice(0, 4),
  };
};

export const handleDownloadEstrategiaPDF = (parsedStrategyObj: any, activeStrategy: any, brandName: string) => {
  if (!parsedStrategyObj) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.");
    return;
  }

  const strategyName = activeStrategy?.name || "Estrategia de Marketing";
  const dateStr = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  let objectivesHtml = "";
  if (parsedStrategyObj.objectives && parsedStrategyObj.objectives.length > 0) {
    objectivesHtml = `
      <div class="mb-6 section-card">
        <h2 class="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-1.5 mb-3 flex items-center gap-2">
          <span>🎯</span> 1. Objetivos SMART
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${parsedStrategyObj.objectives.map((obj: any) => `
            <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between gap-3 page-break-inside-avoid">
              <div>
                <div class="flex justify-between items-center border-b pb-2 mb-2.5">
                  <span class="font-extrabold text-slate-800 text-xs">${obj.name || "Objetivo"}</span>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${obj.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">${obj.status || 'PENDIENTE'}</span>
                </div>
                <div class="space-y-1.5 text-xs text-slate-650">
                  <p><strong>S (Específico):</strong> ${obj.specific || ""}</p>
                  <p><strong>M (Medible):</strong> ${obj.measurable || ""}</p>
                  <p><strong>Meta:</strong> ${obj.targetValue || ""} ${obj.unit || ""}</p>
                  <p><strong>Plazo (T):</strong> ${obj.deadline || ""}</p>
                  ${obj.timeBound ? `<p><strong>Temporal:</strong> ${obj.timeBound}</p>` : ""}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  let personasHtml = "";
  if (parsedStrategyObj.personas && parsedStrategyObj.personas.length > 0) {
    personasHtml = `
      <div class="mb-6 section-card">
        <h2 class="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-1.5 mb-3 flex items-center gap-2">
          <span>👥</span> 2. Público Objetivo (Buyer Personas)
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${parsedStrategyObj.personas.map((p: any, idx: number) => `
            <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between page-break-inside-avoid">
              <div class="space-y-2.5">
                <div class="flex justify-between items-center border-b pb-2">
                  <div class="flex items-center gap-2">
                    <span class="h-5 w-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] font-black">P${idx + 1}</span>
                    <span class="font-extrabold text-slate-800 text-xs">${p.name || "Persona"}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">${p.demographics || ""}</span>
                </div>
                <div class="space-y-1.5 text-xs text-slate-655">
                  <p class="bg-slate-50 p-2 rounded-xl border border-slate-100"><strong>Objetivos:</strong> ${p.goals || "No definidos"}</p>
                  <p class="bg-rose-50/40 p-2 rounded-xl border border-rose-100 text-rose-900"><strong>Puntos de Dolor:</strong> ${p.painPoints || "No definidos"}</p>
                  ${p.communication ? `
                    <div class="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 space-y-0.5">
                      <strong class="text-purple-900 block text-[9px] uppercase font-black">Guía de Comunicación:</strong>
                      ${p.communication.tone ? `<div><strong>Tono:</strong> ${p.communication.tone}</div>` : ""}
                      ${p.communication.triggers ? `<div><strong>Triggers:</strong> ${p.communication.triggers}</div>` : ""}
                      ${p.communication.topics ? `<div><strong>Temas:</strong> ${p.communication.topics}</div>` : ""}
                    </div>
                  ` : ""}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  let funnelHtml = "";
  if (parsedStrategyObj.funnelStages && parsedStrategyObj.funnelStages.length > 0) {
    funnelHtml = `
      <div class="mb-6 section-card">
        <h2 class="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-1.5 mb-3 flex items-center gap-2">
          <span>⚙️</span> 3. Fases del Funnel de Ventas
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${parsedStrategyObj.funnelStages.map((stage: any, idx: number) => `
            <div class="flex gap-3 items-start bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm page-break-inside-avoid">
              <div class="h-7 w-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shrink-0 text-xs shadow-sm">${idx + 1}</div>
              <div>
                <div class="font-extrabold text-slate-800 text-xs mb-0.5">${stage.name || ""}</div>
                <div class="text-[11px] text-slate-600 leading-snug">${stage.description || ""}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  let channelsHtml = "";
  if (parsedStrategyObj.channels && parsedStrategyObj.channels.length > 0) {
    channelsHtml = `
      <div class="mb-6 section-card">
        <h2 class="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-1.5 mb-3 flex items-center gap-2">
          <span>📢</span> 4. Plan de Canales y Frecuencia
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${parsedStrategyObj.channels.map((ch: any) => `
            <div class="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm flex flex-col justify-between gap-2 page-break-inside-avoid">
              <div class="flex justify-between items-center border-b pb-1.5 mb-1">
                <span class="font-extrabold text-slate-800 text-xs">${ch.name || ""}</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">${ch.type || "SOCIAL"}</span>
              </div>
              <div class="text-xs text-slate-655 space-y-1">
                ${ch.frequency ? `<div><strong>Frecuencia:</strong> ${ch.frequency}</div>` : ""}
                ${ch.notes ? `<div class="italic text-slate-500 mt-1"><strong>Notas:</strong> ${ch.notes}</div>` : ""}
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
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Outfit', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          @page {
            margin: 10mm 10mm;
            size: A4 portrait;
          }
          body {
            font-family: 'Outfit', sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .section-card {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          h1, h2, h3, h4 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          @media print {
            body {
              padding: 0 !important;
              background-color: #ffffff !important;
            }
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-800 p-6 leading-relaxed">
        <div class="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-pink-500/10 border border-purple-200/60 p-4 rounded-2xl shadow-sm mb-5 flex justify-between items-center page-break-inside-avoid">
          <div>
            <span class="text-[9px] font-black uppercase tracking-widest text-purple-700">OB MarketHub - Growth Strategy</span>
            <h1 class="text-xl font-black text-slate-800 tracking-tight">${strategyName}</h1>
          </div>
          <div class="text-right text-xs text-slate-500 font-bold">
            Negocio: ${brandName} | Generación: ${dateStr}
          </div>
        </div>

        ${activeStrategy.description ? `
          <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-xs text-slate-650 mb-5 leading-relaxed italic border-l-4 border-l-purple-600 page-break-inside-avoid">
            ${activeStrategy.description}
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
              setTimeout(function() { window.close(); }, 800);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const handleDownloadBancoDeDatosPDF = (
  data: any,
  businessReports: any[],
  competitorReports: any[],
  competitorsList: any[],
  businessId: string
) => {
  if (!data) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.");
    return;
  }

  const brandName = data.businessInfo?.name || "Mi Negocio";
  const dateStr = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  const phone = data.businessInfo?.phoneNumbers || "No registrado";
  const website = data.businessInfo?.website || "No registrado";
  const location = data.businessInfo?.location || "No registrado";
  const industry = data.businessInfo?.industry || "No registrado";
  const description = data.businessInfo?.description || "No registrado";
  
  const consolidatedReport = businessReports.find((r: any) => r.channel === "CONSOLIDATED");
  const parsedConsPdf = consolidatedReport ? (parseJson(consolidatedReport.data) || {}) : {};
  const valueProposition = parsedConsPdf.marketPosition?.value_proposition || parsedConsPdf.valueProposition || parsedConsPdf.marketPosition?.competitiveAdvantage || "No registrado";

  const voice = parseJson(data.businessInfo?.brandVoice) || {};
  const colors = parseJson(data.businessInfo?.brandColors) || {};
  const socialLinks = parseJson(data.businessInfo?.socialLinks) || {};

  const getStatusTextAndColor = (status: string) => {
    if (status === "completed") return { text: "AUDITADO", bg: "#dcfce7", color: "#15803d" };
    if (status === "processing") return { text: "EXTRAENDO", bg: "#dbeafe", color: "#1d4ed8" };
    if (status === "failed") return { text: "FALLIDO", bg: "#ffe4e6", color: "#b91c1c" };
    return { text: "EN COLA", bg: "#f1f5f9", color: "#475569" };
  };

  let myScrapingChannelsHtml = "";
  if (website && website !== "No registrado") {
    const status = getChannelStatus(businessId, "WEBSITE", false, competitorReports, businessReports);
    const statStyle = getStatusTextAndColor(status);
    myScrapingChannelsHtml += `
      <div class="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <span class="text-xs font-semibold text-slate-700 truncate">🌐 Sitio Web: <span class="text-[10px] text-slate-400 font-mono">${website}</span></span>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider" style="background-color: ${statStyle.bg}; color: ${statStyle.color};">${statStyle.text}</span>
      </div>
    `;
  }
  Object.entries(socialLinks).forEach(([channel, url]) => {
    if (url && String(url).trim() !== "") {
      const status = getChannelStatus(businessId, channel, false, competitorReports, businessReports);
      const statStyle = getStatusTextAndColor(status);
      const emoji = channel.toUpperCase() === "FACEBOOK" ? "📘" : channel.toUpperCase() === "INSTAGRAM" ? "📸" : channel.toUpperCase() === "TIKTOK" ? "🎵" : "📱";
      myScrapingChannelsHtml += `
        <div class="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <span class="text-xs font-semibold text-slate-700 truncate">${emoji} ${channel.toUpperCase()}: <span class="text-[10px] text-slate-400 font-mono">${url}</span></span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider" style="background-color: ${statStyle.bg}; color: ${statStyle.color};">${statStyle.text}</span>
        </div>
      `;
    }
  });

  let compScrapingChannelsHtml = "";
  competitorsList.forEach((c: any) => {
    let compChannels = "";
    if (c.website) {
      const status = getChannelStatus(c.id, "WEBSITE", true, competitorReports, businessReports);
      const statStyle = getStatusTextAndColor(status);
      compChannels += `
        <div class="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-700">
          <span>🌐 Sitio Web</span>
          <span class="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" style="background-color: ${statStyle.bg}; color: ${statStyle.color};">${statStyle.text}</span>
        </div>
      `;
    }
    const socialPlatforms = ["facebook", "instagram", "tiktok"];
    socialPlatforms.forEach(platform => {
      if (c[platform]) {
        const status = getChannelStatus(c.id, platform.toUpperCase(), true, competitorReports, businessReports);
        const statStyle = getStatusTextAndColor(status);
        const emoji = platform === "facebook" ? "📘" : platform === "instagram" ? "📸" : "🎵";
        compChannels += `
          <div class="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-700">
            <span>${emoji} ${platform.toUpperCase()}</span>
            <span class="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" style="background-color: ${statStyle.bg}; color: ${statStyle.color};">${statStyle.text}</span>
          </div>
        `;
      }
    });

    compScrapingChannelsHtml += `
      <div class="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-2">
        <div class="font-extrabold text-slate-800 text-xs border-b pb-1.5 mb-2.5 text-uppercase tracking-wide">
          ${c.name}
        </div>
        <div class="space-y-1.5">
          ${compChannels || `<div class="text-[10px] text-slate-400 italic">Sin canales registrados</div>`}
        </div>
      </div>
    `;
  });

  const scrapingProgressSectionHtml = `
    <div class="mb-10 page-break-inside-avoid">
      <h2 class="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2 mb-6 flex items-center gap-2">
        <span>⚡</span> 3. Progreso de Extracción Web (Scraping)
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <div class="flex justify-between items-center border-b pb-2">
            <span class="text-xs font-black uppercase text-slate-800">Mi Negocio</span>
            <span class="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-full text-[8px] font-black uppercase tracking-wider">PROPIO</span>
          </div>
          <div class="space-y-2">
            ${myScrapingChannelsHtml || `<div class="text-xs text-slate-400 italic">Sin canales propios registrados</div>`}
          </div>
        </div>
        <div class="col-span-2 bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
          <div class="flex justify-between items-center border-b pb-2">
            <span class="text-xs font-black uppercase text-slate-800">Competidores</span>
            <span class="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-[8px] font-black uppercase tracking-wider">MERCADO</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${compScrapingChannelsHtml || `<div class="text-xs text-slate-400 italic">Sin competidores registrados</div>`}
          </div>
        </div>
      </div>
    </div>
  `;

  let myAuditedChannelsHtml = "";
  const channels = ["WEBSITE", "FACEBOOK", "INSTAGRAM", "TIKTOK"];
  const myAnalysesByChannel = businessReports.reduce((acc: any, r: any) => {
    acc[r.channel.toUpperCase()] = r;
    return acc;
  }, {});
  
  channels.forEach(chan => {
    const report = myAnalysesByChannel[chan];
    const status = getChannelStatus(businessId, chan, false, competitorReports, businessReports);
    if (status === "idle") return;

    let followers = "N/D";
    let likes = "N/D";
    let engagement = "N/D";

    if (report && report.data) {
      const dataObj = normalizeReportData(report.data);
      if (dataObj) {
        if (chan === "TIKTOK") {
          followers = formatSocialMetric(dataObj.engagement?.followers_count || dataObj.followers);
          likes = formatSocialMetric(dataObj.engagement?.likes_count || dataObj.likes);
          engagement = dataObj.engagement?.engagement_level || "Medium";
        } else if (chan === "FACEBOOK") {
          followers = formatSocialMetric(dataObj.facebook_presence?.audience_metrics?.followers);
          likes = formatSocialMetric(dataObj.facebook_presence?.audience_metrics?.talking_about_count);
          engagement = dataObj.facebook_presence?.audience_metrics?.talking_about_count ? "Media" : "N/D";
        } else if (chan === "INSTAGRAM") {
          followers = formatSocialMetric(dataObj.instagram_presence?.audience_size?.followers || dataObj.followers);
          likes = formatSocialMetric(dataObj.instagram_presence?.audience_size?.posts_count || dataObj.posts);
          engagement = dataObj.engagement_analysis?.engagement_level || "Medium";
        } else if (chan === "WEBSITE") {
          followers = dataObj.brand_identity?.market_positioning ? "Web Activa" : "Completado";
          likes = dataObj.data_quality?.confidence_score ? `Confianza: ${Math.round(dataObj.data_quality.confidence_score * 100)}%` : "Alta";
          engagement = "N/D";
        }
      }
    }

    const statStyle = getStatusTextAndColor(status);
    const emoji = chan === "WEBSITE" ? "🌐" : chan === "FACEBOOK" ? "📘" : chan === "INSTAGRAM" ? "📸" : "🎵";

    myAuditedChannelsHtml += `
      <div class="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col justify-between gap-3">
        <div class="flex justify-between items-center border-b pb-2">
          <span class="text-xs font-black text-slate-800 flex items-center gap-1.5">${emoji} ${chan}</span>
          <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider" style="background-color: ${statStyle.bg}; color: ${statStyle.color};">${statStyle.text}</span>
        </div>
        <div class="space-y-1.5 text-xs">
          ${chan === "WEBSITE" ? `
            <div class="flex justify-between"><span class="text-slate-400">Estado:</span> <span class="font-bold text-slate-700">${followers}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Calidad:</span> <span class="font-bold text-slate-700">${likes}</span></div>
          ` : `
            <div class="flex justify-between"><span class="text-slate-400">Seguidores:</span> <span class="font-bold text-slate-700">${followers}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Actividad:</span> <span class="font-bold text-slate-700">${likes}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Engagement:</span> <span class="font-bold text-purple-605 text-purple-700">${engagement}</span></div>
          `}
        </div>
      </div>
    `;
  });

  let myAuditedChannelsSection = "";
  if (myAuditedChannelsHtml) {
    myAuditedChannelsSection = `
      <div class="mt-8 page-break-inside-avoid">
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">
          Canales Auditados y Métricas Propias
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          ${myAuditedChannelsHtml}
        </div>
      </div>
    `;
  }

  const formatArray = (val: any) => {
    if (!val) return "No especificado";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "string") return val;
    return "No especificado";
  };

  let socialLinksHtml = "";
  const links = Object.entries(socialLinks).filter(([, v]) => v && String(v).trim());
  if (links.length > 0) {
    socialLinksHtml = `
      <div class="flex flex-wrap gap-2 pt-1.5">
        ${links.map(([platform, url]) => `
          <span class="inline-flex items-center px-3 py-1 bg-white border border-slate-150 rounded-2xl text-[10px] font-bold text-slate-600 shadow-sm">${platform}: <span class="font-mono text-[9px] text-slate-400 ml-1 truncate max-w-[200px]">${url}</span></span>
        `).join("")}
      </div>
    `;
  }

  let brandColorsHtml = "";
  if (colors.primary || colors.secondary) {
    brandColorsHtml = `
      <div class="flex gap-4 pt-1.5">
        ${colors.primary ? `
          <div class="flex items-center gap-2">
            <span class="h-4.5 w-4.5 rounded-full border border-slate-200" style="background-color: ${colors.primary}"></span>
            <span class="text-xs text-slate-600"><strong>Primario:</strong> ${colors.primary}</span>
          </div>
        ` : ""}
        ${colors.secondary ? `
          <div class="flex items-center gap-2">
            <span class="h-4.5 w-4.5 rounded-full border border-slate-200" style="background-color: ${colors.secondary}"></span>
            <span class="text-xs text-slate-600"><strong>Secundario:</strong> ${colors.secondary}</span>
          </div>
        ` : ""}
      </div>
    `;
  }

  let businessInfoHtml = `
    <div class="mb-10 page-break-inside-avoid">
      <h2 class="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2 mb-6 flex items-center gap-2">
        <span>🏢</span> 1. Información de Mi Negocio
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1">DATOS DE REGISTRO</span>
          <p class="text-xs text-slate-700"><strong>Ubicación:</strong> ${location}</p>
          <p class="text-xs text-slate-700"><strong>Industria:</strong> ${industry}</p>
          <p class="text-xs text-slate-700"><strong>Teléfono:</strong> ${phone}</p>
          <p class="text-xs text-slate-700"><strong>Sitio Web:</strong> ${website}</p>
        </div>
        <div class="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3 col-span-2">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1">ENFOQUE Y PROPUESTA DE VALOR</span>
          <p class="text-xs text-slate-700"><strong>Descripción:</strong> ${description}</p>
          <p class="text-xs text-orange-600 font-bold italic"><strong>Propuesta de Valor:</strong> "${valueProposition}"</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1">IDENTIDAD DE MARCA</span>
          <p class="text-xs text-slate-700"><strong>Tono de Voz:</strong> ${formatArray(voice.tone)}</p>
          <p class="text-xs text-slate-700"><strong>Personalidad:</strong> ${formatArray(voice.personality)}</p>
          ${brandColorsHtml}
        </div>
        <div class="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3 col-span-2">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1">REDES VINCULADAS</span>
          ${socialLinksHtml || `<div class="text-xs text-slate-400 italic pt-1">Sin redes vinculadas</div>`}
        </div>
      </div>
    </div>
  `;

  let competitorsHtml = "";
  if (competitorsList && competitorsList.length > 0) {
    competitorsHtml = `
      <div class="mb-10 page-break-inside-avoid">
        <h2 class="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2 mb-6 flex items-center gap-2">
          <span>⚔️</span> 2. Competidores Registrados
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${competitorsList.map((c: any, idx: number) => `
            <div class="bg-slate-50/30 border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between gap-4">
              <div>
                <div class="flex justify-between items-center border-b pb-2 mb-3">
                  <span class="font-extrabold text-slate-800 text-sm">${c.name}</span>
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-black bg-slate-100 text-slate-500 uppercase tracking-wider">Competidor ${idx + 1}</span>
                </div>
                <p class="text-xs text-slate-600"><strong>Sitio Web:</strong> ${c.website || "No registrado"}</p>
              </div>
              <div class="flex gap-2">
                ${c.facebook ? `<span class="px-2.5 py-1 bg-white border border-slate-155 rounded-xl text-[10px] font-bold text-slate-600 shadow-sm">📘 Facebook</span>` : ""}
                ${c.instagram ? `<span class="px-2.5 py-1 bg-white border border-slate-155 rounded-xl text-[10px] font-bold text-slate-600 shadow-sm">📸 Instagram</span>` : ""}
                ${c.tiktok ? `<span class="px-2.5 py-1 bg-white border border-slate-155 rounded-xl text-[10px] font-bold text-slate-600 shadow-sm">🎵 TikTok</span>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  let fodaHtml = "";
  if (consolidatedReport) {
    const parsedCons = parseJson(consolidatedReport.data) || {};
    const strengths = Array.isArray(parsedCons.strengths) ? parsedCons.strengths : [];
    const weaknesses = Array.isArray(parsedCons.weaknesses) ? parsedCons.weaknesses : [];
    const opportunities = Array.isArray(parsedCons.opportunities) ? parsedCons.opportunities : [];
    const threats = Array.isArray(parsedCons.threats) ? parsedCons.threats : [];
    const position = parsedCons.marketPosition || {};
    const recommendations = parsedCons.strategicRecommendations || parsedCons.recommendations || [];

    let personasHtml = "";
    if (parsedCons.buyerPersonas && parsedCons.buyerPersonas.length > 0) {
      personasHtml = `
        <div class="mt-8 page-break-inside-avoid">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">
            Público Objetivo (Buyer Personas)
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${parsedCons.buyerPersonas.map((p: any, idx: number) => `
              <div class="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
                <div class="flex justify-between items-center border-b pb-2.5">
                  <strong class="text-slate-800 text-xs">P${idx + 1}: ${p.name || "Audiencia"}</strong>
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-black bg-orange-50 text-orange-700 uppercase tracking-wider">${p.demographics || ""}</span>
                </div>
                <div class="space-y-2 text-xs text-slate-650">
                  <p class="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100"><strong>Objetivos:</strong> ${p.goals || "N/D"}</p>
                  <p class="bg-rose-50/20 p-2.5 rounded-xl border border-rose-100/50 text-rose-800"><strong>Puntos de Dolor:</strong> ${p.painPoints || "N/D"}</p>
                  ${p.communication ? `
                    <div class="bg-orange-50/30 p-2.5 rounded-xl border border-orange-100/50 space-y-0.5 text-[11px] text-orange-900 leading-normal">
                      <strong>Guía de Comunicación:</strong><br>
                      Tono: ${p.communication.tone || "N/D"}<br>
                      Triggers: ${p.communication.triggers || "N/D"}<br>
                      Temas: ${p.communication.topics || "N/D"}
                    </div>
                  ` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    fodaHtml = `
      <div class="mb-10 page-break-inside-avoid">
        <h2 class="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2 mb-6 flex items-center gap-2">
          <span>✦</span> 4. Informe General de Mi Negocio (FODA)
        </h2>
        ${parsedCons.executiveSummary ? `
          <div class="bg-orange-500/5 border border-orange-200/50 p-6 rounded-3xl shadow-sm text-xs text-slate-655 mb-6 leading-relaxed border-l-4 border-l-orange-500">
            <strong>Resumen Ejecutivo Consolidado:</strong><br>
            ${parsedCons.executiveSummary}
          </div>
        ` : ""}

        ${position.currentPosition ? `
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm text-xs text-slate-650">
              <strong>Posición Actual:</strong><br>${position.currentPosition}
            </div>
            <div class="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm text-xs text-slate-650">
              <strong>Ventaja Competitiva:</strong><br>${position.competitiveAdvantage || "N/D"}
            </div>
            <div class="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl shadow-sm text-xs text-slate-650">
              <strong>Brecha de Mercado:</strong><br>${position.marketGap || "N/D"}
            </div>
          </div>
        ` : ""}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-2">
            <span class="text-xs font-black uppercase tracking-widest text-emerald-700 border-b border-emerald-500/10 pb-1.5 block">✓ Fortalezas</span>
            <ul class="list-none space-y-1.5 text-xs text-slate-650">
              ${strengths.map((s: string) => `<li class="flex items-start gap-1.5"><span class="text-emerald-600 font-bold">•</span> ${s}</li>`).join("")}
            </ul>
          </div>
          <div class="p-5 bg-orange-500/5 border border-orange-500/10 rounded-3xl space-y-2">
            <span class="text-xs font-black uppercase tracking-widest text-orange-700 border-b border-orange-500/10 pb-1.5 block">⚠️ Debilidades</span>
            <ul class="list-none space-y-1.5 text-xs text-slate-650">
              ${weaknesses.map((w: string) => `<li class="flex items-start gap-1.5"><span class="text-orange-650 font-bold">•</span> ${w}</li>`).join("")}
            </ul>
          </div>
          <div class="p-5 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-2">
            <span class="text-xs font-black uppercase tracking-widest text-blue-700 border-b border-blue-500/10 pb-1.5 block">✦ Oportunidades</span>
            <ul class="list-none space-y-1.5 text-xs text-slate-650">
              ${opportunities.map((o: string) => `<li class="flex items-start gap-1.5"><span class="text-blue-600 font-bold">•</span> ${o}</li>`).join("")}
            </ul>
          </div>
          <div class="p-5 bg-rose-500/5 border border-rose-500/10 rounded-3xl space-y-2">
            <span class="text-xs font-black uppercase tracking-widest text-rose-700 border-b border-rose-500/10 pb-1.5 block">⚡ Amenazas</span>
            <ul class="list-none space-y-1.5 text-xs text-slate-655">
              ${threats.map((t: string) => `<li class="flex items-start gap-1.5"><span class="text-rose-600 font-bold">•</span> ${t}</li>`).join("")}
            </ul>
          </div>
        </div>

        ${recommendations.length > 0 ? `
          <div class="mt-8">
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Recomendaciones Estratégicas</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${recommendations.map((rec: any, idx: number) => {
                const action = typeof rec === 'string' ? rec : rec.action || rec.description;
                const category = typeof rec === 'string' ? 'General' : rec.category || 'Estrategia';
                return `
                  <div class="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs text-slate-700 leading-relaxed font-semibold">
                    <strong>${idx + 1}. [${category}]</strong> ${action}
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}

        ${personasHtml}
        ${myAuditedChannelsSection}
      </div>
    `;
  }

  let competitiveIntelHtml = "";
  if (data.businessInfo?.competitorGeneralReport) {
    const parsedReport = parseJson(data.businessInfo.competitorGeneralReport) || {};
    const summaryObj = parsedReport.executiveSummary || {};
    let executiveSummary = "No disponible.";
    const rawPanorama = parsedReport.panoramaGlobal || summaryObj.panoramaGlobal;
    if (rawPanorama) {
      if (typeof rawPanorama === "string") executiveSummary = rawPanorama;
      else if (typeof rawPanorama === "object") {
        executiveSummary = rawPanorama.resumen || rawPanorama.panorama || Object.values(rawPanorama).filter(v => typeof v === "string").join("\n");
      }
    } else if (typeof parsedReport.executiveSummary === "string") {
      executiveSummary = parsedReport.executiveSummary;
    }

    const competitorsWithReports = competitorsList.map((c: any) => {
      const cReports = competitorReports.filter((r: any) => r.entityId === c.id);
      const reportsByChannel = cReports.reduce((acc: any, r: any) => {
        acc[r.channel.toUpperCase()] = r;
        return acc;
      }, {});
      return { ...c, reportsByChannel };
    });

    const myDetails = getConsolidatedDetails(myAnalysesByChannel);

    let tableHeaders = `<th class="p-3 text-left bg-slate-100 border border-slate-200 text-xs font-black uppercase text-slate-500">Área / Variable</th>`;
    tableHeaders += `<th class="p-3 text-left bg-orange-500 text-white border border-slate-200 text-xs font-black uppercase">${brandName} (Propio)</th>`;
    competitorsWithReports.forEach((c: any) => {
      tableHeaders += `<th class="p-3 text-left bg-slate-200 border border-slate-200 text-xs font-black uppercase text-slate-700">${c.name}</th>`;
    });

    let positioningRow = `<tr><td class="p-3 bg-slate-50/50 border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wide">Posicionamiento</td><td class="p-3 bg-orange-50/25 border border-slate-200 text-xs text-slate-700 font-semibold">${myDetails.positioning}</td>`;
    competitorsWithReports.forEach((c: any) => {
      const cDetails = getConsolidatedDetails(c.reportsByChannel);
      positioningRow += `<td class="p-3 border border-slate-200 text-xs text-slate-750">${cDetails.positioning}</td>`;
    });
    positioningRow += `</tr>`;

    let strengthsRow = `<tr><td class="p-3 bg-slate-50/50 border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wide">Fortalezas</td><td class="p-3 bg-orange-50/25 border border-slate-200 text-xs text-slate-700"><ul class="list-none space-y-1">${myDetails.strengths.map(s => `<li>• ${s}</li>`).join("")}</ul></td>`;
    competitorsWithReports.forEach((c: any) => {
      const cDetails = getConsolidatedDetails(c.reportsByChannel);
      strengthsRow += `<td class="p-3 border border-slate-200 text-xs text-slate-750"><ul class="list-none space-y-1">${cDetails.strengths.map(s => `<li>• ${s}</li>`).join("")}</ul></td>`;
    });
    strengthsRow += `</tr>`;

    let weaknessesRow = `<tr><td class="p-3 bg-slate-50/50 border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wide">Debilidades</td><td class="p-3 bg-orange-50/25 border border-slate-200 text-xs text-slate-700"><ul class="list-none space-y-1">${myDetails.weaknesses.map(w => `<li>• ${w}</li>`).join("")}</ul></td>`;
    competitorsWithReports.forEach((c: any) => {
      const cDetails = getConsolidatedDetails(c.reportsByChannel);
      weaknessesRow += `<td class="p-3 border border-slate-200 text-xs text-slate-750"><ul class="list-none space-y-1">${cDetails.weaknesses.map(w => `<li>• ${w}</li>`).join("")}</ul></td>`;
    });
    weaknessesRow += `</tr>`;

    let recsRow = `<tr><td class="p-3 bg-slate-50/50 border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wide">Acciones Rec.</td><td class="p-3 bg-orange-50/25 border border-slate-200 text-xs text-slate-700"><ul class="list-none space-y-1">${myDetails.recommendations.map(r => `<li>• ${r}</li>`).join("")}</ul></td>`;
    competitorsWithReports.forEach((c: any) => {
      const cDetails = getConsolidatedDetails(c.reportsByChannel);
      recsRow += `<td class="p-3 border border-slate-200 text-xs text-slate-750"><ul class="list-none space-y-1">${cDetails.recommendations.map(r => `<li>• ${r}</li>`).join("")}</ul></td>`;
    });
    recsRow += `</tr>`;

    let partDiagnosesHtml = "";
    competitorsWithReports.forEach((c: any) => {
      const individualAnalysis = getSelectedCompetitorAnalysis(c);
      
      let compAuditedChannelsHtml = "";
      channels.forEach(chan => {
        const report = c.reportsByChannel[chan];
        const status = getChannelStatus(c.id, chan, true, competitorReports, businessReports);
        if (status === "idle") return;

        let followers = "N/D";
        let likes = "N/D";
        let engagement = "N/D";

        if (report && report.data) {
          const dataObj = normalizeReportData(report.data);
          if (dataObj) {
            if (chan === "TIKTOK") {
              followers = formatSocialMetric(dataObj.engagement?.followers_count || dataObj.followers);
              likes = formatSocialMetric(dataObj.engagement?.likes_count || dataObj.likes);
              engagement = dataObj.engagement?.engagement_level || "Medium";
            } else if (chan === "FACEBOOK") {
              followers = formatSocialMetric(dataObj.facebook_presence?.audience_metrics?.followers);
              likes = formatSocialMetric(dataObj.facebook_presence?.audience_metrics?.talking_about_count);
              engagement = dataObj.facebook_presence?.audience_metrics?.talking_about_count ? "Media" : "N/D";
            } else if (chan === "INSTAGRAM") {
              followers = formatSocialMetric(dataObj.instagram_presence?.audience_size?.followers || dataObj.followers);
              likes = formatSocialMetric(dataObj.instagram_presence?.audience_size?.posts_count || dataObj.posts);
              engagement = dataObj.engagement_analysis?.engagement_level || "Medium";
            } else if (chan === "WEBSITE") {
              followers = dataObj.brand_identity?.market_positioning ? "Web Activa" : "Completado";
              likes = dataObj.data_quality?.confidence_score ? `Confianza: ${Math.round(dataObj.data_quality.confidence_score * 100)}%` : "Alta";
              engagement = "N/D";
            }
          }
        }

        const statStyle = getStatusTextAndColor(status);
        const emoji = chan === "WEBSITE" ? "🌐" : chan === "FACEBOOK" ? "📘" : chan === "INSTAGRAM" ? "📸" : "🎵";

        compAuditedChannelsHtml += `
          <div class="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-col justify-between gap-2.5">
            <div class="flex justify-between items-center border-b pb-1.5">
              <strong class="text-xs font-black text-slate-800 flex items-center gap-1">${emoji} ${chan}</strong>
              <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider" style="background-color: ${statStyle.bg}; color: ${statStyle.color};">${statStyle.text}</span>
            </div>
            <div class="space-y-1 text-[11px]">
              ${chan === "WEBSITE" ? `
                <div class="flex justify-between"><span class="text-slate-400">Estado:</span> <span class="font-bold text-slate-700">${followers}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Calidad:</span> <span class="font-bold text-slate-700">${likes}</span></div>
              ` : `
                <div class="flex justify-between"><span class="text-slate-400">Seguidores:</span> <span class="font-bold text-slate-700">${followers}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Actividad:</span> <span class="font-bold text-slate-700">${likes}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Engagement:</span> <span class="font-bold text-purple-750 text-purple-700">${engagement}</span></div>
              `}
            </div>
          </div>
        `;
      });

      let compAuditedSection = "";
      if (compAuditedChannelsHtml) {
        compAuditedSection = `
          <div class="mt-4 border-t border-slate-100 pt-3">
            <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Canales Auditados (${c.name})
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              ${compAuditedChannelsHtml}
            </div>
          </div>
        `;
      }

      if (individualAnalysis) {
        partDiagnosesHtml += `
          <div class="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 mb-6 page-break-inside-avoid">
            <div class="flex justify-between items-center border-b pb-2.5">
              <strong class="text-slate-800 text-sm flex items-center gap-2">⚔️ Diagnóstico de Competidor: ${c.name}</strong>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-650">
              <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <strong class="text-slate-800 block mb-2 text-[10px] uppercase font-black">Desempeño de Canales:</strong>
                <ul class="list-none space-y-1.5">${individualAnalysis.desempenoCanales.map((item: string) => `<li class="flex items-start gap-1"><span class="text-slate-400">•</span> ${item}</li>`).join("")}</ul>
              </div>
              <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <strong class="text-slate-800 block mb-2 text-[10px] uppercase font-black">Debilidades / Gaps:</strong>
                <ul class="list-none space-y-1.5">${individualAnalysis.debilidadesGaps.map((item: string) => `<li class="flex items-start gap-1"><span class="text-slate-400">•</span> ${item}</li>`).join("")}</ul>
              </div>
              <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <strong class="text-slate-800 block mb-2 text-[10px] uppercase font-black">Plan de Acción Contramedida:</strong>
                <ul class="list-none space-y-1.5">${individualAnalysis.planContramedida.map((item: string) => `<li class="flex items-start gap-1"><span class="text-emerald-600 font-bold">•</span> ${item}</li>`).join("")}</ul>
              </div>
            </div>
            ${compAuditedSection}
          </div>
        `;
      }
    });

    competitiveIntelHtml = `
      <div class="mb-10 page-break-inside-avoid">
        <h2 class="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2 mb-6 flex items-center gap-2">
          <span>🛡️</span> 5. Inteligencia Competitiva
        </h2>
        <div class="bg-orange-500/5 border border-orange-200/50 p-6 rounded-3xl shadow-sm text-xs text-slate-655 mb-6 leading-relaxed border-l-4 border-l-orange-500">
          <strong>Panorama Global de Competidores (IA):</strong><br>
          ${executiveSummary}
        </div>

        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Matriz Comparativa de Canales Digitales</div>
        <div class="overflow-hidden border border-slate-200 rounded-3xl mb-8 shadow-sm">
          <table class="w-full border-collapse bg-white">
            <thead>
              <tr class="border-b border-slate-200">${tableHeaders}</tr>
            </thead>
            <tbody class="divide-y divide-slate-150">
              ${positioningRow}
              ${strengthsRow}
              ${weaknessesRow}
              ${recsRow}
            </tbody>
          </table>
        </div>

        ${partDiagnosesHtml ? `
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Diagnósticos Detallados por Competidor</div>
          ${partDiagnosesHtml}
        ` : ""}
      </div>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Banco de Datos - ${brandName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Outfit', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          body {
            font-family: 'Outfit', sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            margin: 20mm 15mm;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-800 p-10 leading-relaxed">
        <div class="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10 border border-orange-250/30 p-6 rounded-3xl shadow-sm mb-8 flex justify-between items-center">
          <div>
            <span class="text-[9px] font-black uppercase tracking-widest text-orange-700">OB MarketHub - Banco de Datos</span>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight">Banco de Datos e Inteligencia Competitiva</h1>
          </div>
          <div class="text-right text-xs text-slate-400 font-bold">
            Negocio: ${brandName} | Generación: ${dateStr}
          </div>
        </div>

        ${businessInfoHtml}
        ${competitorsHtml}
        ${fodaHtml}
        ${competitiveIntelHtml}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
