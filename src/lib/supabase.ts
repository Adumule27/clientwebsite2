import { createClient } from "@supabase/supabase-js";

// Retrieve URL and Key from Vite build-time environment or runtime Node environment
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined"
    ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    : undefined) ||
  "https://bbdzywucatlypfisyymi.supabase.co";

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== "undefined"
    ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY
    : undefined) ||
  "sb_publishable_kNh0v5x9bkaIOA_sZ3GdwQ_Bydmi9R-";

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "[supabase] Warning: Missing Supabase credentials. Database sync will fall back to local storage."
  );
}

// Fallback placeholder credentials to prevent createClient from crashing if unconfigured
const resolvedUrl = supabaseUrl || "https://placeholder.supabase.co";
const resolvedKey = supabasePublishableKey || "placeholder-anon-key";

export const supabase = createClient(resolvedUrl, resolvedKey);
