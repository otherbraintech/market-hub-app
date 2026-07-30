"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBusiness, setSelectedBusinessAction } from "@/actions/business";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, MoreHorizontal, Globe, Trash, Edit, ArrowRight, Layers, Users, Target, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface BusinessListProps {
  businesses: any[];
}

export function BusinessList({ businesses }: BusinessListProps) {
  const router = useRouter();
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deletingBusinessId) return;
    const result = await deleteBusiness(deletingBusinessId);
    if (result.success) {
      toast.success("Negocio eliminado");
    } else {
      toast.error("Error al eliminar");
    }
    setDeletingBusinessId(null);
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => {
          const productCount = business._count?.products || 0;
          const campaignCount = business._count?.campaigns || 0;
          const competitorCount = business.competitors?.length || 0;

          return (
            <Card key={business.id} className="border border-slate-800 bg-[#0D1526] text-slate-100 shadow-xl rounded-2xl flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-base shrink-0 shadow-md">
                    {business.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {business.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 truncate max-w-[170px] mt-0.5 font-medium">
                      {business.industry || "General / Pyme"}
                    </CardDescription>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 text-slate-100 border-slate-800">
                    <DropdownMenuLabel className="text-xs text-slate-400">Acciones</DropdownMenuLabel>
                    <DropdownMenuItem 
                      className="text-xs hover:bg-slate-800 cursor-pointer"
                      onClick={() => {
                        router.push(`/business/create?businessId=${business.id}&edit=true`);
                      }}
                    >
                      <Edit className="mr-2 h-3.5 w-3.5" /> Editar Datos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem 
                      className="text-xs text-rose-400 focus:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                      onClick={() => setDeletingBusinessId(business.id)}
                    >
                      <Trash className="mr-2 h-3.5 w-3.5" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-slate-400 line-clamp-2 min-h-[36px] font-normal leading-relaxed">
                  {business.description || "Sin descripción corporativa."}
                </p>

                {/* Metrics Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px] font-bold text-cyan-400 border-cyan-500/20 bg-cyan-500/5 gap-1">
                    <Target className="h-3 w-3" /> {campaignCount} Campañas
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-bold text-purple-400 border-purple-500/20 bg-purple-500/5 gap-1">
                    <Package className="h-3 w-3" /> {productCount} Productos
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-bold text-amber-400 border-amber-500/20 bg-amber-500/5 gap-1">
                    <Users className="h-3 w-3" /> {competitorCount} Rivales
                  </Badge>
                </div>

                {business.website && (
                  <div className="pt-2 border-t border-slate-800/60 flex items-center text-xs text-cyan-400 hover:underline">
                    <Globe className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                    <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="truncate">
                      {business.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 pb-4">
                <Button 
                  className="w-full text-xs font-bold gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md"
                  onClick={async () => {
                    await setSelectedBusinessAction(business.id);
                    window.location.href = `/business/${business.id}?skipOnboarding=true`;
                  }}
                >
                  <Layers className="h-3.5 w-3.5" /> Abrir Negocio & Flujo IA
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deletingBusinessId} onOpenChange={(open) => !open && setDeletingBusinessId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar negocio?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-400">
              Esta acción no se puede deshacer. Se eliminarán los competidores, auditorías y campañas asociadas a este negocio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              Eliminar Negocio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
