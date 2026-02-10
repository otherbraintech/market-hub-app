import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Separa acentos de letras (e.g. é -> e´)
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .trim()
    .replace(/\s+/g, "-") // Reemplaza espacios por -
    .replace(/[^\w-]+/g, "") // Remueve caracteres no alfanuméricos
    .replace(/--+/g, "-"); // Reemplaza múltiples - por uno solo
}
