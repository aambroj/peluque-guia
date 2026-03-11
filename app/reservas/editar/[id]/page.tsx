"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: number;
  name: string;
};

type Empleado = {
  id: number;
  name: string;
};

type Servicio = {
  id: number;
  name: string;
};

function normalizeDateForInput(value: string | null | undefined) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  }

  return "";
}

function normalizeTimeForInput(value: string | null | undefined) {
  if (!value) return "";

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  return "";
}

export default function EditarReservaPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [form, setForm] = useState({
    client_id: "",
    employee_id: "",
    service_id: "",
    date: "",
    time: "",
    status: "Pendiente",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [reservaRes, clientesRes, empleadosRes, serviciosRes] = await Promise.all([
        supabase.from("reservas").select("*").eq("id", id).single(),
        supabase.from("clientes").select("id, name").order("name", { ascending: true }),
        supabase.from("empleados").select("id, name").order("name", { ascending: true }),
        supabase.from("servicios").select("id, name").order("name", { ascending: true }),
      ]);

      if (reservaRes.error || clientesRes.error || empleadosRes.error || serviciosRes.error) {
        setError(
          reservaRes.error?.message ||
            clientesRes.error?.message ||
            empleadosRes.error?.message ||
            serviciosRes.error?.message ||
            "Error al cargar datos"
        );
        setLoading(false);
        return;
      }

      const data = reservaRes.data;
      const clientesData = (clientesRes.data ?? []) as Cliente[];
      const empleadosData = (empleadosRes.data ?? []) as Empleado[];
      const serviciosData = (serviciosRes.data ?? []) as Servicio[];

      setClientes(clientesData);
      setEmpleados(empleadosData);
      setServicios(serviciosData);

      const fallbackClientId =
        data.client_id ??
        clientesData.find((c) => c.name === data.client_name)?.id ??
        null;

      const fallbackEmployeeId =
        data.employee_id ??
        empleadosData.find((e) => e.name === data.employee_name)?.id ??
        null;

      const fallbackServiceId =
        data.service_id ??
        serviciosData.find((s) => s.name === data.service_name)?.id ??
        null;

      setForm({
        client_id: fallbackClientId ? String(fallbackClientId) : "",
        employee_id: fallbackEmployeeId ? String(fallbackEmployeeId) : "",
        service_id: fallbackServiceId ? String(fallbackServiceId) : "",
        date: normalizeDateForInput(data.date),
        time: normalizeTimeForInput(data.time),
        status: data.status ?? "Pendiente",
      });

      setLoading(false);
    };

    if (!Number.isNaN(id)) {
      fetchData();
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      client_id: form.client_id ? Number(form.client_id) : null,
      employee_id: form.employee_id ? Number(form.employee_id) : null,
      service_id: form.service_id ? Number(form.service_id) : null,
      date: form.date,
      time: form.time,
      status: form.status,
    };

    const { error } = await supabase.from("reservas").update(payload).eq("id", id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/reservas");
    router.refresh();
  };

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando reserva...
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight">Editar reserva</h2>
          <p className="mt-2 text-zinc-600">
            Modifica los datos de la reserva seleccionada.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Cliente
              </label>
              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Empleado
              </label>
              <select
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="">Selecciona un empleado</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Servicio
              </label>
              <select
                name="service_id"
                value={form.service_id}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Fecha
                </label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Hora
                </label>
                <input
                  name="time"
                  type="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Estado
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

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