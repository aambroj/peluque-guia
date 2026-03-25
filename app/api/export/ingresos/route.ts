import { NextRequest, NextResponse } from "next/server";
import { getServerBusinessContext } from "@/lib/supabase-server";

export const runtime = "nodejs";

const REVENUE_STATUSES = new Set(["Confirmada", "Completada"]);

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasRevenueExportAccess(
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

function normalizeDateParam(value: string | null) {
  const raw = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function normalizeGroupByParam(value: string | null) {
  const raw = String(value ?? "").trim();
  return ["employee", "service", "day"].includes(raw) ? raw : "employee";
}

function slugifyFilenamePart(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function getReservationPrice(reserva: any) {
  const rawSnapshot = reserva?.price_at_booking;
  const snapshot =
    typeof rawSnapshot === "number" ? rawSnapshot : Number(rawSnapshot);

  if (Number.isFinite(snapshot)) {
    return snapshot;
  }

  const servicio = Array.isArray(reserva?.servicio)
    ? reserva.servicio[0]
    : reserva?.servicio;

  const rawPrice = servicio?.price ?? 0;
  const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);

  return Number.isFinite(price) ? price : 0;
}

export async function GET(request: NextRequest) {
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

    if (!hasRevenueExportAccess(subscription?.plan, subscription?.status)) {
      return NextResponse.json(
        {
          error:
            "La exportación de ingresos CSV está disponible solo en los planes Pro y Premium.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = normalizeDateParam(searchParams.get("from"));
    const to = normalizeDateParam(searchParams.get("to"));
    const groupBy = normalizeGroupByParam(searchParams.get("groupBy"));

    if (from && to && from > to) {
      return NextResponse.json(
        { error: "La fecha 'desde' no puede ser mayor que la fecha 'hasta'." },
        { status: 400 }
      );
    }

    let query = supabase
      .from("reservas")
      .select(`
        id,
        date,
        status,
        price_at_booking,
        empleado:empleados!reservas_employee_id_fkey(name),
        servicio:servicios!reservas_service_id_fkey(name, price)
      `)
      .eq("business_id", businessId)
      .order("date", { ascending: true });

    if (from) {
      query = query.gte("date", from);
    }

    if (to) {
      query = query.lte("date", to);
    }

    const { data: reservas, error: reservasError } = await query;

    if (reservasError) {
      return NextResponse.json(
        { error: reservasError.message },
        { status: 500 }
      );
    }

    const filtered = (reservas ?? []).filter((reserva: any) =>
      REVENUE_STATUSES.has(reserva.status)
    );

    if (groupBy === "employee") {
      const grouped = new Map<
        string,
        { empleado: string; reservas: number; ingresos: number }
      >();

      for (const reserva of filtered) {
        const empleado = Array.isArray(reserva.empleado)
          ? reserva.empleado[0]
          : reserva.empleado;

        const empleadoNombre = empleado?.name ?? "Sin asignar";
        const precio = getReservationPrice(reserva);

        const current = grouped.get(empleadoNombre) ?? {
          empleado: empleadoNombre,
          reservas: 0,
          ingresos: 0,
        };

        current.reservas += 1;
        current.ingresos += precio;

        grouped.set(empleadoNombre, current);
      }

      const rows: string[][] = [
        ["Empleado", "Reservas contabilizadas", "Ingresos"],
        ...Array.from(grouped.values())
          .sort((a, b) => {
            if (b.ingresos !== a.ingresos) return b.ingresos - a.ingresos;
            return a.empleado.localeCompare(b.empleado);
          })
          .map((item) => [
            item.empleado,
            String(item.reservas),
            String(item.ingresos),
          ]),
      ];

      const filename = [
        "ingresos",
        "empleado",
        from ? `desde-${from}` : "",
        to ? `hasta-${to}` : "",
      ]
        .filter(Boolean)
        .join("_");

      return new NextResponse("\uFEFF" + toCsv(rows), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (groupBy === "service") {
      const grouped = new Map<
        string,
        { servicio: string; reservas: number; ingresos: number }
      >();

      for (const reserva of filtered) {
        const servicio = Array.isArray(reserva.servicio)
          ? reserva.servicio[0]
          : reserva.servicio;

        const servicioNombre = servicio?.name ?? "Sin servicio";
        const precio = getReservationPrice(reserva);

        const current = grouped.get(servicioNombre) ?? {
          servicio: servicioNombre,
          reservas: 0,
          ingresos: 0,
        };

        current.reservas += 1;
        current.ingresos += precio;

        grouped.set(servicioNombre, current);
      }

      const rows: string[][] = [
        ["Servicio", "Reservas contabilizadas", "Ingresos"],
        ...Array.from(grouped.values())
          .sort((a, b) => {
            if (b.ingresos !== a.ingresos) return b.ingresos - a.ingresos;
            return a.servicio.localeCompare(b.servicio);
          })
          .map((item) => [
            item.servicio,
            String(item.reservas),
            String(item.ingresos),
          ]),
      ];

      const filename = [
        "ingresos",
        "servicio",
        from ? `desde-${from}` : "",
        to ? `hasta-${to}` : "",
      ]
        .filter(Boolean)
        .join("_");

      return new NextResponse("\uFEFF" + toCsv(rows), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const grouped = new Map<
      string,
      { fecha: string; reservas: number; ingresos: number }
    >();

    for (const reserva of filtered) {
      const fecha = String(reserva.date ?? "");
      const precio = getReservationPrice(reserva);

      const current = grouped.get(fecha) ?? {
        fecha,
        reservas: 0,
        ingresos: 0,
      };

      current.reservas += 1;
      current.ingresos += precio;

      grouped.set(fecha, current);
    }

    const rows: string[][] = [
      ["Fecha", "Reservas contabilizadas", "Ingresos"],
      ...Array.from(grouped.values())
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .map((item) => [
          item.fecha,
          String(item.reservas),
          String(item.ingresos),
        ]),
    ];

    const filename = [
      "ingresos",
      "dia",
      from ? `desde-${from}` : "",
      to ? `hasta-${to}` : "",
    ]
      .filter(Boolean)
      .map(slugifyFilenamePart)
      .join("_");

    return new NextResponse("\uFEFF" + toCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo exportar el CSV de ingresos.",
      },
      { status: 500 }
    );
  }
}