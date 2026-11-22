import { z } from "zod";
import { supabase } from "@/lib/supabase";

export const TestimonialSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  location: z.string().optional(),
  quote: z.string().min(1),
  image: z.string().optional(),
  createdAt: z.string(),
  rating: z.number().min(1).max(5).default(5),
  reviewType: z.enum(["website", "product"]).default("website"),
  productName: z.string().optional(),
});

export type Testimonial = z.infer<typeof TestimonialSchema>;

const defaultTestimonials: Testimonial[] = [
  {
    id: "default-1",
    name: "Marta K.",
    location: "Spain",
    quote: "An unforgettable journey — our guide was knowledgeable, kind, and the itinerary was perfectly paced. Highly recommend SDF!",
    createdAt: new Date().toISOString(),
    rating: 5,
    reviewType: "website",
  },
  {
    id: "default-2",
    name: "Daniel T.",
    location: "USA",
    quote: "Beautifully organized trip. From airport pickup to local experiences, everything was seamless. The coffee ceremony was a highlight!",
    createdAt: new Date().toISOString(),
    rating: 5,
    reviewType: "website",
  },
  {
    id: "default-3",
    name: "Alemayehu B.",
    location: "Ethiopia",
    quote: "Authentic, respectful, and inspiring — the cultural interactions felt curated with care. We learned so much and felt safe throughout.",
    createdAt: new Date().toISOString(),
    rating: 5,
    reviewType: "website",
  },
];

function rowToTestimonial(row: Record<string, unknown>): Testimonial | null {
  try {
    return TestimonialSchema.parse({
      id: row.id,
      name: row.name,
      location: row.location ?? undefined,
      quote: row.quote,
      image: row.image ?? undefined,
      createdAt: row.created_at,
      rating: row.rating ?? 5,
      reviewType: row.review_type ?? "website",
      productName: row.product_name ?? undefined,
    });
  } catch {
    return null;
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return defaultTestimonials;

  const items = data
    .map((row) => rowToTestimonial(row as Record<string, unknown>))
    .filter((t): t is Testimonial => t !== null);

  return items.length ? items : defaultTestimonials;
}

async function uploadTestimonialImage(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("testimonial-images")
    .upload(path, blob, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("testimonial-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function addTestimonial(input: {
  name: string;
  location?: string;
  quote: string;
  image?: string;
  rating?: number;
  reviewType?: "website" | "product";
  productName?: string;
}): Promise<Testimonial> {
  let imageUrl = input.image ?? undefined;
  if (imageUrl?.startsWith("data:")) {
    imageUrl = await uploadTestimonialImage(imageUrl);
  }

  const item = TestimonialSchema.parse({
    id: crypto.randomUUID(),
    name: input.name,
    location: input.location ?? undefined,
    quote: input.quote,
    image: imageUrl,
    createdAt: new Date().toISOString(),
    rating: input.rating ?? 5,
    reviewType: input.reviewType ?? "website",
    productName: input.productName ?? undefined,
  });

  const { error } = await supabase.from("testimonials").insert({
    id: item.id,
    name: item.name,
    location: item.location ?? null,
    quote: item.quote,
    image: item.image ?? null,
    created_at: item.createdAt,
    rating: item.rating,
    review_type: item.reviewType,
    product_name: item.productName ?? null,
  });
  if (error) throw new Error(error.message);

  return item;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function clearTestimonials(): Promise<void> {
  await supabase.from("testimonials").delete().neq("id", "");
}
