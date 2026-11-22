import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { getTestimonials, addTestimonial, deleteTestimonial, type Testimonial } from "@/lib/testimonials";
import { getCatalogItems, type CatalogItem } from "@/lib/catalog";

export const Route = createFileRoute("/admin/testimonials")({
  component: AdminTestimonialsPage,
  head: () => ({ meta: [{ title: "Testimonials Admin — SDF Land of Origin" }] }),
});

function AdminTestimonialsPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  async function checkAuth() {
    setAuthLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setIsAuthorized(false);
        setAuthLoading(false);
        return;
      }
      const email = (currentUser.email || "").toLowerCase();
      const isAdmin = adminEmails.length === 0 || adminEmails.includes(email);
      setIsAuthorized(isAdmin);
      setAuthLoading(false);
    } catch (e) {
      setMessage("Unable to verify authentication.");
      setIsAuthorized(false);
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
    const { data: sub } = supabase.auth.onAuthStateChange(() => checkAuth());
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const [items, setItems] = useState<Testimonial[]>([]);
  const [form, setForm] = useState({
    name: "",
    location: "",
    quote: "",
    imagePreview: "",
    rating: 5,
    reviewType: "website" as "website" | "product",
    productName: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      getTestimonials().then(setItems).catch(() => {});
      getCatalogItems().then(setCatalogItems).catch(() => {});
    } else {
      setItems([]);
    }
  }, [isAuthorized]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return setForm((s) => ({ ...s, imagePreview: "" }));
    const reader = new FileReader();
    reader.onload = () => setForm((s) => ({ ...s, imagePreview: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.quote.trim()) return setMessage("Name and quote are required.");
    if (form.reviewType === "product" && !form.productName) {
      return setMessage("Please select a product/tour to review.");
    }
    setIsSaving(true);
    try {
      await addTestimonial({
        name: form.name.trim(),
        location: form.location.trim() || undefined,
        quote: form.quote.trim(),
        image: form.imagePreview || undefined,
        rating: form.rating,
        reviewType: form.reviewType,
        productName: form.reviewType === "product" ? form.productName : undefined,
      });
      setItems(await getTestimonials());
      setForm({
        name: "",
        location: "",
        quote: "",
        imagePreview: "",
        rating: 5,
        reviewType: "website",
        productName: "",
      });
      setMessage("Testimonial added.");
    } catch (err) {
      setMessage("Unable to add testimonial.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteTestimonial(id);
    setItems(await getTestimonials());
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Verifying admin session…</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Please sign in to access admin.</div>;
  if (!isAuthorized) return <div className="min-h-screen flex items-center justify-center">You are not authorized to access this page.</div>;

  return (
    <div className="min-h-screen p-8 bg-[var(--brand-sand)]">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[var(--brand-green)]/10">
        <h1 className="text-3xl font-[family-name:var(--font-display)] font-bold text-[var(--brand-green-deep)] mb-2">Testimonials — Admin</h1>
        <p className="mb-6 text-sm text-muted-foreground">Add, view or remove testimonials shown on the homepage. Submissions are persisted in local storage.</p>

        <form onSubmit={handleAdd} className="mb-8 space-y-4 bg-[var(--brand-sand)]/40 p-6 rounded-2xl border border-[var(--brand-green)]/5">
          <h2 className="text-lg font-bold text-[var(--brand-green-deep)] mb-2">Create Testimonial</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Name"
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none"
            />
            <input
              value={form.location}
              onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
              placeholder="Location (optional)"
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--brand-green-deep)]">Rating</span>
              <select
                value={form.rating}
                onChange={(e) => setForm((s) => ({ ...s, rating: Number(e.target.value) }))}
                className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r} Star{r !== 1 ? "s" : ""}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--brand-green-deep)]">Review Target</span>
              <select
                value={form.reviewType}
                onChange={(e) => setForm((s) => ({ ...s, reviewType: e.target.value as "website" | "product", productName: "" }))}
                className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="website">Website Feedback</option>
                <option value="product">Tour / Product Package</option>
              </select>
            </label>

            {form.reviewType === "product" && (
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[var(--brand-green-deep)]">Select Product *</span>
                <select
                  required
                  value={form.productName}
                  onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))}
                  className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">Choose Tour...</option>
                  {catalogItems.map((c) => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <textarea
            required
            value={form.quote}
            onChange={(e) => setForm((s) => ({ ...s, quote: e.target.value }))}
            placeholder="Quote"
            rows={3}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none resize-none"
          />

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-3 cursor-pointer bg-white border border-[var(--brand-green)]/15 px-4 py-2 rounded-xl hover:bg-gray-50 transition text-sm">
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <span>Upload Image (optional)</span>
            </label>
            {form.imagePreview ? <img src={form.imagePreview} alt="preview" className="h-12 w-12 rounded-full object-cover border" /> : null}
            <button
              type="submit"
              disabled={isSaving}
              className="ml-auto rounded-xl bg-[var(--brand-gold)] hover:opacity-90 text-[var(--brand-green-deep)] px-6 py-2.5 font-semibold text-sm transition"
            >
              {isSaving ? "Saving…" : "Add Testimonial"}
            </button>
          </div>
        </form>

        <h2 className="text-xl font-bold text-[var(--brand-green-deep)] mb-4">Testimonials List</h2>
        <div className="space-y-4">
          {items.map((t) => (
            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-4 border rounded-2xl p-5 bg-[var(--brand-sand)]/10 hover:bg-[var(--brand-sand)]/20 transition">
              <div className="flex items-center gap-4 flex-1">
                {t.image ? (
                  <img src={t.image} alt={t.name} className="h-12 w-12 rounded-full object-cover border" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[var(--brand-green-deep)]/10 text-[var(--brand-green-deep)] flex items-center justify-center font-bold">
                    {t.name?.[0] ?? "?"}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="font-semibold flex flex-wrap items-center gap-2 text-sm text-[var(--brand-green-deep)]">
                    <span>{t.name}</span>
                    {t.location ? <span className="text-xs text-muted-foreground font-normal">({t.location})</span> : null}
                    <span className="text-amber-500 font-bold ml-1">{"★".repeat(t.rating ?? 5)}{"☆".repeat(5 - (t.rating ?? 5))}</span>
                  </div>
                  <div className="text-[10px] tracking-wide uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                    {t.reviewType === "product" && t.productName ? (
                      <span className="bg-[var(--brand-green-deep)]/10 text-[var(--brand-green-deep)] px-2 py-0.5 rounded-full">
                        🧭 Tour: {t.productName}
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                        💻 Website Feedback
                      </span>
                    )}
                  </div>
                  <div className="text-sm italic text-foreground mt-1">“{t.quote}”</div>
                </div>
              </div>
              <div className="sm:self-center">
                <button
                  type="button"
                  onClick={() => { if (confirm("Are you sure you want to delete this review?")) handleDelete(t.id); }}
                  className="rounded-xl px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-2xl">
              No testimonials found.
            </div>
          )}
        </div>

        {message ? <div className="mt-4 text-sm font-semibold text-[var(--brand-green-deep)] bg-[var(--brand-sand)]/35 p-3 rounded-xl border border-[var(--brand-green)]/5 text-center">{message}</div> : null}
      </div>
    </div>
  );
}
