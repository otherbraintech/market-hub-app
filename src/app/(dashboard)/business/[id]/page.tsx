import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listProductsByBusiness } from "@/modules/products";
import { listCampaignsByBusiness } from "@/modules/campaigns";
import { listSocialAccounts } from "@/modules/publishing";
import { BusinessDetailClient } from "@/components/business/business-detail-client";

export default async function BusinessDetailPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skipOnboarding?: string }>;
}) {
  const { id } = await params;
  const { skipOnboarding } = await searchParams;
  const session = await getSession();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
          campaigns: true,
          socialAccounts: true,
        }
      },
      competitors: true
    }
  });

  if (!business) {
    notFound();
  }

  if (business.userId !== session.user.id) {
    redirect("/business");
  }

  const hasOnboardingStrategy = (business.onboardingStrategy && typeof business.onboardingStrategy === "object" && Object.keys(business.onboardingStrategy as object).length > 0 && Object.values(business.onboardingStrategy as object).some((val: any) => typeof val === "string" && val.trim().length > 0));

  if ((business.competitors.length === 0 || !hasOnboardingStrategy) && skipOnboarding !== "true") {
    redirect(`/onboarding?businessId=${id}`);
  }

  // Fetch products, campaigns, social accounts, contents and reports
  const [productsData, campaignsData, socialAccounts, contents, myAnalysis, activeStrategy] = await Promise.all([
    listProductsByBusiness(business.id),
    listCampaignsByBusiness(business.id),
    listSocialAccounts(business.id),
    prisma.content.findMany({
      where: {
        OR: [
          { campaign: { businessId: business.id } },
          { product: { businessId: business.id } }
        ]
      },
      select: { id: true, status: true }
    }),
    prisma.analysisReport.findFirst({
      where: { entityId: business.id, type: "MY_BUSINESS", status: "COMPLETED" },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.marketingStrategy.findFirst({
      where: { businessId: business.id, isActive: true },
      select: { id: true }
    })
  ]);

  const { campaigns } = campaignsData;

  const visualReport = (business.settings as any)?.visualAnalysisReport;
  const hasMediaAnalysis = !!visualReport && typeof visualReport === "object";

  const hasAudit = !!myAnalysis || !!business.competitorGeneralReport;
  const hasStrategy = !!activeStrategy || (Array.isArray((business as any).strategies) && (business as any).strategies.length > 0);
  const hasCampaign = campaigns.length > 0;
  const hasCalendar = contents.length > 0;

  const flowDone = (hasAudit ? 1 : 0) + (hasMediaAnalysis ? 1 : 0) + (hasStrategy ? 1 : 0) + (hasCampaign ? 1 : 0) + (hasCalendar ? 1 : 0);
  const flowPercentage = Math.round((flowDone / 5) * 100);

  const approvedPiecesCount = contents.filter(c => c.status === "PUBLISHED" || c.status === "SCHEDULED").length;

  let activeNetworksList: string[] = [];
  if (business.socialLinks) {
    try {
      const links = typeof business.socialLinks === "string" ? JSON.parse(business.socialLinks) : business.socialLinks;
      if (links && typeof links === "object") {
        activeNetworksList = Object.keys(links).filter(k => typeof links[k] === "string" && links[k].trim() !== "");
      }
    } catch (e) {}
  }

  return (
    <BusinessDetailClient
      business={business}
      hasAudit={hasAudit}
      hasMediaAnalysis={hasMediaAnalysis}
      hasStrategy={hasStrategy}
      hasCampaign={hasCampaign}
      hasCalendar={hasCalendar}
      flowPercentage={flowPercentage}
      flowDone={flowDone}
      activeNetworksCount={socialAccounts.length + activeNetworksList.length}
      activeNetworksList={activeNetworksList}
      calendarCount={hasCalendar ? 1 : 0}
      latestCalendarStatus={hasCalendar ? `${contents.length} piezas` : "Sin generar"}
      approvedPiecesCount={approvedPiecesCount}
      totalPiecesCount={contents.length}
      auditId={myAnalysis?.id}
      strategyId={activeStrategy?.id}
      calendarId={contents?.[0]?.id}
    />
  );
}
