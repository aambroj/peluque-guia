import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Empleado = {
  id: number;
  name: string;
  status?: string | null;
  public_booking_enabled?: boolean | null;
};

type Servicio = {
  id: number;
  name: string;
  duration_minutes: number | null;
};

type ScheduleRow = {
  id: string;
  employee_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
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

type ReservaRow = {
  id: number;
  employee_id: number;
  date: string;
  time: string;
  status: string;
  servicio:
    | {
        duration_minutes: number | null;
      }
    | {
        duration_minutes: number | null;
      }[]
    | null;
};

type DayColor = "green" | "orange" | "red";

const SLOT_STEP_MINUTES = 30;

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isEmployeePublicBookable(employee: Empleado | null | undefined) {
  if (!employee) return false;

  const status = normalizeStatus(employee.status);

  return (
    employee.public_booking_enabled === true &&
    status !== "inactivo" &&
    status !== "vacaciones" &&
    status !== "descanso"
  );
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

function formatMinutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getTodayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function isPastDate(date: string) {
  return date < getTodayDate();
}

function getWeekdayFromDate(date: string) {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getDay();
}

function getMonthDaysCount(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

function getMonthDateRange(month: string) {
  const totalDays = getMonthDaysCount(month);
  return {
    start: `${month}-01`,
    end: `${month}-${String(totalDays).padStart(2, "0")}`,
  };
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  return startA < endB && startB < endA;
}

function getReservaDuration(servicio: ReservaRow["servicio"]) {
  const row = Array.isArray(servicio) ? servicio[0] : servicio;
  const value = row?.duration_minutes;
  return Number.isFinite(value) && (value ?? 0) > 0 ? Number(value) : null;
}

function dateIsWithinRange(
  targetDate: string,
  startDate: string,
  endDate?: string | null
) {
  const finalEndDate = endDate || startDate;
  return targetDate >= startDate && targetDate <= finalEndDate;
}

function buildDayAvailability(params: {
  date: string;
  serviceDuration: number;
  schedule: ScheduleRow | null;
  timeOffRows: TimeOffRow[];
  reservasRows: ReservaRow[];
}) {
  const { date, serviceDuration, schedule, timeOffRows, reservasRows } = params;

  if (isPastDate(date)) {
    return {
      summary: {
        color: "red" as DayColor,
        title: "Pasado",
        detail: "No se puede reservar en días anteriores a hoy.",
        slots: 0,
      },
      availableSlots: [] as string[],
    };
  }

  if (!schedule || !schedule.is_working) {
    return {
      summary: {
        color: "red" as DayColor,
        title: "No trabaja",
        detail: "Ese empleado no trabaja este día.",
        slots: 0,
      },
      availableSlots: [] as string[],
    };
  }

  const scheduleStart = parseTimeToMinutes(schedule.start_time);
  const scheduleEnd = parseTimeToMinutes(schedule.end_time);

  if (
    scheduleStart === null ||
    scheduleEnd === null ||
    scheduleEnd <= scheduleStart
  ) {
    return {
      summary: {
        color: "red" as DayColor,
        title: "No trabaja",
        detail: "El horario no está configurado correctamente.",
        slots: 0,
      },
      availableSlots: [] as string[],
    };
  }

  const applicableTimeOffRows = timeOffRows.filter((row) =>
    dateIsWithinRange(date, row.date, row.end_date)
  );

  const hasFullDayBlock = applicableTimeOffRows.some((row) => row.is_full_day);

  if (hasFullDayBlock) {
    return {
      summary: {
        color: "red" as DayColor,
        title: "Ocupado",
        detail: "No hay horas libres para ese día.",
        slots: 0,
      },
      availableSlots: [] as string[],
    };
  }

  const today = getTodayDate();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const availableSlots: string[] = [];
  let totalCandidateSlots = 0;

  for (
    let candidateStart = scheduleStart;
    candidateStart + serviceDuration <= scheduleEnd;
    candidateStart += SLOT_STEP_MINUTES
  ) {
    const candidateEnd = candidateStart + serviceDuration;

    if (date === today && candidateStart <= nowMinutes) {
      continue;
    }

    totalCandidateSlots += 1;

    let blocked = false;

    for (const block of applicableTimeOffRows) {
      const blockStart = parseTimeToMinutes(block.start_time);
      const blockEnd = parseTimeToMinutes(block.end_time);

      if (
        blockStart !== null &&
        blockEnd !== null &&
        blockEnd > blockStart &&
        rangesOverlap(candidateStart, candidateEnd, blockStart, blockEnd)
      ) {
        blocked = true;
        break;
      }
    }

    if (blocked) continue;

    for (const reserva of reservasRows) {
      const reservaStart = parseTimeToMinutes(reserva.time);
      const reservaDuration = getReservaDuration(reserva.servicio);

      if (reservaStart === null || !reservaDuration) continue;

      const reservaEnd = reservaStart + reservaDuration;

      if (
        rangesOverlap(candidateStart, candidateEnd, reservaStart, reservaEnd)
      ) {
        blocked = true;
        break;
      }
    }

    if (blocked) continue;

    availableSlots.push(formatMinutesToTime(candidateStart));
  }

  const hasPartialRestrictions =
    reservasRows.length > 0 ||
    applicableTimeOffRows.some(
      (row) =>
        !row.is_full_day &&
        row.start_time !== null &&
        row.end_time !== null
    );

  if (availableSlots.length === 0) {
    return {
      summary: {
        color: "red" as DayColor,
        title: "Ocupado",
        detail: "No quedan horas libres.",
        slots: 0,
      },
      availableSlots,
    };
  }

  if (!hasPartialRestrictions && availableSlots.length === totalCandidateSlots) {
    return {
      summary: {
        color: "green" as DayColor,
        title: "Libre",
        detail: "Día completamente libre.",
        slots: availableSlots.length,
      },
      availableSlots,
    };
  }

  return {
    summary: {
      color: "orange" as DayColor,
      title: "Libre",
      detail: "Quedan huecos disponibles.",
      slots: availableSlots.length,
    },
    availableSlots,
  };
}

async function getBaseData(employeeId: number, serviceId: number) {
  const supabaseAdmin = getSupabaseAdmin();

  const [
    { data: employee, error: employeeError },
    { data: service, error: serviceError },
  ] = await Promise.all([
    supabaseAdmin
      .from("empleados")
      .select("id, name, status, public_booking_enabled")
      .eq("id", employeeId)
      .eq("public_booking_enabled", true)
      .maybeSingle(),

    supabaseAdmin
      .from("servicios")
      .select("id, name, duration_minutes")
      .eq("id", serviceId)
      .eq("public_visible", true)
      .maybeSingle(),
  ]);

  if (employeeError) {
    throw new Error(employeeError.message);
  }

  if (serviceError) {
    throw new Error(serviceError.message);
  }

  const typedEmployee = (employee as Empleado | null) ?? null;

  if (!typedEmployee || !isEmployeePublicBookable(typedEmployee)) {
    throw new Error("Empleado no disponible para reservas públicas.");
  }

  if (!service) {
    throw new Error("Servicio no disponible para reserva online.");
  }

  if (
    !Number.isFinite(service.duration_minutes) ||
    (service.duration_minutes ?? 0) <= 0
  ) {
    throw new Error("El servicio no tiene una duración válida.");
  }

  return {
    employee: typedEmployee,
    service: service as Servicio,
  };
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { searchParams } = new URL(request.url);

    const employeeId = Number(searchParams.get("employeeId"));
    const serviceId = Number(searchParams.get("serviceId"));
    const date = searchParams.get("date")?.trim() ?? "";
    const month = searchParams.get("month")?.trim() ?? "";

    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      return NextResponse.json(
        { error: "employeeId no válido." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(serviceId) || serviceId <= 0) {
      return NextResponse.json(
        { error: "serviceId no válido." },
        { status: 400 }
      );
    }

    const { employee, service } = await getBaseData(employeeId, serviceId);
    const serviceDuration = Number(service.duration_minutes);

    if (date) {
      const weekday = getWeekdayFromDate(date);

      if (weekday === null) {
        return NextResponse.json(
          { error: "Fecha no válida." },
          { status: 400 }
        );
      }

      const [
        { data: schedule, error: scheduleError },
        { data: timeOffRows, error: timeOffError },
        { data: reservasRows, error: reservasError },
      ] = await Promise.all([
        supabaseAdmin
          .from("employee_schedules")
          .select("id, employee_id, weekday, start_time, end_time, is_working")
          .eq("employee_id", employeeId)
          .eq("weekday", weekday)
          .maybeSingle(),

        supabaseAdmin
          .from("employee_time_off")
          .select(
            "id, employee_id, date, end_date, start_time, end_time, reason, is_full_day"
          )
          .eq("employee_id", employeeId),

        supabaseAdmin
          .from("reservas")
          .select(`
            id,
            employee_id,
            date,
            time,
            status,
            servicio:servicios!reservas_service_id_fkey(duration_minutes)
          `)
          .eq("employee_id", employeeId)
          .eq("date", date)
          .neq("status", "Cancelada")
          .order("time", { ascending: true }),
      ]);

      if (scheduleError) {
        throw new Error(scheduleError.message);
      }

      if (timeOffError) {
        throw new Error(timeOffError.message);
      }

      if (reservasError) {
        throw new Error(reservasError.message);
      }

      const result = buildDayAvailability({
        date,
        serviceDuration,
        schedule: (schedule as ScheduleRow | null) ?? null,
        timeOffRows: (timeOffRows ?? []) as TimeOffRow[],
        reservasRows: (reservasRows ?? []) as ReservaRow[],
      });

      return NextResponse.json({
        employee,
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes,
        },
        date,
        summary: result.summary,
        availableSlots: result.availableSlots,
      });
    }

    if (month) {
      const { start, end } = getMonthDateRange(month);

      const [
        { data: schedules, error: schedulesError },
        { data: timeOffRows, error: timeOffError },
        { data: reservasRows, error: reservasError },
      ] = await Promise.all([
        supabaseAdmin
          .from("employee_schedules")
          .select("id, employee_id, weekday, start_time, end_time, is_working")
          .eq("employee_id", employeeId),

        supabaseAdmin
          .from("employee_time_off")
          .select(
            "id, employee_id, date, end_date, start_time, end_time, reason, is_full_day"
          )
          .eq("employee_id", employeeId),

        supabaseAdmin
          .from("reservas")
          .select(`
            id,
            employee_id,
            date,
            time,
            status,
            servicio:servicios!reservas_service_id_fkey(duration_minutes)
          `)
          .eq("employee_id", employeeId)
          .gte("date", start)
          .lte("date", end)
          .neq("status", "Cancelada")
          .order("date", { ascending: true })
          .order("time", { ascending: true }),
      ]);

      if (schedulesError) {
        throw new Error(schedulesError.message);
      }

      if (timeOffError) {
        throw new Error(timeOffError.message);
      }

      if (reservasError) {
        throw new Error(reservasError.message);
      }

      const schedulesRows = (schedules ?? []) as ScheduleRow[];
      const allTimeOffRows = (timeOffRows ?? []) as TimeOffRow[];
      const reservasByDate = new Map<string, ReservaRow[]>();

      for (const row of (reservasRows ?? []) as ReservaRow[]) {
        const list = reservasByDate.get(row.date) ?? [];
        list.push(row);
        reservasByDate.set(row.date, list);
      }

      const days: {
        date: string;
        color: DayColor;
        title: string;
        detail: string;
        slots: number;
      }[] = [];

      const totalDays = getMonthDaysCount(month);

      for (let day = 1; day <= totalDays; day += 1) {
        const currentDate = `${month}-${String(day).padStart(2, "0")}`;
        const weekday = getWeekdayFromDate(currentDate);

        if (weekday === null) continue;

        const schedule =
          schedulesRows.find((row) => row.weekday === weekday) ?? null;

        const dayResult = buildDayAvailability({
          date: currentDate,
          serviceDuration,
          schedule,
          timeOffRows: allTimeOffRows,
          reservasRows: reservasByDate.get(currentDate) ?? [],
        });

        days.push({
          date: currentDate,
          color: dayResult.summary.color,
          title: dayResult.summary.title,
          detail: dayResult.summary.detail,
          slots: dayResult.summary.slots,
        });
      }

      return NextResponse.json({
        employee,
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes,
        },
        month,
        days,
      });
    }

    return NextResponse.json(
      { error: "Debes indicar date o month." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al calcular disponibilidad.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}