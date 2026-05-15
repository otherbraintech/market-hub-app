"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Globe, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CompetitorsAnalysisClient({ businessId, initialCompetitors, myAnalysis }: any) {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const router = useRouter();

  const handleRequestAnalysis = async (compId: string, url: string) => {
    try {
      setRequestingId(compId);
      const res = await fetch("/api/analysis/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "COMPETITOR",
          entityId: compId,
          url,
        }),
      });
      if (res.ok) {
        toast.success("Análisis solicitado correctamente.");
        // Refresh the page to get the updated status from server
        router.refresh();
      } else {
        toast.error("Error al solicitar el análisis.");
      }
    } catch (error) {
      toast.error("Error inesperado.");
    } finally {
      setRequestingId(null);
    }
  };

  const completedCompetitors = competitors.filter((c: any) => c.report?.status === "COMPLETED" && c.report?.data);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Competencia IA</h2>
        <Button disabled variant="outline" className="gap-2">
          <Plus className="h-4 w-4"/> Añadir Competidor
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Competidores</TabsTrigger>
          <TabsTrigger value="comparison" disabled={completedCompetitors.length === 0 || !myAnalysis}>
            Tabla Comparativa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {competitors.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl mt-6">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold">Sin competidores</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-4">
                    Añade competidores a tu negocio para poder analizarlos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              competitors.map((comp: any) => {
                const report = comp.report;
                const isPending = report?.status === "PENDING" || report?.status === "PROCESSING";
                const isRequesting = requestingId === comp.id;

                return (
                  <Card key={comp.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{comp.name || "Sin nombre"}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1 truncate">
                            <Globe className="h-3 w-3" /> 
                            <a href={comp.website || "#"} target="_blank" rel="noreferrer" className="hover:underline text-blue-500">
                              {comp.website || "Sin sitio web"}
                            </a>
                          </CardDescription>
                        </div>
                        {report && <StatusBadge status={report.status} />}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {!report ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          Aún no hay análisis. Solicita uno nuevo.
                        </div>
                      ) : report.status === "COMPLETED" && report.data ? (
                        <div className="space-y-3 text-sm">
                          <div className="line-clamp-2 text-muted-foreground mb-2">
                            {report.data.metaDescription || "Sin descripción"}
                          </div>
                          <div>
                            <span className="font-semibold text-xs uppercase">Productos Detectados:</span>
                            <ul className="list-disc pl-4 text-xs mt-1 text-muted-foreground">
                              {(report.data.products || []).slice(0, 3).map((p: string, i: number) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                          {report.data.promotions && report.data.promotions.length > 0 && (
                            <div>
                              <span className="font-semibold text-xs uppercase text-orange-600">Promociones:</span>
                              <ul className="list-disc pl-4 text-xs mt-1 text-muted-foreground">
                                {(report.data.promotions || []).slice(0, 2).map((p: string, i: number) => (
                                  <li key={i}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : report.status === "ERROR" ? (
                        <div className="text-sm text-red-500 text-center py-4">
                          {report.error || "Error al analizar competidor."}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-6 flex flex-col items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          Procesando análisis...
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-4 border-t bg-muted/10">
                      {comp.website ? (
                        <Button 
                          onClick={() => handleRequestAnalysis(comp.id, comp.website)}
                          disabled={isPending || isRequesting}
                          variant="secondary"
                          className="w-full gap-2"
                        >
                          {isRequesting || isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {report ? "Volver a analizar" : "Analizar competidor"}
                        </Button>
                      ) : (
                        <Button disabled variant="outline" className="w-full">Necesita Sitio Web</Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tabla Comparativa: Yo vs Competencia</CardTitle>
              <CardDescription>
                Comparación basada en los últimos informes de IA completados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Métrica</TableHead>
                    <TableHead className="font-bold text-primary">Mi Negocio</TableHead>
                    {completedCompetitors.map((c: any) => (
                      <TableHead key={c.id}>{c.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Total Productos</TableCell>
                    <TableCell>{myAnalysis?.data?.products?.length || 0}</TableCell>
                    {completedCompetitors.map((c: any) => (
                      <TableCell key={c.id}>{c.report?.data?.products?.length || 0}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Promociones</TableCell>
                    <TableCell>{myAnalysis?.data?.promotions?.length || 0}</TableCell>
                    {completedCompetitors.map((c: any) => (
                      <TableCell key={c.id}>{c.report?.data?.promotions?.length || 0}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium align-top">Mejores Promociones</TableCell>
                    <TableCell className="align-top">
                      <ul className="list-disc pl-4 text-xs text-orange-600 space-y-1">
                        {(myAnalysis?.data?.promotions || []).map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </TableCell>
                    {completedCompetitors.map((c: any) => (
                      <TableCell key={c.id} className="align-top">
                        <ul className="list-disc pl-4 text-xs text-orange-600 space-y-1">
                          {(c.report?.data?.promotions || []).map((p: string, i: number) => <li key={i}>{p}</li>)}
                        </ul>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium align-top">Recomendaciones Extraídas</TableCell>
                    <TableCell className="align-top">
                      <ul className="list-disc pl-4 text-xs space-y-1">
                        {(myAnalysis?.data?.recommendations || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    </TableCell>
                    {completedCompetitors.map((c: any) => (
                      <TableCell key={c.id} className="align-top">
                        <ul className="list-disc pl-4 text-xs space-y-1">
                          {(c.report?.data?.recommendations || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 text-[10px]">PENDIENTE</Badge>;
    case "PROCESSING":
      return <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[10px]">PROCESANDO</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-500 text-white hover:bg-green-600 text-[10px]">LISTO</Badge>;
    case "ERROR":
      return <Badge className="bg-red-500 text-white hover:bg-red-600 text-[10px]">ERROR</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
  }
}
