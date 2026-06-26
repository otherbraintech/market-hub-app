/**
 * Sanitiza y normaliza una URL utilizando la API nativa URL de JavaScript/TypeScript.
 * 
 * Elimina todos los query parameters (search) y fragmentos (hash).
 * Remueve el slash final innecesario del path para mantener consistencia.
 * 
 * @param urlString La URL a sanitizar (ej. https://instagram.com/user/?hl=es)
 * @returns La URL sanitizada y consistente
 */
export function sanitizeSocialUrl(urlString: string): string {
  if (!urlString || typeof urlString !== "string") {
    return "";
  }

  let trimmed = urlString.trim();
  if (trimmed === "") {
    return "";
  }

  // Si no empieza con http:// o https://, lo agregamos para poder inicializar la API URL
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsedUrl = new URL(trimmed);
    
    // Limpiamos los query parameters y fragmentos
    parsedUrl.search = "";
    parsedUrl.hash = "";
    
    let sanitized = parsedUrl.toString();
    
    // Si la URL termina en "/" y no es la raíz del dominio, removemos el slash final
    // (Ej. https://instagram.com/user/ => https://instagram.com/user, pero https://instagram.com/ => https://instagram.com/)
    if (sanitized.endsWith("/") && parsedUrl.pathname !== "/") {
      sanitized = sanitized.slice(0, -1);
    }
    
    return sanitized;
  } catch (error) {
    // Si por alguna razón falla el parsing, devolvemos el string original limpiado
    return trimmed;
  }
}
