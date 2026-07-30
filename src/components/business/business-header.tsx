"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Pencil } from "lucide-react";
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
  business: any & {
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
            <Button variant="outline" size="sm" asChild>
              <Link href={`/business/create?businessId=${business.id}&edit=true`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar Negocio
              </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
