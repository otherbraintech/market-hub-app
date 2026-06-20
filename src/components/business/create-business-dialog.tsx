"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BusinessForm } from "@/components/business/business-form";
import { Plus, Sparkles } from "lucide-react";

interface CreateBusinessDialogProps {
  isTutorialActive?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateBusinessDialog({ isTutorialActive, onOpenChange }: CreateBusinessDialogProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold rounded-xl shadow-md hover:shadow-lg transition-all">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Negocio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Crear Nuevo Negocio</DialogTitle>
          <DialogDescription className="text-xs">
            Añade los detalles básicos de tu marca o empresa.
          </DialogDescription>
        </DialogHeader>
        <BusinessForm onSuccess={() => setOpen(false)} isTutorialActive={isTutorialActive} />
      </DialogContent>
    </Dialog>
  );
}
