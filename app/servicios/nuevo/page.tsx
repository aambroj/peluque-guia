"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function NuevoServicioPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    category: "",
    duration_minutes: "",
    price: "",
    description: "",
    public_visible: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabaseBrowser.auth.getUser();

    if (userError || !user) {
      router.push("/login?redirectTo=/servicios/nuevo");
      return;
    }

    const { data: profile, error: profileError } = await supabaseBrowser
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.business_id) {
      setError("No se ha podido resolver el negocio del usuario actual.");
      setLoading(false);
      return;
    }

    const priceNumber =
      form.price.trim() === "" ? null : Number(form.price.replace(",", "."));

    const durationNumber = Number(form.duration_minutes);

    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      setLoading(false);
      return;
    }

    if (priceNumber !== null && (!Number.isFinite(priceNumber) || priceNumber < 0)) {
      setError("El precio no es válido.");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      setError("La duración debe ser un número válido mayor que 0.");
      setLoading(false);
      return;
    }

    const payload = {
      business_id: profile.business_id,
      name: form.name.trim(),
      category: form.category.trim() || null,
      duration_minutes: durationNumber,
      price: priceNumber,
      description: form.description.trim() || null,
      public_visible: form.public_visible,
    };

    const { error } = await supabaseBrowser.from("servicios").insert([payload]);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/servicios");
    router.refresh();
  };

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight">Nuevo servicio</h2>
          <p className="mt-2 text-zinc-600">
            Añade un nuevo servicio al catálogo.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Nombre
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Categoría
              </label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Corte, Color, Peinado..."
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Duración (min)
              </label>
              <input
                name="duration_minutes"
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={handleChange}
                placeholder="45"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Precio
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="18.00"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Descripción
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="public_visible"
                checked={form.public_visible}
                onChange={handleCheckboxChange}
              />
              Visible online
            </label>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar servicio"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}