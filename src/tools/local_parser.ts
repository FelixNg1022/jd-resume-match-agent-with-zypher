// src/tools/local_parser.ts
export function fallbackParseSkills(text: string): string[] {
  const lower = (text || "").toLowerCase();
  const candidates = [
    "java","python","c++","c","go","javascript","typescript","react","node","deno",
    "sql","postgres","mongodb","rust","docker","kubernetes","aws","gcp","azure",
    "ml","machine learning","nlp","graphql","rest","git","linux","ci/cd"
  ];
  const found = new Set<string>();
  for (const s of candidates) {
    if (lower.includes(s)) found.add(s);
  }
  return Array.from(found);
}
