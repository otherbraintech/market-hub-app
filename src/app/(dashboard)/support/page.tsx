import React from "react";
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageSquare, 
  FileText, 
  ExternalLink,
  ChevronRight,
  LifeBuoy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupportPage() {
  const categories = [
    {
      title: "Guías de Inicio",
      description: "Aprende a configurar tu negocio y tus primeros competidores en MarketHub.",
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      linkText: "Ver Guías",
    },
    {
      title: "Video Tutoriales",
      description: "Tutoriales cortos paso a paso de cómo generar tu primer circuito de marketing.",
      icon: <Video className="h-5 w-5 text-purple-500" />,
      linkText: "Ver Videos",
    },
    {
      title: "Preguntas Frecuentes",
      description: "Respuestas a dudas comunes sobre canales de WhatsApp, métricas e IA.",
      icon: <HelpCircle className="h-5 w-5 text-emerald-500" />,
      linkText: "Explorar FAQs",
    },
  ];

  const faqs = [
    {
      question: "¿Cómo funciona el análisis automático de competidores?",
      answer: "MarketHub utiliza un scraper ético para extraer información pública de las redes de tus competidores (Facebook, Instagram, TikTok) y procesa esos datos con IA para darte un reporte detallado de fortalezas, debilidades y oportunidades de contenido."
    },
    {
      question: "¿Por qué no me sugiere estrategias orientadas a sitio web?",
      answer: "Nuestra IA implementa un filtro de pertinencia. Si registraste que tu negocio no cuenta con un sitio web activo, MarketHub descartará automáticamente tácticas web para priorizar flujos de conversión de WhatsApp y mensajería en redes sociales."
    },
    {
      question: "¿Cómo se programan las publicaciones en el calendario?",
      answer: "Al confirmar una estrategia de marketing, el sistema genera automáticamente un lote de 6 campañas en borrador con publicaciones calendarizadas. Puedes entrar a cada publicación, editar su copy, prompt de imagen o adjuntar contenido multimedia listo para publicar."
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="h-8 w-8 text-blue-600 animate-pulse" />
            Centro de Ayuda y Soporte
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Encuentra recursos, guías y resuelve tus dudas para maximizar la presencia digital de tu pyme.
          </p>
        </div>
      </div>

      {/* TARJETAS DE CATEGORIAS */}
      <div className="grid gap-6 md:grid-cols-3">
        {categories.map((cat, idx) => (
          <Card key={idx} className="hover:shadow-md transition-all duration-300 border border-muted/50 group flex flex-col justify-between">
            <CardHeader className="p-5 pb-2">
              <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center mb-3">
                {cat.icon}
              </div>
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{cat.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed mt-1">{cat.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 mt-auto">
              <Button variant="ghost" className="w-full text-xs font-semibold justify-between p-0 hover:bg-transparent text-blue-650 hover:text-blue-700">
                <span>{cat.linkText}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SECCION CENTRAL: VIDEO TUTORIAL Y CONTACTO */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* VIDEO DESTACADO */}
        <Card className="md:col-span-2 overflow-hidden border border-muted/40 hover:shadow-sm transition-all">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-lg font-black tracking-tight">Video Guía: Configura tu circuito de marketing en 3 minutos</CardTitle>
            <CardDescription className="text-xs">Aprende los conceptos clave y cómo usar la IA a tu favor.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="aspect-video w-full rounded-xl bg-slate-950/90 relative flex items-center justify-center group overflow-hidden border">
              {/* Mock video content */}
              <div className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              <Button className="relative h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 border-none">
                <svg className="h-6 w-6 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Button>
              <div className="absolute bottom-3 left-4 text-white text-[10px] font-bold tracking-wider uppercase bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                Tutorial MVP
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MOCK CONTACT FORM */}
        <Card className="border border-muted/40 hover:shadow-sm transition-all flex flex-col justify-between">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-lg font-black tracking-tight">¿Aún necesitas ayuda?</CardTitle>
            <CardDescription className="text-xs">Envíanos un mensaje y te contactaremos por WhatsApp o correo en menos de 24 horas.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="subject-input" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Asunto</label>
              <Input id="subject-input" placeholder="Ej. Duda con la conexión de Instagram" className="text-xs h-9" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="message-input" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Mensaje / Detalle</label>
              <textarea id="message-input" placeholder="Cuéntanos más detalladamente qué necesitas..." className="w-full min-h-[90px] p-2.5 rounded-md border text-xs bg-background resize-none focus-visible:ring-1 focus-visible:ring-blue-600 outline-none" />
            </div>
            <Button className="w-full text-xs font-semibold h-9 bg-blue-650 hover:bg-blue-700 text-white gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Enviar Consulta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PREGUNTAS FRECUENTES (ACCORDION MOCK) */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-black tracking-tight border-b pb-2">Preguntas Frecuentes</h3>
        <div className="grid gap-4">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="border border-muted/30 bg-muted/5">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">?</span>
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 pb-3 text-xs leading-relaxed text-muted-foreground text-justify">
                {faq.answer}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
