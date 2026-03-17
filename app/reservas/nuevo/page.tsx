"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBookingAvailability } from "@/lib/bookingAvailability";
import {
  buildBookingTimes,
  isSlotStillAvailable,
  normalizeDateToISO,
} from "@/lib/availability";

type Cliente = {
  id: number;
  name: string;
};

type Empleado = {
  id: number;
  name: string;
  status?: string | null;
};

type Servicio = {
  id: number;
  name: string;
};

type DayStatus = {
  tone: "gray" | "green" | "orange" | "red";
  title: string;
  detail: string;
};

type ClientesResponse = {
  clientes: Cliente[];
  error?: string;
};

function getDayStatusClasses(tone: DayStatus["tone"]) {
  switch (tone) {
    case "green":
      return "border-green-200 bg-green-50 text-green-700";
    case "orange":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "red":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-600";
  }
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function NuevaReservaPage() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [form, setForm] = useState({
    client_id: "",
    employee_id: "",
    service_id: "",
    date: "",
    time: "",
    status: "Pendiente",
  });

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [dayStatus, setDayStatus] = useState<DayStatus>({
    tone: "gray",
    title: "Sin comprobar",
    detail: "Selecciona empleado, servicio y fecha.",
  });

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError("");

    try {
      const [clientesHttpRes, empleadosRes, serviciosRes] = await Promise.all([
        fetch("/api/admin-clientes", {
          method: "GET",
          cache: "no-store",
        }),
        supabase
          .from("empleados")
          .select("id, name, status")
          .order("name", { ascending: true }),
        supabase
          .from("servicios")
          .select("id, name")
          .order("name", { ascending: true }),
      ]);

      const clientesJson = (await clientesHttpRes.json()) as ClientesResponse;

      if (!clientesHttpRes.ok) {
        throw new Error(clientesJson.error || "Error al cargar clientes");
      }

      if (empleadosRes.error || serviciosRes.error) {
        throw new Error(
          empleadosRes.error?.message ||
            serviciosRes.error?.message ||
            "Error al cargar datos"
        );
      }

      const empleadosActivos = ((empleadosRes.data ?? []) as Empleado[])
        .filter(
          (empleado) =>
            normalizeText(empleado.status ?? "Activo") !== "inactivo"
        )
        .map(({ id, name }) => ({ id, name }));

      setClientes(clientesJson.clientes ?? []);
      setEmpleados(empleadosActivos);
      setServicios((serviciosRes.data ?? []) as Servicio[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      setClientes([]);
      setEmpleados([]);
      setServicios([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!form.employee_id || !form.service_id || !form.date) {
        setAvailableSlots([]);
        setForm((prev) => ({ ...prev, time: "" }));
        setDayStatus({
          tone: "gray",
          title: "Sin comprobar",
          detail: "Selecciona empleado, servicio y fecha.",
        });
        return;
      }

      setLoadingSlots(true);
      setError("");

      try {
        const result = await getBookingAvailability({
          supabase,
          employeeId: Number(form.employee_id),
          serviceId: Number(form.service_id),
          date: form.date,
        });

        setAvailableSlots(result.availableSlots);

        setForm((prev) => {
          const currentTimeIsValid =
            prev.time && result.availableSlots.includes(prev.time);

          return {
            ...prev,
            time: currentTimeIsValid ? prev.time : "",
          };
        });

        const hasFullDayBlock = result.timeOff.some((item) => item.is_full_day);
        const hasPartialBlocks = result.timeOff.some((item) => !item.is_full_day);
        const hasBookings = result.bookings.some(
          (item) => item.status?.toLowerCase() !== "cancelada"
        );

        if (!result.schedule) {
          setDayStatus({
            tone: "red",
            title: "Sin horario",
            detail: "Ese empleado no tiene horario configurado para ese día.",
          });
        } else if (!result.schedule.is_working) {
          setDayStatus({
            tone: "red",
            title: "No trabaja",
            detail: "Ese empleado no trabaja ese día.",
          });
        } else if (hasFullDayBlock) {
          setDayStatus({
            tone: "red",
            title: "Día bloqueado",
            detail: "El día está bloqueado completo para ese empleado.",
          });
        } else if (result.availableSlots.length === 0) {
          setDayStatus({
            tone: "red",
            title: "Completo",
            detail: "No quedan huecos disponibles para ese servicio.",
          });
        } else if (!hasBookings && !hasPartialBlocks) {
          setDayStatus({
            tone: "green",
            title: "Libre completo",
            detail: "No hay reservas ni bloqueos en esa jornada.",
          });
        } else {
          setDayStatus({
            tone: "orange",
            title: "Libre",
            detail: `Quedan ${result.availableSlots.length} huecos disponibles.`,
          });
        }
      } catch (err) {
        setAvailableSlots([]);
        setForm((prev) => ({ ...prev, time: "" }));
        setDayStatus({
          tone: "red",
          title: "Error",
          detail: "No se pudo calcular la disponibilidad.",
        });
        setError(
          err instanceof Error
            ? err.message
            : "Error al calcular disponibilidad"
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailability();
  }, [form.employee_id, form.service_id, form.date]);

  const filteredClientes = useMemo(() => {
    const normalizedSearch = normalizeText(clientSearch);

    if (!normalizedSearch) {
      return clientes.slice(0, 8);
    }

    return [...clientes]
      .filter((cliente) =>
        normalizeText(cliente.name).includes(normalizedSearch)
      )
      .sort((a, b) => {
        const aName = normalizeText(a.name);
        const bName = normalizeText(b.name);

        const aStarts = aName.startsWith(normalizedSearch) ? 0 : 1;
        const bStarts = bName.startsWith(normalizedSearch) ? 0 : 1;

        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name, "es");
      })
      .slice(0, 8);
  }, [clientes, clientSearch]);

  const selectedClient = useMemo(() => {
    return clientes.find((c) => String(c.id) === form.client_id) ?? null;
  }, [clientes, form.client_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setError("");

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClientInputChange = (value: string) => {
    setError("");
    setClientSearch(value);
    setShowClientDropdown(true);

    setForm((prev) => ({
      ...prev,
      client_id: "",
    }));
  };

  const selectClient = (cliente: Cliente) => {
    setClientSearch(cliente.name);
    setShowClientDropdown(false);
    setError("");

    setForm((prev) => ({
      ...prev,
      client_id: String(cliente.id),
    }));
  };

  const handleClientBlur = () => {
    const exactMatch = clientes.find(
      (cliente) => normalizeText(cliente.name) === normalizeText(clientSearch)
    );

    if (exactMatch) {
      setForm((prev) => ({
        ...prev,
        client_id: String(exactMatch.id),
      }));
      setClientSearch(exactMatch.name);
    }

    setTimeout(() => {
      setShowClientDropdown(false);
    }, 150);
  };

  const goToNuevoCliente = () => {
    router.push("/clientes");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!form.client_id) {
        throw new Error(
          "Debes seleccionar un cliente existente o crear uno nuevo."
        );
      }

      if (!form.employee_id || !form.service_id) {
        throw new Error("Debes seleccionar empleado y servicio.");
      }

      if (!form.date) {
        throw new Error("Debes seleccionar una fecha.");
      }

      if (!form.time) {
        throw new Error("Debes seleccionar una hora disponible.");
      }

      const clientId = Number(form.client_id);
      const employeeId = Number(form.employee_id);
      const serviceId = Number(form.service_id);
      const normalizedDate = normalizeDateToISO(form.date);

      if (!Number.isFinite(clientId)) {
        throw new Error("El cliente seleccionado no es válido.");
      }

      const availability = await getBookingAvailability({
        supabase,
        employeeId,
        serviceId,
        date: normalizedDate,
      });

      const stillAvailable = isSlotStillAvailable({
        startTime: form.time,
        serviceDurationMinutes: availability.serviceDurationMinutes,
        schedule: availability.schedule,
        bookings: availability.bookings,
        timeOff: availability.timeOff,
      });

      if (!stillAvailable) {
        setAvailableSlots(availability.availableSlots);
        throw new Error(
          "La hora seleccionada ya no está disponible. Elige otra."
        );
      }

      const { start_time, end_time } = buildBookingTimes(
        form.time,
        availability.serviceDurationMinutes
      );

      const payload = {
        client_id: clientId,
        employee_id: employeeId,
        service_id: serviceId,
        date: normalizedDate,
        time: start_time,
        start_time,
        end_time,
        status: form.status,
      };

      const response = await fetch("/api/admin-reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar la reserva");
      }

      router.push("/reservas");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar la reserva"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando datos...
        </div>
      </section>
    );
  }

  const canCheckAvailability =
    !!form.employee_id && !!form.service_id && !!form.date;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight">Nueva reserva</h2>
          <p className="mt-2 text-zinc-600">
            Registra una nueva cita en la agenda.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Cliente
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => handleClientInputChange(e.target.value)}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={handleClientBlur}
                  placeholder="Escribe el nombre del cliente..."
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                />

                {showClientDropdown ? (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                    {filteredClientes.length > 0 ? (
                      filteredClientes.map((cliente) => (
                        <button
                          key={cliente.id}
                          type="button"
                          onMouseDown={() => selectClient(cliente)}
                          className="block w-full border-b border-zinc-100 px-4 py-3 text-left text-sm hover:bg-zinc-50 last:border-b-0"
                        >
                          {cliente.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-zinc-500">
                        {clientes.length === 0
                          ? "No se han podido cargar clientes."
                          : "No hay clientes que coincidan."}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zinc-500">
                  Escribe unas letras y elige un cliente del desplegable.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goToNuevoCliente}
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Nuevo cliente
                  </button>

                  <button
                    type="button"
                    onClick={loadData}
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Recargar lista
                  </button>
                </div>
              </div>

              {selectedClient ? (
                <p className="mt-2 text-sm text-green-700">
                  Cliente seleccionado:{" "}
                  <span className="font-medium">{selectedClient.name}</span>
                </p>
              ) : clientSearch.trim() ? (
                <p className="mt-2 text-sm text-amber-600">
                  Debes seleccionar un cliente existente o crear uno nuevo.
                </p>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  No hay ningún cliente seleccionado.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Empleado
              </label>
              <select
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                required
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

            <div
              className={`rounded-2xl border p-4 ${getDayStatusClasses(
                dayStatus.tone
              )}`}
            >
              <p className="font-semibold">{dayStatus.title}</p>
              <p className="mt-1 text-sm">{dayStatus.detail}</p>
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
                  Hora disponible
                </label>
                <select
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                  disabled={!canCheckAvailability || loadingSlots}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black disabled:bg-zinc-100"
                >
                  <option value="">
                    {!canCheckAvailability
                      ? "Selecciona empleado, servicio y fecha"
                      : loadingSlots
                      ? "Calculando horas disponibles..."
                      : availableSlots.length === 0
                      ? "No hay horas disponibles"
                      : "Selecciona una hora"}
                  </option>

                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>

                {canCheckAvailability && !loadingSlots ? (
                  <p className="mt-2 text-sm text-zinc-500">
                    {availableSlots.length > 0
                      ? `${availableSlots.length} huecos disponibles para ese día.`
                      : "Ese empleado no tiene huecos disponibles para ese servicio en esa fecha."}
                  </p>
                ) : null}
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
                disabled={loading || loadingSlots}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar reserva"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}