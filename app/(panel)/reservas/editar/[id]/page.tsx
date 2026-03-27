import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerBusinessContext } from "@/lib/supabase-server";

type EditarReservaPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

type TimeOffRow = {
  id: string;
  employee_id: number;
  business_id?: number | null;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  is_full_day: boolean;
};

type ServicioOption = {
  id: number;
  name: string;
  status?: string | null;
};

const ALLOWED_STATUSES = new Set([
  "Pendiente",
  "Confirmada",
  "Cancelada",
  "Completada",
]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toPriceNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function parseTimeToMinutes(time: string) {
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

function minutesToTimeString(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

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

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:00`;
}

function extractMinutesFromUnknown(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/\d+/);
    if (match) {
      const minutes = Number(match[0]);
      if (Number.isFinite(minutes) && minutes > 0) return minutes;
    }
  }

  return null;
}

function getServiceDurationMinutes(
  servicio: Record<string, any> | null | undefined
) {
  if (!servicio) return null;

  const directKeys = [
    "duration_minutes",
    "duration_min",
    "minutes",
    "minutos",
    "duracion_minutos",
    "duracion_min",
    "duration",
  ];

  for (const key of directKeys) {
    if (key in servicio) {
      const minutes = extractMinutesFromUnknown(servicio[key]);
      if (minutes) return minutes;
    }
  }

  for (const [key, value] of Object.entries(servicio)) {
    if (!/(duration|minut|min|duracion)/i.test(key)) continue;
    const minutes = extractMinutesFromUnknown(value);
    if (minutes) return minutes;
  }

  return null;
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  return startA < endB && startB < endA;
}

function getWeekdayFromDate(date: string) {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getDay();
}

function dateIsWithinRange(
  targetDate: string,
  startDate: string,
  endDate?: string | null
) {
  const finalEndDate = endDate || startDate;
  return targetDate >= startDate && targetDate <= finalEndDate;
}

function normalizeTimeInputValue(value: unknown) {
  const text = normalizeText(value);
  if (!text) return "";
  return text.slice(0, 5);
}

export default async function EditarReservaPage({
  params,
  searchParams,
}: EditarReservaPageProps) {
  const { id } = await params;
  const qs = (await searchParams) ?? {};
  const reservaId = Number(id);
  const actionError = normalizeText(qs.error);

  if (!Number.isFinite(reservaId)) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ID de reserva no válido.
          </div>
        </div>
      </section>
    );
  }

  const { user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect(`/login?redirectTo=/reservas/editar/${id}`);
  }

  if (!businessId) {
    redirect("/registro");
  }

  async function updateReserva(formData: FormData) {
    "use server";

    const { user, businessId } = await getServerBusinessContext();

    if (!user) {
      redirect(`/login?redirectTo=/reservas/editar/${id}`);
    }

    if (!businessId) {
      redirect("/registro");
    }

    const supabaseAdmin = getSupabaseAdmin();

    const reservaIdValue = toNumber(formData.get("reserva_id"));
    const client_id = toNumber(formData.get("client_id"));
    const employee_id = toNumber(formData.get("employee_id"));
    const service_id = toNumber(formData.get("service_id"));
    const date = normalizeText(formData.get("date"));
    const time = normalizeText(formData.get("time"));
    const status = normalizeText(formData.get("status"));
    const notes = normalizeText(formData.get("notes"));

    if (!reservaIdValue) {
      redirect(`/reservas/editar/${id}?error=ID+de+reserva+no+v%C3%A1lido`);
    }

    if (!client_id || client_id <= 0) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+un+cliente`);
    }

    if (!employee_id || employee_id <= 0) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+un+empleado`);
    }

    if (!service_id || service_id <= 0) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+un+servicio`);
    }

    if (!date) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+una+fecha`);
    }

    if (!time) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+una+hora`);
    }

    if (!status) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+un+estado`);
    }

    if (!ALLOWED_STATUSES.has(status)) {
      redirect(
        `/reservas/editar/${id}?error=El+estado+seleccionado+no+es+v%C3%A1lido`
      );
    }

    const requestedStart = parseTimeToMinutes(time);

    if (requestedStart === null) {
      redirect(
        `/reservas/editar/${id}?error=La+hora+seleccionada+no+es+v%C3%A1lida`
      );
    }

    const weekday = getWeekdayFromDate(date);

    if (weekday === null) {
      redirect(
        `/reservas/editar/${id}?error=La+fecha+seleccionada+no+es+v%C3%A1lida`
      );
    }

    const [
      { data: reservaActual, error: reservaActualError },
      { data: cliente, error: clienteError },
      { data: empleado, error: empleadoError },
      { data: servicioSeleccionado, error: servicioError },
      { data: horarioEmpleado, error: horarioError },
      { data: timeOffRows, error: timeOffError },
      { data: reservasExistentes, error: reservasExistentesError },
    ] = await Promise.all([
      supabaseAdmin
        .from("reservas")
        .select("id, service_id, business_id")
        .eq("id", reservaIdValue)
        .eq("business_id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("clientes")
        .select("id, business_id")
        .eq("id", client_id)
        .eq("business_id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("empleados")
        .select("id, status, business_id")
        .eq("id", employee_id)
        .eq("business_id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("servicios")
        .select("*")
        .eq("id", service_id)
        .eq("business_id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("employee_schedules")
        .select(
          "id, employee_id, business_id, weekday, start_time, end_time, is_working"
        )
        .eq("employee_id", employee_id)
        .eq("business_id", businessId)
        .eq("weekday", weekday)
        .maybeSingle(),

      supabaseAdmin
        .from("employee_time_off")
        .select(
          "id, employee_id, business_id, date, end_date, start_time, end_time, reason, is_full_day"
        )
        .eq("employee_id", employee_id)
        .eq("business_id", businessId),

      supabaseAdmin
        .from("reservas")
        .select(`
          id,
          business_id,
          date,
          time,
          start_time,
          end_time,
          status,
          servicio:servicios!reservas_service_id_fkey(*)
        `)
        .eq("business_id", businessId)
        .eq("employee_id", employee_id)
        .eq("date", date)
        .neq("status", "Cancelada")
        .neq("id", reservaIdValue)
        .order("time", { ascending: true }),
    ]);

    if (reservaActualError) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(
          `Error al cargar la reserva actual: ${reservaActualError.message}`
        )}`
      );
    }

    if (!reservaActual) {
      redirect(`/reservas/editar/${id}?error=La+reserva+ya+no+existe`);
    }

    if (clienteError) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(
          `Error al validar cliente: ${clienteError.message}`
        )}`
      );
    }

    if (!cliente) {
      redirect(
        `/reservas/editar/${id}?error=El+cliente+seleccionado+no+existe+en+tu+negocio`
      );
    }

    if (empleadoError) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(
          `Error al validar empleado: ${empleadoError.message}`
        )}`
      );
    }

    if (!empleado) {
      redirect(
        `/reservas/editar/${id}?error=El+empleado+seleccionado+no+existe+en+tu+negocio`
      );
    }

    const employeeStatus = normalizeStatus((empleado as any).status);

    if (
      employeeStatus === "descanso" ||
      employeeStatus === "vacaciones" ||
      employeeStatus === "inactivo"
    ) {
      redirect(
        `/reservas/editar/${id}?error=El+empleado+seleccionado+no+est%C3%A1+disponible+actualmente`
      );
    }

    if (servicioError) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(
          `Error al validar el servicio: ${servicioError.message}`
        )}`
      );
    }

    if (!servicioSeleccionado) {
      redirect(
        `/reservas/editar/${id}?error=El+servicio+seleccionado+no+existe+en+tu+negocio`
      );
    }

    const serviceStatus = normalizeStatus((servicioSeleccionado as any).status);

    if (
      serviceStatus === "desactivado" &&
      reservaActual.service_id !== service_id
    ) {
      redirect(
        `/reservas/editar/${id}?error=No+puedes+asignar+un+servicio+desactivado`
      );
    }

    if (horarioError) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(
          `Error al comprobar horario: ${horarioError.message}`
        )}`
      );
    }

    if (timeOffError) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(
          `Error al comprobar bloqueos/vacaciones: ${timeOffError.message}`
        )}`
      );
    }

    if (reservasExistentesError) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(
          `Error al comprobar disponibilidad: ${reservasExistentesError.message}`
        )}`
      );
    }

    const durationMinutes = getServiceDurationMinutes(servicioSeleccionado);

    if (!durationMinutes) {
      redirect(
        `/reservas/editar/${id}?error=El+servicio+seleccionado+no+tiene+una+duraci%C3%B3n+v%C3%A1lida`
      );
    }

    const requestedEnd = requestedStart + durationMinutes;
    const normalizedStartTime = minutesToTimeString(requestedStart);
    const normalizedEndTime = minutesToTimeString(requestedEnd);

    if (!normalizedStartTime || !normalizedEndTime) {
      redirect(
        `/reservas/editar/${id}?error=No+se+ha+podido+calcular+correctamente+la+hora+de+fin`
      );
    }

    if (!horarioEmpleado || !horarioEmpleado.is_working) {
      redirect(`/reservas/editar/${id}?error=El+empleado+no+trabaja+ese+d%C3%ADa`);
    }

    const scheduleStart = parseTimeToMinutes(horarioEmpleado.start_time);
    const scheduleEnd = parseTimeToMinutes(horarioEmpleado.end_time);

    if (
      scheduleStart === null ||
      scheduleEnd === null ||
      scheduleEnd <= scheduleStart
    ) {
      redirect(
        `/reservas/editar/${id}?error=El+horario+del+empleado+no+est%C3%A1+configurado+correctamente+para+ese+d%C3%ADa`
      );
    }

    if (requestedStart < scheduleStart || requestedEnd > scheduleEnd) {
      redirect(
        `/reservas/editar/${id}?error=La+reserva+queda+fuera+del+horario+laboral+del+empleado`
      );
    }

    const applicableTimeOffRows = ((timeOffRows ?? []) as TimeOffRow[]).filter(
      (row) => dateIsWithinRange(date, row.date, row.end_date)
    );

    for (const bloqueo of applicableTimeOffRows) {
      if (bloqueo.is_full_day) {
        redirect(
          `/reservas/editar/${id}?error=El+empleado+no+est%C3%A1+disponible+ese+d%C3%ADa+por+bloqueo+o+vacaciones`
        );
      }

      const bloqueoStart = parseTimeToMinutes(bloqueo.start_time ?? "");
      const bloqueoEnd = parseTimeToMinutes(bloqueo.end_time ?? "");

      if (
        bloqueoStart === null ||
        bloqueoEnd === null ||
        bloqueoEnd <= bloqueoStart
      ) {
        continue;
      }

      if (
        rangesOverlap(
          requestedStart,
          requestedEnd,
          bloqueoStart,
          bloqueoEnd
        )
      ) {
        const reason =
          bloqueo.reason && String(bloqueo.reason).trim()
            ? `El empleado no está disponible en ese tramo: ${bloqueo.reason}.`
            : "El empleado tiene un bloqueo en ese tramo horario.";

        redirect(`/reservas/editar/${id}?error=${encodeURIComponent(reason)}`);
      }
    }

    for (const reserva of reservasExistentes ?? []) {
      const existingStartText = normalizeText(
        (reserva as any).start_time || (reserva as any).time
      );
      const existingStart = parseTimeToMinutes(existingStartText);

      if (existingStart === null) continue;

      let existingEnd = parseTimeToMinutes(
        normalizeText((reserva as any).end_time)
      );

      if (existingEnd === null || existingEnd <= existingStart) {
        const servicioExistente = Array.isArray((reserva as any).servicio)
          ? (reserva as any).servicio[0]
          : (reserva as any).servicio;

        const existingDuration = getServiceDurationMinutes(servicioExistente);

        if (!existingDuration) continue;
        existingEnd = existingStart + existingDuration;
      }

      if (
        rangesOverlap(
          requestedStart,
          requestedEnd,
          existingStart,
          existingEnd
        )
      ) {
        redirect(
          `/reservas/editar/${id}?error=Ese+empleado+ya+tiene+una+reserva+que+se+solapa+con+esa+hora`
        );
      }
    }

    const updatePayload: Record<string, any> = {
      client_id,
      employee_id,
      service_id,
      date,
      time: normalizedStartTime,
      start_time: normalizedStartTime,
      end_time: normalizedEndTime,
      status,
      notes: notes || null,
    };

    if (reservaActual.service_id !== service_id) {
      const priceAtBooking = toPriceNumber((servicioSeleccionado as any).price);

      if (priceAtBooking === null || priceAtBooking < 0) {
        redirect(
          `/reservas/editar/${id}?error=El+servicio+seleccionado+no+tiene+un+precio+v%C3%A1lido`
        );
      }

      updatePayload.price_at_booking = priceAtBooking;
    }

    const { error } = await supabaseAdmin
      .from("reservas")
      .update(updatePayload)
      .eq("id", reservaIdValue)
      .eq("business_id", businessId);

    if (error) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath("/reservas");
    revalidatePath("/dashboard");
    revalidatePath("/reservar");
    revalidatePath(`/reservas/editar/${id}`);

    redirect("/reservas");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const [
    { data: reserva, error: reservaError },
    { data: clientes, error: clientesError },
    { data: empleados, error: empleadosError },
    { data: serviciosActivos, error: serviciosError },
  ] = await Promise.all([
    supabaseAdmin
      .from("reservas")
      .select(
        "id, business_id, client_id, employee_id, service_id, date, time, status, notes, price_at_booking, start_time, end_time"
      )
      .eq("id", reservaId)
      .eq("business_id", businessId)
      .maybeSingle(),

    supabaseAdmin
      .from("clientes")
      .select("id, name")
      .eq("business_id", businessId)
      .order("name", { ascending: true }),

    supabaseAdmin
      .from("empleados")
      .select("id, name")
      .eq("business_id", businessId)
      .order("name", { ascending: true }),

    supabaseAdmin
      .from("servicios")
      .select("id, name, status")
      .eq("business_id", businessId)
      .eq("status", "Activo")
      .order("name", { ascending: true }),
  ]);

  let servicioActualDesactivado: ServicioOption | null = null;
  let servicioActualDesactivadoError: string | null = null;

  if (
    reserva &&
    reserva.service_id &&
    !(serviciosActivos ?? []).some((s) => s.id === reserva.service_id)
  ) {
    const { data, error } = await supabaseAdmin
      .from("servicios")
      .select("id, name, status")
      .eq("id", reserva.service_id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      servicioActualDesactivadoError = error.message;
    } else if (data) {
      servicioActualDesactivado = data as ServicioOption;
    }
  }

  const serviciosOptions: ServicioOption[] = [
    ...((serviciosActivos ?? []) as ServicioOption[]),
    ...(servicioActualDesactivado ? [servicioActualDesactivado] : []),
  ];

  const errores = [
    actionError || null,
    reservaError?.message,
    clientesError?.message,
    empleadosError?.message,
    serviciosError?.message,
    servicioActualDesactivadoError,
  ].filter(Boolean);

  if (!reserva && !reservaError) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Editar reserva
              </h2>
              <p className="mt-2 text-zinc-600">
                La reserva solicitada no existe.
              </p>
            </div>

            <Link
              href="/reservas"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver
            </Link>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No se encontró la reserva que intentas editar.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Editar reserva
            </h2>
            <p className="mt-2 text-zinc-600">
              Modifica los datos de la reserva seleccionada.
            </p>
          </div>

          <Link
            href="/reservas"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Volver a reservas
          </Link>
        </div>

        {errores.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Error al cargar o guardar la reserva.</p>
            <div className="mt-2 space-y-1">
              {errores.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form action={updateReserva} className="space-y-6">
            <input type="hidden" name="reserva_id" value={reserva?.id ?? ""} />

            <div>
              <label
                htmlFor="client_id"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Cliente
              </label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={reserva?.client_id ?? ""}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="">Selecciona un cliente</option>
                {(clientes ?? []).map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="employee_id"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Empleado
              </label>
              <select
                id="employee_id"
                name="employee_id"
                defaultValue={reserva?.employee_id ?? ""}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="">Selecciona un empleado</option>
                {(empleados ?? []).map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="service_id"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Servicio
              </label>
              <select
                id="service_id"
                name="service_id"
                defaultValue={reserva?.service_id ?? ""}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="">Selecciona un servicio</option>
                {serviciosOptions.map((servicio) => {
                  const isDeactivated =
                    normalizeStatus(servicio.status) === "desactivado";

                  return (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.name}
                      {isDeactivated ? " (desactivado)" : ""}
                    </option>
                  );
                })}
              </select>

              <p className="mt-2 text-sm text-zinc-500">
                Solo se muestran servicios activos. Si esta reserva ya tenía un
                servicio desactivado, se mantiene visible para no romper la edición.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Fecha
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  defaultValue={reserva?.date ?? ""}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Hora
                </label>
                <input
                  id="time"
                  type="time"
                  name="time"
                  defaultValue={normalizeTimeInputValue(reserva?.time)}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue={reserva?.status ?? "Pendiente"}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Completada">Completada</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                defaultValue={reserva?.notes ?? ""}
                rows={4}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="Añade observaciones si lo necesitas"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Guardar cambios
              </button>

              <Link
                href="/reservas"
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}