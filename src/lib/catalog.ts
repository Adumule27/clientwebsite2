import { supabase } from "@/lib/supabase";

export type CatalogItem = {
  id: string;
  title: string;
  category: string;
  location?: string;
  duration?: string;
  summary: string;
  description: string;
  icon: string;
  featured: boolean;
  tags: string[];
  image?: string;
  // Overview image or hero image for the package
  overview?: string;
  // Rich itinerary (HTML or plaintext)
  itinerary?: string;
  // What's included — newline-separated or JSON array
  included?: string[];
  // What's excluded — newline-separated or JSON array
  excluded?: string[];
  // Gallery images (data URLs or hosted URLs)
  gallery?: string[];
};

export const catalogPackagesByCategory = {
  "Addis Ababa City Tours and Day Trips": [
    "Addis Ababa City Tours and Day Trips",
    "Addis Ababa Food Tasting Tour",
    "Addis Ababa Nightlife Tour and Pub Crawl",
  ],
  "Historical Tours": [
    "2 Days Lalibela Tour",
    "6 Days / 5 Nights - Danakil Depression and Lalibela Highlights Tour",
    "Day Trip Tiya and Adadi Mariam Church",
  ],
  "Cultural Tours": [
    "3 Days Guided Group Tour of South Omo, Ethiopia",
    "Omo Valley Ethiopia Tribes (Tour 11 Days)",
    "4-Day Omo Valley Cultural Tour from Addis Ababa",
    "8 Days Cultural Tour to Omo Valley Tribes",
  ],
  "Adventure and Safari Tour": [
    "3 Days Danakil Depression Tour",
    "3 Days Erta Ale Volcano and Danakil Depression Tour - Dallol, Salt Flats and Lava Lake",
  ],
  "Trekking Tours": [
    "3 Days Bale Mountains Tour from Addis Ababa",
    "5 Days Awash National Park and Harar Tour",
    "3-Day Tigray Trekking and Community-Based Tour",
    "9 Days Trekking in the Simien Mountains National Park Tour",
    "8 Days Bale Mountain Trekking Tour",
    "4 Days Chebera-Churchura National Park Wildlife Safari (4-Day Wildlife and Nature Experience Itinerary)",
  ],
  "Combined Tours": [
    "7-Day Adventure: Danakil Depression and Gheralta Churches",
    "14 Days Ethiopia Tour - Danakil Depression, Lalibela and Omo Valley Cultural Experience",
    "15 Days Historical, Cultural and Omo Valley Tour",
    "16 Days Ethiopia Grand Cultural, Wildlife and Community Experience Tour",
  ],
  "Festival Tours": [
    "8 Day Ethiopian Christmas (Genna) Tour",
    "8 Day Epiphany (Timket) Tour",
    "7 Day The Finding of the True Cross (Meskel Tour)",
  ],
  "Coffee Tour": [
    "Delve into Ethiopian Coffee Heritage and Urban Culture in a Single Day",
    "3-Day Yirgalem Coffee Tour",
    "6-Day Sidama and Yirgacheffe Coffee and Culture Tour from Addis Ababa",
  ],
  
} as const;

export const catalogCategories = Object.keys(catalogPackagesByCategory);

export function getCatalogPackagesForCategory(category: string): string[] {
  return [...(catalogPackagesByCategory[category as keyof typeof catalogPackagesByCategory] ?? [])];
}

function categoryToLocation(category: string) {
  if (category.includes("Addis Ababa") || category === "Coffee Tour") {
    return "Addis Ababa";
  }

  if (category.includes("Historical")) {
    return "Northern Ethiopia";
  }

  if (category.includes("Cultural")) {
    return "Southern Ethiopia";
  }

  if (category.includes("Adventure") || category.includes("Trekking") || category.includes("Combined")) {
    return "Ethiopia";
  }

  if (category.includes("Festival")) {
    return "Nationwide";
  }

  return "Ethiopia";
}

