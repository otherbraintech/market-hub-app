"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Building2, Pencil, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import { getIndustryPlaceholders } from "@/lib/industry-suggestions";

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
  return (
    <div className="border-b border-border dark:border-slate-800/80 bg-background/80 backdrop-blur-md px-6 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-[1700px] mx-auto">
        {/* Business identity */}
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="h-full w-full object-cover rounded-xl" />
            ) : (
              <Building2 className="h-5 w-5 text-cyan-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight text-foreground dark:text-white">
                {business.name}
              </h1>
              {(() => {
                const resolvedIndustry = business.industry || getIndustryPlaceholders(business.industry, business.description, business.name).industryLabel;
                if (!resolvedIndustry) return null;
                return (
                  <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 animate-pulse">
                    {resolvedIndustry}
                  </Badge>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-border dark:border-slate-800 hover:bg-muted font-bold gap-1.5" asChild>
            <Link href={`/business/create?businessId=${business.id}&edit=true`}>
              <Pencil className="h-3.5 w-3.5 text-cyan-400" />
              <span>Editar Negocio</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
