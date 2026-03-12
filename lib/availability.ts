export type ScheduleRow = {
  employee_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
};

export type TimeOffRow = {
  employee_id?: number;
  date?: string;
  start_time: string | null;
  end_time: string | null;
  reason?: string | null;
  is_full_day: boolean;
};

export type BookingRow = {
  id?: number;
  employee_id?: number;
  service_id?: number;
  client_id?: number;
  date?: string;
  start_time: string | null;
  end_time: string | null;
  status?: string | null;
};

const CANCELLED_STATUSES = new Set([
  "cancelada",
  "cancelado",
  "cancelled",
  "canceled",
]);

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function normalizeTime(time: string): string {
  const parts = time.trim().split(":");

  if (parts.length < 2) {
    throw new Error(`Hora inválida: ${time}`);
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Hora inválida: ${time}`);
  }

  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function timeToMinutes(time: string): number {
  const normalized = normalizeTime(time);
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  if (totalMinutes < 0) {
    throw new Error(`Minutos inválidos: ${totalMinutes}`);
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const base = timeToMinutes(time);
  return minutesToTime(base + minutesToAdd);
}

export function parseDateString(date: string): Date {
  const value = date.trim();

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  // Formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  throw new Error(`Fecha inválida: ${date}`);
}

export function normalizeDateToISO(date: string): string {
  const parsed = parseDateString(date);

  const year = parsed.getFullYear();
  const month = pad2(parsed.getMonth() + 1);
  const day = pad2(parsed.getDate());

  return `${year}-${month}-${day}`;
}

export function getWeekdayFromDate(date: string): number {
  return parseDateString(date).getDay();
}

export function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

export function isCancelledStatus(status?: string | null): boolean {
  if (!status) return false;
  return CANCELLED_STATUSES.has(status.trim().toLowerCase());
}

export function buildBookingTimes(
  startTime: string,
  serviceDurationMinutes: number
) {
  const normalizedStart = normalizeTime(startTime);
  const endTime = addMinutesToTime(normalizedStart, serviceDurationMinutes);

  return {
    start_time: normalizedStart,
    end_time: endTime,
  };
}

export function generateAvailableSlots(params: {
  schedule: ScheduleRow | null;
  bookings: BookingRow[];
  timeOff: TimeOffRow[];
  serviceDurationMinutes: number;
  slotStepMinutes?: number;
}): string[] {
  const {
    schedule,
    bookings,
    timeOff,
    serviceDurationMinutes,
    slotStepMinutes = 30,
  } = params;

  if (!schedule) return [];
  if (!schedule.is_working) return [];
  if (serviceDurationMinutes <= 0) return [];

  const scheduleStart = timeToMinutes(schedule.start_time);
  const scheduleEnd = timeToMinutes(schedule.end_time);

  if (scheduleEnd <= scheduleStart) return [];

  const hasFullDayBlock = timeOff.some((item) => item.is_full_day);
  if (hasFullDayBlock) return [];

  const blockedRanges = timeOff
    .filter(
      (item) => !item.is_full_day && item.start_time !== null && item.end_time !== null
    )
    .map((item) => ({
      start: timeToMinutes(item.start_time as string),
      end: timeToMinutes(item.end_time as string),
    }))
    .filter((range) => range.end > range.start);

  const bookingRanges = bookings
    .filter(
      (item) =>
        item.start_time !== null &&
        item.end_time !== null &&
        !isCancelledStatus(item.status)
    )
    .map((item) => ({
      start: timeToMinutes(item.start_time as string),
      end: timeToMinutes(item.end_time as string),
    }))
    .filter((range) => range.end > range.start);

  const availableSlots: string[] = [];

  for (
    let currentStart = scheduleStart;
    currentStart + serviceDurationMinutes <= scheduleEnd;
    currentStart += slotStepMinutes
  ) {
    const currentEnd = currentStart + serviceDurationMinutes;

    const collidesWithBooking = bookingRanges.some((range) =>
      overlaps(currentStart, currentEnd, range.start, range.end)
    );

    const collidesWithTimeOff = blockedRanges.some((range) =>
      overlaps(currentStart, currentEnd, range.start, range.end)
    );

    if (!collidesWithBooking && !collidesWithTimeOff) {
      availableSlots.push(minutesToTime(currentStart));
    }
  }

  return availableSlots;
}

export function isSlotStillAvailable(params: {
  startTime: string;
  serviceDurationMinutes: number;
  schedule: ScheduleRow | null;
  bookings: BookingRow[];
  timeOff: TimeOffRow[];
}): boolean {
  const {
    startTime,
    serviceDurationMinutes,
    schedule,
    bookings,
    timeOff,
  } = params;

  if (!schedule || !schedule.is_working) return false;

  const slotStart = timeToMinutes(startTime);
  const slotEnd = slotStart + serviceDurationMinutes;

  const scheduleStart = timeToMinutes(schedule.start_time);
  const scheduleEnd = timeToMinutes(schedule.end_time);

  if (slotStart < scheduleStart || slotEnd > scheduleEnd) {
    return false;
  }

  const hasFullDayBlock = timeOff.some((item) => item.is_full_day);
  if (hasFullDayBlock) return false;

  for (const item of timeOff) {
    if (item.is_full_day || !item.start_time || !item.end_time) continue;

    const blockStart = timeToMinutes(item.start_time);
    const blockEnd = timeToMinutes(item.end_time);

    if (overlaps(slotStart, slotEnd, blockStart, blockEnd)) {
      return false;
    }
  }

  for (const booking of bookings) {
    if (!booking.start_time || !booking.end_time) continue;
    if (isCancelledStatus(booking.status)) continue;

    const bookingStart = timeToMinutes(booking.start_time);
    const bookingEnd = timeToMinutes(booking.end_time);

    if (overlaps(slotStart, slotEnd, bookingStart, bookingEnd)) {
      return false;
    }
  }

  return true;
}