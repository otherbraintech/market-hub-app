import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    // Get business info with saved report
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        competitorGeneralReport: true,
        competitorGeneralReportGeneratedAt: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // If there's a saved report, return it
    if (business.competitorGeneralReport) {
      const report = typeof business.competitorGeneralReport === 'string' 
        ? JSON.parse(business.competitorGeneralReport) 
        : business.competitorGeneralReport;
      return NextResponse.json({
        ...report,
        isSavedReport: true,
        savedAt: business.competitorGeneralReportGeneratedAt
      });
    }

    // Get all competitors for this business
    const competitors = await prisma.competitor.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        website: true,
        facebook: true,
        instagram: true,
        tiktok: true,
        linkedin: true,
        youtube: true,
        seoGoogle: true,
      }
    });

    // Get all analysis reports for competitors
    const competitorReports = await prisma.analysisReport.findMany({
      where: {
        type: 'COMPETITOR',
        entityId: { in: competitors.map((c: typeof competitors[number]) => c.id) },
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' }
    });

    // Group competitor reports by competitorId and normalize data
    const competitorReportsMap = new Map<string, any[]>();
    competitorReports.forEach((report: typeof competitorReports[number]) => {
      if (!competitorReportsMap.has(report.entityId)) {
        competitorReportsMap.set(report.entityId, []);
      }
      
      // Normalize data (handle string JSON)
      let dataObj = report.data;
      if (typeof report.data === 'string') {
        try {
          dataObj = JSON.parse(report.data);
        } catch (e) {
          console.error('Error parsing competitor report data:', e);
        }
      }
      
      // Handle new array structure with output field
      if (Array.isArray(dataObj) && dataObj.length > 0 && dataObj[0] && typeof dataObj[0] === 'object' && 'output' in dataObj[0]) {
        dataObj = (dataObj[0] as any).output;
      }
      
      competitorReportsMap.get(report.entityId)!.push({
        ...report,
        data: dataObj
      });
    });

    // Build the consolidated report with enhanced competitor data
    const generalReport = {
      businessId: business.id,
      businessName: business.name,
      generatedAt: new Date().toISOString(),
      executiveSummary: '', // Empty for on-demand reports, only filled when saved
      competitors: competitors.map((competitor: typeof competitors[number]) => {
        const competitorReports = competitorReportsMap.get(competitor.id) || [];
        
        // Extract key insights from all reports
        const allInsights = {
          totalFollowers: 0,
          totalPosts: 0,
          avgEngagement: 0,
          strengths: [] as string[],
          weaknesses: [] as string[],
          recommendations: [] as string[],
          contentThemes: [] as string[],
          postingFrequency: '',
          audienceDemographics: {} as any,
          topPerformingContent: [] as any[],
          contentStrategy: {} as any,
          brandVoice: [] as string[],
          marketingTactics: [] as string[],
          customerEngagement: {} as any,
          competitiveAdvantages: [] as string[],
          marketPositioning: '',
          pricingStrategy: '',
          uniqueSellingPoints: [] as string[],
          // Additional fields
          websiteAnalysis: {} as any,
          seoStrategy: [] as string[],
          advertisingApproach: [] as string[],
          customerService: [] as string[],
          productOfferings: [] as string[],
          promotions: [] as string[],
          partnerships: [] as string[],
          communityBuilding: [] as string[],
          brandConsistency: [] as string[],
          visualIdentity: [] as string[],
          storytellingApproach: [] as string[],
          contentFormats: [] as string[],
          engagementTactics: [] as string[],
          growthStrategy: [] as string[],
          targetAudience: [] as string[],
          valueProposition: [] as string[],
          differentiation: [] as string[],
          strategicAnalysis: '',
        };
        
        // Process each report to extract insights
        competitorReports.forEach((report: typeof competitorReports[number]) => {
          const data = report.data;
          const channel = report.channel;
          
          // Extract Instagram-specific data
          if (data?.instagram_presence) {
            const audienceSize = data.instagram_presence.audience_size || {};
            allInsights.totalFollowers += parseInt(audienceSize.followers || '0');
            allInsights.totalPosts += parseInt(audienceSize.posts_count || '0');
            
            if (data.instagram_presence.brand_summary) {
              allInsights.marketPositioning = data.instagram_presence.brand_summary;
            }
            if (data.instagram_presence.username) {
              allInsights.targetAudience.push(`Instagram: @${data.instagram_presence.username}`);
            }
          }
          
          // Extract engagement data
          if (data?.engagement_analysis) {
            const engagement = data.engagement_analysis;
            if (engagement.engagement_level) {
              allInsights.avgEngagement = engagement.engagement_level;
            }
            if (engagement.content_themes) {
              allInsights.contentThemes.push(...engagement.content_themes);
            }
            if (engagement.posting_frequency) {
              allInsights.postingFrequency = engagement.posting_frequency;
            }
            if (engagement.engagement_tactics) {
              allInsights.engagementTactics.push(...engagement.engagement_tactics);
            }
          }
          
          // Extract competitive observations
          if (data?.competitive_observations) {
            const compObs = data.competitive_observations;
            if (compObs.main_strengths) {
              allInsights.strengths.push(...compObs.main_strengths);
            }
            if (compObs.main_weaknesses) {
              allInsights.weaknesses.push(...compObs.main_weaknesses);
            }
            if (compObs.strategic_recommendations) {
              allInsights.recommendations.push(...compObs.strategic_recommendations);
            }
            if (compObs.competitive_advantages) {
              allInsights.competitiveAdvantages.push(...compObs.competitive_advantages);
            }
            if (compObs.market_positioning) {
              allInsights.marketPositioning = compObs.market_positioning;
            }
            if (compObs.differentiation) {
              allInsights.differentiation.push(...compObs.differentiation);
            }
          }
          
          // Extract branding analysis
          if (data?.branding_analysis) {
            const branding = data.branding_analysis;
            if (branding.brand_personality) {
              allInsights.brandVoice.push(...branding.brand_personality);
            }
            if (branding.communication_style) {
              allInsights.brandVoice.push(...branding.communication_style);
            }
            if (branding.visual_identity) {
              allInsights.visualIdentity.push(...branding.visual_identity);
            }
            if (branding.brand_consistency) {
              allInsights.brandConsistency.push(...branding.brand_consistency);
            }
          }
          
          // Extract content analysis
          if (data?.content_analysis) {
            const content = data.content_analysis;
            if (content.top_performing_content) {
              allInsights.topPerformingContent.push(...content.top_performing_content);
            }
            if (content.content_strategy) {
              allInsights.contentStrategy = { ...allInsights.contentStrategy, ...content.content_strategy };
            }
            if (content.content_formats) {
              allInsights.contentFormats.push(...content.content_formats);
            }
            if (content.storytelling_approach) {
              allInsights.storytellingApproach.push(...content.storytelling_approach);
            }
          }
          
          // Extract business intelligence
          if (data?.business_intelligence) {
            const bizIntel = data.business_intelligence;
            if (bizIntel.marketing_tactics) {
              allInsights.marketingTactics.push(...bizIntel.marketing_tactics);
            }
            if (bizIntel.pricing_strategy) {
              allInsights.pricingStrategy = bizIntel.pricing_strategy;
            }
            if (bizIntel.unique_selling_points) {
              allInsights.uniqueSellingPoints.push(...bizIntel.unique_selling_points);
            }
            if (bizIntel.value_proposition) {
              allInsights.valueProposition.push(...bizIntel.value_proposition);
            }
            if (bizIntel.product_offerings) {
              allInsights.productOfferings.push(...bizIntel.product_offerings);
            }
            if (bizIntel.promotions) {
              allInsights.promotions.push(...bizIntel.promotions);
            }
            if (bizIntel.partnerships) {
              allInsights.partnerships.push(...bizIntel.partnerships);
            }
          }
          
          // Extract website analysis
          if (data?.website_analysis) {
            const website = data.website_analysis;
            allInsights.websiteAnalysis = { ...allInsights.websiteAnalysis, ...website };
          }
          
          // Extract SEO strategy
          if (data?.seo_strategy) {
            allInsights.seoStrategy.push(...data.seo_strategy);
          }
          
          // Extract advertising approach
          if (data?.advertising_approach) {
            allInsights.advertisingApproach.push(...data.advertising_approach);
          }
          
          // Extract customer service
          if (data?.customer_service) {
            allInsights.customerService.push(...data.customer_service);
          }
          
          // Extract community building
          if (data?.community_building) {
            allInsights.communityBuilding.push(...data.community_building);
          }
          
          // Extract growth strategy
          if (data?.growth_strategy) {
            allInsights.growthStrategy.push(...data.growth_strategy);
          }
        });
        
        // Remove duplicates
        allInsights.strengths = [...new Set(allInsights.strengths)];
        allInsights.weaknesses = [...new Set(allInsights.weaknesses)];
        allInsights.recommendations = [...new Set(allInsights.recommendations)];
        allInsights.contentThemes = [...new Set(allInsights.contentThemes)];
        allInsights.brandVoice = [...new Set(allInsights.brandVoice)];
        allInsights.marketingTactics = [...new Set(allInsights.marketingTactics)];
        allInsights.competitiveAdvantages = [...new Set(allInsights.competitiveAdvantages)];
        allInsights.uniqueSellingPoints = [...new Set(allInsights.uniqueSellingPoints)];
        allInsights.seoStrategy = [...new Set(allInsights.seoStrategy)];
        allInsights.advertisingApproach = [...new Set(allInsights.advertisingApproach)];
        allInsights.customerService = [...new Set(allInsights.customerService)];
        allInsights.productOfferings = [...new Set(allInsights.productOfferings)];
        allInsights.promotions = [...new Set(allInsights.promotions)];
        allInsights.partnerships = [...new Set(allInsights.partnerships)];
        allInsights.communityBuilding = [...new Set(allInsights.communityBuilding)];
        allInsights.brandConsistency = [...new Set(allInsights.brandConsistency)];
        allInsights.visualIdentity = [...new Set(allInsights.visualIdentity)];
        allInsights.storytellingApproach = [...new Set(allInsights.storytellingApproach)];
        allInsights.contentFormats = [...new Set(allInsights.contentFormats)];
        allInsights.engagementTactics = [...new Set(allInsights.engagementTactics)];
        allInsights.growthStrategy = [...new Set(allInsights.growthStrategy)];
        allInsights.targetAudience = [...new Set(allInsights.targetAudience)];
        allInsights.valueProposition = [...new Set(allInsights.valueProposition)];
        allInsights.differentiation = [...new Set(allInsights.differentiation)];
        
        return {
          ...competitor,
          reports: competitorReports,
          insights: allInsights
        };
      }),
      
      // Metadata
      metadata: {
        totalCompetitors: competitors.length,
        totalCompetitorReports: competitorReports.length,
        channelsAnalyzed: Array.from(new Set(competitorReports.map((r: typeof competitorReports[number]) => r.channel)))
      }
    };

    return NextResponse.json(generalReport);
  } catch (error) {
    console.error('Error generating general report:', error);
    return NextResponse.json({ error: 'Failed to generate general report' }, { status: 500 });
  }
}
