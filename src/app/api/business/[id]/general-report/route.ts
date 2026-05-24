import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get business info
    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        website: true,
        phoneNumbers: true,
        location: true,
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get all analysis reports for the business (MY_BUSINESS type)
    const businessReports = await prisma.analysisReport.findMany({
      where: {
        type: 'MY_BUSINESS',
        entityId: business.id,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' }
    });

    // Group business reports by channel and normalize data
    const businessReportsMap = new Map<string, any>();
    businessReports.forEach(report => {
      // Keep only the latest report per channel
      if (!businessReportsMap.has(report.channel) || 
          (report.completedAt && businessReportsMap.get(report.channel)!.completedAt < report.completedAt)) {
        // Normalize data (handle string JSON)
        let dataObj = report.data;
        if (typeof report.data === 'string') {
          try {
            dataObj = JSON.parse(report.data);
          } catch (e) {
            console.error('Error parsing report data:', e);
          }
        }
        
        businessReportsMap.set(report.channel, {
          ...report,
          data: dataObj
        });
      }
    });

    // Build the consolidated report
    const generalReport = {
      businessId: business.id,
      businessName: business.name,
      generatedAt: new Date().toISOString(),
      
      // Business summary
      businessSummary: {
        info: {
          id: business.id,
          name: business.name,
          website: business.website,
          phoneNumbers: business.phoneNumbers,
          location: business.location,
        },
        reports: Array.from(businessReportsMap.entries()).map(([channel, report]) => ({
          channel,
          url: report.url,
          data: report.data,
          completedAt: report.completedAt
        }))
      },
      
      // Metadata
      metadata: {
        totalBusinessReports: businessReports.length,
        channelsAnalyzed: Array.from(businessReportsMap.keys())
      }
    };

    return NextResponse.json(generalReport);
  } catch (error) {
    console.error('Error generating business general report:', error);
    return NextResponse.json({ error: 'Failed to generate general report' }, { status: 500 });
  }
}
