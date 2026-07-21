import Link from "next/link";
import { getSession } from "@/lib/auth";
import { 
  ArrowRight, 
  LayoutDashboard, 
  UserPlus, 
  LogIn, 
  Sparkles, 
  Globe, 
  BarChart3, 
  Database, 
  Users, 
  Calendar, 
  Megaphone, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing-header";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      {/* Landing Header */}
      <LandingHeader hasSession={!!session} />

      {/* Decorative Lights (Glow effects) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-[120px]" />
        <div className="absolute top-[25%] -right-[15%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-[150px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[45%] h-[45%] rounded-full bg-blue-600/5 dark:bg-blue-500/2 blur-[130px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 flex flex-col min-h-screen">
        
        {/* HERO SECTION */}
        <section className="pt-32 pb-16 sm:pt-40 md:pt-44 md:pb-20 text-center max-w-5xl mx-auto space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold tracking-wide animate-in fade-in duration-700">
            <Sparkles className="size-4 animate-pulse text-blue-500" />
            <span>Motor de Inferencia Estratégica en Cascada</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05] sm:leading-[1] mb-4 break-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Automatiza tu Marketing con <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Agentes de IA</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Analiza competidores, genera estrategias y automatiza tus campañas con autoposteo inteligente y automejora continua.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md sm:max-w-none px-4 mx-auto pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            {session ? (
              <Button asChild size="lg" className="h-11 sm:h-14 px-5 sm:px-8 rounded-xl sm:rounded-2xl w-full sm:w-auto font-bold text-sm sm:text-base transition-all duration-300 hover:scale-102 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="lg" className="h-11 sm:h-14 px-5 sm:px-8 rounded-xl sm:rounded-2xl w-full sm:w-auto font-bold text-sm sm:text-base border-border hover:border-blue-500 hover:text-blue-600 dark:hover:bg-slate-900/50 dark:text-gray-300 transition-all duration-300 hover:scale-102">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Iniciar sesión
                  </Link>
                </Button>
                <Button asChild size="lg" className="h-11 sm:h-14 px-5 sm:px-8 rounded-xl sm:rounded-2xl w-full sm:w-auto font-bold text-sm sm:text-base bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-102 shadow-blue-200 dark:shadow-none shadow-lg text-white">
                  <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Crear cuenta gratis
                  </Link>
                </Button>
              </>
            )}
          </div>
        </section>

        {/* INTERACTIVE MOCKUP / DASHBOARD PREVIEW */}
        <section className="w-full max-w-6xl mx-auto pb-24 px-2 sm:px-4">
          <div className="relative rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-2xl p-3 sm:p-6 overflow-hidden">
            {/* Window controls */}
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4 mb-6">
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
              </div>
              <div className="px-4 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-slate-400 dark:text-slate-500 border border-slate-200/20">
                https://markethub.otherbrain.tech/dashboard
              </div>
              <div className="w-12" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar simulation */}
              <div className="lg:col-span-3 space-y-2 border-r border-slate-200/50 dark:border-slate-800/50 pr-4 hidden lg:block">
                <div className="font-bold text-[10px] uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-4 px-2">Navegación</div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                  <LayoutDashboard className="size-4" />
                  <span>Mi Negocio</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 text-sm">
                  <Database className="size-4" />
                  <span>Competidores</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 text-sm">
                  <Sparkles className="size-4" />
                  <span>Estrategias IA</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 text-sm">
                  <Megaphone className="size-4" />
                  <span>Campañas</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 text-sm">
                  <Calendar className="size-4" />
                  <span>Calendario</span>
                </div>
              </div>

              {/* Central Panel simulation */}
              <div className="lg:col-span-9 space-y-6">
                {/* Header status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100/30 dark:border-blue-900/30">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">Análisis de Competencia y Estrategia Consolidada</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Agente Estratega activo • Datos extraídos vía Apify/n8n</p>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                    Listo para campañas
                  </span>
                </div>

                {/* Dashboard grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: FODA Refinado */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">FODA Dinámico</span>
                      <TrendingUp className="size-4 text-blue-500" />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10"><strong className="text-green-600 dark:text-green-400">Fortaleza:</strong> Ventaja diferencial clara en catálogo y atención local.</div>
                      <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10"><strong className="text-blue-600 dark:text-blue-400">Oportunidad:</strong> Brecha de contenido en Reels no explotada por competidores.</div>
                      <div className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10"><strong className="text-yellow-600 dark:text-yellow-400">Debilidad:</strong> Presencia digital inconstante y baja prueba social inicial.</div>
                    </div>
                  </div>

                  {/* Card 2: Objetivos SMART */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">3 Objetivos SMART Priorizados</span>
                      <CheckCircle2 className="size-4 text-indigo-500" />
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">1.</span>
                        <span>Incrementar la conversión de WhatsApp Business en un 15% mediante CTAs directos en 30 días.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">2.</span>
                        <span>Lanzar 4 carruseles educativos semanales para mejorar el engagement del perfil en un 8%.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">3.</span>
                        <span>Capturar leads locales aprovechando eventos de vida y cumpleaños locales.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Card 3: Buyer Persona Preview */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Perfil de Buyer Persona Generado</span>
                    <Users className="size-4 text-emerald-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-1 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-100">Carlos "El Emprendedor"</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">32-45 años • Profesional</div>
                      <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] font-semibold">Segmento Meta Ads</div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                        <strong className="text-slate-700 dark:text-slate-300">Dolor Psicográfico Local:</strong> Pierde más de 1 hora en tráfico en horas pico de su ciudad y prefiere entregas a domicilio rápidas y seguras.
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                        <strong className="text-slate-700 dark:text-slate-300">Disparador de Compra (Hook Regional):</strong> "Optimiza tu tiempo sin salir de casa. Envío gratuito en menos de 30 minutos garantizado."
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PIPELINE / WORKFLOW SECTION */}
        <section className="py-16 border-t border-slate-200/20 dark:border-slate-800/20">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              ¿Cómo funciona el flujo de automatización?
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Nuestro motor opera de forma asíncrona mediante eventos para construir una presencia de marketing infalible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto px-4 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 relative group">
              <div className="size-16 rounded-[1.75rem] bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Database className="size-7" />
              </div>
              <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-900/40 hidden md:block z-[-1]" />
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">1. Banco de Datos</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Configura tus canales de comunicación y agrega competidores principales. Nuestro scraper extrae el estado actual del mercado.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 relative group">
              <div className="size-16 rounded-[1.75rem] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Sparkles className="size-7" />
              </div>
              <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-indigo-200 to-transparent dark:from-indigo-900/40 hidden md:block z-[-1]" />
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">2. Inferencia Estratégica</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  El Agente Estratega procesa en cascada y genera de inmediato un análisis FODA, 3 objetivos SMART y 4 perfiles de Buyer Persona.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 relative group">
              <div className="size-16 rounded-[1.75rem] bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900/50 shadow-sm group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                <Megaphone className="size-7" />
              </div>
              <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-violet-200 to-transparent dark:from-violet-900/40 hidden md:block z-[-1]" />
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">3. Campañas y Copys</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generación automática de hasta 8 campañas con sus objetivos. Copys listos y optimizados para canales como Facebook, Instagram y WhatsApp.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center space-y-4 relative group">
              <div className="size-16 rounded-[1.75rem] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Calendar className="size-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">4. Calendario Editorial</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Las publicaciones se inyectan en tu calendario con estados de aprobación (Idea, Generando, En Revisión, Aprobado y Programado).
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* DETAILED FEATURES MATRIX */}
        <section className="py-16 border-t border-slate-200/20 dark:border-slate-800/20">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Diseñado para resultados excepcionales
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Todo el potencial de una suite corporativa de marketing adaptada para tu negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group p-8 bg-card rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800/80 transition-all duration-300 text-left flex flex-col justify-between min-h-[250px]">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Users className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Motor Antropológico</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                    Buyer Personas realistas con análisis sociocultural: idiosincrasias de consumo locales, dolores cotidianos y disparadores (hooks) de compra específicos de la región.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-card rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all duration-300 text-left flex flex-col justify-between min-h-[250px]">
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <ArrowRightLeft className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Análisis de Competencia</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                    Matriz de canales y detección de vacíos de contenido de tus rivales directos. La IA aprovecha estas brechas para posicionar tu marca con mayor fuerza.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-card rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-800/80 transition-all duration-300 text-left flex flex-col justify-between min-h-[250px]">
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Proudly Event-Driven</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                    Toda la generación de datos y llamadas a modelos de lenguaje se procesa asíncronamente en segundo plano. Monitorea el progreso con flujos robustos de jobs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUE STATS SECTION */}
        <section className="py-16 border-t border-slate-200/20 dark:border-slate-800/20 bg-slate-50/50 dark:bg-slate-950/30 rounded-[3rem] px-6 sm:px-12 my-12 border border-slate-200/40 dark:border-slate-800/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">8</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Estrategias simultáneas</div>
              <div className="text-[11px] text-slate-400">Generadas por negocio</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">8</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Campañas automáticas</div>
              <div className="text-[11px] text-slate-400">Con objetivos y canales</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">4</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Buyer Personas</div>
              <div className="text-[11px] text-slate-400">Con perfil psicográfico</div>
            </div>
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">80%</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Ahorro de Tiempo</div>
              <div className="text-[11px] text-slate-400">En planeación estratégica</div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION (CTA) FINAL BANNER */}
        <section className="py-20 text-center max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              ¿Listo para transformar tu marketing digital?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base font-medium">
              Únete a MarketHub hoy mismo y deja que nuestros agentes de IA construyan tu motor de conversión digital.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto px-4">
            {session ? (
              <Button asChild size="lg" className="h-11 sm:h-14 px-5 sm:px-8 rounded-xl sm:rounded-2xl w-full font-bold text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Ir al Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="lg" className="h-11 sm:h-14 px-5 sm:px-8 rounded-xl sm:rounded-2xl w-full font-bold text-sm sm:text-base border-border hover:border-blue-500 hover:text-blue-600 dark:hover:bg-slate-900/50 transition-all duration-300">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild size="lg" className="h-11 sm:h-14 px-5 sm:px-8 rounded-xl sm:rounded-2xl w-full font-bold text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                  <Link href="/register">Crear Cuenta Gratis</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-8 mt-auto border-t border-slate-200/10 dark:border-slate-800/10 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
          © {new Date().getFullYear()} MarketHub. Proudly Event-Driven. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
