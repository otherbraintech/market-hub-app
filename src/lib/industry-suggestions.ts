export interface StrategicQuestionSuggestion {
  placeholder: string;
  chips: string[];
}

export interface IndustryPlaceholdersMap {
  locationAge: StrategicQuestionSuggestion;
  lifeEvent: StrategicQuestionSuggestion;
  archetype: StrategicQuestionSuggestion;
  conversionChannel: StrategicQuestionSuggestion;
  informationGaps: StrategicQuestionSuggestion;
  socialProof: StrategicQuestionSuggestion;
  differentialAdvantage: StrategicQuestionSuggestion;
  industryLabel: string;
}

const GASTRO_PRESETS: IndustryPlaceholdersMap = {
  industryLabel: "Gastronomía y Alimentación",
  locationAge: {
    placeholder: "Ej. Zona Equipetrol (Santa Cruz), jóvenes y ejecutivos de 20 a 45 años",
    chips: ["Santa Cruz - 20 a 40 años", "La Paz - Ejecutivos y Familias", "Cochabamba - Jóvenes universitarios"]
  },
  lifeEvent: {
    placeholder: "Ej. Antojos de fin de semana, cenas de cumpleaños, reuniones con amigos o almuerzos ejecutivos",
    chips: ["Antojo de fin de semana", "Almuerzo ejecutivo de trabajo", "Festejos y cumpleaños", "Reuniones familiares"]
  },
  archetype: {
    placeholder: "Ej. Artesanal y apasionado por el sabor, cálido, acogedor y cercano",
    chips: ["Artesanal y Apasionado", "Moderno y Juvenil", "Tradicional y Familiar", "Gourmet y Exclusivo"]
  },
  conversionChannel: {
    placeholder: "Ej. Instagram DM para reservas y WhatsApp / PedidosYa para delivery directo",
    chips: ["WhatsApp directo para Delivery", "Instagram DM para Reservas", "Botón de Menú Digital / Web"]
  },
  informationGaps: {
    placeholder: "Ej. Zonas y costo de delivery, menú con precios, opciones vegetarianas/keto y reservas",
    chips: ["Tiempo y zonas de delivery", "Menú con precios actualizados", "Opciones vegetarianas o keto", "Reservas de mesas"]
  },
  socialProof: {
    placeholder: "Ej. Fotos de clientes felices y 5 estrellas en Google Maps",
    chips: [
      "Fotos o historias que comparten los clientes en redes",
      "Reseñas y 5 estrellas en Google o Facebook",
      "Mensajes de agradecimiento por WhatsApp",
      "Recomendaciones boca a boca de clientes frecuentes",
      "Menciones de influencers o creadores locales",
      "Buenas notas y opiniones en apps de delivery",
      "Fotos reales de platos y pedidos entregados"
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Ingredientes 100% artesanales y frescos con delivery express calientito en <30 mins",
    chips: ["Delivery express en <30 mins", "Ingredientes 100% frescos y artesanales", "Receta secreta con porciones generosas"]
  }
};

const MODA_PRESETS: IndustryPlaceholdersMap = {
  industryLabel: "Moda, Tendencias y Belleza",
  locationAge: {
    placeholder: "Ej. Ciudades principales (Santa Cruz, La Paz), mujeres de 18 a 35 años amantes de la moda",
    chips: ["Ciudades principales, 18 a 35 años", "Jóvenes universitarias y profesionales", "Mujeres 25 a 45 años con estilo propio"]
  },
  lifeEvent: {
    placeholder: "Ej. Eventos especiales, cambio de temporada, fiestas de fin de semana o regalos",
    chips: ["Eventos y fiestas especiales", "Cambio de temporada / Tendencias", "Regalos y cumpleaños", "Looks de oficina y diario"]
  },
  archetype: {
    placeholder: "Ej. Chic, vanguardista, empoderado, estético y audaz",
    chips: ["Chic y Vanguardista", "Minimalista y Elegante", "Urbano y Audaz", "Fresco y Accesible"]
  },
  conversionChannel: {
    placeholder: "Ej. TikTok/Instagram directo a asesoría por WhatsApp o Tienda Online",
    chips: ["WhatsApp con asesoría de imagen", "Instagram DM directo", "Tienda online / Catálogo web"]
  },
  informationGaps: {
    placeholder: "Ej. Tabla de tallas exactas, material de la prenda, políticas de cambio y costo de envío",
    chips: ["Tabla de tallas y medidas exactas", "Políticas de cambio o devolución", "Costo y tiempo de envío nacional", "Fotos reales puestas"]
  },
  socialProof: {
    placeholder: "Ej. Fotos de clientas vistiendo las prendas y reseñas de compra",
    chips: [
      "Fotos y videos de clientas vistiendo las prendas",
      "Mensajes de agradecimiento y felicitaciones por WhatsApp",
      "Recomendaciones y menciones de creadoras de contenido",
      "Calificaciones de 5 estrellas en Facebook o Google",
      "Comentarios positivos sobre el envío rápido",
      "Años de trayectoria y marca reconocida"
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Diseños de edición limitada (pocas unidades) y asesoría de imagen personalizada gratis",
    chips: ["Edición limitada por colección", "Asesoría de imagen gratis por WhatsApp", "Envíos el mismo día con empaque de regalo"]
  }
};

const TECH_PRESETS: IndustryPlaceholdersMap = {
  industryLabel: "Tecnología, Software y Servicios Digitales",
  locationAge: {
    placeholder: "Ej. Emprendedores, CEOs y gerentes de LatAm de 25 a 50 años",
    chips: ["Fundadores y Gerentes 25 a 50 años", "Equipos de Marketing y Ventas", "Profesionales independientes y Freelancers"]
  },
  lifeEvent: {
    placeholder: "Ej. Necesidad de automatizar procesos, falta de control en ventas o aceleración del negocio",
    chips: ["Digitalización y automatización de procesos", "Crecimiento rápido de ventas", "Pérdida de tiempo en tareas manuales", "Cambio de sistema obsoleto"]
  },
  archetype: {
    placeholder: "Ej. Innovador, confiable, ágil, directo y orientado a resultados métricos",
    chips: ["Innovador y Tecnológico", "Confiable y Profesional", "Ágil y Orientado a Resultados", "Cercano y Educador"]
  },
  conversionChannel: {
    placeholder: "Ej. Agendamiento de Demo en vivo o WhatsApp directo con un especialista",
    chips: ["Agendamiento de Demo en Vivo", "WhatsApp directo de ventas B2B", "Prueba gratuita en plataforma web"]
  },
  informationGaps: {
    placeholder: "Ej. Facilidad de integración con sistemas actuales, precios de suscripción y soporte técnico",
    chips: ["Integración con herramientas actuales", "Precios y planes de suscripción", "Facilidad de uso y capacitación", "Seguridad de datos y soporte 24/7"]
  },
  socialProof: {
    placeholder: "Ej. Casos de éxito comprobados y empresas reconocidas que confían en nosotros",
    chips: [
      "Casos de éxito con resultados reales y métricas",
      "Empresas reconocidas que confían en el servicio",
      "Testimonios en video de gerentes o clientes",
      "Calificaciones y opiniones positivas en internet",
      "Mensajes de felicitación del equipo de soporte",
      "Certificaciones e hitos de calidad"
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Puesta en marcha en 24 horas con soporte en español 1 a 1 y garantía de satisfacción",
    chips: ["Implementación express en 24 horas", "Soporte dedicado en español por WhatsApp", "Plataforma todo-en-uno más intuitiva"]
  }
};

const SALUD_PRESETS: IndustryPlaceholdersMap = {
  industryLabel: "Salud, Estética y Bienestar",
  locationAge: {
    placeholder: "Ej. Personas de 25 a 55 años en la ciudad interesadas en salud integral y cuidado personal",
    chips: ["Hombres y Mujeres 25 a 55 años", "Deportistas y apasionados del fitness", "Madres y familias jóvenes"]
  },
  lifeEvent: {
    placeholder: "Ej. Dolores o molestias físicas, preparación previa a eventos, cambio de estilo de vida",
    chips: ["Prevención y molestias de salud", "Mejora de autoestima y estética", "Propósito de cambio de hábitos", "Recomendación médica/familiar"]
  },
  archetype: {
    placeholder: "Ej. Empático, profesional médico, riguroso, humano y relajante",
    chips: ["Empático y Humano", "Científico y Riguroso", "Exclusivo y Relajante", "Motivador y Enérgico"]
  },
  conversionChannel: {
    placeholder: "Ej. WhatsApp directo para agendar primera cita de evaluación diagnóstica",
    chips: ["Agendamiento rápido por WhatsApp", "Llamada a recepción central", "Formulario web de citas"]
  },
  informationGaps: {
    placeholder: "Ej. Si los tratamientos duelen, costo de la primera cita y experiencia de los profesionales",
    chips: ["Si el tratamiento genera dolor/reposo", "Precio de la primera evaluación", "Acreditación y experiencia médica", "Facilidades de pago por sesiones"]
  },
  socialProof: {
    placeholder: "Ej. Fotos de antes y después y testimonios reales de pacientes",
    chips: [
      "Fotos de cambios reales (antes y después)",
      "Testimonios en video de pacientes satisfechos",
      "Títulos, especializaciones y licencias médicas",
      "Reseñas y 5 estrellas en Google Maps",
      "Mensajes de agradecimiento por WhatsApp",
      "Años de experiencia atendiendo a miles de pacientes"
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Tecnología de punta sin dolor, atención puntual sin filas y seguimiento personalizado",
    chips: ["Tecnología de última generación indolora", "Atención puntual sin filas de espera", "Diagnóstico integral y seguimiento continuo"]
  }
};

const SERVICIOS_PRESETS: IndustryPlaceholdersMap = {
  industryLabel: "Servicios Profesionales, Educación y Bienes Raíces",
  locationAge: {
    placeholder: "Ej. Profesionales, emprendedores o inversionistas de 25 a 50 años",
    chips: ["Profesionales y Ejecutivos 25-45 años", "Emprendedores e Inversionistas", "Estudiantes y Jóvenes Universitarios"]
  },
  lifeEvent: {
    placeholder: "Ej. Deseo de ascender en el trabajo, lanzar un negocio propio o adquirir una propiedad",
    chips: ["Mejora profesional y ascenso", "Apertura de nuevo emprendimiento", "Inversión en bienes raíces / propiedad", "Resolución de problemas legales/contables"]
  },
  archetype: {
    placeholder: "Ej. Experto, mentor pedagógico, analítico, seguro y de alto prestigio",
    chips: ["Experto y Líder de Opinión", "Mentor Cercano y Práctico", "Analítico y Transparente", "Prestigioso y Exclusivo"]
  },
  conversionChannel: {
    placeholder: "Ej. WhatsApp directo para recibir la propuesta/dossier o agendar una llamada",
    chips: ["WhatsApp con un asesor especializado", "Descarga de dossier / temario web", "Reunión por Zoom / Presencial"]
  },
  informationGaps: {
    placeholder: "Ej. Precios de servicios, certificación u homologación, tiempos de entrega y metodología",
    chips: ["Certificación y validez oficial", "Precios y facilidades de pago", "Tiempos de ejecución / entrega", "Acompañamiento post-servicio"]
  },
  socialProof: {
    placeholder: "Ej. Testimonios de clientes satisfechos y casos de éxito reales",
    chips: [
      "Testimonios de clientes o alumnos satisfechos",
      "Casos de éxito reales con resultados comprobados",
      "Reseñas y 5 estrellas en Google o redes",
      "Mensajes de agradecimiento por WhatsApp o correo",
      "Certificados oficiales y convenios institucionales",
      "Proyectos ejecutados y empresas que nos recomiendan"
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Metodología 100% práctica enfocada en resultados inmediatos con garantía de calidad",
    chips: ["Metodología 100% práctica y aplicada", "Acompañamiento 1 a 1 personalizado", "Garantía total de satisfacción"]
  }
};

const GENERAL_PRESETS: IndustryPlaceholdersMap = {
  industryLabel: "Comercio y Servicios Generales",
  locationAge: {
    placeholder: "Ej. Clientes locales y nacionales de 20 a 50 años",
    chips: ["Público local de 20 a 50 años", "Clientes de la ciudad / zona", "Compradores online a nivel nacional"]
  },
  lifeEvent: {
    placeholder: "Ej. Solución rápida a un problema cotidiano, compras de temporada o necesidad puntual",
    chips: ["Necesidad inmediata / Solución rápida", "Compras de temporada o regalo", "Reemplazo de producto o servicio"]
  },
  archetype: {
    placeholder: "Ej. Cercano, servicial, transparente, eficiente y amigable",
    chips: ["Cercano y Servicial", "Eficiente y Práctico", "Moderno y Confiable", "Innovador y Directo"]
  },
  conversionChannel: {
    placeholder: "Ej. WhatsApp Business, mensajes directos en redes sociales o tienda física",
    chips: ["WhatsApp directo de atención", "Visita a tienda física / local", "Catálogo digital en web/redes"]
  },
  informationGaps: {
    placeholder: "Ej. Precios actualizados, formas de pago aceptadas (QR, tarjeta) y tiempos de entrega",
    chips: ["Precios y stock disponible", "Formas de pago (QR, transferencia, tarjeta)", "Ubicación exacta y horarios de atención"]
  },
  socialProof: {
    placeholder: "Ej. Calificaciones positivas de clientes en redes y fotos de entregas",
    chips: [
      "Fotos de entregas a clientes satisfechos",
      "Reseñas y 5 estrellas en Google o Facebook",
      "Mensajes de agradecimiento por WhatsApp",
      "Recomendaciones boca a boca de clientes habituales",
      "Publicaciones o fotos compartidas por compradores",
      "Años de atención y local físico abierto"
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Excelente relación calidad-precio y atención inmediata personalizada por WhatsApp",
    chips: ["Excelente relación precio-calidad", "Atención amable y sin demoras", "Garantía de satisfacción garantizada"]
  }
};

/**
 * Obtiene los datos sugeridos y placeholders dinámicos adaptados a la industria o descripción del negocio.
 */
export function getIndustryPlaceholders(
  industry?: string | null,
  description?: string | null,
  businessName?: string | null
): IndustryPlaceholdersMap {
  const textToSearch = `${industry || ""} ${description || ""} ${businessName || ""}`.toLowerCase();

  // 1. Gastronomía
  if (
    textToSearch.includes("gastro") ||
    textToSearch.includes("restauran") ||
    textToSearch.includes("comida") ||
    textToSearch.includes("café") ||
    textToSearch.includes("cafe") ||
    textToSearch.includes("panad") ||
    textToSearch.includes("reposter") ||
    textToSearch.includes("bar") ||
    textToSearch.includes("snack") ||
    textToSearch.includes("hamburgue") ||
    textToSearch.includes("pizza") ||
    textToSearch.includes("sushi") ||
    textToSearch.includes("alimento")
  ) {
    return GASTRO_PRESETS;
  }

  // 2. Moda y Belleza
  if (
    textToSearch.includes("moda") ||
    textToSearch.includes("ropa") ||
    textToSearch.includes("vestir") ||
    textToSearch.includes("boutique") ||
    textToSearch.includes("calzado") ||
    textToSearch.includes("zapat") ||
    textToSearch.includes("belleza") ||
    textToSearch.includes("cosmétic") ||
    textToSearch.includes("cosmetic") ||
    textToSearch.includes("peluquer") ||
    textToSearch.includes("estétic") ||
    textToSearch.includes("estetic") ||
    textToSearch.includes("joya") ||
    textToSearch.includes("accesorio")
  ) {
    return MODA_PRESETS;
  }

  // 3. Tecnología y SaaS
  if (
    textToSearch.includes("tecnolog") ||
    textToSearch.includes("software") ||
    textToSearch.includes("saas") ||
    textToSearch.includes("app") ||
    textToSearch.includes("digital") ||
    textToSearch.includes("marketing") ||
    textToSearch.includes("agencia") ||
    textToSearch.includes("web") ||
    textToSearch.includes("tienda online") ||
    textToSearch.includes("ecommerce") ||
    textToSearch.includes("sistem")
  ) {
    return TECH_PRESETS;
  }

  // 4. Salud y Fitness
  if (
    textToSearch.includes("salud") ||
    textToSearch.includes("clínic") ||
    textToSearch.includes("clinic") ||
    textToSearch.includes("médic") ||
    textToSearch.includes("medic") ||
    textToSearch.includes("dentis") ||
    textToSearch.includes("odontol") ||
    textToSearch.includes("fitness") ||
    textToSearch.includes("gimnas") ||
    textToSearch.includes("gym") ||
    textToSearch.includes("bienestar") ||
    textToSearch.includes("nutric") ||
    textToSearch.includes("terapia")
  ) {
    return SALUD_PRESETS;
  }

  // 5. Servicios Profesionales, Educación, Inmobiliaria
  if (
    textToSearch.includes("educa") ||
    textToSearch.includes("curso") ||
    textToSearch.includes("capacita") ||
    textToSearch.includes("academia") ||
    textToSearch.includes("inmobiliari") ||
    textToSearch.includes("propiedad") ||
    textToSearch.includes("bienes raíces") ||
    textToSearch.includes("consultor") ||
    textToSearch.includes("abogad") ||
    textToSearch.includes("contab") ||
    textToSearch.includes("asesor") ||
    textToSearch.includes("arquitect") ||
    textToSearch.includes("servicio")
  ) {
    return SERVICIOS_PRESETS;
  }

  // 6. General
  return GENERAL_PRESETS;
}
