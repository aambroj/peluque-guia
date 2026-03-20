"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BusinessPublic = {
  id: number;
  name: string | null;
  slug: string;
};

type EmpleadoPublico = {
  id: number;
  business_id: number | null;
  name: string | null;
  role: string | null;
  phone: string | null;
  status: string | null;
  public_booking_enabled: boolean | null;
};

type ScheduleRow = {
  id: string;
  business_id?: number | null;
  employee_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
};

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function parseTimeToMinutes(time: string | null | undefined) {
  if (!time) return null;

  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function hasValidWorkingSchedule(rows: ScheduleRow[] | null | undefined) {
  return (rows ?? []).some((row) => {
    if (!row.is_working) return false;

    const start = parseTimeToMinutes(row.start_time);
    const end = parseTimeToMinutes(row.end_time);

    return start !== null && end !== null && end > start;
  });
}

function isEmployeePublicBookable(empleado: EmpleadoPublico) {
  const status = normalizeStatus(empleado.status);
  const canBook = empleado.public_booking_enabled === true;

  return (
    canBook &&
    status !== "descanso" &&
    status !== "vacaciones" &&
    status !== "inactivo"
  );
}

export default function PublicBusinessBookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug ?? "").trim().toLowerCase();

  const [business, setBusiness] = useState<BusinessPublic | null>(null);
  const [empleados, setEmpleados] = useState<EmpleadoPublico[]>([]);
  const [hiddenEmployeesWithoutSchedule, setHiddenEmployeesWithoutSchedule] =
    useState<EmpleadoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBusinessAndEmployees = async () => {
      setLoading(true);
      setError("");

      try {
        if (!slug) {
          throw new Error("El salón solicitado no es válido.");
        }

        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("id, name, slug")
          .eq("slug", slug)
          .maybeSingle();

        if (businessError) {
          throw new Error(businessError.message);
        }

        if (!businessData) {
          throw new Error("No se encontró el salón solicitado.");
        }

        const typedBusiness = businessData as BusinessPublic;
        setBusiness(typedBusiness);

        const [empleadosRes, schedulesRes] = await Promise.all([
          supabase
            .from("empleados")
            .select(
              "id, business_id, name, role, phone, status, public_booking_enabled"
            )
            .eq("business_id", typedBusiness.id)
            .eq("public_booking_enabled", true)
            .order("name", { ascending: true }),

          supabase
            .from("employee_schedules")
            .select(
              "id, business_id, employee_id, weekday, start_time, end_time, is_working"
            )
            .eq("business_id", typedBusiness.id),
        ]);

        if (empleadosRes.error) {
          throw new Error(empleadosRes.error.message);
        }

        if (schedulesRes.error) {
          throw new Error(schedulesRes.error.message);
        }

        const rows = (empleadosRes.data ?? []) as EmpleadoPublico[];
        const publicables = rows.filter(isEmployeePublicBookable);

        const schedulesByEmployee = new Map<number, ScheduleRow[]>();

        for (const row of (schedulesRes.data ?? []) as ScheduleRow[]) {
          const list = schedulesByEmployee.get(row.employee_id) ?? [];
          list.push(row);
          schedulesByEmployee.set(row.employee_id, list);
        }

        const visibles = publicables.filter((empleado) =>
          hasValidWorkingSchedule(schedulesByEmployee.get(empleado.id) ?? [])
        );

        const ocultosSinHorario = publicables.filter(
          (empleado) =>
            !hasValidWorkingSchedule(schedulesByEmployee.get(empleado.id) ?? [])
        );

        setEmpleados(visibles);
        setHiddenEmployeesWithoutSchedule(ocultosSinHorario);
      } catch (err) {
        setBusiness(null);
        setEmpleados([]);
        setHiddenEmployeesWithoutSchedule([]);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los datos públicos."
        );
      } finally {
        setLoading(false);
      }
    };

    loadBusinessAndEmployees();
  }, [slug]);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/reservar"
            className="inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            ← Volver
          </Link>
        </div>

        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">
            {business?.name || "Reserva tu cita online"}
          </h1>
          <p className="mt-2 text-zinc-600">
            Elige el profesional con el que quieres reservar y consulta sus días
            y horas disponibles.
          </p>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-600 shadow-sm">
            Cargando profesionales disponibles...
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-600 shadow-sm">
            {error}
          </section>
        ) : (
          <>
            {hiddenEmployeesWithoutSchedule.length > 0 ? (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
                Hay {hiddenEmployeesWithoutSchedule.length} profesional
                {hiddenEmployeesWithoutSchedule.length === 1 ? "" : "es"} que
                aún no aparece{hiddenEmployeesWithoutSchedule.length === 1 ? "" : "n"} en
                la reserva online porque no tiene{hiddenEmployeesWithoutSchedule.length === 1 ? "" : "n"} horario configurado.
              </section>
            ) : null}

            {empleados.length === 0 ? (
              <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-600 shadow-sm">
                No hay profesionales disponibles para reserva online en este
                momento.
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
                        <h2 className="text-xl font-semibold">
                          {empleado.name || "Profesional"}
                        </h2>
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
                        <span className="font-medium text-zinc-800">
                          Estado:
                        </span>{" "}
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
                        href={`/reservar/${slug}/${empleado.id}`}
                        className="inline-flex rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        Ver calendario y reservar
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}