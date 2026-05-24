import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GeneralReportClient } from './client-page';

interface PageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default async function GeneralReportPage({ params }: PageProps) {
  const { businessId } = await params;

  // Verify business exists
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
    }
  });

  if (!business) {
    redirect('/competitors');
  }

  return <GeneralReportClient businessId={businessId} businessName={business.name} />;
}
