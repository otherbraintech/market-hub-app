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
  businessHours: StrategicQuestionSuggestion;
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
    placeholder: "Ej. WhatsApp directo, Apps de Delivery, Canal Moderno, Canal Tradicional o Sitio Web",
    chips: [
      "WhatsApp directo",
      "Apps de Delivery (PedidosYa, Yango, etc.)",
      "Canal Moderno",
      "Canal Tradicional",
      "Sitio Web / Tienda Online"
    ]
  },
  informationGaps: {
    placeholder: "Ej. Zonas y costo de delivery, menú con precios, opciones vegetarianas/keto y reservas",
    chips: ["Tiempo y zonas de delivery", "Menú con precios actualizados", "Opciones vegetarianas o keto", "Reservas de mesas"]
  },
  socialProof: {
    placeholder: "Ej. \"La comida llegó caliente en <20 mins y el sabor es único\"",
    chips: [
      "\"La comida llegó caliente en <20 mins y el sabor es único\"",
      "\"Excelente atención, celebramos mi cumpleaños y nos regalaron postre\"",
      "\"Porciones súper generosas y la mejor relación precio-calidad\"",
      "\"El mejor delivery de la ciudad, recomendado 100%\"",
      "\"Calidad 5 estrellas, súper recomendado por todo mi grupo de trabajo\""
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Ingredientes 100% artesanales y frescos con delivery express calientito en <30 mins",
    chips: ["Delivery express en <30 mins", "Ingredientes 100% frescos y artesanales", "Receta secreta con porciones generosas"]
  },
  businessHours: {
    placeholder: "Ej. Lunes a Viernes de 11:30 a 23:00, Sábados y Domingos de 11:00 a 00:00",
    chips: [
      "Lunes a Viernes de 11:30 a 23:00",
      "Lunes a Sábado de 12:00 a 23:30",
      "Lunes a Domingo de 11:00 a 00:00 (Delivery continuo)",
      "Martes a Domingo de 18:00 a 01:00"
    ]
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
    placeholder: "Ej. WhatsApp directo, Apps de Delivery, Canal Moderno, Canal Tradicional o Tienda Online",
    chips: [
      "WhatsApp directo",
      "Apps de Delivery (PedidosYa, Yango, etc.)",
      "Canal Moderno",
      "Canal Tradicional",
      "Sitio Web / Tienda Online"
    ]
  },
  informationGaps: {
    placeholder: "Ej. Tabla de tallas exactas, material de la prenda, políticas de cambio y costo de envío",
    chips: ["Tabla de tallas y medidas exactas", "Políticas de cambio o devolución", "Costo y tiempo de envío nacional", "Fotos reales puestas"]
  },
  socialProof: {
    placeholder: "Ej. \"La calidad de la prenda es increíble y el calce perfecto\"",
    chips: [
      "\"La calidad de la prenda es increíble y el calce perfecto\"",
      "\"Llegó al día siguiente a mi casa y la atención por WhatsApp fue excelente\"",
      "\"Superó mis expectativas, la tela se siente de alta costura\"",
      "\"Mi boutique favorita, siempre tienen las últimas tendencias\"",
      "\"100% confiable, me asesoraron con la talla exacta\""
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Diseños de edición limitada (pocas unidades) y asesoría de imagen personalizada gratis",
    chips: ["Edición limitada por colección", "Asesoría de imagen gratis por WhatsApp", "Envíos el mismo día con empaque de regalo"]
  },
  businessHours: {
    placeholder: "Ej. Lunes a Sábado de 10:00 a 20:00 (Tienda física) / Atención 24/7 en WhatsApp",
    chips: [
      "Lunes a Sábado de 10:00 a 20:00",
      "Lunes a Viernes de 9:00 a 19:30, Sábados de 9:00 a 14:00",
      "Atención en línea 24/7 por WhatsApp / Tienda Web",
      "Martes a Domingo de 11:00 a 20:30"
    ]
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
    placeholder: "Ej. WhatsApp directo, Canal Moderno, Canal Tradicional o Plataforma Web",
    chips: [
      "WhatsApp directo",
      "Canal Moderno",
      "Canal Tradicional",
      "Sitio Web / Tienda Online"
    ]
  },
  informationGaps: {
    placeholder: "Ej. Facilidad de integración con sistemas actuales, precios de suscripción y soporte técnico",
    chips: ["Integración con herramientas actuales", "Precios y planes de suscripción", "Facilidad de uso y capacitación", "Seguridad de datos y soporte 24/7"]
  },
  socialProof: {
    placeholder: "Ej. \"Automatizamos nuestras ventas en 24h y ahorramos 15 horas a la semana\"",
    chips: [
      "\"Automatizamos nuestras ventas en 24h y ahorramos 15 horas a la semana\"",
      "\"El soporte por WhatsApp responde en minutos y resolvió toda nuestra integración\"",
      "\"Plataforma intuitiva que nos permitió duplicar nuestro flujo de leads\"",
      "\"Excelente plataforma, la mejor inversión del año para nuestra empresa\"",
      "\"Servicio 5 estrellas, la migración fue indolora y rápida\""
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Puesta en marcha en 24 horas con soporte en español 1 a 1 y garantía de satisfacción",
    chips: ["Implementación express en 24 horas", "Soporte dedicado en español por WhatsApp", "Plataforma todo-en-uno más intuitiva"]
  },
  businessHours: {
    placeholder: "Ej. Lunes a Viernes de 8:30 a 18:30 (Soporte 24/7 en plataforma)",
    chips: [
      "Lunes a Viernes de 8:30 a 18:30",
      "Lunes a Sábado de 9:00 a 18:00",
      "Soporte técnico 24/7 en línea",
      "Atención comercial Lunes a Viernes de 9:00 a 19:00"
    ]
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
    placeholder: "Ej. WhatsApp directo, Canal Moderno, Canal Tradicional o Formulario Web",
    chips: [
      "WhatsApp directo",
      "Canal Moderno",
      "Canal Tradicional",
      "Sitio Web / Tienda Online"
    ]
  },
  informationGaps: {
    placeholder: "Ej. Si los tratamientos duelen, costo de la primera cita y experiencia de los profesionales",
    chips: ["Si el tratamiento genera dolor/reposo", "Precio de la primera evaluación", "Acreditación y experiencia médica", "Facilidades de pago por sesiones"]
  },
  socialProof: {
    placeholder: "Ej. \"El tratamiento fue 100% indoloro y los resultados son visibles en la 1ra sesión\"",
    chips: [
      "\"El tratamiento fue 100% indoloro y los resultados son visibles en la 1ra sesión\"",
      "\"Atención impecable sin filas de espera, doctores muy humanos y profesionales\"",
      "\"Me explicaron todo el procedimiento con mucha paciencia, súper recomendado\"",
      "\"Excelente experiencia, recuperé mi confianza totalmente\"",
      "\"Instalaciones de primera y seguimiento médico personalizado\""
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Tecnología de punta sin dolor, atención puntual sin filas y seguimiento personalizado",
    chips: ["Tecnología de última generación indolora", "Atención puntual sin filas de espera", "Diagnóstico integral y seguimiento continuo"]
  },
  businessHours: {
    placeholder: "Ej. Lunes a Viernes de 8:00 a 20:00, Sábados de 8:00 a 13:00",
    chips: [
      "Lunes a Viernes de 8:00 a 20:00",
      "Lunes a Sábado de 8:30 a 19:00",
      "Atención previa cita Lunes a Viernes 9:00 a 18:00",
      "Emergencias / Consultas por WhatsApp 24/7"
    ]
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
    placeholder: "Ej. WhatsApp directo, Apps de Delivery, Canal Moderno, Canal Tradicional o Sitio Web",
    chips: [
      "WhatsApp directo",
      "Apps de Delivery (PedidosYa, Yango, etc.)",
      "Canal Moderno",
      "Canal Tradicional",
      "Sitio Web / Tienda Online"
    ]
  },
  informationGaps: {
    placeholder: "Ej. Precios de servicios, certificación u homologación, tiempos de entrega y metodología",
    chips: ["Certificación y validez oficial", "Precios y facilidades de pago", "Tiempos de ejecución / entrega", "Acompañamiento post-servicio"]
  },
  socialProof: {
    placeholder: "Ej. \"Superaron mis expectativas, resolviendo todo en tiempo récord\"",
    chips: [
      "\"Superaron mis expectativas, resolviendo todo en tiempo récord\"",
      "\"Atención 1 a 1 personalizada y muy transparente con los costos\"",
      "\"Excelente profesionalismo, los recomiendo a ojos cerrados\"",
      "\"Metodología práctica que me permitió conseguir mi objetivo de inmediato\"",
      "\"La mejor consultoría de la ciudad, profesionalismo total\""
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Metodología 100% práctica enfocada en resultados inmediatos con garantía de calidad",
    chips: ["Metodología 100% práctica y aplicada", "Acompañamiento 1 a 1 personalizado", "Garantía total de satisfacción"]
  },
  businessHours: {
    placeholder: "Ej. Lunes a Viernes de 8:30 a 18:30, Sábados de 9:00 a 13:00",
    chips: [
      "Lunes a Viernes de 8:30 a 18:30",
      "Lunes a Viernes de 9:00 a 18:00, Sábados de 9:00 a 13:00",
      "Atención previa cita Lunes a Viernes",
      "Soporte al cliente por WhatsApp de 8:00 a 20:00"
    ]
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
    placeholder: "Ej. WhatsApp directo, Apps de Delivery, Canal Moderno, Canal Tradicional o Tienda Web",
    chips: [
      "WhatsApp directo",
      "Apps de Delivery (PedidosYa, Yango, etc.)",
      "Canal Moderno",
      "Canal Tradicional",
      "Sitio Web / Tienda Online"
    ]
  },
  informationGaps: {
    placeholder: "Ej. Precios actualizados, formas de pago aceptadas (QR, tarjeta) y tiempos de entrega",
    chips: ["Precios y stock disponible", "Formas de pago (QR, transferencia, tarjeta)", "Ubicación exacta y horarios de atención"]
  },
  socialProof: {
    placeholder: "Ej. \"Producto de excelente calidad, llegó muy rápido a mi ciudad\"",
    chips: [
      "\"Producto de excelente calidad, llegó muy rápido a mi ciudad\"",
      "\"Atención rápida y amable por WhatsApp, 100% confiables\"",
      "\"Compré por recomendación y ahora soy cliente frecuente\"",
      "\"Súper recomendados, respuestas inmediatas y envío puntual\"",
      "\"Excelente relación precio-calidad, volveré a comprar\""
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. Excelente relación calidad-precio y atención inmediata personalizada por WhatsApp",
    chips: ["Excelente relación precio-calidad", "Atención amable y sin demoras", "Garantía de satisfacción garantizada"]
  },
  businessHours: {
    placeholder: "Ej. Lunes a Sábado de 8:30 a 19:30, Domingos de 9:00 a 13:00",
    chips: [
      "Lunes a Sábado de 8:30 a 19:30",
      "Lunes a Viernes de 9:00 a 18:30, Sábados de 9:00 a 13:30",
      "Atención continua Lunes a Domingo",
      "Pedidos por WhatsApp las 24 horas"
    ]
  }
};

const ERROR_PRESETS: IndustryPlaceholdersMap = {
  industryLabel: "Error al identificar rubro (Descripción o datos insuficientes)",
  locationAge: {
    placeholder: "Ej. Especifica el público objetivo y la ubicación principal de tu negocio",
    chips: ["Clientes de la ciudad local", "Público general 20 a 50 años", "Ejecutivos y Empresas B2B"]
  },
  lifeEvent: {
    placeholder: "Ej. Describe qué problema resuelve tu negocio o qué necesidad satisface",
    chips: ["Solución rápida a un problema", "Compra recurrente / Servicio habitual", "Regalos y eventos especiales"]
  },
  archetype: {
    placeholder: "Ej. Define la personalidad de tu marca (ej: Profesional, Cercana, Innovadora)",
    chips: ["Profesional y Confiable", "Cercana y Servicial", "Innovadora y Moderna", "Exclusiva y Premium"]
  },
  conversionChannel: {
    placeholder: "Ej. WhatsApp directo, Apps de Delivery, Canal Moderno, Canal Tradicional o Tienda Web",
    chips: [
      "WhatsApp directo",
      "Apps de Delivery (PedidosYa, Yango, etc.)",
      "Canal Moderno",
      "Canal Tradicional",
      "Sitio Web / Tienda Online"
    ]
  },
  informationGaps: {
    placeholder: "Ej. ¿Qué dudas o preguntas frecuentes suelen tener tus clientes antes de comprar?",
    chips: ["Precios y promociones", "Ubicación y horarios de atención", "Tiempos de entrega y envíos"]
  },
  socialProof: {
    placeholder: "Ej. \"Excelente servicio y atención personalizada 100% garantizada\"",
    chips: [
      "\"Excelente servicio y atención personalizada 100% garantizada\"",
      "\"Respuestas inmediatas y gran calidad en la atención\"",
      "\"Recomendados por su puntualidad y transparencia\"",
      "\"Muy satisfecho con la compra y el soporte brindado\""
    ]
  },
  differentialAdvantage: {
    placeholder: "Ej. ¿Cuál es el principal valor único o ventaja de tu negocio respecto a otros?",
    chips: ["Atención rápida e inmediata", "Excelente relación precio-calidad", "Garantía de servicio personalizado"]
  },
  businessHours: {
    placeholder: "Ej. Lunes a Viernes de 9:00 a 18:00, Sábados de 9:00 a 13:00",
    chips: [
      "Lunes a Viernes de 9:00 a 18:00",
      "Lunes a Sábado de 8:30 a 19:00",
      "Atención continua 24/7 por WhatsApp / Tienda Web"
    ]
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

  // 0. Si se especificó o detectó un error por datos aleatorios/insuficientes
  if (textToSearch.includes("error al identificar") || textToSearch.includes("insuficiente")) {
    return ERROR_PRESETS;
  }

  let matchedPreset = GENERAL_PRESETS;

  // 1. Gastronomía
  if (
    textToSearch.includes("gastro") ||
    textToSearch.includes("restauran") ||
    textToSearch.includes("comida") ||
    textToSearch.includes("café") ||
    textToSearch.includes("cafe") ||
    textToSearch.includes("panad") ||
    textToSearch.includes("reposter") ||
    textToSearch.includes("pasteler") ||
    textToSearch.includes("torta") ||
    textToSearch.includes("postre") ||
    textToSearch.includes("bar") ||
    textToSearch.includes("snack") ||
    textToSearch.includes("hamburgue") ||
    textToSearch.includes("pizza") ||
    textToSearch.includes("sushi") ||
    textToSearch.includes("alimento")
  ) {
    matchedPreset = GASTRO_PRESETS;
  } else if (
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
    matchedPreset = MODA_PRESETS;
  } else if (
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
    matchedPreset = TECH_PRESETS;
  } else if (
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
    matchedPreset = SALUD_PRESETS;
  } else if (
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
    matchedPreset = SERVICIOS_PRESETS;
  }

  // 2. Determinar la etiqueta exacta del rubro (dando prioridad al valor devuelto por la IA)
  let exactLabel = (industry && industry.trim().length > 0 && !industry.toLowerCase().includes("error"))
    ? industry.trim()
    : null;

  if (!exactLabel) {
    if (textToSearch.includes("pasteler") || textToSearch.includes("reposter") || textToSearch.includes("torta") || textToSearch.includes("postre")) {
      exactLabel = "Pastelería y Repostería";
    } else if (textToSearch.includes("panad") || textToSearch.includes("panificad")) {
      exactLabel = "Panadería y Repostería";
    } else if (textToSearch.includes("café") || textToSearch.includes("cafe")) {
      exactLabel = "Cafetería y Repostería";
    } else if (textToSearch.includes("hamburgue") || textToSearch.includes("pizza") || textToSearch.includes("sushi") || textToSearch.includes("restauran")) {
      exactLabel = "Restaurantes y Gastronomía";
    } else if (textToSearch.includes("odontol") || textToSearch.includes("dentis")) {
      exactLabel = "Odontología y Salud Dental";
    } else if (textToSearch.includes("boutique") || textToSearch.includes("ropa")) {
      exactLabel = "Moda y Boutiques";
    } else {
      exactLabel = matchedPreset.industryLabel;
    }
  }

  return {
    ...matchedPreset,
    industryLabel: exactLabel
  };
}
