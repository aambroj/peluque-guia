"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: number;
  name: string;
  phone: string | null;
  visits: number | null;
  last_visit: string | null;
  notes: string | null;
};

type ClienteForm = {
  name: string;
  phone: string;
  visits: string;
  last_visit: string;
  notes: string;
};

export default function ClienteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = Number(params.id);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteForm>({
    name: "",
    phone: "",
    visits: "0",
    last_visit: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadCliente = async () => {
      if (!Number.isFinite(clientId) || clientId <= 0) {
        setError("Cliente inválido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");

      const { data, error } = await supabase
        .from("clientes")
        .select("id, name, phone, visits, last_visit, notes")
        .eq("id", clientId)
        .maybeSingle();

      if (error) {
        setError(error.message || "No se pudo cargar el cliente.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("No se encontró el cliente.");
        setLoading(false);
        return;
      }

      const clienteData = data as Cliente;
      setCliente(clienteData);

      setForm({
        name: clienteData.name ?? "",
        phone: clienteData.phone ?? "",
        visits: String(clienteData.visits ?? 0),
        last_visit: clienteData.last_visit ?? "",
        notes: clienteData.notes ?? "",
      });

      setLoading(false);
    };

    loadCliente();
  }, [clientId]);

  const updateField = (
    field: keyof ClienteForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    const visitsNumber = Number(form.visits);

    if (!Number.isFinite(visitsNumber) || visitsNumber < 0) {
      setError("El número de visitas no es válido.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      visits: visitsNumber,
      last_visit: form.last_visit || null,
      notes: form.notes.trim() || null,
    };

    const { data, error } = await supabase
      .from("clientes")
      .update(payload)
      .eq("id", clientId)
      .select("id, name, phone, visits, last_visit, notes")
      .single();

    setSaving(false);

    if (error) {
      setError(error.message || "No se pudo guardar el cliente.");
      return;
    }

    const updated = data as Cliente;
    setCliente(updated);
    setForm({
      name: updated.name ?? "",
      phone: updated.phone ?? "",
      visits: String(updated.visits ?? 0),
      last_visit: updated.last_visit ?? "",
      notes: updated.notes ?? "",
    });

    setSuccess("Datos del cliente guardados correctamente.");

    router.push("/clientes");
    router.refresh();
  };

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando datos del cliente...
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Editar cliente
              </h1>
              <p className="mt-2 text-zinc-600">
                Modifica los datos generales de{" "}
                <span className="font-medium text-zinc-900">
                  {cliente?.name ?? "este cliente"}
                </span>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/clientes"
                className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-black"
              >
                Volver a clientes
              </Link>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
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

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Nombre
              </label>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Teléfono
              </label>
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Teléfono de contacto"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Visitas
              </label>
              <input
                inputMode="numeric"
                value={form.visits}
                onChange={(e) => updateField("visits", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Última visita
              </label>
              <input
                type="date"
                value={form.last_visit}
                onChange={(e) => updateField("last_visit", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Notas
            </label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              placeholder="Información adicional del cliente"
            />
          </div>
        </div>
      </div>
    </section>
  );
}