"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Servicio = {
  id: number;
  name: string;
  status?: string | null;
};

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

type Empleado = {
  id: number;
  business_id?: number | null;
  name: string;
  status?: string | null;
  public_booking_enabled?: boolean | null;
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

type DayColor = "green" | "orange" | "red";

type DayItem = {
  date: string;
  color: DayColor;
  title: string;
  detail: string;
  slots: number;
};

type DayAvailabilityResponse = {
  employee: Empleado;
  service: {
    id: number;
    name: string;
    duration_minutes: number;
  };
  date: string;
  summary: {
    color: DayColor;
    title: string;
    detail: string;
    slots: number;
  };
  availableSlots: string[];
};

type MonthAvailabilityResponse = {
  employee: Empleado;
  service: {
    id: number;
    name: string;
    duration_minutes: number;
  };
  month: string;
  days: DayItem[];
};

type CalendarCell =
  | {
      type: "empty";
      key: string;
    }
  | {
      type: "day";
      key: string;
      date: string;
      dayNumber: number;
      isPast: boolean;
      isSelected: boolean;
      info: DayItem | null;
    };

type BookingSuccess = {
  date: string;
  time: string;
  serviceName: string;
  employeeName: string;
  businessName: string | null;
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

function isEmployeePublicBookable(employee: Empleado | null) {
  if (!employee) return false;

  const status = normalizeStatus(employee.status);

  return (
    employee.public_booking_enabled === true &&
    status !== "descanso" &&
    status !== "vacaciones" &&
    status !== "inactivo"
  );
}

function isServicePublicBookable(service: Servicio | null) {
  if (!service) return false;

  const status = normalizeStatus(service.status);

  return status === "" || status === "activo";
}

function getTodayMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function getColorClasses(color: DayColor) {
  if (color === "green") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (color === "orange") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function getSoftColorClasses(color: DayColor) {
  if (color === "green") {
    return "border-green-200 bg-green-50 text-green-700 hover:border-green-300";
  }

  if (color === "orange") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700 hover:border-yellow-300";
  }

  return "border-red-200 bg-red-50 text-red-700 hover:border-red-300";
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);

  return date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}

function isPastDate(date: string) {
  return date < getTodayDate();
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getNextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getMonthDaysCount(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

function getMonthFirstWeekdayIndexMondayFirst(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const sundayFirst = new Date(year, monthNumber - 1, 1).getDay();
  return sundayFirst === 0 ? 6 : sundayFirst - 1;
}

function getCalendarCells(month: string, selectedDate: string, days: DayItem[]) {
  const daysMap = new Map(days.map((item) => [item.date, item]));
  const totalDays = getMonthDaysCount(month);
  const firstWeekdayIndex = getMonthFirstWeekdayIndexMondayFirst(month);

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstWeekdayIndex; i += 1) {
    cells.push({
      type: "empty",
      key: `empty-${i}`,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    cells.push({
      type: "day",
      key: date,
      date,
      dayNumber: day,
      isPast: isPastDate(date),
      isSelected: date === selectedDate,
      info: daysMap.get(date) ?? null,
    });
  }

  return cells;
}

function getBestSelectedDate(days: DayItem[], month: string) {
  const firstFutureWithSlots = days.find(
    (item) => !isPastDate(item.date) && item.slots > 0
  );

  if (firstFutureWithSlots) {
    return firstFutureWithSlots.date;
  }

  const firstFutureDay = days.find((item) => !isPastDate(item.date));

  if (firstFutureDay) {
    return firstFutureDay.date;
  }

  return `${month}-01`;
}

function buildAvailabilityUrl(params: {
  slug: string;
  employeeId: number;
  serviceId: string;
  date?: string;
  month?: string;
}) {
  const search = new URLSearchParams();
  search.set("slug", normalizeSlug(params.slug));
  search.set("employeeId", String(params.employeeId));
  search.set("serviceId", params.serviceId);

  if (params.date) search.set("date", params.date);
  if (params.month) search.set("month", params.month);

  return `/api/public-availability?${search.toString()}`;
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

async function safeJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function PublicEmployeeBookingPage() {
  const params = useParams<{ slug: string; employeeId: string }>();

  const slug = normalizeSlug(String(params.slug ?? ""));
  const employeeId = Number(params.employeeId);

  const [business, setBusiness] = useState<BusinessPublic | null>(null);
  const [employee, setEmployee] = useState<Empleado | null>(null);
  const [services, setServices] = useState<Servicio[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [month, setMonth] = useState(getTodayMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedTime, setSelectedTime] = useState("");

  const [monthDays, setMonthDays] = useState<DayItem[]>([]);
  const [daySlots, setDaySlots] = useState<string[]>([]);
  const [daySummary, setDaySummary] = useState<DayItem | null>(null);

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccess | null>(
    null
  );

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

  const selectedService = useMemo(
    () => services.find((service) => String(service.id) === serviceId) ?? null,
    [services, serviceId]
  );

  useEffect(() => {
    const loadBase = async () => {
      setLoadingBase(true);
      setPageError("");
      setFormError("");

      try {
        if (!slug) {
          throw new Error("Salón público no válido.");
        }

        if (!Number.isFinite(employeeId) || employeeId <= 0) {
          throw new Error("Profesional no válido.");
        }

        const businessResponse = await fetch(
          `/api/public-business?slug=${encodeURIComponent(slug)}`
        );

        const businessPayload = await safeJson<
          PublicBusinessResponse | { error?: string }
        >(businessResponse);

        if (
          !businessResponse.ok ||
          !businessPayload ||
          !("business" in businessPayload)
        ) {
          throw new Error(
            (businessPayload &&
              "error" in businessPayload &&
              businessPayload.error) ||
              "No se encontró el salón solicitado."
          );
        }

        const businessData = businessPayload.business;

        const [employeeRes, servicesRes, schedulesRes] = await Promise.all([
          supabase
            .from("empleados")
            .select("id, business_id, name, status, public_booking_enabled")
            .eq("id", employeeId)
            .eq("business_id", businessData.id)
            .eq("public_booking_enabled", true)
            .maybeSingle(),

          supabase
            .from("servicios")
            .select("id, name, status")
            .eq("business_id", businessData.id)
            .eq("public_visible", true)
            .or("status.is.null,status.eq.Activo")
            .order("name", { ascending: true }),

          supabase
            .from("employee_schedules")
            .select(
              "id, business_id, employee_id, weekday, start_time, end_time, is_working"
            )
            .eq("business_id", businessData.id)
            .eq("employee_id", employeeId),
        ]);

        if (employeeRes.error) {
          throw new Error(employeeRes.error.message);
        }

        if (servicesRes.error) {
          throw new Error(servicesRes.error.message);
        }

        if (schedulesRes.error) {
          throw new Error(schedulesRes.error.message);
        }

        const loadedEmployee = employeeRes.data as Empleado | null;

        if (!loadedEmployee || !isEmployeePublicBookable(loadedEmployee)) {
          throw new Error(
            "Este profesional no está disponible para reserva online."
          );
        }

        const loadedSchedules = (schedulesRes.data ?? []) as ScheduleRow[];

        if (!hasValidWorkingSchedule(loadedSchedules)) {
          throw new Error(
            "Este profesional todavía no tiene horarios disponibles para reserva online."
          );
        }

        const loadedServices = ((servicesRes.data ?? []) as Servicio[]).filter(
          isServicePublicBookable
        );

        if (loadedServices.length === 0) {
          throw new Error(
            "Ahora mismo no hay servicios disponibles para reservar online."
          );
        }

        setBusiness(businessData);
        setEmployee(loadedEmployee);
        setServices(loadedServices);
        setServiceId(String(loadedServices[0].id));
      } catch (err) {
        setBusiness(null);
        setEmployee(null);
        setServices([]);
        setServiceId("");
        setPageError(
          err instanceof Error ? err.message : "Error cargando datos públicos."
        );
      } finally {
        setLoadingBase(false);
      }
    };

    loadBase();
  }, [slug, employeeId]);

  useEffect(() => {
    if (!services.length) {
      setServiceId("");
      return;
    }

    const exists = services.some((service) => String(service.id) === serviceId);

    if (!exists) {
      setServiceId(String(services[0].id));
      setSelectedTime("");
      setBookingSuccess(null);
      setFormError("");
    }
  }, [services, serviceId]);

  useEffect(() => {
    const loadMonth = async () => {
      if (
        !serviceId ||
        !employee ||
        !isEmployeePublicBookable(employee) ||
        !slug
      ) {
        return;
      }

      setLoadingMonth(true);
      setFormError("");

      try {
        const response = await fetch(
          buildAvailabilityUrl({
            slug,
            employeeId,
            serviceId,
            month,
          })
        );

        const data = await safeJson<MonthAvailabilityResponse | { error: string }>(
          response
        );

        if (!response.ok || !data) {
          throw new Error(
            data && "error" in data ? data.error : "No se pudo cargar el mes."
          );
        }

        const result = data as MonthAvailabilityResponse;
        setMonthDays(result.days);

        const selectedIsInMonth = selectedDate.startsWith(`${month}-`);
        const selectedStillValid =
          result.days.some((item) => item.date === selectedDate) &&
          !isPastDate(selectedDate);

        if (!selectedIsInMonth || !selectedStillValid) {
          setSelectedDate(getBestSelectedDate(result.days, month));
          setSelectedTime("");
        }
      } catch (err) {
        setMonthDays([]);
        setFormError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la disponibilidad mensual."
        );

        if (month === getTodayMonth()) {
          setSelectedDate(getTodayDate());
        }
      } finally {
        setLoadingMonth(false);
      }
    };

    loadMonth();
  }, [slug, employeeId, employee, serviceId, month, selectedDate]);

  useEffect(() => {
    const loadDay = async () => {
      if (
        !serviceId ||
        !selectedDate ||
        !employee ||
        !isEmployeePublicBookable(employee) ||
        !slug
      ) {
        setDaySlots([]);
        setDaySummary(null);
        setSelectedTime("");
        return;
      }

      if (isPastDate(selectedDate)) {
        setDaySlots([]);
        setDaySummary({
          date: selectedDate,
          color: "red",
          title: "Fecha pasada",
          detail: "No se puede reservar en días anteriores a hoy.",
          slots: 0,
        });
        setSelectedTime("");
        return;
      }

      setLoadingDay(true);
      setFormError("");

      try {
        const response = await fetch(
          buildAvailabilityUrl({
            slug,
            employeeId,
            serviceId,
            date: selectedDate,
          })
        );

        const data = await safeJson<DayAvailabilityResponse | { error: string }>(
          response
        );

        if (!response.ok || !data) {
          throw new Error(
            data && "error" in data ? data.error : "No se pudo cargar ese día."
          );
        }

        const result = data as DayAvailabilityResponse;

        setDaySlots(result.availableSlots);
        setDaySummary({
          date: result.date,
          color: result.summary.color,
          title: result.summary.title,
          detail: result.summary.detail,
          slots: result.summary.slots,
        });

        setSelectedTime((prev) =>
          result.availableSlots.includes(prev) ? prev : ""
        );
      } catch (err) {
        setDaySlots([]);
        setDaySummary(null);
        setSelectedTime("");
        setFormError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la disponibilidad diaria."
        );
      } finally {
        setLoadingDay(false);
      }
    };

    loadDay();
  }, [slug, employeeId, employee, serviceId, selectedDate]);

  const selectedDayFromMonth = useMemo(
    () => monthDays.find((item) => item.date === selectedDate) ?? null,
    [monthDays, selectedDate]
  );

  const calendarCells = useMemo(
    () => getCalendarCells(month, selectedDate, monthDays),
    [month, selectedDate, monthDays]
  );

  const canGoToPreviousMonth = month > getTodayMonth();

  const resetForAnotherBooking = () => {
    setBookingSuccess(null);
    setFormError("");
    setSelectedTime("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    setBookingSuccess(null);

    try {
      const trimmedClientName = clientName.trim();
      const trimmedPhone = phone.trim();
      const trimmedNotes = notes.trim();

      if (!slug) {
        throw new Error("Salón público no válido.");
      }

      if (!serviceId) {
        throw new Error("Selecciona un servicio.");
      }

      if (!selectedDate) {
        throw new Error("Selecciona un día.");
      }

      if (isPastDate(selectedDate)) {
        throw new Error("No se puede reservar en fechas pasadas.");
      }

      if (!selectedTime) {
        throw new Error("Selecciona una hora.");
      }

      if (!trimmedClientName) {
        throw new Error("Introduce tu nombre.");
      }

      if (!trimmedPhone) {
        throw new Error("Introduce tu teléfono.");
      }

      const response = await fetch("/api/public-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          employeeId,
          serviceId: Number(serviceId),
          date: selectedDate,
          startTime: selectedTime,
          clientName: trimmedClientName,
          phone: trimmedPhone,
          notes: trimmedNotes,
        }),
      });

      const data = await safeJson<any>(response);

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo completar la reserva.");
      }

      if (!data?.booking) {
        throw new Error("No se pudo obtener el resumen de la reserva creada.");
      }

      setBookingSuccess({
        date: data.booking.date,
        time: data.booking.start_time,
        serviceName: selectedService?.name ?? "Servicio",
        employeeName: employee?.name ?? "Profesional",
        businessName: business?.name ?? null,
      });

      setSelectedTime("");
      setClientName("");
      setPhone("");
      setNotes("");

      const refreshDay = await fetch(
        buildAvailabilityUrl({
          slug,
          employeeId,
          serviceId,
          date: selectedDate,
        })
      );

      const refreshDayData = await safeJson<DayAvailabilityResponse>(refreshDay);

      if (refreshDay.ok && refreshDayData) {
        setDaySlots(refreshDayData.availableSlots);
        setDaySummary({
          date: refreshDayData.date,
          color: refreshDayData.summary.color,
          title: refreshDayData.summary.title,
          detail: refreshDayData.summary.detail,
          slots: refreshDayData.summary.slots,
        });
      }

      const refreshMonth = await fetch(
        buildAvailabilityUrl({
          slug,
          employeeId,
          serviceId,
          month,
        })
      );

      const refreshMonthData = await safeJson<MonthAvailabilityResponse>(
        refreshMonth
      );

      if (refreshMonth.ok && refreshMonthData) {
        setMonthDays(refreshMonthData.days);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Error al crear la reserva."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingBase) {
    return (
      <main className="min-h-screen bg-zinc-50 px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando formulario de reserva...
        </div>
      </main>
    );
  }

  if (pageError && !employee) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link
            href={slug ? `/reservar/${slug}` : "/reservar"}
            className="inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            ← Volver al salón
          </Link>

          <section className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {pageError}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-8 md:px-6 md:py-10"
      style={{
        background: `linear-gradient(180deg, ${hexToRgba(
          accentColor,
          0.08
        )} 0%, #fafafa 240px)`,
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={slug ? `/reservar/${slug}` : "/reservar"}
            className="inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            ← Volver al salón
          </Link>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
            <div>
              <div
                className="inline-flex rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  color: accentColor,
                  borderColor: hexToRgba(accentColor, 0.22),
                  backgroundColor: hexToRgba(accentColor, 0.08),
                }}
              >
                Reserva online
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
                Reserva tu cita con {employee?.name ?? "tu profesional"}
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
                {business?.name ? `${business.name}. ` : ""}
                Elige el servicio, selecciona el día y la hora que prefieras y
                completa tus datos para pedir tu cita.
              </p>

              {publicBookingMessage ? (
                <div
                  className="mt-6 rounded-3xl border p-5 text-sm leading-6"
                  style={{
                    borderColor: hexToRgba(accentColor, 0.22),
                    backgroundColor: hexToRgba(accentColor, 0.06),
                    color: "#27272a",
                  }}
                >
                  {publicBookingMessage}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Elige servicio
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Horarios disponibles
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium text-zinc-700">
                  Reserva online directa
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
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

                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-base font-bold"
                    style={{
                      backgroundColor: hexToRgba(accentColor, 0.12),
                      color: accentColor,
                    }}
                  >
                    {getEmployeeInitials(employee?.name)}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      Profesional seleccionado
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
                      {employee?.name ?? "Profesional"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {business?.name ?? "Salón"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Mes actual
                  </p>
                  <p className="mt-2 text-2xl font-bold capitalize tracking-tight text-zinc-900">
                    {formatMonthLabel(month)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Puedes cambiar de mes cuando quieras.
                  </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">
                    Día elegido
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                    {selectedDate ? formatDate(selectedDate) : "--/--/----"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Después solo tendrás que escoger una hora disponible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Servicio
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => {
                    setServiceId(e.target.value);
                    setSelectedTime("");
                    setBookingSuccess(null);
                    setFormError("");
                  }}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-black"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Mes
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canGoToPreviousMonth}
                    onClick={() => {
                      if (!canGoToPreviousMonth) return;
                      setMonth(getPreviousMonth(month));
                      setSelectedTime("");
                      setBookingSuccess(null);
                      setFormError("");
                    }}
                    className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ←
                  </button>

                  <div className="flex-1 rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-sm font-medium capitalize text-zinc-800">
                    {formatMonthLabel(month)}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMonth(getNextMonth(month));
                      setSelectedTime("");
                      setBookingSuccess(null);
                      setFormError("");
                    }}
                    className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-black"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">
                    Calendario de disponibilidad
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Verde = más disponibilidad, amarillo = disponibilidad media,
                    rojo = no disponible o casi completo.
                  </p>
                </div>

                {loadingMonth ? (
                  <span className="text-sm text-zinc-500">Cargando mes...</span>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 md:hidden">
                Desliza lateralmente para ver el calendario completo.
              </div>

              <div className="mt-3 overflow-x-auto pb-2">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-7 gap-2 md:gap-3">
                    {WEEKDAY_LABELS.map((label) => (
                      <div
                        key={label}
                        className="rounded-xl bg-zinc-100 px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:text-xs"
                      >
                        {label}
                      </div>
                    ))}

                    {calendarCells.map((cell) => {
                      if (cell.type === "empty") {
                        return (
                          <div
                            key={cell.key}
                            className="min-h-[92px] rounded-2xl border border-transparent sm:min-h-[100px]"
                          />
                        );
                      }

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          disabled={cell.isPast}
                          onClick={() => {
                            if (cell.isPast) return;
                            setSelectedDate(cell.date);
                            setSelectedTime("");
                            setBookingSuccess(null);
                            setFormError("");
                          }}
                          className={`min-h-[100px] rounded-2xl border p-3 text-left transition sm:min-h-[112px] ${
                            cell.isPast
                              ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                              : cell.info
                              ? getSoftColorClasses(cell.info.color)
                              : "border-zinc-200 bg-white text-zinc-500"
                          }`}
                          style={
                            cell.isSelected && !cell.isPast
                              ? { boxShadow: `0 0 0 2px ${accentColor}` }
                              : undefined
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold sm:text-base">
                              {cell.dayNumber}
                            </span>

                            {!cell.isPast && cell.info ? (
                              <span className="shrink-0 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold leading-none sm:text-[11px]">
                                {cell.info.slots}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2">
                            {cell.isPast ? (
                              <p className="text-[11px] sm:text-xs">Pasado</p>
                            ) : cell.info ? (
                              <>
                                <p className="pr-1 text-xs font-semibold leading-tight tracking-tight break-normal sm:text-[13px]">
                                  {cell.info.title}
                                </p>
                                <p className="mt-1 hidden text-[11px] leading-4 md:line-clamp-2 md:block">
                                  {cell.info.detail}
                                </p>
                              </>
                            ) : (
                              <p className="text-[11px] sm:text-xs">
                                Sin datos
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold text-zinc-900">
              Completa tu reserva
            </h2>

            <div className="mt-4 space-y-4">
              {bookingSuccess ? (
                <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                  <div className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                    Reserva confirmada
                  </div>

                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-emerald-900">
                    Tu cita ha quedado registrada
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Hemos guardado correctamente tu reserva. Este es el resumen
                    de tu cita:
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Salón
                      </p>
                      <p className="mt-1 text-base font-semibold text-zinc-900">
                        {bookingSuccess.businessName ?? "Salón"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Profesional
                      </p>
                      <p className="mt-1 text-base font-semibold text-zinc-900">
                        {bookingSuccess.employeeName}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Servicio
                      </p>
                      <p className="mt-1 text-base font-semibold text-zinc-900">
                        {bookingSuccess.serviceName}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Fecha y hora
                      </p>
                      <p className="mt-1 text-base font-semibold text-zinc-900">
                        {formatDate(bookingSuccess.date)} · {bookingSuccess.time}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={resetForAnotherBooking}
                      className="rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                      style={{
                        backgroundColor: accentColor,
                        color: accentTextColor,
                      }}
                    >
                      Reservar otra cita
                    </button>

                    <Link
                      href={slug ? `/reservar/${slug}` : "/reservar"}
                      className="rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                    >
                      Volver al salón
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Día seleccionado</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {selectedDate ? formatDate(selectedDate) : "Sin seleccionar"}
                </p>

                {daySummary ? (
                  <div
                    className={`mt-3 rounded-2xl border p-3 ${getColorClasses(
                      daySummary.color
                    )}`}
                  >
                    <p className="text-[16px] font-semibold">
                      {daySummary.title}
                    </p>
                    <p className="mt-1 text-sm">{daySummary.detail}</p>
                  </div>
                ) : selectedDayFromMonth ? (
                  <div
                    className={`mt-3 rounded-2xl border p-3 ${getColorClasses(
                      selectedDayFromMonth.color
                    )}`}
                  >
                    <p className="text-[16px] font-semibold">
                      {selectedDayFromMonth.title}
                    </p>
                    <p className="mt-1 text-sm">
                      {selectedDayFromMonth.detail}
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Horarios disponibles
                </label>

                {loadingDay ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                    Cargando horarios...
                  </div>
                ) : daySlots.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                    No hay horarios disponibles para ese día.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {daySlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setSelectedTime(slot);
                          setBookingSuccess(null);
                          setFormError("");
                        }}
                        className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                          selectedTime === slot
                            ? ""
                            : "border-zinc-300 bg-white text-zinc-800 hover:border-black"
                        }`}
                        style={
                          selectedTime === slot
                            ? {
                                backgroundColor: accentColor,
                                borderColor: accentColor,
                                color: accentTextColor,
                              }
                            : undefined
                        }
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Nombre
                  </label>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-black"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Teléfono
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="tel"
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-black"
                    placeholder="Tu teléfono"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Notas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-black"
                    placeholder="Alguna indicación adicional, si la necesitas"
                  />
                </div>

                {formError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {formError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={saving || !selectedTime}
                  className="w-full rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: accentColor,
                    color: accentTextColor,
                  }}
                >
                  {saving ? "Reservando..." : "Confirmar reserva"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}