"use client";

import { useState, useEffect } from "react";
import { Business } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Building2, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BusinessForm } from "./business-form";

interface BusinessHeaderProps {
  business: Business & {
    _count?: {
      products: number;
      campaigns: number;
      contents?: number;
    };
  };
}

export function BusinessHeader({ business }: BusinessHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="border-b bg-card px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center border">
             {business.logo ? (
                 <img src={business.logo} alt={business.name} className="h-full w-full object-cover rounded-lg" />
             ) : (
                <Building2 className="h-8 w-8 text-primary" />
             )}
          </div>
          <div>
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
                {business.industry && <Badge variant="secondary">{business.industry}</Badge>}
            </div>
            
            
             {business.website && (
                <a 
                    href={business.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-blue-500 hover:underline mt-1 block"
                >
                    {business.website}
                </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
            {isMounted && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Negocio
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                          <DialogTitle>Editar {business.name}</DialogTitle>
                          <DialogDescription>
                              Actualiza la información y configuración estratégica de tu negocio.
                          </DialogDescription>
                      </DialogHeader>
                      <BusinessForm 
                          defaultValues={{
                              ...business,
                              description: business.description || "",
                              industry: business.industry || "",
                              website: business.website || "",
                              brandVoice: (business.brandVoice as any) || { tone: [], personality: [], values: [] },
                              targetAudience: (business.targetAudience as any) || { demographics: "", psychographics: "" }
                          }}
                          onSuccess={() => {
                              setIsEditDialogOpen(false);
                              window.location.reload();
                          }}
                      />
                  </DialogContent>
              </Dialog>
            )}

             <Button size="sm" asChild>
                <Link href="/campaigns">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Campaña
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
