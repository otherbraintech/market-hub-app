import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ArrowRight, LayoutDashboard, UserPlus, LogIn, Sparkles, Globe, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#fafafa]">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-400/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 flex flex-col min-h-screen">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-16 sm:pt-40 md:pt-48 md:pb-24 text-center max-w-4xl mx-auto space-y-8 md:space-y-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter text-gray-900 leading-[0.9] sm:leading-[0.85] mb-6 md:mb-8 break-tight">
              Market<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Hub</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed px-2 sm:px-4">
              Gestiona campañas multicanal y genera estrategias de impacto con una arquitectura moderna basada en eventos.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-sm sm:max-w-none px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {session ? (
              <Button asChild size="lg" className="h-14 px-8 rounded-2xl w-full sm:w-auto font-bold text-base transition-all duration-300 hover:scale-105">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl w-full sm:w-auto font-bold text-base border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-all duration-300 hover:scale-105">
                  <Link href="/login">
                    <LogIn className="mr-2 h-5 w-5" />
                    Iniciar sesión
                  </Link>
                </Button>
                <Button asChild size="lg" className="h-14 px-8 rounded-2xl w-full sm:w-auto font-bold text-base bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-blue-200 shadow-lg">
                  <Link href="/register">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Crear cuenta
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <FeatureCard 
              icon={<Sparkles className="w-6 h-6" />}
              title="IA Generativa"
              description="Estrategias y contenidos creados por modelos avanzados."
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6" />}
              title="Omnicanal"
              description="Publicación automática en tus redes sociales favoritas."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6" />}
              title="Analytics"
              description="Métricas precisas para optimizar cada conversión."
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="py-8 text-center text-gray-400 text-sm font-medium">
          © 2026 MarketHub. Proudly Event-Driven.
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-8 bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-gray-200/50 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 text-left flex flex-col gap-4">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
      </div>
    </div>
  );
}
