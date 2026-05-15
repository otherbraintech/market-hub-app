import { getSelectedBusinessId } from "@/actions/business";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CompetitorsAnalysisClient } from "./client-page";

export default async function CompetitorsAnalysisPage() {
  const businessId = await getSelectedBusinessId();
  if (!businessId) {
    redirect("/business");
  }

  // Fetch competitors
  const competitors = await prisma.competitor.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

  // Fetch latest analysis for competitors
  const competitorsWithReports = await Promise.all(
    competitors.map(async (comp) => {
      const report = await prisma.analysisReport.findFirst({
        where: { entityId: comp.id, type: "COMPETITOR" },
        orderBy: { createdAt: "desc" },
      });
      return { ...comp, report };
    })
  );

  // Fetch my business latest analysis
  const myAnalysis = await prisma.analysisReport.findFirst({
    where: { entityId: businessId, type: "MY_BUSINESS", status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CompetitorsAnalysisClient 
      businessId={businessId}
      initialCompetitors={competitorsWithReports}
      myAnalysis={myAnalysis}
    />
  );
}
