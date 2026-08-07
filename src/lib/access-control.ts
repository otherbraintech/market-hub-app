/**
 * Sistema de Control de Accesos Basado en Roles (RBAC)
 */

export type UserRole = "USER" | "SPECIALIST" | "ADMIN";

// Define qué roles tienen acceso a qué prefijos de ruta
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/dashboard": ["USER", "SPECIALIST", "ADMIN"],
  "/business": ["USER", "SPECIALIST", "ADMIN"],
  "/agentes": ["USER", "SPECIALIST", "ADMIN"],
  "/calendar": ["USER", "SPECIALIST", "ADMIN"],
  "/support": ["USER", "SPECIALIST", "ADMIN"],
  "/guide": ["USER", "SPECIALIST", "ADMIN"],
  "/marketing": ["USER", "SPECIALIST", "ADMIN"],
  "/plans": ["USER", "SPECIALIST", "ADMIN"],
  "/products": ["SPECIALIST", "ADMIN"],
  "/trends": ["SPECIALIST", "ADMIN"],
  "/civic-dates": ["SPECIALIST", "ADMIN"],
  "/jobs": ["ADMIN"],
  "/strategies": ["SPECIALIST", "ADMIN"],
  "/campaigns": ["SPECIALIST", "ADMIN"],
  "/media": ["SPECIALIST", "ADMIN"],
  "/publishing": ["SPECIALIST", "ADMIN"],
  "/metrics": ["SPECIALIST", "ADMIN"],
  "/settings/users": ["ADMIN"],
};

/**
 * Verifica si un rol específico tiene acceso a una ruta (pathname)
 */
export function hasRouteAccess(role: string | undefined, pathname: string): boolean {
  const rawRole = role || "USER";
  if (rawRole === "SUPER_ADMIN" || rawRole === "ADMIN") {
    return true;
  }
  const userRole = rawRole as UserRole;
  const cleanPath = pathname.split('?')[0];
  
  // Buscar coincidencia de ruta más específica primero
  const sortedRoutes = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
  
  for (const route of sortedRoutes) {
    if (cleanPath === route || cleanPath.startsWith(route + "/")) {
      return ROUTE_PERMISSIONS[route].includes(userRole);
    }
  }
  
  return true; // Rutas públicas o no listadas se permiten por defecto
}
