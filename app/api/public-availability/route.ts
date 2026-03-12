import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getBookingAvailability } from "@/lib/bookingAvailability";
import { normalizeDateToISO } from "@/lib/availability";

type PublicDaySummary = {
  color: "green" | "orange" | "red";
  title: string;
  detail: string;
  slots: number;
};

function isCancelledStatus(status?: string | null) {
  if (!status) return false;

  const value = status.trim().toLowerCase();
  return (
    value === "cancelada" ||
    value === "cancelado" ||
    value === "cancelled" ||
    value === "canceled"
  );
}

function getTodayDateISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayMonthISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildDaySummary(
  result: Awaited<ReturnType<typeof getBookingAvailability>>
): PublicDaySummary {
  const hasFullDayBlock = result.timeOff.some((item) => item.is_full_day);
  const hasPartialBlocks = result.timeOff.some((item) => !item.is_full_day);
  const hasActiveBookings = result.bookings.some(
    (item) => !isCancelledStatus(item.status)
  );

  if (!result.schedule) {
    return {
      color: "red",
      title: "Sin horario",
      detail: "Ese empleado no tiene horario configurado para ese día.",
      slots: 0,
    };
  }

  if (!result.schedule.is_working) {
    return {
      color: "red",
      title: "No trabaja",
      detail: "Ese empleado no trabaja ese día.",
      slots: 0,
    };
  }

  if (hasFullDayBlock) {
    return {
      color: "red",
      title: "Bloqueado",
      detail: "El día está bloqueado completo.",
      slots: 0,
    };
  }

  if (result.availableSlots.length === 0) {
    return {
      color: "red",
      title: "Completo",
      detail: "No quedan huecos disponibles.",
      slots: 0,
    };
  }

  if (!hasActiveBookings && !hasPartialBlocks) {
    return {
      color: "green",
      title: "Libre",
      detail: "Día completamente libre.",
      slots: result.availableSlots.length,
    };
  }

  return {
    color: "orange",
    title: "Semiocupado",
    detail: "Quedan huecos disponibles.",
    slots: result.availableSlots.length,
  };
}

function getMonthDates(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("El parámetro month debe tener formato YYYY-MM");
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${year}-${String(monthNumber).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    dates.push(isoDate);
  }

  return dates;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const searchParams = request.nextUrl.searchParams;

    const employeeId = Number(searchParams.get("employeeId"));
    const serviceId = Number(searchParams.get("serviceId"));
    const dateParam = searchParams.get("date");
    const monthParam = searchParams.get("month");

    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      return NextResponse.json(
        { error: "employeeId es obligatorio y debe ser numérico." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(serviceId) || serviceId <= 0) {
      return NextResponse.json(
        { error: "serviceId es obligatorio y debe ser numérico." },
        { status: 400 }
      );
    }

    if (!dateParam && !monthParam) {
      return NextResponse.json(
        { error: "Debes enviar date=YYYY-MM-DD o month=YYYY-MM." },
        { status: 400 }
      );
    }

    const { data: employee, error: employeeError } = await supabase
      .from("empleados")
      .select("id, name, public_booking_enabled, status")
      .eq("id", employeeId)
      .maybeSingle();

    if (employeeError) {
      return NextResponse.json(
        { error: employeeError.message },
        { status: 500 }
      );
    }

    if (!employee || employee.public_booking_enabled !== true) {
      return NextResponse.json(
        { error: "Empleado no disponible para reserva pública." },
        { status: 404 }
      );
    }

    if (employee.status === "Descanso") {
      return NextResponse.json(
        { error: "Ese empleado no está disponible actualmente." },
        { status: 409 }
      );
    }

    const { data: service, error: serviceError } = await supabase
      .from("servicios")
      .select("id, name, duration_minutes, public_visible")
      .eq("id", serviceId)
      .maybeSingle();

    if (serviceError) {
      return NextResponse.json(
        { error: serviceError.message },
        { status: 500 }
      );
    }

    if (!service || service.public_visible !== true) {
      return NextResponse.json(
        { error: "Servicio no disponible públicamente." },
        { status: 404 }
      );
    }

    if (dateParam) {
      const date = normalizeDateToISO(dateParam);

      if (date < getTodayDateISO()) {
        return NextResponse.json(
          { error: "No se puede consultar disponibilidad de fechas pasadas." },
          { status: 400 }
        );
      }

      const result = await getBookingAvailability({
        supabase,
        employeeId,
        serviceId,
        date,
      });

      const summary = buildDaySummary(result);

      return NextResponse.json({
        employee: {
          id: employee.id,
          name: employee.name,
        },
        service: {
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes,
        },
        date,
        summary,
        availableSlots: result.availableSlots,
      });
    }

    const month = monthParam as string;

    if (month < getTodayMonthISO()) {
      return NextResponse.json(
        { error: "No se puede consultar disponibilidad de meses pasados." },
        { status: 400 }
      );
    }

    const dates = getMonthDates(month).filter((date) => date >= getTodayDateISO());

    const days = await Promise.all(
      dates.map(async (date) => {
        const result = await getBookingAvailability({
          supabase,
          employeeId,
          serviceId,
          date,
        });

        const summary = buildDaySummary(result);

        return {
          date,
          ...summary,
        };
      })
    );

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
      },
      service: {
        id: service.id,
        name: service.name,
        duration_minutes: service.duration_minutes,
      },
      month,
      days,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno calculando disponibilidad pública.",
      },
      { status: 500 }
    );
  }
}