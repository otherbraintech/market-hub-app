import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BusinessAnalysisClient } from "./client-page";

export default async function BusinessAnalysisPage({ 
  params,
}: { 
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      website: true,
      socialLinks: true,
    }
  });

  if (!business) {
    notFound();
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
  myAnalyses.forEach(analysis => {
    if (!myAnalysesByChannel[analysis.channel]) {
      myAnalysesByChannel[analysis.channel] = analysis;
    }
  });

  // Extract social links from JSON
  const socialLinks = business.socialLinks as any || {};

  return (
    <BusinessAnalysisClient 
      businessId={business.id}
      businessName={business.name}
      business={{
        id: business.id,
        name: business.name,
        website: business.website,
        facebook: socialLinks.facebook,
        instagram: socialLinks.instagram,
        tiktok: socialLinks.tiktok,
        linkedin: socialLinks.linkedin,
        youtube: socialLinks.youtube,
        seoGoogle: socialLinks.seoGoogle,
      }}
      myAnalysesByChannel={myAnalysesByChannel}
    />
  );
}
