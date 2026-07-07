"use client";

import React from "react";
import Link from "next/link";
import { 
  Building2, 
  Calendar, 
  Compass, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ListTodo
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GuidePage() {
  const steps = [
    {
      step: "Paso 1",
      title: "Registro e Inicio de Sesión",
      description: "Accede de forma segura con tu cuenta de usuario. El sistema identificará tu rol y simplificará tu entorno de trabajo para evitar saturación de herramientas avanzadas.",
      icon: <ShieldCheck className="h-6 w-6 text-blue-500" />,
      actionText: "Ir al Dashboard",
      actionUrl: "/dashboard",
    },
    {
      step: "Paso 2",
      title: "Creación y Registro del Negocio",
      description: "Da de alta tu empresa ingresando su nombre, descripción general e industria. Esto le permite al sistema adaptar las vistas y recordatorios específicos.",
      icon: <Building2 className="h-6 w-6 text-indigo-500" />,
      actionText: "Administrar Negocio",
      actionUrl: "/business",
    },
    {
      step: "Paso 3",
      title: "Configuración Básica de Marca",
      description: "Añade los datos de contacto y el enlace directo a tus redes sociales favoritas dentro del formulario de configuración del negocio seleccionado.",
      icon: <Compass className="h-6 w-6 text-emerald-500" />,
      actionText: "Ver Configuración",
      actionUrl: "/business",
    },
    {
      step: "Paso 4",
      title: "Planificación de Contenidos (Calendario)",
      description: "Usa el Calendario Editorial interactivo para planificar tus publicaciones manualmente. Agrega títulos, copies (caption) y URLs de imágenes o videos con facilidad.",
      icon: <Calendar className="h-6 w-6 text-amber-500" />,
      actionText: "Ver Calendario",
      actionUrl: "/calendar",
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* CABECERA */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <ListTodo className="h-8 w-8 text-blue-600" />
          Guía de Flujo para Usuario Normal
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aprende el recorrido recomendado para administrar tu negocio y planificar tus contenidos de manera ágil y sencilla.
        </p>
      </div>

      {/* FLUJO PASO A PASO */}
      <div className="grid gap-6">
        {steps.map((step, idx) => (
          <Card key={idx} className="overflow-hidden hover:shadow-md transition-all duration-300 border border-muted/50">
            <div className="flex flex-col md:flex-row">
              <div className="p-6 flex items-start gap-4 md:w-3/4">
                <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                    {step.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
              <div className="p-6 bg-muted/10 border-t md:border-t-0 md:border-l flex items-center justify-center md:w-1/4">
                <Button asChild className="w-full text-xs font-semibold h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 transition-all">
                  <Link href={step.actionUrl}>
                    {step.actionText}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* RESUMEN/INFO */}
      <Card className="border border-blue-100 bg-blue-50/20 dark:bg-blue-950/10 dark:border-blue-950/30">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <CheckCircle2 className="h-5 w-5" />
            Beneficios de tu espacio de trabajo simplificado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Cero distracciones:</strong> Se han removido las analíticas avanzadas y logs de ejecuciones de IA para que te enfoques en la creación y administración diaria.
            </li>
            <li>
              <strong>Navegación intuitiva:</strong> Accesos directos y un calendario de fácil interacción que te permite reprogramar posts con solo arrastrar y soltar.
            </li>
            <li>
              <strong>Soporte al alcance:</strong> Accede de forma directa al centro de soporte en cualquier momento desde el menú lateral si necesitas ayuda.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
