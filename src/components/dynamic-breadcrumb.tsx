"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  business: "Negocios",
  campaigns: "Campañas",
  products: "Productos",
  settings: "Configuración",
  strategies: "Estrategias",
  calendar: "Calendario",
  media: "Galería",
  publishing: "Publicaciones",
  metrics: "Métricas",
  jobs: "Tareas",
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">MarketHub</BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          // If it's just 'dashboard' at the start, don't repeat it
          if (segment === "dashboard" && index === 0) return null;

          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          
          // Check if it's an ID (CUID or similar)
          const isId = segment.length > 15 && (segment.startsWith('c') || /[0-9]/.test(segment));
          
          let label = routeMap[segment] || segment;
          if (isId) {
            label = "Detalle";
          }

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="capitalize">
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}

        {segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard') ? (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
