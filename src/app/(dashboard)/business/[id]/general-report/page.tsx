import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { BusinessGeneralReportClient } from './client-page';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessGeneralReportPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session || !session.userId) {
    redirect("/login");
  }

  // Verify business exists
  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      userId: true,
    }
  });

  if (!business) {
    redirect('/business');
  }

  // Authorization check: ensure the business belongs to the current user
  if (business.userId !== session.userId) {
    redirect("/business");
  }

  return <BusinessGeneralReportClient businessId={business.id} businessName={business.name} />;
}
