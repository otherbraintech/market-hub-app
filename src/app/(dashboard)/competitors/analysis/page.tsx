import { getSelectedBusinessId } from "@/actions/business";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CompetitorsAnalysisClient } from "./client-page";
import { triggerMissingCompetitorAnalyses } from "@/app/(dashboard)/business/[id]/competitor-actions";

export default async function CompetitorsAnalysisPage() {
  const businessId = await getSelectedBusinessId();
  if (!businessId) {
    redirect("/business");
  }

  // Trigger check for any missing competitor channel analyses in the background
  triggerMissingCompetitorAnalyses(businessId).catch((err) => {
    console.error("Error triggering missing competitor analyses on page load:", err);
  });

  // Fetch competitors
  const competitors = await prisma.competitor.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all analysis reports for competitors
  const competitorsWithReports = await Promise.all(
    competitors.map(async (comp: { id: string }) => {
      const reportsRaw = await prisma.analysisReport.findMany({
        where: { entityId: comp.id, type: "COMPETITOR" },
        orderBy: { createdAt: "desc" },
      });
      const reportsByChannel: Record<string, any> = {};
      for (const rep of reportsRaw) {
        if (!reportsByChannel[rep.channel]) {
          reportsByChannel[rep.channel] = rep;
        }
      }
      return { ...comp, reportsByChannel };
    })
  );

  // Fetch my business analysis reports for all channels
  const myAnalysesRaw = await prisma.analysisReport.findMany({
    where: { entityId: businessId, type: "MY_BUSINESS" },
    orderBy: { createdAt: "desc" },
  });
  const myAnalysesByChannel: Record<string, any> = {};
  for (const rep of myAnalysesRaw) {
    if (!myAnalysesByChannel[rep.channel]) {
      myAnalysesByChannel[rep.channel] = rep;
    }
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true }
  });
  const businessName = business?.name || "";

  return (
    <CompetitorsAnalysisClient 
      businessId={businessId}
      businessName={businessName}
      initialCompetitors={competitorsWithReports}
      myAnalysesByChannel={myAnalysesByChannel}
    />
  );
}
