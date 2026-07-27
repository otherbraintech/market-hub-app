"use client"

import * as React from "react"
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
  Zap,
  Moon,
  Sun,
  BookOpen,
  LifeBuoy
} from "lucide-react"
import { useTheme } from "next-themes"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { logout } from "@/app/(auth)/login/actions"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  businesses: any[]
  selectedId?: string
  session?: any
}

export function AppSidebar({ businesses, selectedId, session, ...props }: AppSidebarProps) {
  // Map businesses to teams format for TeamSwitcher
  const teams = businesses.map(b => ({
    name: b.name,
    logo: Building2,
    plan: b.industry || "General",
    id: b.id
  }))

  const role = session?.user?.role || "USER"

  const navMain = React.useMemo(() => {
    const rawNav = [
      {
        title: "Inicio",
        url: "#",
        icon: LayoutDashboard,
        isActive: true,
        items: [
          { title: "Panel General", url: "/dashboard" },
          { title: "Mis Negocios", url: "/business" },
          { 
            title: "Asistente Onboarding", 
            url: selectedId ? `/onboarding?businessId=${selectedId}&preview=true` : "/onboarding" 
          },
        ],
      },
      {
        title: "Mi Negocio",
        url: "#",
        icon: Building2,
        isActive: true,
        items: [
          ...(selectedId ? [
            { title: "Perfil del Negocio", url: `/business/${selectedId}` },
            { title: "Monitoreo de Agentes", url: `/business/${selectedId}/monitor` }
          ] : []),
          { title: "Productos", url: "/products" },
        ],
      },
      {
        title: "Inteligencia IA",
        url: "#",
        icon: Lightbulb,
        isActive: true,
        items: [
          { title: "Mi Negocio IA", url: "/business/analysis" },
          { title: "Mi Competencia IA", url: "/competitors/analysis" },
          { title: "Tendencias IA", url: "/trends" },
          { title: "Jobs IA", url: "/jobs" },
        ],
      },
      {
        title: "Marketing & Social",
        url: "#",
        icon: Share2,
        isActive: true,
        items: [
          { title: "Estrategias", url: "/strategies" },
          { title: "Campañas", url: "/campaigns" },
          { title: "Mi Calendario", url: "/calendar" },
          { title: "Media", url: "/media" },
          { title: "Publicación", url: "/publishing" },
          { title: "Métricas", url: "/metrics" },
        ],
      },
      {
        title: "Administración",
        url: "#",
        icon: Settings,
        items: [
          { title: "Usuarios", url: "/settings/users" },
        ],
      },
      {
        title: "Mi Calendario",
        url: "/calendar",
        icon: Calendar,
      },
      {
        title: "Estrategias y Campañas",
        url: "/marketing",
        icon: Share2,
      },
      {
        title: "Guía de Inicio",
        url: "/guide",
        icon: BookOpen,
      },
      {
        title: "Soporte y Ayuda",
        url: "/support",
        icon: LifeBuoy,
      },
    ]

    return rawNav
      .map(section => {
        if (!section.items) return section;
        const filteredItems = section.items.filter(item => {
          if (role === "USER") {
            if (item.url === "/products") return false;
            if (section.title === "Marketing & Social" && item.url !== "/calendar") return false;
            if (item.url === "/settings/users") return false;
          } else if (role === "SPECIALIST") {
            if (item.url === "/settings/users" || item.url === "/jobs") return false;
          }
          return true;
        });

        return { ...section, items: filteredItems };
      })
      .filter(section => {
        if (role === "USER" && section.title === "Inteligencia IA") return false;
        if (role === "USER" && section.title === "Marketing & Social") return false;
        if (role !== "USER" && (section.title === "Estrategias y Campañas" || section.title === "Mi Calendario")) return false;
        if (!section.items || section.items.length === 0) {
          return !!section.url && section.url !== "#";
        }
        return section.items.length > 0;
      });
  }, [role, selectedId]);

  const user = {
    name: session?.user?.name || session?.user?.username || "Usuario",
    email: session?.user?.username || "Administrador",
    avatar: "/avatars/user.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full mh-gradient-brand opacity-30 blur-sm"></div>
              <svg viewBox="0 0 40 40" className="w-8 h-8 relative z-10">
                <defs>
                  <linearGradient id="sb-tl" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00C9C8"/><stop offset="100%" stopColor="#00B4D8"/>
                  </linearGradient>
                  <linearGradient id="sb-tr" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B6CA8"/>
                  </linearGradient>
                  <linearGradient id="sb-bl" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1B6CA8"/><stop offset="100%" stopColor="#1565C0"/>
                  </linearGradient>
                  <linearGradient id="sb-br" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1565C0"/><stop offset="100%" stopColor="#0D3B8C"/>
                  </linearGradient>
                </defs>
                <path d="M20 20 C14 14 8 10 10 4 C12 -2 18 2 20 20Z" fill="url(#sb-tl)"/>
                <path d="M20 20 C26 14 30 8 36 10 C42 12 38 18 20 20Z" fill="url(#sb-tr)"/>
                <path d="M20 20 C26 26 30 32 36 30 C42 28 38 22 20 20Z" fill="url(#sb-bl)"/>
                <path d="M20 20 C14 26 8 30 10 36 C12 42 18 38 20 20Z" fill="url(#sb-br)"/>
                <circle cx="20" cy="20" r="4.5" fill="#90E0EF"/>
                <circle cx="20" cy="20" r="3" fill="#CAF0F8"/>
              </svg>
            </div>
          </div>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-black text-base tracking-tight">Market<span className="mh-gradient-text">Hub</span></span>
            <span className="truncate text-[10px] font-bold text-cyan-400 opacity-80 uppercase tracking-widest">Agentic SaaS</span>
          </div>
        </div>
        <TeamSwitcher teams={teams} selectedId={selectedId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Cargando tema...">
            <div className="relative flex items-center gap-2">
              <div className="flex items-center justify-center">
                <Sun className="h-4 w-4" />
              </div>
              <span className="truncate">Cargando tema...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          tooltip={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
        >
          <div className="relative flex items-center gap-2">
            <div className="flex items-center justify-center">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            <span className="truncate">
              {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
