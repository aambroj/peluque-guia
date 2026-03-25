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

function hasReservationsExportAccess(
  plan: string | null | undefined,
  status: string | null | undefined
) {
  const normalizedPlan = normalizeText(plan ?? "");
  const normalizedStatus = normalizeText(status ?? "");

  const validPlans = ["pro", "premium"];
  const validStatuses = ["trialing", "active", "past_due", "unpaid", "paused"];

  return validPlans.includes(normalizedPlan) && validStatuses.includes(normalizedStatus);
}

function getRelation(value: any) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getRelationName(value: any, fallback = "") {
  return getRelation(value)?.name ?? fallback;
}

function getRelationPhone(value: any, fallback = "") {
  return getRelation(value)?.phone ?? fallback;
}

function getReservationPrice(reserva: any) {
  const rawSnapshot = reserva?.price_at_booking;
  const snapshot =
    typeof rawSnapshot === "number" ? rawSnapshot : Number(rawSnapshot);

  if (Number.isFinite(snapshot)) {
    return snapshot;
  }

  const servicio = getRelation(reserva?.servicio);
  const rawPrice = servicio?.price ?? 0;
  const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);

  return Number.isFinite(price) ? price : 0;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function buildFilename(dateFrom?: string | null, dateTo?: string | null) {
  if (dateFrom && dateTo) {
    return `reservas-${dateFrom}-a-${dateTo}.csv`;
  }

  if (dateFrom) {
    return `reservas-desde-${dateFrom}.csv`;
  }

  if (dateTo) {
    return `reservas-hasta-${dateTo}.csv`;
  }

  return "reservas.csv";
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, businessId } = await getServerBusinessContext();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
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

    if (
      !hasReservationsExportAccess(subscription?.plan, subscription?.status)
    ) {
      return NextResponse.json(
        {
          error:
            "La exportación de reservas CSV está disponible solo en los planes Pro y Premium.",
        },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employee_id");

    let query = supabase
      .from("reservas")
      .select(`
        id,
        date,
        time,
        status,
        price_at_booking,
        cliente:clientes!reservas_client_id_fkey(name, phone),
        servicio:servicios!reservas_service_id_fkey(name, price),
        empleado:empleados!reservas_employee_id_fkey(name)
      `)
      .eq("business_id", businessId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (dateFrom) {
      query = query.gte("date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("date", dateTo);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (employeeId) {
      const parsedEmployeeId = Number(employeeId);

      if (Number.isFinite(parsedEmployeeId)) {
        query = query.eq("employee_id", parsedEmployeeId);
      }
    }

    const { data: reservas, error: reservasError } = await query;

    if (reservasError) {
      return NextResponse.json(
        { error: reservasError.message },
        { status: 500 }
      );
    }

    const rows: string[][] = [
      [
        "ID",
        "Fecha",
        "Hora",
        "Estado",
        "Cliente",
        "Teléfono cliente",
        "Empleado",
        "Servicio",
        "Precio reservado",
      ],
      ...(reservas ?? []).map((reserva: any) => [
        String(reserva.id ?? ""),
        String(reserva.date ?? ""),
        String(reserva.time ?? ""),
        String(reserva.status ?? ""),
        getRelationName(reserva.cliente, ""),
        getRelationPhone(reserva.cliente, ""),
        getRelationName(reserva.empleado, ""),
        getRelationName(reserva.servicio, ""),
        String(getReservationPrice(reserva)),
      ]),
    ];

    const csv = "\uFEFF" + toCsv(rows);
    const filename = buildFilename(dateFrom, dateTo);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo exportar el CSV de reservas.",
      },
      { status: 500 }
    );
  }
}