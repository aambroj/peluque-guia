"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Empleado = {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  status: string | null;
  public_booking_enabled: boolean | null;
};

type EmpleadoForm = {
  name: string;
  role: string;
  phone: string;
  status: string;
  public_booking_enabled: boolean;
};

export default function EmpleadoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const employeeId = Number(params.id);

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [form, setForm] = useState<EmpleadoForm>({
    name: "",
    role: "",
    phone: "",
    status: "Disponible",
    public_booking_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadEmpleado = async () => {
      if (!Number.isFinite(employeeId) || employeeId <= 0) {
        setError("Empleado inválido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");

      const { data, error } = await supabase
        .from("empleados")
        .select("id, name, role, phone, status, public_booking_enabled")
        .eq("id", employeeId)
        .maybeSingle();

      if (error) {
        setError(error.message || "No se pudo cargar el empleado.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("No se encontró el empleado.");
        setLoading(false);
        return;
      }

      const empleadoData = data as Empleado;
      setEmpleado(empleadoData);

      setForm({
        name: empleadoData.name ?? "",
        role: empleadoData.role ?? "",
        phone: empleadoData.phone ?? "",
        status: empleadoData.status ?? "Disponible",
        public_booking_enabled: empleadoData.public_booking_enabled ?? true,
      });

      setLoading(false);
    };

    loadEmpleado();
  }, [employeeId]);

  const updateField = (
    field: keyof EmpleadoForm,
    value: string | boolean
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
      setError("El nombre del empleado es obligatorio.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status.trim() || "Disponible",
      public_booking_enabled: form.public_booking_enabled,
    };

    const { data, error } = await supabase
      .from("empleados")
      .update(payload)
      .eq("id", employeeId)
      .select("id, name, role, phone, status, public_booking_enabled")
      .single();

    setSaving(false);

    if (error) {
      setError(error.message || "No se pudo guardar el empleado.");
      return;
    }

    const updated = data as Empleado;
    setEmpleado(updated);
    setForm({
      name: updated.name ?? "",
      role: updated.role ?? "",
      phone: updated.phone ?? "",
      status: updated.status ?? "Disponible",
      public_booking_enabled: updated.public_booking_enabled ?? true,
    });

    setSuccess("Datos del empleado guardados correctamente.");

    router.push("/empleados");
    router.refresh();
  };

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando datos del empleado...
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
                Editar empleado
              </h1>
              <p className="mt-2 text-zinc-600">
                Modifica los datos generales de{" "}
                <span className="font-medium text-zinc-900">
                  {empleado?.name ?? "este empleado"}
                </span>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/empleados"
                className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-black"
              >
                Volver a empleados
              </Link>

              <Link
                href={`/empleados/${employeeId}/horario`}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-black"
              >
                Ver horario
              </Link>

              <Link
                href={`/empleados/${employeeId}/bloqueos`}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-black"
              >
                Ver bloqueos
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
                placeholder="Nombre del empleado"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Rol
              </label>
              <input
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                placeholder="Ej. Estilista"
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
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="Disponible">Disponible</option>
                <option value="Descanso">Descanso</option>
                <option value="Vacaciones">Vacaciones</option>
                <option value="Baja">Baja</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={form.public_booking_enabled}
                onChange={(e) =>
                  updateField("public_booking_enabled", e.target.checked)
                }
              />
              Permitir reserva online para este empleado
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}