"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Empleado = {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  status: string | null;
  public_booking_enabled?: boolean | null;
};

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmpleados = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("empleados")
        .select("id, name, role, phone, status, public_booking_enabled")
        .order("name", { ascending: true });

      if (error) {
        setError(error.message || "No se pudieron cargar los empleados.");
        setLoading(false);
        return;
      }

      setEmpleados((data ?? []) as Empleado[]);
      setLoading(false);
    };

    loadEmpleados();
  }, []);

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando empleados...
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
              <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
              <p className="mt-2 text-zinc-600">
                Gestiona el equipo, sus datos, horarios semanales y sus bloqueos
                o vacaciones.
              </p>
            </div>

            <Link
              href="/empleados/nuevo"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Nuevo empleado
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {empleados.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm text-zinc-600">
            No hay empleados registrados.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {empleados.map((empleado) => (
              <article
                key={empleado.id}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{empleado.name}</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {empleado.role || "Profesional del salón"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      empleado.status === "Descanso"
                        ? "border border-orange-200 bg-orange-50 text-orange-700"
                        : empleado.status === "Vacaciones" ||
                          empleado.status === "Baja" ||
                          empleado.status === "Inactivo"
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : "border border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    {empleado.status || "Disponible"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-zinc-600">
                  <p>
                    <span className="font-medium text-zinc-800">Teléfono:</span>{" "}
                    {empleado.phone || "No indicado"}
                  </p>

                  <p>
                    <span className="font-medium text-zinc-800">
                      Reserva online:
                    </span>{" "}
                    {empleado.public_booking_enabled ? "Activa" : "Desactivada"}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/empleados/${empleado.id}`}
                    className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Editar datos
                  </Link>

                  <Link
                    href={`/empleados/${empleado.id}/horario`}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-black"
                  >
                    Horario
                  </Link>

                  <Link
                    href={`/empleados/${empleado.id}/bloqueos`}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-black"
                  >
                    Bloqueos / vacaciones
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}