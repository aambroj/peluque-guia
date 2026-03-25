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

function normalizeStatusParam(value: string | null) {
  const raw = String(value ?? "").trim();
  const allowed = ["Confirmada", "Pendiente", "Cancelada", "Completada"];
  return allowed.includes(raw) ? raw : "";
}

function normalizeEmployeeIdParam(value: string | null) {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) return null;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeServiceIdParam(value: string | null) {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) return null;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

    const { searchParams } = new URL(request.url);
    const from = normalizeDateParam(searchParams.get("from"));
    const to = normalizeDateParam(searchParams.get("to"));
    const status = normalizeStatusParam(searchParams.get("status"));
    const employeeId = normalizeEmployeeIdParam(searchParams.get("employeeId"));
    const serviceId = normalizeServiceIdParam(searchParams.get("serviceId"));

    if (from && to && from > to) {
      return NextResponse.json(
        { error: "La fecha 'desde' no puede ser mayor que la fecha 'hasta'." },
        { status: 400 }
      );
    }

    let employeeNameForFilename = "";
    let serviceNameForFilename = "";

    if (employeeId) {
      const { data: empleado, error: empleadoError } = await supabase
        .from("empleados")
        .select("id, name")
        .eq("business_id", businessId)
        .eq("id", employeeId)
        .maybeSingle();

      if (empleadoError) {
        return NextResponse.json(
          { error: empleadoError.message },
          { status: 500 }
        );
      }

      if (!empleado) {
        return NextResponse.json(
          { error: "El empleado seleccionado no existe en este negocio." },
          { status: 400 }
        );
      }

      employeeNameForFilename = empleado.name ?? "";
    }

    if (serviceId) {
      const { data: servicio, error: servicioError } = await supabase
        .from("servicios")
        .select("id, name")
        .eq("business_id", businessId)
        .eq("id", serviceId)
        .maybeSingle();

      if (servicioError) {
        return NextResponse.json(
          { error: servicioError.message },
          { status: 500 }
        );
      }

      if (!servicio) {
        return NextResponse.json(
          { error: "El servicio seleccionado no existe en este negocio." },
          { status: 400 }
        );
      }

      serviceNameForFilename = servicio.name ?? "";
    }

    let query = supabase
      .from("reservas")
      .select(`
        id,
        date,
        time,
        status,
        notes,
        price_at_booking,
        cliente:clientes!reservas_client_id_fkey(name, phone),
        empleado:empleados!reservas_employee_id_fkey(id, name),
        servicio:servicios!reservas_service_id_fkey(id, name, price)
      `)
      .eq("business_id", businessId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (from) {
      query = query.gte("date", from);
    }

    if (to) {
      query = query.lte("date", to);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    if (serviceId) {
      query = query.eq("service_id", serviceId);
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
        "Precio",
        "Notas",
      ],
      ...(reservas ?? []).map((reserva: any) => {
        const cliente = Array.isArray(reserva.cliente)
          ? reserva.cliente[0]
          : reserva.cliente;
        const empleado = Array.isArray(reserva.empleado)
          ? reserva.empleado[0]
          : reserva.empleado;
        const servicio = Array.isArray(reserva.servicio)
          ? reserva.servicio[0]
          : reserva.servicio;

        const precio = reserva.price_at_booking ?? servicio?.price ?? "";

        return [
          String(reserva.id ?? ""),
          String(reserva.date ?? ""),
          String(reserva.time ?? ""),
          String(reserva.status ?? ""),
          String(cliente?.name ?? ""),
          String(cliente?.phone ?? ""),
          String(empleado?.name ?? ""),
          String(servicio?.name ?? ""),
          String(precio ?? ""),
          String(reserva.notes ?? ""),
        ];
      }),
    ];

    const csv = "\uFEFF" + toCsv(rows);

    const filenameParts = ["reservas"];

    if (from) filenameParts.push(`desde-${from}`);
    if (to) filenameParts.push(`hasta-${to}`);
    if (status) filenameParts.push(slugifyFilenamePart(status));

    if (employeeNameForFilename) {
      filenameParts.push(slugifyFilenamePart(employeeNameForFilename));
    } else if (employeeId) {
      filenameParts.push(`empleado-${employeeId}`);
    }

    if (serviceNameForFilename) {
      filenameParts.push(slugifyFilenamePart(serviceNameForFilename));
    } else if (serviceId) {
      filenameParts.push(`servicio-${serviceId}`);
    }

    const filename = `${filenameParts.filter(Boolean).join("_")}.csv`;

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