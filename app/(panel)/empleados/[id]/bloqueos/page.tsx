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

type TimeOffRow = {
  id: string;
  employee_id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  is_full_day: boolean;
  created_at?: string | null;
};

type TimeOffFormRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  is_full_day: boolean;
};

function getTodayDateISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTime(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 5);
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function createEmptyNewBlock() {
  return {
    date: getTodayDateISO(),
    start_time: "14:00",
    end_time: "15:00",
    reason: "",
    is_full_day: false,
  };
}

function validateBlock(row: {
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
  is_full_day: boolean;
}) {
  if (!row.date) {
    throw new Error("La fecha es obligatoria.");
  }

  if (row.is_full_day) {
    return;
  }

  if (!row.start_time || !row.end_time) {
    throw new Error("Debes indicar hora de inicio y fin para un bloqueo parcial.");
  }

  if (row.start_time >= row.end_time) {
    throw new Error("La hora de fin debe ser mayor que la de inicio.");
  }
}

export default function EmpleadoBloqueosPage() {
  const params = useParams<{ id: string }>();
  const employeeId = Number(params.id);

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [rows, setRows] = useState<TimeOffFormRow[]>([]);
  const [newBlock, setNewBlock] = useState(createEmptyNewBlock());

  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const savingSet = useMemo(() => new Set(savingIds), [savingIds]);
  const deletingSet = useMemo(() => new Set(deletingIds), [deletingIds]);

  const loadData = async () => {
    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      setError("Empleado inválido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const [employeeRes, blocksRes] = await Promise.all([
      supabase
        .from("empleados")
        .select("id, name, role, status")
        .eq("id", employeeId)
        .maybeSingle(),
      supabase
        .from("employee_time_off")
        .select("id, employee_id, date, start_time, end_time, reason, is_full_day, created_at")
        .eq("employee_id", employeeId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true }),
    ]);

    if (employeeRes.error) {
      setError(employeeRes.error.message || "No se pudo cargar el empleado.");
      setLoading(false);
      return;
    }

    if (blocksRes.error) {
      setError(blocksRes.error.message || "No se pudieron cargar los bloqueos.");
      setLoading(false);
      return;
    }

    if (!employeeRes.data) {
      setError("No se encontró el empleado.");
      setLoading(false);
      return;
    }

    setEmpleado(employeeRes.data as Empleado);

    const mappedRows = ((blocksRes.data ?? []) as TimeOffRow[]).map((item) => ({
      id: item.id,
      date: item.date,
      start_time: normalizeTime(item.start_time),
      end_time: normalizeTime(item.end_time),
      reason: item.reason ?? "",
      is_full_day: item.is_full_day,
    }));

    setRows(mappedRows);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const updateRow = (
    id: string,
    field: keyof Omit<TimeOffFormRow, "id">,
    value: string | boolean
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (field === "is_full_day") {
          const checked = Boolean(value);

          return {
            ...row,
            is_full_day: checked,
            start_time: checked ? "" : row.start_time || "09:00",
            end_time: checked ? "" : row.end_time || "18:00",
          };
        }

        return {
          ...row,
          [field]: value,
        };
      })
    );
  };

  const updateNewBlock = (
    field: keyof typeof newBlock,
    value: string | boolean
  ) => {
    setNewBlock((prev) => {
      if (field === "is_full_day") {
        const checked = Boolean(value);

        return {
          ...prev,
          is_full_day: checked,
          start_time: checked ? "" : prev.start_time || "09:00",
          end_time: checked ? "" : prev.end_time || "18:00",
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const saveRow = async (row: TimeOffFormRow) => {
    setError("");
    setSuccess("");

    try {
      validateBlock(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bloqueo inválido.");
      return;
    }

    setSavingIds((prev) => [...prev, row.id]);

    const payload = {
      date: row.date,
      start_time: row.is_full_day ? null : row.start_time,
      end_time: row.is_full_day ? null : row.end_time,
      reason: row.reason.trim() || null,
      is_full_day: row.is_full_day,
    };

    const { error } = await supabase
      .from("employee_time_off")
      .update(payload)
      .eq("id", row.id);

    setSavingIds((prev) => prev.filter((item) => item !== row.id));

    if (error) {
      setError(error.message || "No se pudo guardar el bloqueo.");
      return;
    }

    setSuccess("Bloqueo guardado correctamente.");
  };

  const deleteRow = async (id: string) => {
    setError("");
    setSuccess("");
    setDeletingIds((prev) => [...prev, id]);

    const { error } = await supabase
      .from("employee_time_off")
      .delete()
      .eq("id", id);

    setDeletingIds((prev) => prev.filter((item) => item !== id));

    if (error) {
      setError(error.message || "No se pudo borrar el bloqueo.");
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== id));
    setSuccess("Bloqueo eliminado correctamente.");
  };

  const createBlock = async () => {
    setError("");
    setSuccess("");

    try {
      validateBlock(newBlock);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bloqueo inválido.");
      return;
    }

    setCreating(true);

    const payload = {
      employee_id: employeeId,
      date: newBlock.date,
      start_time: newBlock.is_full_day ? null : newBlock.start_time,
      end_time: newBlock.is_full_day ? null : newBlock.end_time,
      reason: newBlock.reason.trim() || null,
      is_full_day: newBlock.is_full_day,
    };

    const { data, error } = await supabase
      .from("employee_time_off")
      .insert([payload])
      .select("id, date, start_time, end_time, reason, is_full_day")
      .single();

    setCreating(false);

    if (error) {
      setError(error.message || "No se pudo crear el bloqueo.");
      return;
    }

    if (data) {
      const newRow: TimeOffFormRow = {
        id: data.id,
        date: data.date,
        start_time: normalizeTime(data.start_time),
        end_time: normalizeTime(data.end_time),
        reason: data.reason ?? "",
        is_full_day: data.is_full_day,
      };

      setRows((prev) =>
        [...prev, newRow].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.start_time.localeCompare(b.start_time);
        })
      );
    }

    setNewBlock(createEmptyNewBlock());
    setSuccess("Bloqueo creado correctamente.");
  };

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando bloqueos del empleado...
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">
            Vacaciones y bloqueos
          </h1>
          <p className="mt-2 text-zinc-600">
            Gestiona ausencias, vacaciones, descansos y bloqueos de{" "}
            <span className="font-medium text-zinc-900">
              {empleado?.name ?? "este empleado"}
            </span>.
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {empleado?.role || "Profesional del salón"} ·{" "}
            {empleado?.status || "Disponible"}
          </p>
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

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Añadir bloqueo</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Crea vacaciones de día completo o descansos por horas.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Fecha
              </label>
              <input
                type="date"
                value={newBlock.date}
                onChange={(e) => updateNewBlock("date", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div className="flex items-end">
              <label className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={newBlock.is_full_day}
                  onChange={(e) =>
                    updateNewBlock("is_full_day", e.target.checked)
                  }
                />
                Día completo
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Inicio
              </label>
              <input
                type="time"
                value={newBlock.start_time}
                disabled={newBlock.is_full_day}
                onChange={(e) => updateNewBlock("start_time", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Fin
              </label>
              <input
                type="time"
                value={newBlock.end_time}
                disabled={newBlock.is_full_day}
                onChange={(e) => updateNewBlock("end_time", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Motivo
              </label>
              <input
                value={newBlock.reason}
                onChange={(e) => updateNewBlock("reason", e.target.value)}
                placeholder="Ej. Vacaciones, comida, médico..."
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={createBlock}
              disabled={creating}
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {creating ? "Creando..." : "Crear bloqueo"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="text-xl font-semibold">Bloqueos existentes</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Edita o elimina vacaciones y descansos ya guardados.
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="px-6 py-8 text-sm text-zinc-500">
              No hay bloqueos registrados para este empleado.
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {rows.map((row) => {
                const isSaving = savingSet.has(row.id);
                const isDeleting = deletingSet.has(row.id);

                return (
                  <article
                    key={row.id}
                    className="rounded-2xl border border-zinc-200 p-5"
                  >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) =>
                            updateRow(row.id, "date", e.target.value)
                          }
                          className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                          <input
                            type="checkbox"
                            checked={row.is_full_day}
                            onChange={(e) =>
                              updateRow(row.id, "is_full_day", e.target.checked)
                            }
                          />
                          Día completo
                        </label>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">
                          Inicio
                        </label>
                        <input
                          type="time"
                          value={row.start_time}
                          disabled={row.is_full_day}
                          onChange={(e) =>
                            updateRow(row.id, "start_time", e.target.value)
                          }
                          className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">
                          Fin
                        </label>
                        <input
                          type="time"
                          value={row.end_time}
                          disabled={row.is_full_day}
                          onChange={(e) =>
                            updateRow(row.id, "end_time", e.target.value)
                          }
                          className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">
                          Motivo
                        </label>
                        <input
                          value={row.reason}
                          onChange={(e) =>
                            updateRow(row.id, "reason", e.target.value)
                          }
                          placeholder="Motivo del bloqueo"
                          className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                        {row.is_full_day
                          ? `Bloqueo completo · ${formatDate(row.date)}`
                          : `Bloqueo parcial · ${formatDate(row.date)} · ${row.start_time} - ${row.end_time}`}
                      </div>

                      <button
                        type="button"
                        onClick={() => saveRow(row)}
                        disabled={isSaving}
                        className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        disabled={isDeleting}
                        className="rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}