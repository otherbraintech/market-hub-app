import { prisma } from "@/lib/prisma";
import { Calendar as CalendarIcon } from "lucide-react";
import { getSelectedBusinessId } from "@/actions/business";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage() {
  const selectedBusinessId = await getSelectedBusinessId();

  if (!selectedBusinessId) {
    return (
      <div className="p-8 h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center">
        <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecciona un negocio</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          El calendario muestra la programación específica de cada negocio. Selecciona uno para continuar.
        </p>
      </div>
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: selectedBusinessId },
    select: { name: true }
  });

  const businessName = business?.name || "";

  const campaigns = await prisma.campaign.findMany({
    where: { businessId: selectedBusinessId },
    include: {
      strategy: true
    },
    orderBy: { name: "asc" }
  });

  const contents = await prisma.content.findMany({
    where: {
      campaign: { businessId: selectedBusinessId },
      scheduledAt: { not: null }
    },
    include: {
      campaign: {
        select: { name: true }
      }
    },
    orderBy: { scheduledAt: "asc" }
  });

  // Convert dates to string/ISO format for serialization if necessary
  const serializedContents = contents.map((item: any) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    scheduledAt: item.scheduledAt ? item.scheduledAt.toISOString() : null,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
  }));

  // Serializar campañas para Client Component (Decimal/Date no son serializables)
  const serializedCampaigns = campaigns.map((camp: any) => ({
    ...camp,
    budget: camp.budget ? Number(camp.budget) : null,
    startDate: camp.startDate ? camp.startDate.toISOString() : null,
    endDate: camp.endDate ? camp.endDate.toISOString() : null,
    createdAt: camp.createdAt.toISOString(),
    updatedAt: camp.updatedAt.toISOString(),
    strategy: camp.strategy ? {
      ...camp.strategy,
      createdAt: camp.strategy.createdAt.toISOString(),
      updatedAt: camp.strategy.updatedAt.toISOString(),
    } : null,
  }));

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <CalendarView 
        businessId={selectedBusinessId}
        businessName={businessName}
        campaigns={serializedCampaigns}
        initialContents={serializedContents as any}
      />
    </div>
  );
}
