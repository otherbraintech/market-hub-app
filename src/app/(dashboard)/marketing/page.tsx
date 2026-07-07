import { prisma } from "@/lib/prisma";
import { getSelectedBusinessId } from "@/actions/business";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Share2 } from "lucide-react";
import { MarketingClient } from "./marketing-client";

export default async function MarketingPage() {
  const session = await getSession();
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <Share2 className="h-12 w-12 text-muted-foreground/30 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-xs">
          Por favor, selecciona un negocio en la barra lateral para ver sus estrategias y campañas de marketing.
        </p>
      </div>
    );
  }

  // Fetch business info
  const business = await prisma.business.findUnique({
    where: { id: selectedBusinessId },
    select: { name: true, settings: true }
  });
  const businessName = business?.name || "";
  const settings = (business?.settings as Record<string, any>) || {};
  const lastCascadeGeneratedAt = settings.lastCascadeGeneratedAt || null;
  const initialAutoGenerateEnabled = settings.autoGenerateCampaigns !== false;

  // Fetch strategies
  const rawStrategies = await prisma.marketingStrategy.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      business: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const strategies = rawStrategies.map((s: any) => ({
    id: s.id,
    businessId: s.businessId,
    name: s.name,
    description: s.description,
    isActive: s.isActive,
    objectives: s.objectives,
    personas: s.personas,
    funnelStages: s.funnelStages,
    channels: s.channels,
    contentPillars: s.contentPillars,
    postingSchedule: s.postingSchedule,
    business: {
      name: s.business.name
    }
  }));

  // Fetch campaigns
  const rawCampaigns = await prisma.campaign.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      business: { select: { name: true } },
      strategy: { select: { name: true } },
      contents: {
        orderBy: { scheduledAt: "asc" }
      },
      _count: { select: { contents: true } }
    },
    orderBy: { startDate: "desc" }
  });

  const campaigns = rawCampaigns.map((c: any) => ({
    ...c,
    budget: c.budget ? Number(c.budget.toString()) : null,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate ? c.endDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <MarketingClient
      strategies={strategies}
      campaigns={campaigns}
      selectedBusinessId={selectedBusinessId}
      businessName={businessName}
      lastCascadeGeneratedAt={lastCascadeGeneratedAt}
      initialAutoGenerateEnabled={initialAutoGenerateEnabled}
    />
  );
}
