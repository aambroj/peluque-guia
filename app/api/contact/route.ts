import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type ContactBody = {
  name?: string;
  email?: string;
  businessName?: string;
  phone?: string;
  employeesRange?: string;
  message?: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactBody;

    const name = normalizeText(body.name);
    const email = normalizeText(body.email).toLowerCase();
    const businessName = normalizeText(body.businessName);
    const phone = normalizeText(body.phone);
    const employeesRange = normalizeText(body.employeesRange);
    const message = normalizeText(body.message);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Debes completar nombre, email y mensaje." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "El email no tiene un formato válido." },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "El mensaje es demasiado corto." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.from("contact_requests").insert({
      name,
      email,
      business_name: businessName || null,
      phone: phone || null,
      employees_range: employeesRange || null,
      message,
      source: "web-contact-form",
      status: "new",
    });

    if (error) {
      console.error("Error guardando solicitud de contacto:", error);
      return NextResponse.json(
        { error: "No se pudo enviar la solicitud ahora mismo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Solicitud enviada correctamente.",
    });
  } catch (error) {
    console.error("Error en /api/contact:", error);

    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 500 }
    );
  }
}