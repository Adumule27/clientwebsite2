import { supabase } from "@/lib/supabase";

let cache: Record<string, string> = {};
let initPromise: Promise<void> | null = null;

export function initSiteContent(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const { data } = await supabase.from("site_content").select("key, value");
      if (data) {
        cache = {};
        for (const row of data) cache[row.key] = row.value;
      }
    } catch {}
  })();
  return initPromise;
}

export function getContent(key: string): string | null {
  return cache[key] ?? null;
}

export function getContentOr(key: string, defaultValue: string): string {
  return cache[key] ?? defaultValue;
}

export async function setContent(key: string, value: string): Promise<void> {
  if (value.trim()) {
    cache[key] = value.trim();
    initPromise = null;
    await supabase.from("site_content").upsert({ key, value: value.trim() });
  } else {
    delete cache[key];
    initPromise = null;
    await supabase.from("site_content").delete().eq("key", key);
  }
}

export async function removeContent(key: string): Promise<void> {
  delete cache[key];
  initPromise = null;
  await supabase.from("site_content").delete().eq("key", key);
}

export function getAllContent(): Record<string, string> {
  return { ...cache };
}
