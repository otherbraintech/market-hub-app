import { sanitizeSocialUrl } from "../src/lib/url";

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
    expected: "https://instagram.com/", // root slash should be kept
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
