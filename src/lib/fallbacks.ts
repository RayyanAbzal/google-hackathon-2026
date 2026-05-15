// Toggle USE_FALLBACKS=true in .env.local to use mock data for all external services.
// Flip this if Gemini rate-limits or Supabase flakes during the demo.

export const USE_FALLBACKS = process.env.USE_FALLBACKS === "true";

// Replace these stubs with real seeded data once the theme is known.

export const FALLBACK_AI_RESPONSE = "This is a mock AI response for demo purposes.";

export const FALLBACK_DATA: Record<string, unknown>[] = [
  { id: "1", label: "Mock item 1" },
  { id: "2", label: "Mock item 2" },
  { id: "3", label: "Mock item 3" },
];

export function withFallback<T>(live: T, fallback: T): T {
  return USE_FALLBACKS ? fallback : live;
}
