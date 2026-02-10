import { prisma } from "@/lib/prisma";
import { StrategyForm } from "@/components/strategy/strategy-form";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditStrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const strategy = await prisma.marketingStrategy.findUnique({
    where: { id },
  });

  if (!strategy) {
    notFound();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/strategies">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Estrategia</h1>
          <p className="text-muted-foreground">{strategy.name}</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <StrategyForm 
          businessId={strategy.businessId} 
          defaultValues={strategy as any} 
        />
      </div>
    </div>
  );
}