function packageToDuration(packageName: string) {
  const exactDayMatch = packageName.match(/(\d+)\s*[- ]?\s*days?/i);

  if (exactDayMatch) {
    return `${exactDayMatch[1]} days`;
  }

  if (packageName.toLowerCase().includes("single day") || packageName.toLowerCase().includes("day trip")) {
    return "Full day";
  }

  return "Custom";
}

export const catalogSeedItems: CatalogItem[] = [
  ...catalogCategories.flatMap((category) => {
    const packages = getCatalogPackagesForCategory(category);

    return packages.map((packageName, index) => ({
      id: `${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
      title: packageName,
      category,
      location: categoryToLocation(category),
      duration: packageToDuration(packageName),
      summary: `Package itinerary for ${packageName}.`,
      description: `${packageName} is available as a guided package and can be edited from the admin catalog.`,
      icon: "🧭",
      featured: index === 0,
      tags: ["Package", "Ethiopia Tour"],
      overview: undefined,
      itinerary: "",
      included: [],
      gallery: [],
    }));
  }),
];

const TABLE_NAME = "catalog_items";

function normalizeCatalogItem(item: Record<string, unknown>): CatalogItem {
  const fallbackCategory = catalogCategories[0] ?? "Cultural Tours";

  return {
    id: String(item.id ?? crypto.randomUUID()),
    title: String(item.title ?? "Untitled catalog item"),
    category: String(item.category ?? fallbackCategory),
    location: item.location !== undefined && item.location !== null ? String(item.location) : "",
    duration: item.duration !== undefined && item.duration !== null ? String(item.duration) : "",
    summary: String(item.summary ?? ""),
    description: String(item.description ?? ""),
    icon: String(item.icon ?? "✨"),
    featured: Boolean(item.featured),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)).filter(Boolean) : [],
    image: typeof item.image === "string" && item.image ? String(item.image) : undefined,
    overview: typeof item.overview === "string" && item.overview ? String(item.overview) : undefined,
    itinerary: typeof item.itinerary === "string" ? String(item.itinerary) : "",
    included: Array.isArray(item.included) ? item.included.map((i) => String(i)) : (typeof item.included === "string" && item.included ? String(item.included).split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []),
    excluded: Array.isArray(item.excluded) ? item.excluded.map((i) => String(i)) : (typeof item.excluded === "string" && item.excluded ? String(item.excluded).split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []),
    gallery: Array.isArray(item.gallery) ? item.gallery.map((g) => String(g)) : [],
  };
}

export async function getCatalogItems(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("featured", { ascending: false });

  if (error) return [];
  return (data ?? []).map((item) => normalizeCatalogItem(item as Record<string, unknown>));
}

export async function getCategoryImage(category: string): Promise<string | undefined> {
  const { data } = await supabase
    .from("catalog_category_images")
    .select("image_url")
    .eq("category", category)
    .single();
  return data?.image_url ?? undefined;
}

export async function saveCategoryImage(category: string, url: string): Promise<void> {
  await supabase
    .from("catalog_category_images")
    .upsert({ category, image_url: url });
}

export async function getPackageImage(category: string, packageName: string): Promise<string | undefined> {
  const { data } = await supabase
    .from("catalog_package_images")
    .select("image_url")
    .eq("category", category)
    .eq("package_name", packageName)
    .single();
  return data?.image_url ?? undefined;
}

export async function savePackageImage(category: string, packageName: string, url: string): Promise<void> {
  await supabase
    .from("catalog_package_images")
    .upsert({ category, package_name: packageName, image_url: url });
}

export async function saveCatalogItem(item: CatalogItem) {
  const nextItem = normalizeCatalogItem(item as Record<string, unknown>);
  const { error } = await supabase.from(TABLE_NAME).upsert(nextItem);
  if (error) throw new Error(error.message);
  return nextItem;
}

export async function deleteCatalogItem(itemId: string) {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  return itemId;
}
