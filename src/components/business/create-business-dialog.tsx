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
import { Plus } from "lucide-react";

export function CreateBusinessDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Negocio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Negocio</DialogTitle>
          <DialogDescription>
            Añade los detalles básicos de tu marca o empresa.
          </DialogDescription>
        </DialogHeader>
        <BusinessForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
