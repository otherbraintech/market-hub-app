import { prisma } from "@/lib/prisma";
import { getActiveStrategyForBusiness } from "@/modules/marketing-strategy";
import { StrategyForm } from "./strategy-form";

interface StrategyViewProps {
  businessId: string;
}

export async function StrategyView({ businessId }: StrategyViewProps) {
  const strategy = await getActiveStrategyForBusiness(businessId);

  return (
    <div className="max-w-5xl mx-auto">
      <StrategyForm 
        businessId={businessId} 
        defaultValues={strategy ? ({
            name: strategy.name,
            description: strategy.description || "",
            isActive: strategy.isActive,
            objectives: strategy.objectives || [],
            personas: strategy.personas || [],
            funnelStages: strategy.funnelStages || [],
            channels: strategy.channels || []
        } as any) : undefined} 
      />
    </div>
  );
}
