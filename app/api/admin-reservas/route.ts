import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminBookingBody;

    const clientId = toNumber(body.client_id);
    const employeeId = toNumber(body.employee_id);
    const serviceId = toNumber(body.service_id);

    const date = normalizeText(body.date);
    const time = normalizeText(body.time);
    const start_time = normalizeText(body.start_time);
    const end_time = normalizeText(body.end_time);
    const status = normalizeText(body.status) || "Pendiente";
    const notes = normalizeText(body.notes);

    if (
      !clientId ||
      !employeeId ||
      !serviceId ||
      !date ||
      !time ||
      !start_time ||
      !end_time ||
      !status
    ) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios para guardar la reserva." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const [
      { data: cliente, error: clienteError },
      { data: empleado, error: empleadoError },
      { data: servicio, error: servicioError },
    ] = await Promise.all([
      supabase.from("clientes").select("id").eq("id", clientId).maybeSingle(),
      supabase.from("empleados").select("id").eq("id", employeeId).maybeSingle(),
      supabase
        .from("servicios")
        .select("id, name, price")
        .eq("id", serviceId)
        .maybeSingle(),
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

    if (!cliente) {
      return NextResponse.json(
        { error: "El cliente seleccionado no existe." },
        { status: 400 }
      );
    }

    if (!empleado) {
      return NextResponse.json(
        { error: "El empleado seleccionado no existe." },
        { status: 400 }
      );
    }

    if (!servicio) {
      return NextResponse.json(
        { error: "El servicio seleccionado no existe." },
        { status: 400 }
      );
    }

    const priceAtBooking = toPriceNumber((servicio as any).price);

    if (priceAtBooking === null || priceAtBooking < 0) {
      return NextResponse.json(
        { error: "El servicio no tiene un precio válido para guardar la reserva." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("reservas")
      .insert([
        {
          client_id: clientId,
          employee_id: employeeId,
          service_id: serviceId,
          date,
          time,
          start_time,
          end_time,
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