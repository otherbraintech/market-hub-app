import { prisma } from "@/lib/prisma";
import { Target } from "lucide-react";
import { getSelectedBusinessId } from "@/actions/business";
import { CampaignsClientPage } from "./client-page";

export default async function CampaignsPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Por favor, selecciona un negocio en la barra lateral para ver sus campañas activas.
        </p>
      </div>
    );
  }

  const rawCampaigns = await prisma.campaign.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      business: { select: { name: true } },
      strategy: { select: { name: true } },
      _count: { select: { contents: true } }
    },
    orderBy: { startDate: "desc" }
  });

  const business = await prisma.business.findUnique({
    where: { id: selectedBusinessId },
    select: { name: true }
  });
  const businessName = business?.name || "";

  const campaigns = rawCampaigns.map((c) => ({
    ...c,
    budget: c.budget ? Number(c.budget.toString()) : null,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate ? c.endDate.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <CampaignsClientPage
      initialCampaigns={campaigns}
      selectedBusinessId={selectedBusinessId}
      businessName={businessName}
    />
  );
}
