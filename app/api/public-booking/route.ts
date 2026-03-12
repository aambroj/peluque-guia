import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getBookingAvailability } from "@/lib/bookingAvailability";
import {
  buildBookingTimes,
  isSlotStillAvailable,
  normalizeDateToISO,
} from "@/lib/availability";

function normalizePhone(phone: string) {
  return phone.trim();
}

function getTodayDateISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const employeeId = Number(body.employeeId);
    const serviceId = Number(body.serviceId);
    const rawDate = String(body.date ?? "");
    const startTime = String(body.startTime ?? "");
    const clientName = String(body.clientName ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));
    const notes = String(body.notes ?? "").trim();

    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      return NextResponse.json(
        { error: "employeeId inválido." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(serviceId) || serviceId <= 0) {
      return NextResponse.json(
        { error: "serviceId inválido." },
        { status: 400 }
      );
    }

    if (!rawDate) {
      return NextResponse.json(
        { error: "La fecha es obligatoria." },
        { status: 400 }
      );
    }

    if (!startTime) {
      return NextResponse.json(
        { error: "La hora es obligatoria." },
        { status: 400 }
      );
    }

    if (!clientName || clientName.length < 2) {
      return NextResponse.json(
        {
          error:
            "El nombre es obligatorio y debe tener al menos 2 caracteres.",
        },
        { status: 400 }
      );
    }

    if (!phone || phone.length < 6) {
      return NextResponse.json(
        { error: "El teléfono es obligatorio y debe ser válido." },
        { status: 400 }
      );
    }

    const date = normalizeDateToISO(rawDate);

    if (date < getTodayDateISO()) {
      return NextResponse.json(
        { error: "No se puede reservar en fechas pasadas." },
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
        { error: "Servicio no disponible para reserva pública." },
        { status: 404 }
      );
    }

    const availability = await getBookingAvailability({
      supabase,
      employeeId,
      serviceId,
      date,
    });

    const stillAvailable = isSlotStillAvailable({
      startTime,
      serviceDurationMinutes: availability.serviceDurationMinutes,
      schedule: availability.schedule,
      bookings: availability.bookings,
      timeOff: availability.timeOff,
    });

    if (!stillAvailable) {
      return NextResponse.json(
        { error: "La hora seleccionada ya no está disponible." },
        { status: 409 }
      );
    }

    const { start_time, end_time } = buildBookingTimes(
      startTime,
      availability.serviceDurationMinutes
    );

    const { data: existingClients, error: existingClientError } = await supabase
      .from("clientes")
      .select("id, name, phone")
      .eq("phone", phone)
      .order("id", { ascending: true })
      .limit(1);

    if (existingClientError) {
      return NextResponse.json(
        { error: existingClientError.message },
        { status: 500 }
      );
    }

    let clientId: number | null = existingClients?.[0]?.id ?? null;

    if (!clientId) {
      const clientPayload = {
        name: clientName,
        phone,
        visits: 0,
        last_visit: date,
        notes: notes || null,
      };

      const { data: createdClient, error: createClientError } = await supabase
        .from("clientes")
        .insert([clientPayload])
        .select("id")
        .single();

      if (createClientError) {
        return NextResponse.json(
          { error: createClientError.message },
          { status: 500 }
        );
      }

      clientId = createdClient.id as number;
    }

    const bookingPayload = {
      client_id: clientId,
      employee_id: employeeId,
      service_id: serviceId,
      date,
      time: start_time,
      start_time,
      end_time,
      status: "Pendiente",
      booking_source: "public",
    };

    const { data: booking, error: bookingError } = await supabase
      .from("reservas")
      .insert([bookingPayload])
      .select("id, date, start_time, end_time, status")
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      booking,
      employee: {
        id: employee.id,
        name: employee.name,
      },
      service: {
        id: service.id,
        name: service.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno al crear la reserva pública.",
      },
      { status: 500 }
    );
  }
}