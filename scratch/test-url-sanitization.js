function sanitizeSocialUrl(urlString) {
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
    if (sanitized.endsWith("/") && parsedUrl.pathname !== "/") {
      sanitized = sanitized.slice(0, -1);
    }
    
    return sanitized;
  } catch (error) {
    return trimmed;
  }
}

const testCases = [
  {
    input: "https://www.facebook.com/TartinaBolivia?locale=es_LA",
    expected: "https://www.facebook.com/TartinaBolivia",
  },
  {
    input: "https://www.instagram.com/tartina.bo/?hl=es",
    expected: "https://www.instagram.com/tartina.bo",
  },
  {
    input: "https://www.instagram.com/tartina.bo/?utm_source=ig_web_copy_link",
    expected: "https://www.instagram.com/tartina.bo",
  },
  {
    input: "https://www.youtube.com/@example?si=abc123",
    expected: "https://www.youtube.com/@example",
  },
  {
    input: "facebook.com/my-page/?ref=bookmarks",
    expected: "https://facebook.com/my-page",
  },
  {
    input: "https://instagram.com/",
    expected: "https://instagram.com/",
  }
];

let failed = false;
console.log("Running URL sanitization tests...");
for (const tc of testCases) {
  const result = sanitizeSocialUrl(tc.input);
  if (result !== tc.expected) {
    console.error(`FAIL: Input: "${tc.input}" | Expected: "${tc.expected}" | Got: "${result}"`);
    failed = true;
  } else {
    console.log(`PASS: "${tc.input}" => "${result}"`);
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log("All tests passed successfully!");
}
