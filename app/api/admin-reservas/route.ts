import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      client_id,
      employee_id,
      service_id,
      date,
      time,
      start_time,
      end_time,
      status,
    } = body ?? {};

    if (
      !client_id ||
      !employee_id ||
      !service_id ||
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

    const { data, error } = await supabase
      .from("reservas")
      .insert([
        {
          client_id,
          employee_id,
          service_id,
          date,
          time,
          start_time,
          end_time,
          status,
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