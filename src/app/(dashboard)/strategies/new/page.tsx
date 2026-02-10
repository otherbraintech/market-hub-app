import { getSelectedBusinessId } from "@/actions/business";
import { StrategyForm } from "@/components/strategy/strategy-form";
import { Lightbulb, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewStrategyPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    redirect("/strategies");
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
          <h1 className="text-3xl font-bold tracking-tight">Nueva Estrategia</h1>
          <p className="text-muted-foreground">Configura los pilares de marketing para tu negocio.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <StrategyForm businessId={selectedBusinessId} />
      </div>
    </div>
  );
}
