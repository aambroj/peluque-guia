"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EmpleadoPublico = {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  status: string | null;
  public_booking_enabled: boolean;
};

export default function ReservarPage() {
  const [empleados, setEmpleados] = useState<EmpleadoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("empleados")
        .select("id, name, role, phone, status, public_booking_enabled")
        .eq("public_booking_enabled", true)
        .neq("status", "Descanso")
        .order("name", { ascending: true });

      if (error) {
        setError(error.message || "No se pudieron cargar los empleados.");
        setLoading(false);
        return;
      }

      setEmpleados((data ?? []) as EmpleadoPublico[]);
      setLoading(false);
    };

    loadEmployees();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">
            Reserva tu cita online
          </h1>
          <p className="mt-2 text-zinc-600">
            Elige el profesional con el que quieres reservar y consulta sus días
            y horas disponibles.
          </p>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm text-zinc-600">
            Cargando empleados disponibles...
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm text-red-600">
            {error}
          </section>
        ) : empleados.length === 0 ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm text-zinc-600">
            Ahora mismo no hay empleados disponibles para reserva online.
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Reserva online
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-zinc-600">
                  <p>
                    <span className="font-medium text-zinc-800">Estado:</span>{" "}
                    {empleado.status || "Disponible"}
                  </p>

                  {empleado.phone ? (
                    <p>
                      <span className="font-medium text-zinc-800">
                        Contacto:
                      </span>{" "}
                      {empleado.phone}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6">
                  <Link
                    href={`/reservar/${empleado.id}`}
                    className="inline-flex rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Ver calendario y reservar
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}