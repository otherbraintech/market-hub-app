import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Shield, Bell, CreditCard, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Administra tus preferencias, conexiones y seguridad.</p>
      </div>

      <div className="grid gap-8">
        {/* Perfil */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Perfil de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                 U
               </div>
               <div>
                  <p className="font-bold">Usuario Administrador</p>
                  <p className="text-sm text-muted-foreground">admin@markethub.ai</p>
               </div>
               <Button variant="outline" size="sm" className="ml-auto">Editar Perfil</Button>
             </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notificaciones
            </CardTitle>
            <CardDescription>Configura cómo quieres recibir las alertas del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between">
               <div className="space-y-0.5">
                 <Label>Falla en publicación</Label>
                 <p className="text-xs text-muted-foreground">Recibe un correo si una publicación no sale correctamente.</p>
               </div>
               <Switch checked />
             </div>
             <div className="flex items-center justify-between">
               <div className="space-y-0.5">
                 <Label>IA Job completado</Label>
                 <p className="text-xs text-muted-foreground">Notificación en el navegador cuando termine un proceso largo.</p>
               </div>
               <Switch checked />
             </div>
          </CardContent>
        </Card>

        {/* n8n / IA Settings placeholder */}
        <Card className="card-shadow border-orange-100 bg-orange-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Globe className="h-5 w-5" /> Integraciones Master
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-4 border rounded-xl bg-background">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold">n8n</div>
                 <div>
                    <p className="text-sm font-bold">Webhook Service</p>
                    <p className="text-xs text-muted-foreground">https://n8n.servicios.ai/webhook/...</p>
                 </div>
               </div>
               <Badge className="bg-green-100 text-green-700">Conectado</Badge>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
