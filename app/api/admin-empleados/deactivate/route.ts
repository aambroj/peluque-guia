import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body?.id);

    if (!id) {
      return NextResponse.json(
        { error: "Falta el id del empleado." },
        { status: 400 }
      );
    }

    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No necesitamos escribir cookies aquí.
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.business_id) {
      return NextResponse.json(
        { error: "No se ha podido resolver el negocio del usuario." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("empleados")
      .update({ status: "Inactivo" })
      .eq("id", id)
      .eq("business_id", profile.business_id);

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