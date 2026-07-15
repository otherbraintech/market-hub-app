import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Completado</Badge>;
      case "FAILED": return <Badge variant="destructive">Fallido</Badge>;
      case "PROCESSING": return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 animate-pulse">Procesando</Badge>;
      case "QUEUED": return <Badge variant="secondary">En Cola</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procesos en Ejecución</h1>
          <p className="text-muted-foreground">Estado de los jobs de IA (generación de texto, imágenes, etc).</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Activos</p>
            <h3 className="text-2xl font-bold">{jobs.filter((j: any) => j.status === 'PROCESSING').length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Últimas 24h</p>
            <h3 className="text-2xl font-bold">{jobs.filter((j: any) => j.status === 'SUCCESS').length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Fallas</p>
            <h3 className="text-2xl font-bold">{jobs.filter((j: any) => j.status === 'FAILED').length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total</p>
            <h3 className="text-2xl font-bold">{jobs.length}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Proceso</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Iniciado</th>
                <th className="px-6 py-4">Duración</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    No hay procesos registrados recientemente.
                  </td>
                </tr>
              ) : (
                jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{job.type}</span>
                        <span className="text-[10px] text-muted-foreground">{job.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {job.updatedAt ? `${Math.round((new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime()) / 1000)}s` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-xs">Detalles</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
