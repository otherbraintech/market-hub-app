import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Shield, Bell, CreditCard, User, Globe, Building2, Users2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  const [dbUser, businessCount] = await Promise.all([
    userId ? prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        plan: true,
        maxBusinesses: true,
        maxCompetitors: true,
        createdAt: true
      }
    }) : Promise.resolve(null),
    userId ? prisma.business.count({ where: { userId } }) : Promise.resolve(0)
  ]);

  const userName = dbUser?.name || session?.user?.name || "Usuario Administrador";
  const userEmail = dbUser?.username || session?.user?.email || session?.user?.username || "admin@markethub.ai";
  const userRole = dbUser?.role || session?.user?.role || "USER";
  const rawPlan = dbUser?.plan || session?.user?.plan || "FREE";
  const planDisplayNames: Record<string, string> = {
    FREE: "GRATUITO",
    profesional: "PROFESIONAL",
    premium: "PREMIUM",
    agencia: "AGENCIA",
    CUSTOM: "PERSONALIZADO"
  };
  const userPlanLabel = planDisplayNames[rawPlan] || rawPlan.toUpperCase();
  const maxBusinesses = dbUser?.maxBusinesses ?? 5;
  const maxCompetitors = dbUser?.maxCompetitors ?? 3;
  const businessPercentage = Math.min((businessCount / maxBusinesses) * 100, 100);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <SettingsIcon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" /> Configuración de la Cuenta
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Administra los límites operativos de tu plan, tu perfil corporativo y tus integraciones.
        </p>
      </div>

      <div className="grid gap-8">
        {/* 1. Tarjeta de Perfil & Plan Activo */}
        <Card className="border shadow-md bg-card/60 backdrop-blur-md">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                <User className="h-5 w-5 text-indigo-600" /> Perfil del Usuario
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 text-xs font-black px-3 py-1">
                  ROL: {userRole}
                </Badge>
                <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 text-xs font-black px-3 py-1">
                  PLAN: {userPlanLabel}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-md shrink-0">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1 text-center sm:text-left flex-1">
                <p className="font-extrabold text-lg text-foreground">{userName}</p>
                <p className="text-sm font-medium text-muted-foreground">{userEmail}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl font-bold px-4">
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Tarjeta Destacada de Límites Operativos de la Cuenta */}
        <Card className="border-2 border-indigo-200/80 dark:border-indigo-900/60 shadow-lg bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5">
          <CardHeader className="border-b border-indigo-100 dark:border-indigo-900/40 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-black text-foreground">
                  <Shield className="h-5 w-5 text-indigo-600" /> Límites Operativos de tu Cuenta
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Capacidad configurada para la creación de negocios y auditoría de competidores por marca.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs font-black self-start sm:self-auto px-3 py-1">
                ✓ PLAN {userPlanLabel} ACTIVO
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Límite de Creación de Negocios */}
              <div className="p-5 bg-background/90 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 border border-indigo-500/20">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                        Límite de Creación de Negocios
                      </span>
                      <span className="text-[10.5px] text-muted-foreground font-medium block">
                        Marcas/Empresas registradas
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                    {businessCount} / {maxBusinesses}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <Progress value={businessPercentage} className="h-2.5 rounded-full" />
                  <div className="flex justify-between text-[10px] font-extrabold text-muted-foreground pt-0.5">
                    <span>Creados: {businessCount} negocios</span>
                    <span>Límite Total: {maxBusinesses} negocios</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                  Tu plan actual te permite crear y administrar hasta <strong>{maxBusinesses} negocios o marcas</strong> en simultáneo.
                </p>
              </div>

              {/* Límite de Competidores por Negocio */}
              <div className="p-5 bg-background/90 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600 border border-purple-500/20">
                      <Users2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                        Límite de Competidores
                      </span>
                      <span className="text-[10.5px] text-muted-foreground font-medium block">
                        Por cada negocio activo
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-purple-600 dark:text-purple-400">
                    {maxCompetitors} por Negocio
                  </span>
                </div>

                <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-200/50 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-200">
                    Máximo por negocio:
                  </span>
                  <Badge className="bg-purple-600 text-white font-black text-xs px-2.5 py-0.5">
                    {maxCompetitors} Competidores Directos
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                  Cada negocio registrado puede incluir hasta <strong>{maxCompetitors} marcas competidoras</strong> para escaneo de IA y auditoría.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Notificaciones */}
        <Card className="border shadow-md bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-extrabold">
              <Bell className="h-5 w-5 text-indigo-600" /> Preferencias de Notificaciones
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              Configura cómo quieres recibir las alertas del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold">Falla en publicación</Label>
                <p className="text-xs text-muted-foreground">Recibe un correo si una publicación no sale correctamente.</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold">IA Job completado</Label>
                <p className="text-xs text-muted-foreground">Notificación en el navegador cuando termine un proceso largo de los agentes.</p>
              </div>
              <Switch checked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
