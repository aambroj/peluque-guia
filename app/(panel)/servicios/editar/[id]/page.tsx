"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ServicioForm = {
  name: string;
  category: string;
  duration_minutes: string;
  price: string;
  description: string;
  public_visible: boolean;
};

export default function EditarServicioPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [businessId, setBusinessId] = useState<number | null>(null);
  const [form, setForm] = useState<ServicioForm>({
    name: "",
    category: "",
    duration_minutes: "",
    price: "",
    description: "",
    public_visible: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServicio = async () => {
      if (Number.isNaN(id)) {
        setError("ID de servicio no válido.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabaseBrowser.auth.getUser();

      if (userError || !user) {
        router.push(`/login?redirectTo=/servicios/editar/${id}`);
        return;
      }

      const { data: profile, error: profileError } = await supabaseBrowser
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message || "No se pudo cargar el perfil.");
        setLoading(false);
        return;
      }

      if (!profile?.business_id) {
        router.push("/registro");
        return;
      }

      const resolvedBusinessId = Number(profile.business_id);
      setBusinessId(resolvedBusinessId);

      const { data, error } = await supabaseBrowser
        .from("servicios")
        .select(
          "id, name, category, duration_minutes, price, description, public_visible"
        )
        .eq("id", id)
        .eq("business_id", resolvedBusinessId)
        .maybeSingle();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("No se encontró el servicio.");
        setLoading(false);
        return;
      }

      setForm({
        name: data.name ?? "",
        category: data.category ?? "",
        duration_minutes:
          data.duration_minutes !== null && data.duration_minutes !== undefined
            ? String(data.duration_minutes)
            : "",
        price:
          data.price !== null && data.price !== undefined
            ? String(data.price)
            : "",
        description: data.description ?? "",
        public_visible: data.public_visible ?? true,
      });

      setLoading(false);
    };

    fetchServicio();
  }, [id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!businessId) {
        setError("No se ha podido resolver el negocio actual.");
        return;
      }

      const name = form.name.trim();
      const category = form.category.trim();
      const description = form.description.trim();
      const durationNumber = Number(form.duration_minutes);
      const priceNumber =
        form.price.trim() === "" ? null : Number(form.price.replace(",", "."));

      if (!name) {
        setError("El nombre es obligatorio.");
        return;
      }

      if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
        setError("La duración debe ser un número válido mayor que 0.");
        return;
      }

      if (
        priceNumber !== null &&
        (!Number.isFinite(priceNumber) || priceNumber < 0)
      ) {
        setError("El precio no es válido.");
        return;
      }

      const payload = {
        name,
        category: category || null,
        duration_minutes: durationNumber,
        price: priceNumber,
        description: description || null,
        public_visible: form.public_visible,
      };

      const { error } = await supabaseBrowser
        .from("servicios")
        .update(payload)
        .eq("id", id)
        .eq("business_id", businessId);

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/servicios");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando servicio...
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight">Editar servicio</h2>
          <p className="mt-2 text-zinc-600">
            Modifica los datos del servicio seleccionado.
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
                onChange={handleChange}
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
                disabled={saving}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}