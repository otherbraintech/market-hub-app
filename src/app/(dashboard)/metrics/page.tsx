import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Users, MessageSquare, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MetricsPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Resultados</h1>
          <p className="text-muted-foreground">Métricas integradas de todas tus redes sociales y campañas.</p>
        </div>
        <Badge className="bg-orange-100 text-orange-700 font-bold border-orange-200">BETA</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Alcance Total", value: "128.4k", trend: "+14%", pos: true, icon: Users },
          { label: "Interacciones", value: "8.2k", trend: "+2.1%", pos: true, icon: MessageSquare },
          { label: "Guardados", value: "1.5k", trend: "-3.4%", pos: false, icon: Heart },
          { label: "Crecimiento", value: "4.8%", trend: "+0.2%", pos: true, icon: TrendingUp },
        ].map((stat, i) => (
          <Card key={i} className="card-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <div className={`flex items-center text-xs font-bold ${stat.pos ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trend} {stat.pos ? <TrendingUp className="ml-1 h-3 w-3" /> : <TrendingDown className="ml-1 h-3 w-3" />}
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
         <Card className="h-64 flex flex-col items-center justify-center border-dashed">
            <BarChart3 className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground font-medium">Gráfico de Crecimiento Semanal</p>
            <p className="text-xs text-muted-foreground/60">(Simulado - Integrando con APIs de Meta/TikTok)</p>
         </Card>
         
         <Card className="h-64 flex flex-col items-center justify-center border-dashed">
            <TrendingUp className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground font-medium">Top Contenidos por Engagement</p>
            <p className="text-xs text-muted-foreground/60">(Simulado - Integrando con APIs de Meta/TikTok)</p>
         </Card>
      </div>
    </div>
  );
}
