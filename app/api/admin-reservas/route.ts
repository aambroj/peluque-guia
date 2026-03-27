import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerBusinessContext } from "@/lib/supabase-server";
import { isServiceActive, normalizeStatus } from "@/lib/service-status";

type AdminBookingBody = {
  client_id?: string | number;
  employee_id?: string | number;
  service_id?: string | number;
  date?: string;
  time?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  notes?: string;
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

const ALLOWED_STATUSES = new Set([
  "Pendiente",
  "Confirmada",
  "Cancelada",
  "Completada",
]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

export async function POST(request: Request) {
  try {
    const { user, businessId } = await getServerBusinessContext();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión." },
        { status: 401 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Tu usuario no tiene un negocio asociado." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as AdminBookingBody;

    const clientId = toNumber(body.client_id);
    const employeeId = toNumber(body.employee_id);
    const serviceId = toNumber(body.service_id);

    const date = normalizeText(body.date);
    const requestedTime = normalizeText(body.start_time || body.time);
    const status = normalizeText(body.status) || "Pendiente";
    const notes = normalizeText(body.notes);

    if (!clientId || !employeeId || !serviceId || !date || !requestedTime) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios para guardar la reserva." },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "El estado seleccionado no es válido." },
        { status: 400 }
      );
    }

    const requestedStart = parseTimeToMinutes(requestedTime);

    if (requestedStart === null) {
      return NextResponse.json(
        { error: "La hora seleccionada no es válida." },
        { status: 400 }
      );
    }

    const weekday = getWeekdayFromDate(date);

    if (weekday === null) {
      return NextResponse.json(
        { error: "La fecha seleccionada no es válida." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const [
      { data: cliente, error: clienteError },
      { data: empleado, error: empleadoError },
      { data: servicio, error: servicioError },
      { data: horarioEmpleado, error: horarioError },
      { data: timeOffRows, error: timeOffError },
      { data: reservasExistentes, error: reservasExistentesError },
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, business_id")
        .eq("id", clientId)
        .eq("business_id", businessId)
        .maybeSingle(),

      supabase
        .from("empleados")
        .select("id, name, status, business_id")
        .eq("id", employeeId)
        .eq("business_id", businessId)
        .maybeSingle(),

      supabase
        .from("servicios")
        .select("*")
        .eq("id", serviceId)
        .eq("business_id", businessId)
        .maybeSingle(),

      supabase
        .from("employee_schedules")
        .select(
          "id, employee_id, business_id, weekday, start_time, end_time, is_working"
        )
        .eq("employee_id", employeeId)
        .eq("business_id", businessId)
        .eq("weekday", weekday)
        .maybeSingle(),

      supabase
        .from("employee_time_off")
        .select(
          "id, employee_id, business_id, date, end_date, start_time, end_time, reason, is_full_day"
        )
        .eq("employee_id", employeeId)
        .eq("business_id", businessId),

      supabase
        .from("reservas")
        .select(`
          id,
          date,
          time,
          start_time,
          end_time,
          status,
          servicio:servicios!reservas_service_id_fkey(*)
        `)
        .eq("business_id", businessId)
        .eq("employee_id", employeeId)
        .eq("date", date)
        .neq("status", "Cancelada")
        .order("time", { ascending: true }),
    ]);

    if (clienteError) {
      return NextResponse.json(
        { error: `Error al validar cliente: ${clienteError.message}` },
        { status: 500 }
      );
    }

    if (empleadoError) {
      return NextResponse.json(
        { error: `Error al validar empleado: ${empleadoError.message}` },
        { status: 500 }
      );
    }

    if (servicioError) {
      return NextResponse.json(
        { error: `Error al validar servicio: ${servicioError.message}` },
        { status: 500 }
      );
    }

    if (horarioError) {
      return NextResponse.json(
        { error: `Error al comprobar horario: ${horarioError.message}` },
        { status: 500 }
      );
    }

    if (timeOffError) {
      return NextResponse.json(
        {
          error: `Error al comprobar bloqueos/vacaciones: ${timeOffError.message}`,
        },
        { status: 500 }
      );
    }

    if (reservasExistentesError) {
      return NextResponse.json(
        {
          error: `Error al comprobar disponibilidad: ${reservasExistentesError.message}`,
        },
        { status: 500 }
      );
    }

    if (!cliente) {
      return NextResponse.json(
        { error: "El cliente seleccionado no existe en tu negocio." },
        { status: 400 }
      );
    }

    if (!empleado) {
      return NextResponse.json(
        { error: "El empleado seleccionado no existe en tu negocio." },
        { status: 400 }
      );
    }

    const employeeStatus = normalizeStatus((empleado as any).status);

    if (
      employeeStatus === "descanso" ||
      employeeStatus === "vacaciones" ||
      employeeStatus === "inactivo"
    ) {
      return NextResponse.json(
        {
          error:
            "El empleado seleccionado no está disponible actualmente para nuevas reservas.",
        },
        { status: 409 }
      );
    }

    if (!servicio) {
      return NextResponse.json(
        { error: "El servicio seleccionado no existe en tu negocio." },
        { status: 400 }
      );
    }

    if (!isServiceActive(servicio as any)) {
      return NextResponse.json(
        {
          error:
            "El servicio seleccionado está desactivado. Actualiza la página y elige otro.",
        },
        { status: 409 }
      );
    }

    const serviceDurationMinutes = getServiceDurationMinutes(servicio);

    if (!serviceDurationMinutes) {
      return NextResponse.json(
        {
          error:
            "El servicio seleccionado no tiene una duración válida configurada.",
        },
        { status: 400 }
      );
    }

    const priceAtBooking = toPriceNumber((servicio as any).price);

    if (priceAtBooking === null || priceAtBooking < 0) {
      return NextResponse.json(
        {
          error: "El servicio no tiene un precio válido para guardar la reserva.",
        },
        { status: 400 }
      );
    }

    const requestedEnd = requestedStart + serviceDurationMinutes;
    const normalizedStartTime = minutesToTimeString(requestedStart);
    const normalizedEndTime = minutesToTimeString(requestedEnd);

    if (!normalizedStartTime || !normalizedEndTime) {
      return NextResponse.json(
        { error: "No se ha podido calcular correctamente la hora de la reserva." },
        { status: 400 }
      );
    }

    if (!horarioEmpleado || !horarioEmpleado.is_working) {
      return NextResponse.json(
        {
          error:
            "El empleado no trabaja ese día. Elige otra fecha u otro profesional.",
        },
        { status: 409 }
      );
    }

    const scheduleStart = parseTimeToMinutes(horarioEmpleado.start_time);
    const scheduleEnd = parseTimeToMinutes(horarioEmpleado.end_time);

    if (
      scheduleStart === null ||
      scheduleEnd === null ||
      scheduleEnd <= scheduleStart
    ) {
      return NextResponse.json(
        {
          error:
            "El horario del empleado no está configurado correctamente para ese día.",
        },
        { status: 400 }
      );
    }

    if (requestedStart < scheduleStart || requestedEnd > scheduleEnd) {
      return NextResponse.json(
        {
          error: "La reserva queda fuera del horario laboral del empleado.",
        },
        { status: 409 }
      );
    }

    const applicableTimeOffRows = ((timeOffRows ?? []) as TimeOffRow[]).filter(
      (row) => dateIsWithinRange(date, row.date, row.end_date)
    );

    for (const bloqueo of applicableTimeOffRows) {
      if (bloqueo.is_full_day) {
        return NextResponse.json(
          {
            error:
              "El empleado no está disponible ese día por bloqueo o vacaciones.",
          },
          { status: 409 }
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
        return NextResponse.json(
          {
            error:
              bloqueo.reason && String(bloqueo.reason).trim()
                ? `El empleado no está disponible en ese tramo: ${bloqueo.reason}.`
                : "El empleado tiene un bloqueo en ese tramo horario.",
          },
          { status: 409 }
        );
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
        return NextResponse.json(
          {
            error:
              "Ese empleado ya tiene una reserva que se solapa con esa hora. Elige otro hueco.",
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("reservas")
      .insert([
        {
          business_id: businessId,
          client_id: clientId,
          employee_id: employeeId,
          service_id: serviceId,
          date,
          time: normalizedStartTime,
          start_time: normalizedStartTime,
          end_time: normalizedEndTime,
          status,
          notes: notes || null,
          price_at_booking: priceAtBooking,
          booking_source: "admin",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      reserva: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno al guardar la reserva",
      },
      { status: 500 }
    );
  }
}