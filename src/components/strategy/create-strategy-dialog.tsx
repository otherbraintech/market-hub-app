"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StrategyForm } from "./strategy-form"

interface StrategyDialogProps {
  businessId: string
  defaultValues?: Partial<any>
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function StrategyDialog({ businessId, defaultValues, onSuccess, trigger }: StrategyDialogProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!defaultValues

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-primary">
            <Plus className="mr-2 h-4 w-4" /> Nueva Estrategia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar: ${defaultValues.name}` : "Nueva Estrategia de Marketing"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Actualiza los objetivos, personas y canales de tu estrategia." 
              : "Define los objetivos, personas y canales para tu negocio."}
          </DialogDescription>
        </DialogHeader>
        <StrategyForm 
          businessId={businessId} 
          defaultValues={defaultValues}
          onSuccess={() => {
            setOpen(false)
            onSuccess?.()
          }} 
        />
      </DialogContent>
    </Dialog>
  )
}
