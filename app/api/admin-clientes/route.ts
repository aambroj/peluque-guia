import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerBusinessContext } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { user, businessId } = await getServerBusinessContext();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión." },
        { status: 401 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Tu usuario no tiene un negocio asociado." },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("clientes")
      .select("id, name")
      .eq("business_id", businessId)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      clientes: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar clientes",
      },
      { status: 500 }
    );
  }
}