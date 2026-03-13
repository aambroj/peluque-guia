import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type PublicBookingBody = {
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  employee_id?: string | number;
  service_id?: string | number;
  date?: string;
  time?: string;
  notes?: string;

  clientName?: string;
  phone?: string;
  employeeId?: string | number;
  serviceId?: string | number;
  startTime?: string;
};

type TimeOffRow = {
  id: string;
  employee_id: number;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  is_full_day: boolean;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const body = (await request.json()) as PublicBookingBody;

    const client_name = normalizeText(body.client_name || body.clientName);
    const client_phone = normalizeText(body.client_phone || body.phone);
    const date = normalizeText(body.date);
    const time = normalizeText(body.time || body.startTime);
    const notes = normalizeText(body.notes);

    const employee_id = body.employee_id
      ? Number(body.employee_id)
      : body.employeeId
      ? Number(body.employeeId)
      : null;

    const service_id = body.service_id
      ? Number(body.service_id)
      : body.serviceId
      ? Number(body.serviceId)
      : null;

    if (!client_name) {
      return NextResponse.json(
        { error: "El nombre del cliente es obligatorio." },
        { status: 400 }
      );
    }

    if (!client_phone) {
      return NextResponse.json(
        { error: "El teléfono del cliente es obligatorio." },
        { status: 400 }
      );
    }

    if (!employee_id || !Number.isFinite(employee_id)) {
      return NextResponse.json(
        { error: "Debes seleccionar un empleado." },
        { status: 400 }
      );
    }

    if (!service_id || !Number.isFinite(service_id)) {
      return NextResponse.json(
        { error: "Debes seleccionar un servicio." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Debes seleccionar una fecha." },
        { status: 400 }
      );
    }

    if (!time) {
      return NextResponse.json(
        { error: "Debes seleccionar una hora." },
        { status: 400 }
      );
    }

    const requestedStart = parseTimeToMinutes(time);

    if (requestedStart === null) {
      return NextResponse.json(
        { error: "La hora seleccionada no es válida." },
        { status: 400 }
      );
    }

    const today = new Date();
    const todayText = today.toISOString().split("T")[0];

    if (date < todayText) {
      return NextResponse.json(
        { error: "No se puede reservar en una fecha pasada." },
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

    const [
      { data: empleado, error: empleadoError },
      { data: servicio, error: servicioError },
      { data: horarioEmpleado, error: horarioError },
      { data: timeOffRows, error: timeOffError },
      { data: reservasExistentes, error: reservasExistentesError },
    ] = await Promise.all([
      supabaseAdmin
        .from("empleados")
        .select("id, name, public_booking_enabled")
        .eq("id", employee_id)
        .eq("public_booking_enabled", true)
        .maybeSingle(),

      supabaseAdmin
        .from("servicios")
        .select("*")
        .eq("id", service_id)
        .eq("public_visible", true)
        .maybeSingle(),

      supabaseAdmin
        .from("employee_schedules")
        .select("id, employee_id, weekday, start_time, end_time, is_working")
        .eq("employee_id", employee_id)
        .eq("weekday", weekday)
        .maybeSingle(),

      supabaseAdmin
        .from("employee_time_off")
        .select(
          "id, employee_id, date, end_date, start_time, end_time, reason, is_full_day"
        )
        .eq("employee_id", employee_id),

      supabaseAdmin
        .from("reservas")
        .select(`
          id,
          date,
          time,
          status,
          servicio:servicios!reservas_service_id_fkey(*)
        `)
        .eq("employee_id", employee_id)
        .eq("date", date)
        .neq("status", "Cancelada")
        .order("time", { ascending: true }),
    ]);

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
        { error: `Error al comprobar bloqueos/vacaciones: ${timeOffError.message}` },
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

    if (!empleado) {
      return NextResponse.json(
        {
          error:
            "El empleado seleccionado no existe o no está disponible para reserva online.",
        },
        { status: 400 }
      );
    }

    if (!servicio) {
      return NextResponse.json(
        {
          error:
            "El servicio seleccionado no existe o no está visible para reserva online.",
        },
        { status: 400 }
      );
    }

    const requestedDuration = getServiceDurationMinutes(servicio);

    if (!requestedDuration) {
      return NextResponse.json(
        {
          error:
            "El servicio seleccionado no tiene una duración válida configurada.",
        },
        { status: 400 }
      );
    }

    const requestedEnd = requestedStart + requestedDuration;

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
      const existingStart = parseTimeToMinutes(reserva.time);

      if (existingStart === null) continue;

      const servicioExistente = Array.isArray(reserva.servicio)
        ? reserva.servicio[0]
        : reserva.servicio;

      const existingDuration = getServiceDurationMinutes(servicioExistente);

      if (!existingDuration) continue;

      const existingEnd = existingStart + existingDuration;

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

    let clientId: number | null = null;
    const telefonoNormalizado = client_phone.trim();

    const { data: clienteExistente, error: clienteExistenteError } =
      await supabaseAdmin
        .from("clientes")
        .select("id, visits")
        .eq("phone", telefonoNormalizado)
        .maybeSingle();

    if (clienteExistenteError) {
      return NextResponse.json(
        { error: `Error al buscar cliente: ${clienteExistenteError.message}` },
        { status: 500 }
      );
    }

    if (clienteExistente) {
      clientId = clienteExistente.id;

      const { error: updateClienteError } = await supabaseAdmin
        .from("clientes")
        .update({
          name: client_name,
          phone: telefonoNormalizado,
          last_visit: date,
          visits: (clienteExistente.visits ?? 0) + 1,
        })
        .eq("id", clientId);

      if (updateClienteError) {
        return NextResponse.json(
          { error: `Error al actualizar cliente: ${updateClienteError.message}` },
          { status: 500 }
        );
      }
    } else {
      const { data: nuevoCliente, error: insertClienteError } =
        await supabaseAdmin
          .from("clientes")
          .insert({
            name: client_name,
            phone: telefonoNormalizado,
            last_visit: date,
            visits: 1,
          })
          .select("id")
          .single();

      if (insertClienteError) {
        return NextResponse.json(
          { error: `Error al crear cliente: ${insertClienteError.message}` },
          { status: 500 }
        );
      }

      clientId = nuevoCliente.id;
    }

    const { data: nuevaReserva, error: insertReservaError } =
      await supabaseAdmin
        .from("reservas")
        .insert({
          client_id: clientId,
          employee_id,
          service_id,
          date,
          time,
          status: "Pendiente",
          notes: notes || null,
        })
        .select("id, date, time, status")
        .single();

    if (insertReservaError) {
      return NextResponse.json(
        { error: `Error al crear la reserva: ${insertReservaError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Reserva creada correctamente.",
        reservaId: nuevaReserva.id,
        booking: {
          id: nuevaReserva.id,
          date: nuevaReserva.date,
          start_time: nuevaReserva.time,
          status: nuevaReserva.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error inesperado al crear la reserva.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}