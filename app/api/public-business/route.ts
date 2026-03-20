import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function normalizeSlug(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { searchParams } = new URL(request.url);
    const slug = normalizeSlug(searchParams.get("slug"));

    if (!slug) {
      return NextResponse.json({ error: "slug no válido." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "No se encontró el salón solicitado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ business: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al cargar el salón público.",
      },
      { status: 500 }
    );
  }
}