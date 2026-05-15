// Toggle USE_FALLBACKS=true in .env.local to activate mock data for all external services.
// Flip this if Gemini rate-limits or Supabase flakes during the demo.
// TODO: fill in seeded data at 10am once theme and data shape are known.

export const USE_FALLBACKS = process.env.USE_FALLBACKS === "true";

export const FALLBACK_AI_RESPONSE = "";

export const FALLBACK_DATA: Record<string, unknown>[] = [];

export function withFallback<T>(live: T, fallback: T): T {
  return USE_FALLBACKS ? fallback : live;
}
