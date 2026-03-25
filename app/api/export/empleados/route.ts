import { NextRequest, NextResponse } from "next/server";
import { getServerBusinessContext } from "@/lib/supabase-server";

export const runtime = "nodejs";

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasEmployeesExportAccess(
  plan: string | null | undefined,
  status: string | null | undefined
) {
  const normalizedPlan = normalizeText(plan ?? "");
  const normalizedStatus = normalizeText(status ?? "");

  const validPlans = ["pro", "premium"];
  const validStatuses = ["trialing", "active", "past_due", "unpaid", "paused"];

  return (
    validPlans.includes(normalizedPlan) &&
    validStatuses.includes(normalizedStatus)
  );
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export async function GET(_request: NextRequest) {
  try {
    const { supabase, user, businessId } = await getServerBusinessContext();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "No se ha encontrado el negocio actual." },
        { status: 400 }
      );
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("business_id", businessId)
      .maybeSingle();

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    if (!hasEmployeesExportAccess(subscription?.plan, subscription?.status)) {
      return NextResponse.json(
        {
          error:
            "La exportación de empleados CSV está disponible solo en los planes Pro y Premium.",
        },
        { status: 403 }
      );
    }

    const { data: empleados, error: empleadosError } = await supabase
      .from("empleados")
      .select("id, name, role, phone, status, public_booking_enabled")
      .eq("business_id", businessId)
      .order("name", { ascending: true });

    if (empleadosError) {
      return NextResponse.json(
        { error: empleadosError.message },
        { status: 500 }
      );
    }

    const rows: string[][] = [
      ["ID", "Nombre", "Rol", "Teléfono", "Estado", "Reserva online"],
      ...(empleados ?? []).map((empleado: any) => [
        String(empleado.id ?? ""),
        String(empleado.name ?? ""),
        String(empleado.role ?? ""),
        String(empleado.phone ?? ""),
        String(empleado.status ?? ""),
        empleado.public_booking_enabled === true ? "Sí" : "No",
      ]),
    ];

    const csv = "\uFEFF" + toCsv(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="empleados.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo exportar el CSV de empleados.",
      },
      { status: 500 }
    );
  }
}