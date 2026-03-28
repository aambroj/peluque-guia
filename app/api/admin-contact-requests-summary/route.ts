import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const CONTACT_ADMIN_EMAILS = (
  process.env.CONTACT_ADMIN_EMAILS?.split(",") ?? [
    "alber.ambroj@gmail.com",
    "aambroj@yahoo.es",
  ]
)
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { isAdmin: false, newCount: 0 },
        { status: 200 }
      );
    }

    const userEmail = user.email?.trim().toLowerCase() ?? "";
    const isAdmin = CONTACT_ADMIN_EMAILS.includes(userEmail);

    if (!isAdmin) {
      return NextResponse.json(
        { isAdmin: false, newCount: 0 },
        { status: 200 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { count, error } = await supabaseAdmin
      .from("contact_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    if (error) {
      console.error("Error contando solicitudes nuevas:", error);

      return NextResponse.json(
        { isAdmin: true, newCount: 0, error: "No se pudo cargar el resumen." },
        { status: 200 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      newCount: count ?? 0,
    });
  } catch (error) {
    console.error("Error en admin-contact-requests-summary:", error);

    return NextResponse.json(
      { isAdmin: false, newCount: 0, error: "Error interno." },
      { status: 200 }
    );
  }
}