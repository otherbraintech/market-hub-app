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
            if (item.url.includes("/monitor") || item.url === "/products") return false;
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
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg">
            <Zap className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-black text-lg tracking-tight">MarketHub</span>
            <span className="truncate text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Intelligence OS</span>
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
