"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building2, 
  Lightbulb, 
  Package, 
  Target, 
  Calendar, 
  Image as ImageIcon, 
  Share2, 
  BarChart3, 
  Settings, 
  LogOut,
  Zap
} from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Negocios", href: "/business", icon: Building2 },
  { name: "Estrategias", href: "/strategies", icon: Lightbulb },
  { name: "Productos", href: "/products", icon: Package },
  { name: "Campañas", href: "/campaigns", icon: Target },
  { name: "Calendario", href: "/calendar", icon: Calendar },
  { name: "Media", href: "/media", icon: ImageIcon },
  { name: "Publicación", href: "/publishing", icon: Share2 },
  { name: "Métricas", href: "/metrics", icon: BarChart3 },
  { name: "Jobs", href: "/jobs", icon: Zap },
];

import { Business } from "@prisma/client";
import { BusinessSwitcher } from "./business-switcher";

interface AppSidebarProps {
  businesses: Business[];
  selectedId?: string;
}

export function AppSidebar({ businesses, selectedId }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r bg-background flex flex-col h-screen sticky top-0 z-40 transition-all duration-300">
      <div className="p-8 pb-4 flex items-center gap-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-300">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-xl tracking-tight text-gradient">MarketHub</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Intelligence OS</span>
        </div>
      </div>

      <BusinessSwitcher businesses={businesses} selectedId={selectedId} />

      <div className="px-4 mb-4">
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] px-4 mb-2">Principal</div>
        <nav className="space-y-1">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <SidebarItem key={item.name} item={item} isActive={isActive} />
            );
          })}
        </nav>
      </div>

      <div className="px-4 mb-4 mt-2">
        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] px-4 mb-2">Contenido & Social</div>
        <nav className="space-y-1">
          {navigation.slice(5, 10).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <SidebarItem key={item.name} item={item} isActive={isActive} />
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 space-y-2 border-t bg-muted/30">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Configuración
        </Link>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ item, isActive }: { item: any, isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
        isActive 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <item.icon className={cn(
        "h-4 w-4 transition-transform group-hover:scale-110",
        isActive ? "text-primary-foreground" : "text-muted-foreground/70"
      )} />
      {item.name}
      {isActive && (
        <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary-foreground/50 animate-pulse" />
      )}
    </Link>
  );
}

