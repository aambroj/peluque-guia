import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function normalizeSlug(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function sanitizeHexColor(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : "#111827";
}

function sanitizeLogoUrl(value: string | null | undefined) {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  if (/^https?:\/\/.+/i.test(raw)) {
    return raw;
  }

  return null;
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
      .select(
        "id, name, slug, email, brand_primary_color, public_booking_message, public_logo_url"
      )
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

    return NextResponse.json({
      business: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        email: data.email ?? null,
        brand_primary_color: sanitizeHexColor(data.brand_primary_color),
        public_booking_message: data.public_booking_message ?? "",
        public_logo_url: sanitizeLogoUrl(data.public_logo_url),
      },
    });
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