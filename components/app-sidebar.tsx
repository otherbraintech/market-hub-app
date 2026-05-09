"use client"

import * as React from "react"
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
    Store,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

// This is sample nav data.
const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/",
            icon: SquareTerminal,
            isActive: true,
        },
        {
            title: "Negocios",
            url: "/negocios",
            icon: Store,
            // no subitems -> simple link, no accordion
        },

        {
            title: "Configuración",
            url: "/configuracion",
            icon: Settings2,
        },
        {
            title: "Planificación",
            url: "/planificacion",
            icon: Bot,
        },
    ],
}

export function AppSidebar({ businesses, initialActiveId, user, ...props }: React.ComponentProps<typeof Sidebar> & { businesses: any[]; initialActiveId?: string | null; user: { name: string; email: string; avatar: string } }) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher businesses={businesses} initialActiveId={initialActiveId} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}


