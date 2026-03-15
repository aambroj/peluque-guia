"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Servicio = {
  id: number;
  name: string;
};

type Empleado = {
  id: number;
  name: string;
  status?: string | null;
  public_booking_enabled?: boolean | null;
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

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

export default function PublicEmployeeBookingPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = Number(params.employeeId);

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadBase = async () => {
      setLoadingBase(true);
      setError("");

      try {
        const [employeeRes, servicesRes] = await Promise.all([
          supabase
            .from("empleados")
            .select("id, name, status, public_booking_enabled")
            .eq("id", employeeId)
            .eq("public_booking_enabled", true)
            .maybeSingle(),
          supabase
            .from("servicios")
            .select("id, name")
            .eq("public_visible", true)
            .order("name", { ascending: true }),
        ]);

        if (employeeRes.error) {
          throw new Error(employeeRes.error.message);
        }

        if (servicesRes.error) {
          throw new Error(servicesRes.error.message);
        }

        const loadedEmployee = employeeRes.data as Empleado | null;

        if (!loadedEmployee || !isEmployeePublicBookable(loadedEmployee)) {
          throw new Error("Empleado no disponible para reservas públicas.");
        }

        const loadedServices = (servicesRes.data ?? []) as Servicio[];

        setEmployee(loadedEmployee);
        setServices(loadedServices);

        if (loadedServices.length > 0) {
          setServiceId(String(loadedServices[0].id));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error cargando datos públicos."
        );
      } finally {
        setLoadingBase(false);
      }
    };

    if (Number.isFinite(employeeId) && employeeId > 0) {
      loadBase();
    } else {
      setError("Empleado inválido.");
      setLoadingBase(false);
    }
  }, [employeeId]);

  useEffect(() => {
    const loadMonth = async () => {
      if (!serviceId || !employee || !isEmployeePublicBookable(employee)) return;

      setLoadingMonth(true);
      setError("");

      try {
        const response = await fetch(
          `/api/public-availability?employeeId=${employeeId}&serviceId=${serviceId}&month=${month}`
        );

        const data: MonthAvailabilityResponse | { error: string } =
          await response.json();

        if (!response.ok) {
          throw new Error("error" in data ? data.error : "Error cargando mes.");
        }

        const result = data as MonthAvailabilityResponse;
        setMonthDays(result.days);

        const selectedIsInMonth = selectedDate.startsWith(`${month}-`);
        const selectedStillValid =
          result.days.some((item) => item.date === selectedDate) &&
          !isPastDate(selectedDate);

        if (!selectedIsInMonth || !selectedStillValid) {
          const firstAvailableDate = result.days[0]?.date ?? `${month}-01`;
          setSelectedDate(firstAvailableDate);
          setSelectedTime("");
        }
      } catch (err) {
        setMonthDays([]);
        setError(
          err instanceof Error
            ? err.message
            : "Error cargando disponibilidad mensual."
        );

        if (month === getTodayMonth()) {
          setSelectedDate(getTodayDate());
        }
      } finally {
        setLoadingMonth(false);
      }
    };

    loadMonth();
  }, [employeeId, employee, serviceId, month, selectedDate]);

  useEffect(() => {
    const loadDay = async () => {
      if (!serviceId || !selectedDate || !employee || !isEmployeePublicBookable(employee)) {
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
      setError("");
      setSuccess("");

      try {
        const response = await fetch(
          `/api/public-availability?employeeId=${employeeId}&serviceId=${serviceId}&date=${selectedDate}`
        );

        const data: DayAvailabilityResponse | { error: string } =
          await response.json();

        if (!response.ok) {
          throw new Error("error" in data ? data.error : "Error cargando día.");
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
        setError(
          err instanceof Error
            ? err.message
            : "Error cargando disponibilidad diaria."
        );
      } finally {
        setLoadingDay(false);
      }
    };

    loadDay();
  }, [employeeId, employee, serviceId, selectedDate]);

  const selectedDayFromMonth = useMemo(
    () => monthDays.find((item) => item.date === selectedDate) ?? null,
    [monthDays, selectedDate]
  );

  const calendarCells = useMemo(
    () => getCalendarCells(month, selectedDate, monthDays),
    [month, selectedDate, monthDays]
  );

  const canGoToPreviousMonth = month > getTodayMonth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
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

      if (!clientName.trim()) {
        throw new Error("Introduce tu nombre.");
      }

      if (!phone.trim()) {
        throw new Error("Introduce tu teléfono.");
      }

      const response = await fetch("/api/public-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          serviceId: Number(serviceId),
          date: selectedDate,
          startTime: selectedTime,
          clientName,
          phone,
          notes,
        }),
      });

      const rawText = await response.text();

      let data: any = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            `La API devolvió una respuesta no válida: ${rawText.slice(0, 200)}`
          );
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear la reserva.");
      }

      if (!data?.booking) {
        throw new Error("La API no devolvió los datos de la reserva creada.");
      }

      setSuccess(
        `Reserva creada para el ${formatDate(data.booking.date)} a las ${data.booking.start_time}.`
      );

      setSelectedTime("");
      setNotes("");

      const refreshDay = await fetch(
        `/api/public-availability?employeeId=${employeeId}&serviceId=${serviceId}&date=${selectedDate}`
      );

      const refreshDayText = await refreshDay.text();
      const refreshDayData: DayAvailabilityResponse = JSON.parse(refreshDayText);

      if (refreshDay.ok) {
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
        `/api/public-availability?employeeId=${employeeId}&serviceId=${serviceId}&month=${month}`
      );

      const refreshMonthText = await refreshMonth.text();
      const refreshMonthData: MonthAvailabilityResponse =
        JSON.parse(refreshMonthText);

      if (refreshMonth.ok) {
        setMonthDays(refreshMonthData.days);
      }
    } catch (err) {
      setError(
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
          Cargando formulario público...
        </div>
      </main>
    );
  }

  if (error && !employee) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link
            href="/reservar"
            className="inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            ← Volver a profesionales
          </Link>

          <section className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm text-red-700">
            {error}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/reservar"
            className="inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            ← Volver a profesionales
          </Link>
        </div>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-3xl font-bold tracking-tight">Reserva online</h1>
          <p className="mt-2 text-zinc-600">
            Reserva tu cita con {employee?.name ?? "el empleado seleccionado"}.
          </p>
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
                    setSuccess("");
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
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
                      setSuccess("");
                    }}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ←
                  </button>

                  <div className="flex-1 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-center text-sm font-medium capitalize text-zinc-800">
                    {formatMonthLabel(month)}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMonth(getNextMonth(month));
                      setSelectedTime("");
                      setSuccess("");
                    }}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium transition hover:border-black"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Calendario</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Verde = libre, amarillo = semilibre, rojo = ocupado o no
                    disponible.
                  </p>
                </div>

                {loadingMonth ? (
                  <span className="text-sm text-zinc-500">
                    Cargando mes...
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-7 gap-2">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="rounded-xl bg-zinc-100 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-600"
                  >
                    {label}
                  </div>
                ))}

                {calendarCells.map((cell) => {
                  if (cell.type === "empty") {
                    return (
                      <div
                        key={cell.key}
                        className="min-h-[92px] rounded-2xl border border-transparent"
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
                        setSuccess("");
                      }}
                      className={`min-h-[92px] rounded-2xl border p-3 text-left transition ${
                        cell.isPast
                          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                          : cell.info
                          ? getSoftColorClasses(cell.info.color)
                          : "border-zinc-200 bg-white text-zinc-500"
                      } ${cell.isSelected && !cell.isPast ? "ring-2 ring-black" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {cell.dayNumber}
                        </span>

                        {!cell.isPast && cell.info ? (
                          <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium">
                            {cell.info.slots}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2">
                        {cell.isPast ? (
                          <p className="text-xs">Pasado</p>
                        ) : cell.info ? (
                          <>
                            <p className="-ml-0.5 pr-1 text-[13px] font-semibold leading-tight tracking-tight break-words">
                              {cell.info.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[11px]">
                              {cell.info.detail}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs">Sin datos</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-semibold">Selecciona tu cita</h2>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Día seleccionado</p>
                <p className="mt-1 font-semibold">
                  {selectedDate ? formatDate(selectedDate) : "Sin seleccionar"}
                </p>

                {daySummary ? (
                  <div
                    className={`mt-3 rounded-xl border p-3 ${getColorClasses(
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
                    className={`mt-3 rounded-xl border p-3 ${getColorClasses(
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
                  Horas libres
                </label>

                {loadingDay ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                    Cargando horas...
                  </div>
                ) : daySlots.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                    No hay horas disponibles para ese día.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {daySlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          selectedTime === slot
                            ? "border-black bg-black text-white"
                            : "border-zinc-300 bg-white hover:border-black"
                        }`}
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
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
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
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
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
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                    placeholder="Alguna indicación adicional"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {success}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={saving || !selectedTime}
                  className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
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