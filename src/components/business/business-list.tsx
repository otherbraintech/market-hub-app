"use client";

import { useState } from "react";
import { deleteBusiness, setSelectedBusinessAction } from "@/actions/business";
import { BusinessForm } from "./business-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, MoreHorizontal, Globe, Trash, Edit } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface BusinessListProps {
  businesses: any[];
}

export function BusinessList({ businesses }: BusinessListProps) {
  const [editingBusiness, setEditingBusiness] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este negocio? Se perderán todas sus campañas.")) {
      const result = await deleteBusiness(id);
      if (result.success) {
        toast.success("Negocio eliminado");
      } else {
        toast.error("Error al eliminar");
      }
    }
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => (
          <Card key={business.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{business.name}</CardTitle>
                  <CardDescription className="text-xs truncate max-w-[150px]">
                    {business.industry || "Sin industria"}
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => {
                    setEditingBusiness(business);
                    setIsDialogOpen(true);
                  }}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(business.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                {business.description || "Sin descripción disponible."}
              </p>
              {business.website && (
                <div className="mt-4 flex items-center text-xs text-blue-500 hover:underline">
                  <Globe className="mr-1 h-3 w-3" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer">
                    {business.website}
                  </a>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={async () => {
                  await setSelectedBusinessAction(business.id);
                  window.location.href = `/business/${business.id}`;
                }}
              >
                Ver Detalles
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingBusiness(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Negocio</DialogTitle>
            <DialogDescription>
              Modifica la información de tu negocio.
            </DialogDescription>
          </DialogHeader>
          {editingBusiness && (
            <BusinessForm 
              defaultValues={{
                id: editingBusiness.id,
                name: editingBusiness.name,
                description: editingBusiness.description || "",
                industry: editingBusiness.industry || "",
                website: editingBusiness.website || "",
                phoneNumbers: editingBusiness.phoneNumbers || "",
                location: editingBusiness.location || "",
                socialLinks: (editingBusiness.socialLinks as any) || { facebook: "", instagram: "", tiktok: "" },
                brandVoice: (editingBusiness.brandVoice as any) || { tone: [], personality: [], values: [] },
                targetAudience: (editingBusiness.targetAudience as any) || { demographics: "", psychographics: "" }
              }} 
              onSuccess={() => setIsDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
