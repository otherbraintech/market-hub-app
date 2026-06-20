"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogIn } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";

interface SessionWatcherProps {
  initialExpired?: boolean;
}

export function SessionWatcher({ initialExpired = false }: SessionWatcherProps) {
  const [isOpen, setIsOpen] = React.useState(initialExpired);

  const checkSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) {
        setIsOpen(true);
      } else {
        const data = await res.json();
        if (!data.authenticated) {
          setIsOpen(true);
        }
      }
    } catch (error) {
      // Si la llamada falla o hay error de red/servidor, no forzamos logout inmediatamente
      // para evitar falsos positivos si hay micro-cortes de red. Pero si no hay respuesta de la sesión:
      console.warn("Error al verificar la sesión:", error);
    }
  }, []);

  React.useEffect(() => {
    // Si ya sabemos que está expirada, no hace falta configurar el timer
    if (isOpen) return;

    // Configurar polling cada 45 segundos
    const interval = setInterval(checkSession, 45000);

    // Verificar también cuando la página vuelve a estar activa o recibe foco
    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [isOpen, checkSession]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // Fallback si por alguna razón falla la server action (por falta de red, etc.)
      window.location.href = "/login";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="border-destructive/30 max-w-md shadow-2xl">
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <AlertDialogMedia className="bg-destructive/10 text-destructive mb-4 p-3 rounded-full size-14 flex items-center justify-center">
            <ShieldAlert className="size-8" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            Sesión Expirada o Inválida
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
            Tu sesión ha expirado o se ha cerrado debido a una actualización de la plataforma. Para garantizar la seguridad de tus datos, debes volver a iniciar sesión.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-6 justify-center">
          <Button 
            onClick={handleLogout} 
            className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold h-11 rounded-xl transition-all duration-300 hover:scale-102 flex items-center justify-center gap-2 shadow-lg shadow-destructive/10"
          >
            <LogIn className="size-4" />
            Volver al Login
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
