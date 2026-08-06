"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function BusinessRedirector({ hasBusinesses }: { hasBusinesses: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Rutas permitidas incluso si el usuario o admin aún no ha creado un negocio
    const isAllowedRoute = 
      pathname === "/onboarding" ||
      pathname.startsWith("/trends") ||
      pathname.startsWith("/civic-dates") ||
      pathname.startsWith("/agentes") ||
      pathname.startsWith("/plans") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/business");

    if (!hasBusinesses && !isAllowedRoute) {
      router.push("/onboarding");
    }
  }, [hasBusinesses, pathname, router]);

  return null;
}
