"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { hasRouteAccess } from "@/lib/access-control";
import { UnauthorizedView } from "./unauthorized-view";

interface RoleAccessGuardProps {
  role: string | undefined;
  children: React.ReactNode;
}

export function RoleAccessGuard({ role, children }: RoleAccessGuardProps) {
  const pathname = usePathname();
  const [hasAccess, setHasAccess] = React.useState(true);

  React.useEffect(() => {
    setHasAccess(hasRouteAccess(role, pathname));
  }, [role, pathname]);

  if (!hasAccess) {
    return <UnauthorizedView />;
  }

  return <>{children}</>;
}
