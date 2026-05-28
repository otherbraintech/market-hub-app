"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { deleteCampaignAction } from "@/actions/campaign";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteCampaignButtonProps {
  campaignId: string;
  businessId: string;
}

export function DeleteCampaignButton({ campaignId, businessId }: DeleteCampaignButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteCampaignAction(campaignId, businessId);
      if (res.success) {
        toast.success("Campaña eliminada con éxito");
        setIsOpen(false);
      } else {
        toast.error(res.error || "Error al eliminar la campaña");
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado al intentar eliminar la campaña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="text-destructive hover:text-white hover:bg-destructive h-8 px-2.5 shrink-0 transition-colors" 
          disabled={loading}
          title="Eliminar Campaña"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de eliminar esta campaña?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán de forma permanente la campaña y todos los contenidos (copys, publicaciones e imágenes) asociados a ella.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {loading ? "Eliminando..." : "Eliminar Campaña"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
