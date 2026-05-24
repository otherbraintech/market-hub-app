import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BusinessGeneralReportClient } from './client-page';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessGeneralReportPage({ params }: PageProps) {
  const { id } = await params;

  // Verify business exists
  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
    }
  });

  if (!business) {
    redirect('/business');
  }

  return <BusinessGeneralReportClient businessId={business.id} businessName={business.name} />;
}
