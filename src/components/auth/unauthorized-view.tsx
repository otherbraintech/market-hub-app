"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UnauthorizedView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-destructive/10 text-destructive p-4 rounded-full mb-6">
        <ShieldAlert className="size-16" />
      </div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
        Acceso Denegado
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-sm leading-relaxed">
        No tienes permisos suficientes para acceder a esta sección de la plataforma. Si consideras que esto es un error, por favor contacta al administrador del sistema.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="rounded-xl font-bold h-11 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Home className="size-4" />
            Volver al Inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
