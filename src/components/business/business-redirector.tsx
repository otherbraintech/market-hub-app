"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function BusinessRedirector({ hasBusinesses }: { hasBusinesses: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Si no tiene negocios y no está en la página de negocio ni de administración de usuarios, redirigir
    if (!hasBusinesses && pathname !== "/business" && pathname !== "/settings/users" && pathname !== "/settings") {
      router.push("/business");
    }
  }, [hasBusinesses, pathname, router]);

  return null;
}
