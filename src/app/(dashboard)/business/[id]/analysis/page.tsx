import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BusinessAnalysisClient } from "../../analysis/client-page";

export default async function BusinessAnalysisPage({ 
  params,
}: { 
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session || !session.userId) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      website: true,
      socialLinks: true,
      userId: true,
    }
  });

  if (!business) {
    notFound();
  }

  // Authorization check: ensure the business belongs to the current user
  if (business.userId !== session.userId) {
    redirect("/business");
  }

  // Get all analysis reports for this business (MY_BUSINESS type)
  const myAnalyses = await prisma.analysisReport.findMany({
    where: {
      type: 'MY_BUSINESS',
      entityId: business.id,
    },
    orderBy: { createdAt: 'desc' }
  });

  // Group analyses by channel
  const myAnalysesByChannel: Record<string, any> = {};
  myAnalyses.forEach((analysis: { channel: string }) => {
    if (!myAnalysesByChannel[analysis.channel]) {
      myAnalysesByChannel[analysis.channel] = analysis;
    }
  });

  return (
    <BusinessAnalysisClient 
      businessId={business.id}
      business={business}
      initialAnalyses={myAnalysesByChannel}
    />
  );
}
