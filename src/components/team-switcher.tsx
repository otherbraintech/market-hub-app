"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { setSelectedBusinessAction } from "@/actions/business"

export function TeamSwitcher({
  teams,
  selectedId,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
    id: string
  }[]
  selectedId?: string
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  
  const activeTeam = teams.find(t => t.id === selectedId) || teams[0]

  const handleSelect = (businessId: string) => {
    startTransition(async () => {
      await setSelectedBusinessAction(businessId)
      router.push(`/business/${businessId}?skipOnboarding=true`)
      router.refresh()
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isPending}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeTeam ? <activeTeam.logo className="size-4" /> : <Building2 className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam?.name || "Sin Negocio"}</span>
                <span className="truncate text-xs">{activeTeam?.plan || "Selecciona uno"}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Tus Negocios
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSelect(team.id)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 p-2 cursor-pointer"
              onClick={() => router.push("/business")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Agregar Negocio</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
