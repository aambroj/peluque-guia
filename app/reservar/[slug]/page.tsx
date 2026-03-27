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

function getContrastTextColor(hex: string) {
  const safeHex = sanitizeHexColor(hex).replace("#", "");
  const r = Number.parseInt(safeHex.slice(0, 2), 16);
  const g = Number.parseInt(safeHex.slice(2, 4), 16);
  const b = Number.parseInt(safeHex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness >= 155 ? "#111827" : "#ffffff";
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

function getEmployeeInitials(name: string | null | undefined) {
  const safe = String(name ?? "").trim();

  if (!safe) return "PR";

  const parts = safe.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "PR";
}

export default function PublicBusinessBookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = normalizeSlug(String(params.slug ?? ""));

  const [business, setBusiness] = useState<BusinessPublic | null>(null);
  const [empleados, setEmpleados] = useState<EmpleadoPublico[]>([]);
  const [hasPublicServices, setHasPublicServices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const accentColor = useMemo(
    () => sanitizeHexColor(business?.brand_primary_color),
    [business?.brand_primary_color]
  );

  const accentTextColor = useMemo(
    () => getContrastTextColor(accentColor),
    [accentColor]
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

        const [empleadosRes, schedulesRes, servicesRes] = await Promise.all([
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

          supabase
            .from("servicios")
            .select("id", { count: "exact", head: true })
            .eq("business_id", typedBusiness.id)
            .eq("public_visible", true),
        ]);

        if (empleadosRes.error) {
          throw new Error(empleadosRes.error.message);
        }

        if (schedulesRes.error) {
          throw new Error(schedulesRes.error.message);
        }

        if (servicesRes.error) {
          throw new Error(servicesRes.error.message);
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

        const publicServicesAvailable = (servicesRes.count ?? 0) > 0;

        setHasPublicServices(publicServicesAvailable);
        setEmpleados(visibles);
      } catch (err) {
        setBusiness(null);
        setEmpleados([]);
        setHasPublicServices(false);
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
    <main
      className="min-h-screen px-6 py-8 md:py-10"
      style={{
        background: `linear-gradient(180deg, ${hexToRgba(
          accentColor,
          0.08
        )} 0%, #fafafa 220px)`,
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
            <div>
              <div
                className="inline-flex rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  color: accentColor,
                  borderColor: hexToRgba(accentColor, 0.2),
                  backgroundColor: hexToRgba(accentColor, 0.08),
                }}
              >
                Reserva online oficial
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
                {business?.name || "Reserva tu cita online"}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                Elige al profesional con el que quieres reservar y consulta sus
                horarios disponibles de forma rápida, cómoda y clara.
              </p>

              {publicBookingMessage ? (
                <div
                  className="mt-6 rounded-3xl border p-5 text-sm leading-6"
                  style={{
                    borderColor: hexToRgba(accentColor, 0.2),
                    backgroundColor: hexToRgba(accentColor, 0.06),
                    color: "#27272a",
                  }}
                >
                  {publicBookingMessage}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#profesionales"
                  className="inline-flex rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                  style={{
                    backgroundColor: accentColor,
                    color: accentTextColor,
                  }}
                >
                  Ver profesionales disponibles
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Reserva online
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Elige profesional
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Horarios disponibles
                </span>
              </div>
            </div>

            <div className="flex h-full flex-col justify-between gap-4">
              <div
                className="rounded-[2rem] p-6"
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(
                    accentColor,
                    0.14
                  )}, ${hexToRgba(accentColor, 0.05)})`,
                  border: `1px solid ${hexToRgba(accentColor, 0.16)}`,
                }}
              >
                {publicLogoUrl ? (
                  <div className="mb-5">
                    <img
                      src={publicLogoUrl}
                      alt={
                        business?.name
                          ? `Logo de ${business.name}`
                          : "Logo del salón"
                      }
                      className="h-20 w-auto rounded-2xl border border-zinc-200 bg-white p-2 object-contain"
                    />
                  </div>
                ) : null}

                <p className="text-sm font-medium text-zinc-700">
                  Reserva en tu salón
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                  {business?.name || "Salón"}
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Una forma sencilla y directa de pedir cita online.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Profesionales disponibles
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                    {loading ? "..." : empleados.length}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Disponibles para reservar online
                  </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Reserva rápida
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Selecciona un profesional y entra directamente en su
                    calendario.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
            {!hasPublicServices ? (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-amber-900">
                  La reserva online no está disponible en este momento
                </h2>
                <p className="mt-2 text-sm text-amber-800">
                  Ahora mismo no es posible continuar con la reserva online.
                  Puedes intentarlo más tarde o ponerte en contacto con el
                  salón.
                </p>
              </section>
            ) : null}

            <section
              id="profesionales"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Selecciona profesional
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
                    Profesionales disponibles para reservar
                  </h2>
                </div>

                <p className="text-sm text-zinc-500">
                  {hasPublicServices
                    ? "Elige con quién quieres tu próxima cita."
                    : "La reserva online no está disponible temporalmente."}
                </p>
              </div>

              {empleados.length === 0 ? (
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 text-zinc-600">
                  Ahora mismo no hay profesionales disponibles para reservar
                  online.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {empleados.map((empleado) => (
                    <article
                      key={empleado.id}
                      className="group rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold"
                            style={{
                              backgroundColor: hexToRgba(accentColor, 0.12),
                              color: accentColor,
                            }}
                          >
                            {getEmployeeInitials(empleado.name)}
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold text-zinc-900">
                              {empleado.name || "Profesional"}
                            </h3>
                            <p className="mt-1 text-sm text-zinc-500">
                              {empleado.role || "Profesional"}
                            </p>
                          </div>
                        </div>

                        <span
                          className="rounded-full border px-3 py-1 text-xs font-medium"
                          style={{
                            color: accentColor,
                            borderColor: hexToRgba(accentColor, 0.22),
                            backgroundColor: hexToRgba(accentColor, 0.08),
                          }}
                        >
                          Online
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
                        <p>
                          <span className="font-medium text-zinc-800">
                            Estado:
                          </span>{" "}
                          {empleado.status || "Disponible"}
                        </p>
                      </div>

                      <div className="mt-6">
                        {hasPublicServices ? (
                          <Link
                            href={`/reservar/${slug}/${empleado.id}`}
                            className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                            style={{
                              backgroundColor: accentColor,
                              color: accentTextColor,
                            }}
                          >
                            Ver calendario y reservar
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-400"
                          >
                            Reserva no disponible
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}