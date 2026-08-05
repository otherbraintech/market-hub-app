import { PrismaClient, CivicDateCategory } from "@prisma/client";

const prisma = new PrismaClient();

interface CivicDateSeed {
  name: string;
  date: string; // MM-DD
  fixedYear?: number;
  category: CivicDateCategory;
  region: string;
  description: string;
  importance: number; // 1-10
  hashtags: string[];
  industries?: string[];
}

const CIVIC_DATES: CivicDateSeed[] = [
  // ═══════════════════════════════════════
  // 🇧🇴 CÍVICAS / PATRIAS
  // ═══════════════════════════════════════
  {
    name: "Día del Estado Plurinacional de Bolivia",
    date: "01-22",
    category: "CIVICA",
    region: "BOLIVIA",
    description: "Conmemoración de la fundación del Estado Plurinacional de Bolivia.",
    importance: 8,
    hashtags: ["#EstadoPlurinacional", "#Bolivia", "#22DeEnero"],
  },
  {
    name: "Día del Mar",
    date: "03-23",
    category: "CIVICA",
    region: "BOLIVIA",
    description: "Reivindicación marítima boliviana. Se recuerda la pérdida del litoral en la Guerra del Pacífico.",
    importance: 7,
    hashtags: ["#DiaDelMar", "#MarParaBolivia", "#23DeMarzo"],
  },
  {
    name: "Día del Trabajo",
    date: "05-01",
    category: "CIVICA",
    region: "BOLIVIA",
    description: "Feriado nacional en honor a los trabajadores.",
    importance: 7,
    hashtags: ["#DiaDelTrabajo", "#1DeMayo", "#Bolivia"],
  },
  {
    name: "Día de la Reforma Agraria",
    date: "08-02",
    category: "CIVICA",
    region: "BOLIVIA",
    description: "Conmemoración de la Reforma Agraria de 1953.",
    importance: 5,
    hashtags: ["#ReformaAgraria", "#2DeAgosto"],
  },
  {
    name: "Día de la Independencia de Bolivia",
    date: "08-06",
    category: "CIVICA",
    region: "BOLIVIA",
    description: "Aniversario patrio de la República de Bolivia, fundada en 1825.",
    importance: 10,
    hashtags: ["#6DeAgosto", "#IndependenciaBolivia", "#VivaBolivia", "#FiestasPatrias"],
  },
  {
    name: "Día de la Bandera Boliviana",
    date: "08-17",
    category: "CIVICA",
    region: "BOLIVIA",
    description: "Homenaje a la bandera tricolor de Bolivia.",
    importance: 6,
    hashtags: ["#DiaDeLaBandera", "#BoliviaTricolor"],
  },
  {
    name: "Día de la Democracia",
    date: "10-10",
    category: "CIVICA",
    region: "BOLIVIA",
    description: "Se celebra el retorno a la democracia en Bolivia.",
    importance: 5,
    hashtags: ["#DemocraciaBolivia", "#10DeOctubre"],
  },

  // ═══════════════════════════════════════
  // 🎁 COMERCIALES
  // ═══════════════════════════════════════
  {
    name: "San Valentín / Día de los Enamorados",
    date: "02-14",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Día del amor y la amistad, fecha clave para comercio y gastronomía.",
    importance: 10,
    hashtags: ["#SanValentin", "#14DeFebrero", "#DiaDelAmor", "#DiaDeLosEnamorados"],
    industries: ["GASTRONOMIA", "RETAIL", "MODA", "JOYERIA", "FLORERIA", "REGALOS"],
  },
  {
    name: "Día de la Mujer Boliviana",
    date: "10-11",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Homenaje a la mujer boliviana. Día de reconocimiento y ofertas comerciales.",
    importance: 8,
    hashtags: ["#DiaDeLaMujerBoliviana", "#11DeOctubre", "#MujerBoliviana"],
    industries: ["MODA", "BELLEZA", "RETAIL", "FLORERIA"],
  },
  {
    name: "Día de la Madre (Bolivia)",
    date: "05-27",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Fecha comercial de altísimo impacto. Se celebra el 27 de mayo en honor a la Coronilla.",
    importance: 10,
    hashtags: ["#DiaDeLaMadre", "#27DeMayo", "#MamáBoliviana", "#FelizDiaMama"],
    industries: ["GASTRONOMIA", "RETAIL", "MODA", "FLORERIA", "REGALOS", "BELLEZA", "JOYERIA"],
  },
  {
    name: "Día del Padre (Bolivia)",
    date: "03-19",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Día de San José, se celebra el Día del Padre en Bolivia.",
    importance: 8,
    hashtags: ["#DiaDelPadre", "#19DeMarzo", "#PapáBoliviano"],
    industries: ["GASTRONOMIA", "RETAIL", "TECNOLOGIA", "REGALOS"],
  },
  {
    name: "Día del Niño (Bolivia)",
    date: "04-12",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Celebración dedicada a los niños y niñas de Bolivia.",
    importance: 8,
    hashtags: ["#DiaDelNiño", "#12DeAbril", "#NiñosBolivia"],
    industries: ["JUGUETERIA", "GASTRONOMIA", "ENTRETENIMIENTO", "RETAIL"],
  },
  {
    name: "Día de la Primavera y la Amistad",
    date: "09-21",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Día de la Juventud, la Primavera y la Amistad. Gran impacto comercial.",
    importance: 9,
    hashtags: ["#DiaDeLaPrimavera", "#21DeSeptiembre", "#DiaDelAmigo", "#Primavera"],
    industries: ["GASTRONOMIA", "RETAIL", "MODA", "FLORERIA", "ENTRETENIMIENTO"],
  },
  {
    name: "Black Friday",
    date: "11-28",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Viernes negro de ofertas y descuentos masivos. Fecha comercial global adoptada en Bolivia.",
    importance: 9,
    hashtags: ["#BlackFriday", "#Ofertas", "#Descuentos", "#BlackFridayBolivia"],
    industries: ["RETAIL", "TECNOLOGIA", "MODA", "ELECTRONICA"],
  },
  {
    name: "Cyber Monday",
    date: "12-01",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Lunes de ofertas online post Black Friday.",
    importance: 7,
    hashtags: ["#CyberMonday", "#OfertasOnline"],
    industries: ["RETAIL", "TECNOLOGIA", "ECOMMERCE"],
  },
  {
    name: "Día del Maestro (Bolivia)",
    date: "06-06",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Homenaje a los docentes bolivianos.",
    importance: 7,
    hashtags: ["#DiaDelMaestro", "#6DeJunio", "#GraciasProfe"],
    industries: ["GASTRONOMIA", "REGALOS", "FLORERIA"],
  },
  {
    name: "Día del Abuelo",
    date: "08-26",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Día de los abuelos y abuelas.",
    importance: 5,
    hashtags: ["#DiaDelAbuelo", "#26DeAgosto"],
    industries: ["GASTRONOMIA", "SALUD", "REGALOS"],
  },
  {
    name: "Día del Farmacéutico Boliviano",
    date: "06-18",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Reconocimiento al sector farmacéutico nacional.",
    importance: 4,
    hashtags: ["#DiaDelFarmaceutico"],
    industries: ["SALUD", "FARMACIA"],
  },
  {
    name: "Día del Contador",
    date: "05-17",
    category: "COMERCIAL",
    region: "BOLIVIA",
    description: "Celebración del profesional contable en Bolivia.",
    importance: 4,
    hashtags: ["#DiaDelContador", "#17DeMayo"],
    industries: ["SERVICIOS_PROFESIONALES", "CONTABILIDAD"],
  },

  // ═══════════════════════════════════════
  // ⛪ RELIGIOSAS
  // ═══════════════════════════════════════
  {
    name: "Carnaval (Lunes)",
    date: "02-16",
    fixedYear: 2026,
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Lunes de Carnaval. Fecha variable según calendario litúrgico.",
    importance: 9,
    hashtags: ["#CarnavalBolivia", "#Carnaval2026"],
  },
  {
    name: "Carnaval (Martes)",
    date: "02-17",
    fixedYear: 2026,
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Martes de Carnaval. Día de Ch'alla y celebraciones.",
    importance: 9,
    hashtags: ["#Carnaval", "#Challa", "#MartesDeCarnaval"],
  },
  {
    name: "Carnaval (Lunes)",
    date: "02-08",
    fixedYear: 2027,
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Lunes de Carnaval 2027.",
    importance: 9,
    hashtags: ["#CarnavalBolivia", "#Carnaval2027"],
  },
  {
    name: "Carnaval (Martes)",
    date: "02-09",
    fixedYear: 2027,
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Martes de Carnaval 2027.",
    importance: 9,
    hashtags: ["#Carnaval", "#Challa", "#Carnaval2027"],
  },
  {
    name: "Viernes Santo",
    date: "04-03",
    fixedYear: 2026,
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Feriado nacional de Semana Santa.",
    importance: 8,
    hashtags: ["#ViernesSanto", "#SemanaSanta", "#SemanaSanta2026"],
  },
  {
    name: "Viernes Santo",
    date: "03-26",
    fixedYear: 2027,
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Feriado nacional de Semana Santa 2027.",
    importance: 8,
    hashtags: ["#ViernesSanto", "#SemanaSanta2027"],
  },
  {
    name: "Corpus Christi",
    date: "06-04",
    fixedYear: 2026,
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Solemnidad del Cuerpo y la Sangre de Cristo. Feriado nacional.",
    importance: 6,
    hashtags: ["#CorpusChristi"],
  },
  {
    name: "Todos Santos / Día de los Difuntos",
    date: "11-02",
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Tradición boliviana de las mesas de Todos Santos, tantawawas y ofrendas a los difuntos.",
    importance: 8,
    hashtags: ["#TodosSantos", "#DiaDeLosDifuntos", "#Tantawawa", "#2DeNoviembre"],
  },
  {
    name: "Navidad",
    date: "12-25",
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Nochebuena y Navidad, temporada alta de comercio y gastronomía.",
    importance: 10,
    hashtags: ["#Navidad", "#FelizNavidad", "#25DeDiciembre", "#NavidadBoliviana"],
    industries: ["GASTRONOMIA", "RETAIL", "MODA", "REGALOS", "JUGUETERIA"],
  },
  {
    name: "Año Nuevo",
    date: "01-01",
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Inicio del nuevo año. Cierre de ciclo y nuevos comienzos.",
    importance: 9,
    hashtags: ["#AñoNuevo", "#FelizAñoNuevo", "#1DeEnero"],
  },
  {
    name: "Día de Reyes",
    date: "01-06",
    category: "RELIGIOSA",
    region: "BOLIVIA",
    description: "Epifanía del Señor. Tradición de la Rosca de Reyes.",
    importance: 5,
    hashtags: ["#DiaDeReyes", "#RoscaDeReyes"],
    industries: ["GASTRONOMIA", "PANADERIA"],
  },

  // ═══════════════════════════════════════
  // 🎭 CULTURALES
  // ═══════════════════════════════════════
  {
    name: "Entrada del Gran Poder",
    date: "06-07",
    fixedYear: 2026,
    category: "CULTURAL",
    region: "LA_PAZ",
    description: "La festividad folklórica más grande de La Paz con desfile de fraternidades.",
    importance: 8,
    hashtags: ["#GranPoder", "#GranPoder2026", "#LaPaz", "#FolkloreBoliviano"],
  },
  {
    name: "Fiesta de Urkupiña",
    date: "08-15",
    category: "CULTURAL",
    region: "COCHABAMBA",
    description: "Festividad religiosa y cultural en Quillacollo, Cochabamba. Peregrinación masiva.",
    importance: 8,
    hashtags: ["#Urkupiña", "#VirgenDeUrkupiña", "#Quillacollo", "#Cochabamba"],
  },
  {
    name: "Carnaval de Oruro (Entrada)",
    date: "02-14",
    fixedYear: 2026,
    category: "CULTURAL",
    region: "ORURO",
    description: "Obra Maestra del Patrimonio Oral e Intangible de la Humanidad (UNESCO).",
    importance: 9,
    hashtags: ["#CarnavalDeOruro", "#Oruro", "#Diablada", "#UNESCO"],
  },
  {
    name: "Alasita",
    date: "01-24",
    category: "CULTURAL",
    region: "LA_PAZ",
    description: "Feria de miniaturas en honor al Ekeko. Patrimonio Cultural Inmaterial de la Humanidad.",
    importance: 7,
    hashtags: ["#Alasita", "#Ekeko", "#LaPaz", "#Miniaturas"],
  },
  {
    name: "Año Nuevo Aymara (Willkakuti)",
    date: "06-21",
    category: "CULTURAL",
    region: "BOLIVIA",
    description: "Solsticio de invierno. Celebración del retorno del sol en Tiwanaku.",
    importance: 7,
    hashtags: ["#AñoNuevoAymara", "#Willkakuti", "#Tiwanaku", "#21DeJunio"],
  },
  {
    name: "Festival Internacional de la Cultura (Sucre)",
    date: "11-15",
    category: "CULTURAL",
    region: "CHUQUISACA",
    description: "Festival cultural anual en la capital constitucional de Bolivia.",
    importance: 5,
    hashtags: ["#FestivalCultura", "#Sucre"],
  },

  // ═══════════════════════════════════════
  // 📍 REGIONALES — SANTA CRUZ
  // ═══════════════════════════════════════
  {
    name: "Aniversario de Santa Cruz de la Sierra",
    date: "02-26",
    category: "REGIONAL",
    region: "SANTA_CRUZ",
    description: "Fundación de Santa Cruz de la Sierra por Ñuflo de Chaves en 1561.",
    importance: 9,
    hashtags: ["#AniversarioSantaCruz", "#26DeFebrero", "#SantaCruz", "#465Años"],
  },
  {
    name: "Efeméride Departamental de Santa Cruz",
    date: "09-24",
    category: "REGIONAL",
    region: "SANTA_CRUZ",
    description: "Grito libertario del 24 de septiembre de 1810. Máxima festividad cruceña.",
    importance: 10,
    hashtags: ["#24DeSeptiembre", "#SantaCruz", "#EfemerideCruceña", "#GritoLibertario", "#VivaSantaCruz"],
  },
  {
    name: "Feria Exposición de Santa Cruz (EXPOCRUZ)",
    date: "09-19",
    category: "REGIONAL",
    region: "SANTA_CRUZ",
    description: "La feria multisectorial más grande de Bolivia. Vitrina de negocios y comercio.",
    importance: 9,
    hashtags: ["#Expocruz", "#Expocruz2026", "#FeriaExposicion", "#SantaCruz"],
    industries: ["RETAIL", "TECNOLOGIA", "AGROINDUSTRIA", "GASTRONOMIA", "AUTOMOTRIZ"],
  },
  {
    name: "Carnaval Cruceño (Corso)",
    date: "02-14",
    fixedYear: 2026,
    category: "REGIONAL",
    region: "SANTA_CRUZ",
    description: "Corso carnavalero cruceño con comparsas, carros alegóricos y reinas.",
    importance: 9,
    hashtags: ["#CarnavalCruceño", "#Corso", "#SantaCruz", "#Carnaval2026"],
  },
  {
    name: "Día de la Tradición Cruceña",
    date: "10-04",
    category: "REGIONAL",
    region: "SANTA_CRUZ",
    description: "Celebración de las costumbres, gastronomía y cultura cruceña.",
    importance: 7,
    hashtags: ["#TradicionCruceña", "#CulturaCamba", "#SantaCruz"],
    industries: ["GASTRONOMIA", "CULTURA"],
  },
  {
    name: "Feria del Libro de Santa Cruz",
    date: "06-01",
    category: "REGIONAL",
    region: "SANTA_CRUZ",
    description: "Feria Internacional del Libro de Santa Cruz.",
    importance: 6,
    hashtags: ["#FeriaDelLibro", "#SantaCruz", "#Lectura"],
    industries: ["EDUCACION", "EDITORIAL", "CULTURA"],
  },
  {
    name: "Día del Cruceño",
    date: "09-24",
    category: "REGIONAL",
    region: "SANTA_CRUZ",
    description: "Sinónimo de la Efeméride; se celebra la identidad y orgullo cruceño.",
    importance: 10,
    hashtags: ["#DiaDelCruceño", "#OrgulloCamba"],
  },
  {
    name: "Virgen de Cotoca",
    date: "12-08",
    category: "REGIONAL",
    region: "SANTA_CRUZ",
    description: "Peregrinación masiva a Cotoca en honor a la Virgen de la Inmaculada Concepción.",
    importance: 8,
    hashtags: ["#VirgenDeCotoca", "#Cotoca", "#8DeDiciembre", "#SantaCruz"],
  },

  // ═══════════════════════════════════════
  // 📍 REGIONALES — OTROS DEPARTAMENTOS
  // ═══════════════════════════════════════
  {
    name: "Efeméride de La Paz",
    date: "07-16",
    category: "REGIONAL",
    region: "LA_PAZ",
    description: "Revolución del 16 de julio de 1809 en La Paz.",
    importance: 7,
    hashtags: ["#16DeJulio", "#LaPaz", "#EfemeridePaceña"],
  },
  {
    name: "Efeméride de Cochabamba",
    date: "09-14",
    category: "REGIONAL",
    region: "COCHABAMBA",
    description: "Revolución del 14 de septiembre de 1810 en Cochabamba.",
    importance: 7,
    hashtags: ["#14DeSeptiembre", "#Cochabamba"],
  },
  {
    name: "Efeméride de Sucre (Chuquisaca)",
    date: "05-25",
    category: "REGIONAL",
    region: "CHUQUISACA",
    description: "Primer grito libertario de América, 25 de mayo de 1809.",
    importance: 8,
    hashtags: ["#25DeMayo", "#PrimerGrito", "#Sucre"],
  },
  {
    name: "Efeméride de Potosí",
    date: "11-10",
    category: "REGIONAL",
    region: "POTOSI",
    description: "Revolución del 10 de noviembre de 1810 en Potosí.",
    importance: 6,
    hashtags: ["#10DeNoviembre", "#Potosi"],
  },
  {
    name: "Efeméride de Oruro",
    date: "02-10",
    category: "REGIONAL",
    region: "ORURO",
    description: "Revolución del 10 de febrero de 1781 en Oruro.",
    importance: 6,
    hashtags: ["#10DeFebrero", "#Oruro"],
  },
  {
    name: "Efeméride de Tarija",
    date: "04-15",
    category: "REGIONAL",
    region: "TARIJA",
    description: "Batalla de la Tablada del 15 de abril de 1817.",
    importance: 6,
    hashtags: ["#15DeAbril", "#Tarija"],
  },
  {
    name: "Efeméride de Beni",
    date: "11-18",
    category: "REGIONAL",
    region: "BENI",
    description: "Creación del departamento del Beni el 18 de noviembre de 1842.",
    importance: 5,
    hashtags: ["#18DeNoviembre", "#Beni", "#Trinidad"],
  },
  {
    name: "Efeméride de Pando",
    date: "09-24",
    category: "REGIONAL",
    region: "PANDO",
    description: "Creación del departamento de Pando.",
    importance: 5,
    hashtags: ["#Pando", "#Cobija"],
  },

  // ═══════════════════════════════════════
  // 🌍 INTERNACIONALES
  // ═══════════════════════════════════════
  {
    name: "Día Internacional de la Mujer",
    date: "03-08",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Día mundial de los derechos de la mujer y la igualdad de género.",
    importance: 9,
    hashtags: ["#8M", "#DiaInternacionalDeLaMujer", "#8DeMarzo", "#MujeresQueInspiran"],
    industries: ["MODA", "BELLEZA", "RETAIL"],
  },
  {
    name: "Día de la Tierra",
    date: "04-22",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Conciencia ambiental y cuidado del planeta.",
    importance: 6,
    hashtags: ["#DiaDeLaTierra", "#MedioAmbiente", "#22DeAbril"],
  },
  {
    name: "Día del Medio Ambiente",
    date: "06-05",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Día mundial del medio ambiente, promovido por la ONU.",
    importance: 6,
    hashtags: ["#DiaMundialDelMedioAmbiente", "#5DeJunio"],
  },
  {
    name: "Día del Emprendedor",
    date: "04-16",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Celebración global del espíritu emprendedor.",
    importance: 7,
    hashtags: ["#DiaDelEmprendedor", "#Emprendimiento", "#Startup"],
    industries: ["STARTUP", "TECNOLOGIA", "SERVICIOS_PROFESIONALES"],
  },
  {
    name: "Día Mundial de las Redes Sociales",
    date: "06-30",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Celebración del impacto de las redes sociales en la comunicación.",
    importance: 7,
    hashtags: ["#DiaRedesSociales", "#SocialMedia", "#MarketingDigital"],
    industries: ["MARKETING", "TECNOLOGIA", "COMUNICACION"],
  },
  {
    name: "Día Mundial del Marketing",
    date: "05-16",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Celebración del marketing como motor de negocios y economía.",
    importance: 7,
    hashtags: ["#DiaMundialDelMarketing", "#Marketing", "#16DeMayo"],
    industries: ["MARKETING", "PUBLICIDAD"],
  },
  {
    name: "Halloween / Noche de Brujas",
    date: "10-31",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Festividad adoptada globalmente. Temáticas de terror y disfraces.",
    importance: 7,
    hashtags: ["#Halloween", "#NocheDeBrujas", "#31DeOctubre"],
    industries: ["GASTRONOMIA", "ENTRETENIMIENTO", "MODA"],
  },
  {
    name: "Día de la Alimentación",
    date: "10-16",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Conciencia sobre la seguridad alimentaria mundial.",
    importance: 5,
    hashtags: ["#DiaDeLaAlimentacion", "#16DeOctubre"],
    industries: ["GASTRONOMIA", "AGROINDUSTRIA", "SALUD"],
  },
  {
    name: "Día del Internet",
    date: "05-17",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Celebración de las telecomunicaciones y el internet.",
    importance: 6,
    hashtags: ["#DiaDelInternet", "#17DeMayo"],
    industries: ["TECNOLOGIA", "TELECOMUNICACIONES"],
  },
  {
    name: "Nochevieja / Fin de Año",
    date: "12-31",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Cierre de año. Temporada alta de eventos, gastronomía y festejos.",
    importance: 9,
    hashtags: ["#FinDeAño", "#Nochevieja", "#31DeDiciembre", "#Despedida"],
    industries: ["GASTRONOMIA", "EVENTOS", "ENTRETENIMIENTO", "RETAIL"],
  },
  {
    name: "Día del Nutricionista",
    date: "08-11",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Reconocimiento a los profesionales de la nutrición.",
    importance: 4,
    hashtags: ["#DiaDelNutricionista"],
    industries: ["SALUD", "GASTRONOMIA"],
  },
  {
    name: "Día de la Fotografía",
    date: "08-19",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Celebración mundial de la fotografía como arte y comunicación.",
    importance: 5,
    hashtags: ["#DiaDeLaFotografia", "#19DeAgosto"],
    industries: ["FOTOGRAFIA", "MARKETING", "ARTE"],
  },
  {
    name: "Día del Programador",
    date: "09-12",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Homenaje a los desarrolladores de software (día 256 del año).",
    importance: 5,
    hashtags: ["#DiaDelProgramador", "#Developers"],
    industries: ["TECNOLOGIA", "SOFTWARE"],
  },
  {
    name: "Día del Café",
    date: "10-01",
    category: "INTERNACIONAL",
    region: "BOLIVIA",
    description: "Celebración mundial del café y su industria.",
    importance: 6,
    hashtags: ["#DiaDelCafe", "#Coffee", "#1DeOctubre"],
    industries: ["GASTRONOMIA", "CAFETERIA"],
  },
];

async function seedCivicDates() {
  console.log("🇧🇴 Seeding civic dates for Bolivia & Santa Cruz...\n");

  let created = 0;
  let skipped = 0;

  for (const civicDate of CIVIC_DATES) {
    // Check if already exists (same name + date + fixedYear)
    const existing = await prisma.civicDate.findFirst({
      where: {
        name: civicDate.name,
        date: civicDate.date,
        fixedYear: civicDate.fixedYear ?? null,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.civicDate.create({
      data: {
        name: civicDate.name,
        date: civicDate.date,
        fixedYear: civicDate.fixedYear ?? null,
        category: civicDate.category,
        region: civicDate.region,
        description: civicDate.description,
        importance: civicDate.importance,
        hashtags: civicDate.hashtags,
        industries: civicDate.industries ?? undefined,
        isActive: true,
      },
    });
    created++;
  }

  console.log(`✅ Seed complete: ${created} created, ${skipped} skipped (already exist)`);
  console.log(`📊 Total civic dates in DB: ${await prisma.civicDate.count()}`);
}

seedCivicDates()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
