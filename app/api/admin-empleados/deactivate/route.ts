import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerBusinessContext } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { user, businessId } = await getServerBusinessContext();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "No se ha podido resolver el negocio del usuario." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = Number(body?.id);

    if (!id) {
      return NextResponse.json(
        { error: "Falta el id del empleado." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: empleado, error: empleadoError } = await supabaseAdmin
      .from("empleados")
      .select("id, business_id")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (empleadoError) {
      return NextResponse.json(
        { error: empleadoError.message },
        { status: 500 }
      );
    }

    if (!empleado) {
      return NextResponse.json(
        { error: "El empleado no existe en tu negocio." },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin
      .from("empleados")
      .update({
        status: "Inactivo",
        public_booking_enabled: false,
      })
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al dar de baja al empleado",
      },
      { status: 500 }
    );
  }
}