"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Empleado = {
  id: number;
  name: string;
  role: string | null;
  status: string | null;
};

type ScheduleRow = {
  employee_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
};

type ScheduleFormRow = {
  weekday: number;
  label: string;
  start_time: string;
  end_time: string;
  is_working: boolean;
};

const WEEKDAYS: Array<{ weekday: number; label: string }> = [
  { weekday: 1, label: "Lunes" },
  { weekday: 2, label: "Martes" },
  { weekday: 3, label: "Miércoles" },
  { weekday: 4, label: "Jueves" },
  { weekday: 5, label: "Viernes" },
  { weekday: 6, label: "Sábado" },
  { weekday: 0, label: "Domingo" },
];

function createDefaultSchedule(): ScheduleFormRow[] {
  return WEEKDAYS.map((day) => {
    const isWeekday = day.weekday >= 1 && day.weekday <= 5;
    const isSaturday = day.weekday === 6;

    return {
      weekday: day.weekday,
      label: day.label,
      is_working: isWeekday || isSaturday,
      start_time: isWeekday ? "09:00" : isSaturday ? "10:00" : "00:00",
      end_time: isWeekday ? "18:00" : isSaturday ? "14:00" : "00:00",
    };
  });
}

function normalizeTime(value: string) {
  if (!value) return "";
  return value.slice(0, 5);
}

function validateRow(row: ScheduleFormRow) {
  if (!row.is_working) return;

  if (!row.start_time || !row.end_time) {
    throw new Error(`Debes indicar hora de inicio y fin para ${row.label}.`);
  }

  if (row.start_time >= row.end_time) {
    throw new Error(`La hora de fin debe ser mayor que la de inicio en ${row.label}.`);
  }
}

export default function EmpleadoHorarioPage() {
  const params = useParams<{ id: string }>();
  const employeeId = Number(params.id);

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [scheduleRows, setScheduleRows] = useState<ScheduleFormRow[]>(
    createDefaultSchedule()
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const orderedRows = useMemo(
    () =>
      [...scheduleRows].sort((a, b) => {
        const orderA = WEEKDAYS.findIndex((item) => item.weekday === a.weekday);
        const orderB = WEEKDAYS.findIndex((item) => item.weekday === b.weekday);
        return orderA - orderB;
      }),
    [scheduleRows]
  );

  useEffect(() => {
    const loadData = async () => {
      if (!Number.isFinite(employeeId) || employeeId <= 0) {
        setError("Empleado inválido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");

      const [employeeRes, scheduleRes] = await Promise.all([
        supabase
          .from("empleados")
          .select("id, name, role, status")
          .eq("id", employeeId)
          .maybeSingle(),
        supabase
          .from("employee_schedules")
          .select("employee_id, weekday, start_time, end_time, is_working")
          .eq("employee_id", employeeId),
      ]);

      if (employeeRes.error) {
        setError(employeeRes.error.message || "No se pudo cargar el empleado.");
        setLoading(false);
        return;
      }

      if (scheduleRes.error) {
        setError(scheduleRes.error.message || "No se pudo cargar el horario.");
        setLoading(false);
        return;
      }

      if (!employeeRes.data) {
        setError("No se encontró el empleado.");
        setLoading(false);
        return;
      }

      setEmpleado(employeeRes.data as Empleado);

      const defaults = createDefaultSchedule();
      const dbRows = (scheduleRes.data ?? []) as ScheduleRow[];

      const merged = defaults.map((defaultRow) => {
        const found = dbRows.find((item) => item.weekday === defaultRow.weekday);

        if (!found) {
          return defaultRow;
        }

        return {
          weekday: found.weekday,
          label: defaultRow.label,
          start_time: normalizeTime(found.start_time),
          end_time: normalizeTime(found.end_time),
          is_working: found.is_working,
        };
      });

      setScheduleRows(merged);
      setLoading(false);
    };

    loadData();
  }, [employeeId]);

  const updateRow = (
    weekday: number,
    field: keyof Omit<ScheduleFormRow, "weekday" | "label">,
    value: string | boolean
  ) => {
    setScheduleRows((prev) =>
      prev.map((row) => {
        if (row.weekday !== weekday) return row;

        if (field === "is_working") {
          const checked = Boolean(value);

          if (!checked) {
            return {
              ...row,
              is_working: false,
              start_time: "00:00",
              end_time: "00:00",
            };
          }

          const start =
            row.start_time && row.start_time !== "00:00" ? row.start_time : "09:00";
          const end =
            row.end_time && row.end_time !== "00:00" ? row.end_time : "18:00";

          return {
            ...row,
            is_working: true,
            start_time: start,
            end_time: end,
          };
        }

        return {
          ...row,
          [field]: value,
        };
      })
    );
  };

  const applyWeekdayTemplate = () => {
    const monday = scheduleRows.find((row) => row.weekday === 1);

    if (!monday || !monday.is_working) {
      setError("Primero configura el lunes como día laborable.");
      return;
    }

    setError("");
    setSuccess("");

    setScheduleRows((prev) =>
      prev.map((row) => {
        if (row.weekday >= 1 && row.weekday <= 5) {
          return {
            ...row,
            is_working: true,
            start_time: monday.start_time,
            end_time: monday.end_time,
          };
        }

        return row;
      })
    );
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    try {
      for (const row of orderedRows) {
        validateRow(row);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Horario inválido.");
      return;
    }

    setSaving(true);

    const payload = orderedRows.map((row) => ({
      employee_id: employeeId,
      weekday: row.weekday,
      start_time: row.is_working ? row.start_time : "00:00",
      end_time: row.is_working ? row.end_time : "00:00",
      is_working: row.is_working,
    }));

    const { error } = await supabase
      .from("employee_schedules")
      .upsert(payload, {
        onConflict: "employee_id,weekday",
      });

    setSaving(false);

    if (error) {
      setError(error.message || "No se pudo guardar el horario.");
      return;
    }

    setSuccess("Horario guardado correctamente.");
  };

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando horario del empleado...
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
                Horario semanal
              </h1>
              <p className="mt-2 text-zinc-600">
                Gestiona los días y horas de trabajo de{" "}
                <span className="font-medium text-zinc-900">
                  {empleado?.name ?? "este empleado"}
                </span>.
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {empleado?.role || "Profesional del salón"} ·{" "}
                {empleado?.status || "Disponible"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={applyWeekdayTemplate}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:border-black"
              >
                Copiar lunes a laborables
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar horario"}
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

        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr] gap-4 border-b border-zinc-200 px-6 py-4 text-sm font-semibold text-zinc-700">
            <div>Día</div>
            <div>Trabaja</div>
            <div>Inicio</div>
            <div>Fin</div>
          </div>

          <div className="divide-y divide-zinc-200">
            {orderedRows.map((row) => (
              <div
                key={row.weekday}
                className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr] gap-4 px-6 py-4"
              >
                <div className="flex items-center font-medium text-zinc-900">
                  {row.label}
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={row.is_working}
                      onChange={(e) =>
                        updateRow(row.weekday, "is_working", e.target.checked)
                      }
                    />
                    {row.is_working ? "Sí" : "No"}
                  </label>
                </div>

                <div>
                  <input
                    type="time"
                    value={row.start_time}
                    disabled={!row.is_working}
                    onChange={(e) =>
                      updateRow(row.weekday, "start_time", e.target.value)
                    }
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                </div>

                <div>
                  <input
                    type="time"
                    value={row.end_time}
                    disabled={!row.is_working}
                    onChange={(e) =>
                      updateRow(row.weekday, "end_time", e.target.value)
                    }
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}