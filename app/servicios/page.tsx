"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ServicioRow = {
  id: number;
  name: string;
  category: string | null;
  price: number | string | null;
  duration_minutes: number | null;
  description: string | null;
  public_visible?: boolean | null;
};

type ServicioFormRow = {
  id: number;
  name: string;
  category: string;
  price: string;
  duration_minutes: string;
  description: string;
  public_visible: boolean;
};

type NewServiceForm = {
  name: string;
  category: string;
  price: string;
  duration_minutes: string;
  description: string;
  public_visible: boolean;
};

function toInputString(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizePriceInput(value: string) {
  return value.replace(",", ".").trim();
}

function getEmptyNewService(): NewServiceForm {
  return {
    name: "",
    category: "",
    price: "",
    duration_minutes: "30",
    description: "",
    public_visible: true,
  };
}

export default function ServiciosPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState<number | null>(null);
  const [servicios, setServicios] = useState<ServicioFormRow[]>([]);
  const [newService, setNewService] = useState<NewServiceForm>(
    getEmptyNewService()
  );
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const savingSet = useMemo(() => new Set(savingIds), [savingIds]);

  const resolveBusinessId = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabaseBrowser.auth.getUser();

    if (userError || !user) {
      router.push("/login?redirectTo=/servicios");
      return null;
    }

    const { data: profile, error: profileError } = await supabaseBrowser
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message || "No se pudo cargar el perfil.");
      return null;
    }

    if (!profile?.business_id) {
      router.push("/registro");
      return null;
    }

    return Number(profile.business_id);
  }, [router]);

  const loadServicios = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const resolvedBusinessId = await resolveBusinessId();

    if (!resolvedBusinessId) {
      setLoading(false);
      return;
    }

    setBusinessId(resolvedBusinessId);

    const { data, error } = await supabaseBrowser
      .from("servicios")
      .select(
        "id, name, category, price, duration_minutes, description, public_visible"
      )
      .eq("business_id", resolvedBusinessId)
      .order("id", { ascending: true });

    if (error) {
      setError(error.message || "No se pudieron cargar los servicios.");
      setLoading(false);
      return;
    }

    const rows = ((data ?? []) as ServicioRow[]).map((item) => ({
      id: item.id,
      name: item.name ?? "",
      category: item.category ?? "",
      price: toInputString(item.price),
      duration_minutes: toInputString(item.duration_minutes),
      description: item.description ?? "",
      public_visible: item.public_visible ?? true,
    }));

    setServicios(rows);
    setLoading(false);
  }, [resolveBusinessId]);

  useEffect(() => {
    loadServicios();
  }, [loadServicios]);

  const updateRow = (
    id: number,
    field: keyof ServicioFormRow,
    value: string | boolean
  ) => {
    setServicios((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const updateNewService = (
    field: keyof NewServiceForm,
    value: string | boolean
  ) => {
    setNewService((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateServiceData = (data: {
    name: string;
    price: string;
    duration_minutes: string;
  }) => {
    const normalizedPrice = normalizePriceInput(data.price);
    const priceNumber = Number(normalizedPrice);
    const durationNumber = Number(data.duration_minutes);

    if (!data.name.trim()) {
      throw new Error("El servicio debe tener nombre.");
    }

    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      throw new Error(`El servicio "${data.name}" tiene un precio inválido.`);
    }

    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      throw new Error(
        `El servicio "${data.name}" debe tener una duración válida.`
      );
    }

    return {
      priceNumber,
      durationNumber,
    };
  };

  const saveRow = async (row: ServicioFormRow) => {
    setError("");
    setSuccess("");

    if (!businessId) {
      setError("No se ha podido resolver el negocio actual.");
      return false;
    }

    let parsed;
    try {
      parsed = validateServiceData(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Datos inválidos.");
      return false;
    }

    setSavingIds((prev) => [...prev, row.id]);

    const payload = {
      name: row.name.trim(),
      category: row.category.trim() || null,
      price: parsed.priceNumber,
      duration_minutes: parsed.durationNumber,
      description: row.description.trim() || null,
      public_visible: row.public_visible,
    };

    const { error } = await supabaseBrowser
      .from("servicios")
      .update(payload)
      .eq("id", row.id)
      .eq("business_id", businessId);

    setSavingIds((prev) => prev.filter((id) => id !== row.id));

    if (error) {
      setError(
        `No se pudo guardar "${row.name}": ${error.message || "error desconocido"}`
      );
      return false;
    }

    setSuccess(`Servicio "${row.name}" guardado correctamente.`);
    return true;
  };

  const saveAll = async () => {
    setError("");
    setSuccess("");

    for (const row of servicios) {
      try {
        validateServiceData(row);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Datos inválidos.");
        return;
      }
    }

    for (const row of servicios) {
      const ok = await saveRow(row);
      if (!ok) return;
    }

    setSuccess("Todos los servicios se han guardado.");
  };

  const createService = async () => {
    setError("");
    setSuccess("");

    if (!businessId) {
      setError("No se ha podido resolver el negocio actual.");
      return;
    }

    let parsed;
    try {
      parsed = validateServiceData(newService);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Datos inválidos.");
      return;
    }

    setCreating(true);

    const payload = {
      business_id: businessId,
      name: newService.name.trim(),
      category: newService.category.trim() || null,
      price: parsed.priceNumber,
      duration_minutes: parsed.durationNumber,
      description: newService.description.trim() || null,
      public_visible: newService.public_visible,
    };

    const { data, error } = await supabaseBrowser
      .from("servicios")
      .insert([payload])
      .select(
        "id, name, category, price, duration_minutes, description, public_visible"
      )
      .single();

    setCreating(false);

    if (error) {
      setError(error.message || "No se pudo crear el servicio.");
      return;
    }

    if (data) {
      const newRow: ServicioFormRow = {
        id: data.id,
        name: data.name ?? "",
        category: data.category ?? "",
        price: toInputString(data.price),
        duration_minutes: toInputString(data.duration_minutes),
        description: data.description ?? "",
        public_visible: data.public_visible ?? true,
      };

      setServicios((prev) => [...prev, newRow].sort((a, b) => a.id - b.id));
    }

    setNewService(getEmptyNewService());
    setSuccess(`Servicio "${payload.name}" creado correctamente.`);
  };

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando servicios...
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
              <p className="mt-2 text-zinc-600">
                Aquí el dueño puede crear nuevos servicios y cambiar precios,
                duración y visibilidad online.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadServicios}
                className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Recargar
              </button>

              <button
                type="button"
                onClick={saveAll}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Guardar todos
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Añadir nuevo servicio</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Crea un servicio nuevo con su precio y duración.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Nombre
              </label>
              <input
                value={newService.name}
                onChange={(e) => updateNewService("name", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Ej. Alisado"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Categoría
              </label>
              <input
                value={newService.category}
                onChange={(e) => updateNewService("category", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Ej. Tratamientos"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Precio
              </label>
              <input
                inputMode="decimal"
                value={newService.price}
                onChange={(e) => updateNewService("price", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Ej. 25 o 25.50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Duración (min)
              </label>
              <input
                inputMode="numeric"
                value={newService.duration_minutes}
                onChange={(e) =>
                  updateNewService("duration_minutes", e.target.value)
                }
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Ej. 60"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Descripción
              </label>
              <textarea
                rows={3}
                value={newService.description}
                onChange={(e) => updateNewService("description", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Describe el servicio"
              />
            </div>

            <div className="flex flex-col justify-between gap-4">
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={newService.public_visible}
                  onChange={(e) =>
                    updateNewService("public_visible", e.target.checked)
                  }
                />
                Visible online
              </label>

              <button
                type="button"
                onClick={createService}
                disabled={creating}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear servicio"}
              </button>
            </div>
          </div>
        </section>

        {servicios.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm text-sm text-zinc-500">
            No hay servicios registrados todavía.
          </div>
        ) : (
          <div className="space-y-4">
            {servicios.map((row) => {
              const isSaving = savingSet.has(row.id);

              return (
                <article
                  key={row.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Nombre
                      </label>
                      <input
                        value={row.name}
                        onChange={(e) =>
                          updateRow(row.id, "name", e.target.value)
                        }
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Categoría
                      </label>
                      <input
                        value={row.category}
                        onChange={(e) =>
                          updateRow(row.id, "category", e.target.value)
                        }
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Precio
                      </label>
                      <input
                        inputMode="decimal"
                        value={row.price}
                        onChange={(e) =>
                          updateRow(row.id, "price", e.target.value)
                        }
                        placeholder="Ej. 15 o 15.50"
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Duración (min)
                      </label>
                      <input
                        inputMode="numeric"
                        value={row.duration_minutes}
                        onChange={(e) =>
                          updateRow(row.id, "duration_minutes", e.target.value)
                        }
                        placeholder="Ej. 30"
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        value={row.description}
                        onChange={(e) =>
                          updateRow(row.id, "description", e.target.value)
                        }
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>

                    <div className="flex flex-col justify-between gap-4">
                      <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                        <input
                          type="checkbox"
                          checked={row.public_visible}
                          onChange={(e) =>
                            updateRow(row.id, "public_visible", e.target.checked)
                          }
                        />
                        Visible online
                      </label>

                      <button
                        type="button"
                        onClick={() => saveRow(row)}
                        disabled={isSaving}
                        className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {isSaving ? "Guardando..." : "Guardar servicio"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}