import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { AgentPipelineMonitor } from "@/components/business/agent-pipeline-monitor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cpu } from "lucide-react";
import Link from "next/link";

export default async function MonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  });

  if (!business) {
    notFound();
  }

  if (business.userId !== session.user.id) {
    redirect("/business");
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
          <Link href={`/business/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Cpu className="h-7 w-7 text-violet-650" />
            Consola y Monitoreo de Agentes: {business.name}
          </h2>
          <p className="text-muted-foreground text-sm">
            Monitorea el estado de procesamiento del pipeline autónomo y los logs de la inteligencia artificial.
          </p>
        </div>
      </div>

      <div className="w-full">
        <AgentPipelineMonitor businessId={id} />
      </div>
    </div>
  );
}
