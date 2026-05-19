import { getSelectedBusinessId, getBusinessAction } from "@/actions/business";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BusinessAnalysisClient } from "./client-page";

export default async function BusinessAnalysisPage() {
  const businessId = await getSelectedBusinessId();
  if (!businessId) {
    redirect("/business");
  }

  const business = await getBusinessAction(businessId);
  if (!business) {
    redirect("/business");
  }

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

  return (
    <BusinessAnalysisClient 
      businessId={businessId}
      business={business}
      initialAnalyses={myAnalysesByChannel}
    />
  );
}
