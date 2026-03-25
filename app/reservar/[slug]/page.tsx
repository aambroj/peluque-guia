"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BusinessPublic = {
  id: number;
  name: string | null;
  slug: string;
  email?: string | null;
  brand_primary_color?: string | null;
  public_booking_message?: string | null;
  public_logo_url?: string | null;
};

type PublicBusinessResponse = {
  business: BusinessPublic;
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

function normalizeSlug(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function sanitizeHexColor(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : "#111827";
}

function sanitizeLogoUrl(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  return /^https?:\/\/.+/i.test(raw) ? raw : "";
}

function hexToRgba(hex: string, alpha: number) {
  const safeHex = sanitizeHexColor(hex).replace("#", "");
  const r = Number.parseInt(safeHex.slice(0, 2), 16);
  const g = Number.parseInt(safeHex.slice(2, 4), 16);
  const b = Number.parseInt(safeHex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const slug = normalizeSlug(String(params.slug ?? ""));

  const [business, setBusiness] = useState<BusinessPublic | null>(null);
  const [empleados, setEmpleados] = useState<EmpleadoPublico[]>([]);
  const [hiddenEmployeesWithoutSchedule, setHiddenEmployeesWithoutSchedule] =
    useState<EmpleadoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const accentColor = useMemo(
    () => sanitizeHexColor(business?.brand_primary_color),
    [business?.brand_primary_color]
  );

  const publicBookingMessage = useMemo(
    () => String(business?.public_booking_message ?? "").trim(),
    [business?.public_booking_message]
  );

  const publicLogoUrl = useMemo(
    () => sanitizeLogoUrl(business?.public_logo_url),
    [business?.public_logo_url]
  );

  useEffect(() => {
    const loadBusinessAndEmployees = async () => {
      setLoading(true);
      setError("");

      try {
        if (!slug) {
          throw new Error("El salón solicitado no es válido.");
        }

        const businessResponse = await fetch(
          `/api/public-business?slug=${encodeURIComponent(slug)}`
        );

        const businessPayload:
          | PublicBusinessResponse
          | {
              error?: string;
            } = await businessResponse.json();

        if (!businessResponse.ok || !("business" in businessPayload)) {
          throw new Error(
            ("error" in businessPayload && businessPayload.error) ||
              "No se encontró el salón solicitado."
          );
        }

        const typedBusiness = businessPayload.business;
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  color: accentColor,
                  borderColor: hexToRgba(accentColor, 0.22),
                  backgroundColor: hexToRgba(accentColor, 0.08),
                }}
              >
                Reserva online
              </span>
            </div>

            {publicLogoUrl ? (
              <div className="flex items-center">
                <img
                  src={publicLogoUrl}
                  alt={business?.name ? `Logo de ${business.name}` : "Logo del salón"}
                  className="h-16 w-auto rounded-xl border border-zinc-200 bg-white p-2 object-contain"
                />
              </div>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
            {business?.name || "Reserva tu cita online"}
          </h1>

          <p className="mt-2 text-zinc-600">
            Elige el profesional con el que quieres reservar y consulta sus días
            y horas disponibles.
          </p>

          {publicBookingMessage ? (
            <div
              className="mt-5 rounded-2xl border p-4 text-sm"
              style={{
                borderColor: hexToRgba(accentColor, 0.22),
                backgroundColor: hexToRgba(accentColor, 0.06),
                color: "#27272a",
              }}
            >
              {publicBookingMessage}
            </div>
          ) : null}
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
                aún no aparece
                {hiddenEmployeesWithoutSchedule.length === 1 ? "" : "n"} en la
                reserva online porque no tiene
                {hiddenEmployeesWithoutSchedule.length === 1 ? "" : "n"} horario
                configurado.
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
                        <h2 className="text-xl font-semibold text-zinc-900">
                          {empleado.name || "Profesional"}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          {empleado.role || "Profesional del salón"}
                        </p>
                      </div>

                      <span
                        className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{
                          color: accentColor,
                          borderColor: hexToRgba(accentColor, 0.22),
                          backgroundColor: hexToRgba(accentColor, 0.08),
                        }}
                      >
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
                        className="inline-flex rounded-xl px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
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