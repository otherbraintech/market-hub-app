export interface SystemHoliday {
  month: number; // 1-indexed (1-12)
  day: number;
  name: string;
  emoji: string;
  country?: string;
  category: "PATRIA" | "SOCIAL" | "GLOBAL" | "DEPARTAMENTAL";
}

export const SYSTEM_HOLIDAYS: SystemHoliday[] = [
  { month: 1, day: 1, name: "Año Nuevo", emoji: "🎆", category: "GLOBAL" },
  { month: 1, day: 22, name: "Día del Estado Plurinacional", emoji: "🇧🇴", country: "BO", category: "PATRIA" },
  { month: 2, day: 2, name: "Virgen de Candelaria", emoji: "🕯️", category: "SOCIAL" },
  { month: 2, day: 14, name: "San Valentín / Día del Amor", emoji: "💖", category: "GLOBAL" },
  { month: 2, day: 27, name: "Carnaval", emoji: "🎭", category: "SOCIAL" },
  { month: 3, day: 8, name: "Día Internacional de la Mujer", emoji: "👩", category: "GLOBAL" },
  { month: 3, day: 19, name: "Día del Padre y del Artesano", emoji: "👨", country: "BO", category: "SOCIAL" },
  { month: 3, day: 23, name: "Día del Mar", emoji: "⚓", country: "BO", category: "PATRIA" },
  { month: 4, day: 12, name: "Día del Niño", emoji: "👧", country: "BO", category: "SOCIAL" },
  { month: 4, day: 18, name: "Semana Santa / Viernes Santo", emoji: "✝️", category: "GLOBAL" },
  { month: 5, day: 1, name: "Día del Trabajo", emoji: "👷", category: "GLOBAL" },
  { month: 5, day: 27, name: "Día de la Madre", emoji: "💐", country: "BO", category: "PATRIA" },
  { month: 6, day: 21, name: "Año Nuevo Andino Amazónico", emoji: "🌞", country: "BO", category: "PATRIA" },
  { month: 6, day: 24, name: "Noche de San Juan", emoji: "🔥", category: "SOCIAL" },
  { month: 7, day: 16, name: "Efeméride de La Paz", emoji: "🏙️", country: "BO", category: "DEPARTAMENTAL" },
  { month: 7, day: 23, name: "Día de la Amistad", emoji: "🤝", category: "GLOBAL" },
  { month: 8, day: 6, name: "Día de la Patria / Independencia de Bolivia", emoji: "🇧🇴", country: "BO", category: "PATRIA" },
  { month: 8, day: 17, name: "Día de la Bandera", emoji: "🚩", country: "BO", category: "PATRIA" },
  { month: 9, day: 14, name: "Efeméride de Cochabamba", emoji: "🏔️", country: "BO", category: "DEPARTAMENTAL" },
  { month: 9, day: 21, name: "Día de la Primavera y la Juventud", emoji: "🌸", category: "SOCIAL" },
  { month: 9, day: 24, name: "Efeméride de Santa Cruz", emoji: "🌴", country: "BO", category: "DEPARTAMENTAL" },
  { month: 10, day: 11, name: "Día de la Mujer Boliviana", emoji: "👩‍🦱", country: "BO", category: "PATRIA" },
  { month: 10, day: 31, name: "Halloween / Noche de Brujas", emoji: "🎃", category: "GLOBAL" },
  { month: 11, day: 2, name: "Todos Santos / Día de los Difuntos", emoji: "🕯️", category: "SOCIAL" },
  { month: 11, day: 18, name: "Efeméride de Beni", emoji: "🌳", country: "BO", category: "DEPARTAMENTAL" },
  { month: 12, day: 24, name: "Nochebuena", emoji: "🎄", category: "GLOBAL" },
  { month: 12, day: 25, name: "Navidad", emoji: "🎁", category: "GLOBAL" },
  { month: 12, day: 31, name: "Fin de Año", emoji: "🍾", category: "GLOBAL" }
];

export function getSystemHolidayForDate(date: Date): SystemHoliday | undefined {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return SYSTEM_HOLIDAYS.find(h => h.month === m && h.day === d);
}

export function getSystemHolidaysForMonth(year: number, monthZeroIndexed: number): (SystemHoliday & { dateStr: string })[] {
  const m = monthZeroIndexed + 1;
  return SYSTEM_HOLIDAYS.filter(h => h.month === m).map(h => {
    const dateObj = new Date(year, monthZeroIndexed, h.day, 10, 0, 0);
    const dateStr = dateObj.toISOString().split('T')[0];
    return {
      ...h,
      dateStr
    };
  });
}
