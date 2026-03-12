import {
  BookingRow,
  ScheduleRow,
  TimeOffRow,
  generateAvailableSlots,
  getWeekdayFromDate,
  normalizeDateToISO,
} from "./availability";

type SupabaseClientLike = any;

function toLegacyDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function dedupeBookings(bookings: BookingRow[]): BookingRow[] {
  const map = new Map<string, BookingRow>();

  for (const booking of bookings) {
    const key =
      booking.id !== undefined
        ? String(booking.id)
        : `${booking.employee_id}-${booking.date}-${booking.start_time}-${booking.end_time}`;

    if (!map.has(key)) {
      map.set(key, booking);
    }
  }

  return Array.from(map.values());
}

export async function getServiceDurationMinutes(params: {
  supabase: SupabaseClientLike;
  serviceId: number;
}): Promise<number> {
  const { supabase, serviceId } = params;

  const { data, error } = await supabase
    .from("servicios")
    .select("id, name, duration_minutes")
    .eq("id", serviceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al cargar la duración del servicio: ${error.message}`);
  }

  if (!data) {
    throw new Error("No se encontró el servicio seleccionado.");
  }

  const duration = Number(data.duration_minutes);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("El servicio no tiene una duración válida.");
  }

  return duration;
}

export async function getEmployeeScheduleForDate(params: {
  supabase: SupabaseClientLike;
  employeeId: number;
  date: string;
}): Promise<ScheduleRow | null> {
  const { supabase, employeeId, date } = params;

  const normalizedDate = normalizeDateToISO(date);
  const weekday = getWeekdayFromDate(normalizedDate);

  const { data, error } = await supabase
    .from("employee_schedules")
    .select("employee_id, weekday, start_time, end_time, is_working")
    .eq("employee_id", employeeId)
    .eq("weekday", weekday)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al cargar el horario del empleado: ${error.message}`);
  }

  return (data as ScheduleRow | null) ?? null;
}

export async function getEmployeeTimeOffForDate(params: {
  supabase: SupabaseClientLike;
  employeeId: number;
  date: string;
}): Promise<TimeOffRow[]> {
  const { supabase, employeeId, date } = params;

  const normalizedDate = normalizeDateToISO(date);

  const { data, error } = await supabase
    .from("employee_time_off")
    .select("employee_id, date, start_time, end_time, reason, is_full_day")
    .eq("employee_id", employeeId)
    .eq("date", normalizedDate)
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(`Error al cargar los bloqueos del empleado: ${error.message}`);
  }

  return (data as TimeOffRow[]) ?? [];
}

export async function getEmployeeBookingsForDate(params: {
  supabase: SupabaseClientLike;
  employeeId: number;
  date: string;
}): Promise<BookingRow[]> {
  const { supabase, employeeId, date } = params;

  const normalizedDate = normalizeDateToISO(date);
  const legacyDate = toLegacyDisplayDate(normalizedDate);

  const baseQuery = supabase
    .from("reservas")
    .select("id, employee_id, service_id, client_id, date, start_time, end_time, status")
    .eq("employee_id", employeeId)
    .order("start_time", { ascending: true });

  const [isoResult, legacyResult] = await Promise.all([
    baseQuery.eq("date", normalizedDate),
    normalizedDate === legacyDate
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("reservas")
          .select("id, employee_id, service_id, client_id, date, start_time, end_time, status")
          .eq("employee_id", employeeId)
          .eq("date", legacyDate)
          .order("start_time", { ascending: true }),
  ]);

  if (isoResult.error) {
    throw new Error(`Error al cargar las reservas del día: ${isoResult.error.message}`);
  }

  if (legacyResult.error) {
    throw new Error(
      `Error al cargar las reservas antiguas del día: ${legacyResult.error.message}`
    );
  }

  const isoBookings = (isoResult.data as BookingRow[]) ?? [];
  const legacyBookings = (legacyResult.data as BookingRow[]) ?? [];

  return dedupeBookings([...isoBookings, ...legacyBookings]);
}

export async function getBookingAvailability(params: {
  supabase: SupabaseClientLike;
  employeeId: number;
  serviceId: number;
  date: string;
  slotStepMinutes?: number;
}) {
  const {
    supabase,
    employeeId,
    serviceId,
    date,
    slotStepMinutes = 30,
  } = params;

  const normalizedDate = normalizeDateToISO(date);

  const [serviceDurationMinutes, schedule, timeOff, bookings] = await Promise.all([
    getServiceDurationMinutes({ supabase, serviceId }),
    getEmployeeScheduleForDate({ supabase, employeeId, date: normalizedDate }),
    getEmployeeTimeOffForDate({ supabase, employeeId, date: normalizedDate }),
    getEmployeeBookingsForDate({ supabase, employeeId, date: normalizedDate }),
  ]);

  const availableSlots = generateAvailableSlots({
    schedule,
    bookings,
    timeOff,
    serviceDurationMinutes,
    slotStepMinutes,
  });

  return {
    normalizedDate,
    serviceDurationMinutes,
    schedule,
    timeOff,
    bookings,
    availableSlots,
  };
}