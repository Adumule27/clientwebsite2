import { supabase } from "@/lib/supabase";

export type ImageSlot = {
  key: string;
  label: string;
  section: string;
};

export const IMAGE_SLOTS: ImageSlot[] = [
  // ── Hero slideshow ──
  { key: "hero-0", label: "Slide 1 — Fasil Ghebbi",       section: "Hero Slideshow" },
  { key: "hero-1", label: "Slide 2 — Axum Obelisks",      section: "Hero Slideshow" },
  { key: "hero-2", label: "Slide 3 — Omo Valley Tribes",  section: "Hero Slideshow" },
  { key: "hero-3", label: "Slide 4 — Anwar Mosque",       section: "Hero Slideshow" },
  { key: "hero-4", label: "Slide 5 — Historic Mosques",   section: "Hero Slideshow" },
  { key: "hero-5", label: "Slide 6 — Menelik Memorial",   section: "Hero Slideshow" },
  // ── Tour Destinations ("Where heritage comes alive") ──
  { key: "dest-0", label: "Fasil Ghebbi",                  section: "Tour Destinations" },
  { key: "dest-1", label: "Axum Obelisks",                 section: "Tour Destinations" },
  { key: "dest-2", label: "Royal Enclosure — Gondar",      section: "Tour Destinations" },
  { key: "dest-3", label: "Anwar Grand Mosque",            section: "Tour Destinations" },
  { key: "dest-4", label: "Historic Mosques",              section: "Tour Destinations" },
  { key: "dest-5", label: "Omo Valley Tribes",             section: "Tour Destinations" },
  // ── Explore / Discover / Experience panels ──
  { key: "panel-explore",     label: "Explore panel",     section: "Explore · Discover · Experience" },
  { key: "panel-discover",    label: "Discover panel",    section: "Explore · Discover · Experience" },
  { key: "panel-experience",  label: "Experience panel",  section: "Explore · Discover · Experience" },
  // ── Tour Package category cards ──
  { key: "cat-addis",      label: "Addis Ababa City Tours and Day Trips", section: "Tour Package Categories" },
  { key: "cat-historical", label: "Historical Tours",        section: "Tour Package Categories" },
  { key: "cat-cultural",   label: "Cultural Tours",          section: "Tour Package Categories" },
  { key: "cat-adventure",  label: "Adventure & Safari",      section: "Tour Package Categories" },
  { key: "cat-trekking",   label: "Trekking Tours",          section: "Tour Package Categories" },
  { key: "cat-combined",   label: "Combined Tours",          section: "Tour Package Categories" },
  { key: "cat-festival",   label: "Festival Tours",          section: "Tour Package Categories" },
  { key: "cat-coffee",     label: "Coffee Tours",            section: "Tour Package Categories" },
  // ── Events section ──
  { key: "events-bg", label: "Events section background", section: "Events" },
];

export const SECTIONS = [...new Set(IMAGE_SLOTS.map((s) => s.section))];

let cache: Record<string, string> = {};
let initPromise: Promise<void> | null = null;

export function initSiteImages(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const { data } = await supabase.from("site_images").select("key, url");
      if (data) {
        cache = {};
        for (const row of data) cache[row.key] = row.url;
      }
    } catch {}
  })();
  return initPromise;
}

export function getSiteImage(key: string): string | null {
  return cache[key] ?? null;
}

export async function setSiteImage(key: string, url: string): Promise<void> {
  cache[key] = url;
  initPromise = null; // force re-fetch on next visit so homepage picks up the change
  await supabase.from("site_images").upsert({ key, url });
}

export async function removeSiteImage(key: string): Promise<void> {
  delete cache[key];
  initPromise = null;
  await supabase.from("site_images").delete().eq("key", key);
}

export async function uploadSiteImage(
  key: string,
  file: File,
  supabaseClient: typeof supabase,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${key}-${Date.now()}.${ext}`;
  const { error } = await supabaseClient.storage
    .from("site-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabaseClient.storage.from("site-images").getPublicUrl(path);
  await setSiteImage(key, data.publicUrl);
  return data.publicUrl;
}
