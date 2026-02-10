"use client"

import * as React from "react"
import { ChevronsUpDown, Building2, Plus } from "lucide-react"
import { Business } from "@prisma/client"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setSelectedBusinessAction } from "@/actions/business"
import { cn } from "@/lib/utils"

interface BusinessSwitcherProps {
  businesses: Business[]
  selectedId?: string
}

export function BusinessSwitcher({
  businesses,
  selectedId,
}: BusinessSwitcherProps) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useTransition()
  
  const activeBusiness = businesses.find((b) => b.id === selectedId) || businesses[0]

  const handleSelect = async (businessId: string) => {
    setIsPending(async () => {
      await setSelectedBusinessAction(businessId)
      router.refresh()
    })
  }

  if (!activeBusiness) {
    return (
      <div className="px-4 mb-8">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/20 italic text-muted-foreground text-sm">
           Sin negocios aún
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 mb-8">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
                "flex w-full items-center gap-3 p-3 rounded-xl bg-card border shadow-sm hover:bg-muted/50 transition-all duration-200 group text-left",
                isPending && "opacity-50 grayscale pointer-events-none"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              {activeBusiness.logo ? (
                <img src={activeBusiness.logo} alt={activeBusiness.name} className="h-full w-full object-cover rounded-lg" />
              ) : (
                <Building2 className="size-5" />
              )}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="truncate text-sm font-bold leading-none mb-1">
                {activeBusiness.name}
              </span>
              <span className="truncate text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                {activeBusiness.industry || "General"}
              </span>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[240px] rounded-xl p-2 shadow-2xl"
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Tus Negocios
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />
          <div className="max-h-[300px] overflow-y-auto">
            {businesses.map((business) => (
              <DropdownMenuItem
                key={business.id}
                onClick={() => handleSelect(business.id)}
                className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1 last:mb-0",
                    business.id === selectedId && "bg-primary/5 text-primary font-medium"
                )}
              >
                <div className={cn(
                    "flex size-8 items-center justify-center rounded-md border text-muted-foreground transition-colors",
                    business.id === selectedId && "bg-primary text-white border-primary"
                )}>
                  {business.logo ? (
                    <img src={business.logo} alt={business.name} className="h-full w-full object-cover rounded-md" />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-semibold">{business.name}</span>
                    <span className="truncate text-[10px] opacity-70">{business.industry}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem 
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer"
            onClick={() => router.push("/business")}
          >
            <div className="flex size-8 items-center justify-center rounded-md border border-dashed text-muted-foreground">
              <Plus className="size-4" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-semibold">Agregar Negocio</span>
                <span className="text-[10px] text-muted-foreground">Crear nueva entidad</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
