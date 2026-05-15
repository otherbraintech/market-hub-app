"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, AlertCircle, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "cookies-next"; // We'll assume cookies-next or manual cookie read for selected business

export default function BusinessAnalysisPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("https://www.web.com/"); // Ideally fetched from Business details

  useEffect(() => {
    // In a real scenario, fetch business details to get the website URL
    // For now we get businessId from cookies or assume a generic one.
    // Replace with real logic if needed.
    const getBusinessId = () => {
      // Very basic cookie read if you use cookies-next
      // const id = getCookie("selectedBusinessId") as string;
      // Using a fallback for testing
      setBusinessId("cl_business_mock_id"); 
    };
    getBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchLatestAnalysis();
    }
  }, [businessId]);

  const fetchLatestAnalysis = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analysis/latest?type=MY_BUSINESS&entityId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAnalysis = async () => {
    if (!businessId) return;
    try {
      setRequesting(true);
      const res = await fetch("/api/analysis/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "MY_BUSINESS",
          entityId: businessId,
          url: websiteUrl,
        }),
      });
      if (res.ok) {
        toast.success("Análisis solicitado correctamente.");
        await fetchLatestAnalysis();
      } else {
        toast.error("Error al solicitar el análisis.");
      }
    } catch (error) {
      toast.error("Error inesperado.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Mi Negocio IA</h2>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-2/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mi Negocio IA</h2>
        <Button 
          onClick={handleRequestAnalysis} 
          disabled={requesting || report?.status === "PENDING" || report?.status === "PROCESSING"}
          className="gap-2"
        >
          {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {requesting ? "Enviando..." : "Solicitar nuevo análisis"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Último Análisis de tu Sitio Web</CardTitle>
          <CardDescription>
            Resultados generados por nuestra IA para {websiteUrl}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!report ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold">Aún no hay análisis. Solicita uno nuevo.</h3>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b pb-4">
                <span className="text-sm font-medium">Estado actual:</span>
                <StatusBadge status={report.status} />
              </div>

              {report.status === "COMPLETED" && report.data && (
                <div className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-xl border">
                    <h4 className="font-bold text-sm uppercase text-muted-foreground mb-2">Información General</h4>
                    <p className="font-semibold text-lg">{report.data.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{report.data.metaDescription}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <h4 className="font-bold text-sm uppercase text-primary mb-3">Productos Detectados</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {(report.data.products || []).map((p: string, i: number) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                      <h4 className="font-bold text-sm uppercase text-orange-600 mb-3">Promociones Activas</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {(report.data.promotions || []).map((p: string, i: number) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                    <h4 className="font-bold text-sm uppercase text-blue-600 mb-3">Recomendaciones de Mejora</h4>
                    <ul className="space-y-3">
                      {(report.data.recommendations || []).map((rec: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <ChevronRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {report.status === "ERROR" && (
                <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 text-destructive flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Error en el análisis</p>
                    <p className="text-sm mt-1">{report.error || "Ocurrió un error inesperado."}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendiente</Badge>;
    case "PROCESSING":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Procesando</Badge>;
    case "COMPLETED":
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Listo</Badge>;
    case "ERROR":
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
