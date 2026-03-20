import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";
import { formatDate, formatTime, getStatusBadgeClasses } from "@/lib/utils";

const REVENUE_STATUSES = new Set(["Confirmada", "Completada"]);
const MADRID_TIME_ZONE = "Europe/Madrid";

type BusinessSummary = {
  id: number;
  name: string | null;
  slug: string | null;
};

type SubscriptionSummary = {
  plan: string | null;
  status: string | null;
};

function toDateValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMadridDateAtNoonUTC(baseDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(baseDate);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getRelation(value: any) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getRelationName(value: any, fallback = "-") {
  return getRelation(value)?.name ?? fallback;
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

function getTopItem(items: Record<string, number>) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return {
    name: entries[0][0],
    count: entries[0][1],
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

function buildRevenueByEmployee(reservas: any[]) {
  const revenueMap: Record<
    string,
    { name: string; amount: number; reservas: number }
  > = {};

  reservas
    .filter((reserva) => REVENUE_STATUSES.has(reserva.status))
    .forEach((reserva) => {
      const empleadoNombre = getRelationName(reserva.empleado, "Sin asignar");
      const price = getReservationPrice(reserva);

      revenueMap[empleadoNombre] ??= {
        name: empleadoNombre,
        amount: 0,
        reservas: 0,
      };

      revenueMap[empleadoNombre].amount += price;
      revenueMap[empleadoNombre].reservas += 1;
    });

  return Object.values(revenueMap).sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    if (b.reservas !== a.reservas) return b.reservas - a.reservas;
    return a.name.localeCompare(b.name);
  });
}

function formatPlanLabel(plan: string | null | undefined) {
  const normalized = normalizeText(plan ?? "");

  if (!normalized) return "Sin plan";
  if (normalized === "basic") return "Basic";
  if (normalized === "pro") return "Pro";
  if (normalized === "premium") return "Premium";

  return plan ?? "Sin plan";
}

function formatSubscriptionStatus(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  if (!normalized) return "Sin suscripción";
  if (normalized === "active") return "Activa";
  if (normalized === "inactive") return "Inactiva";
  if (normalized === "trialing") return "En prueba";
  if (normalized === "past_due") return "Pago pendiente";
  if (normalized === "canceled") return "Cancelada";
  if (normalized === "paused") return "Pausada";

  return status ?? "Sin suscripción";
}

function getSubscriptionStatusClasses(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  if (normalized === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "trialing") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (normalized === "past_due") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "canceled") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (normalized === "paused") {
    return "border-zinc-300 bg-zinc-100 text-zinc-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export default async function DashboardPage() {
  const { supabase, user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const madridToday = getMadridDateAtNoonUTC();
  const today = toDateValue(madridToday);
  const next7 = toDateValue(addDays(madridToday, 7));

  const monthStart = `${madridToday.getUTCFullYear()}-${String(
    madridToday.getUTCMonth() + 1
  ).padStart(2, "0")}-01`;

  const monthEndDate = new Date(
    Date.UTC(
      madridToday.getUTCFullYear(),
      madridToday.getUTCMonth() + 1,
      0,
      12,
      0,
      0
    )
  );

  const monthEnd = toDateValue(monthEndDate);

  const mesActualLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TIME_ZONE,
    month: "long",
    year: "numeric",
  }).format(new Date());

  const [
    { data: businessDetalle, error: businessDetalleError },
    { data: subscriptionDetalle, error: subscriptionDetalleError },
    { count: clientesCount, error: clientesError },
    { data: empleadosDetalle, error: empleadosDetalleError },
    { count: serviciosCount, error: serviciosError },
    { count: reservasHoyCount, error: reservasHoyError },
    { count: reservasProximos7Count, error: reservasProximos7Error },
    { count: confirmadasFuturasCount, error: confirmadasFuturasError },
    { count: pendientesFuturasCount, error: pendientesFuturasError },
    { count: canceladasFuturasCount, error: canceladasFuturasError },
    { data: reservasProximas, error: reservasListaError },
    { data: clientes, error: clientesListaError },
    { data: reservasHoyDetalle, error: reservasHoyDetalleError },
    { data: reservasMesDetalle, error: reservasMesDetalleError },
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("id", businessId)
      .maybeSingle(),

    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("business_id", businessId)
      .maybeSingle(),

    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),

    supabase
      .from("empleados")
      .select("id, status, public_booking_enabled")
      .eq("business_id", businessId)
      .order("name", { ascending: true }),

    supabase
      .from("servicios")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),

    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("date", today),

    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("date", today)
      .lte("date", next7),

    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gt("date", today)
      .eq("status", "Confirmada"),

    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gt("date", today)
      .eq("status", "Pendiente"),

    supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gt("date", today)
      .eq("status", "Cancelada"),

    supabase
      .from("reservas")
      .select(`
        id,
        date,
        time,
        status,
        cliente:clientes!reservas_client_id_fkey(id, name),
        servicio:servicios!reservas_service_id_fkey(id, name, price),
        empleado:empleados!reservas_employee_id_fkey(id, name)
      `)
      .eq("business_id", businessId)
      .gte("date", today)
      .neq("status", "Cancelada")
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(5),

    supabase
      .from("clientes")
      .select("*")
      .eq("business_id", businessId)
      .order("id", { ascending: false })
      .limit(5),

    supabase
      .from("reservas")
      .select(`
        id,
        status,
        price_at_booking,
        empleado:empleados!reservas_employee_id_fkey(id, name),
        servicio:servicios!reservas_service_id_fkey(id, name, price)
      `)
      .eq("business_id", businessId)
      .eq("date", today),

    supabase
      .from("reservas")
      .select(`
        id,
        status,
        date,
        price_at_booking,
        empleado:empleados!reservas_employee_id_fkey(id, name),
        servicio:servicios!reservas_service_id_fkey(id, name, price)
      `)
      .eq("business_id", businessId)
      .gte("date", monthStart)
      .lte("date", monthEnd),
  ]);

  const errores = [
    businessDetalleError,
    subscriptionDetalleError,
    clientesError,
    empleadosDetalleError,
    serviciosError,
    reservasHoyError,
    reservasProximos7Error,
    confirmadasFuturasError,
    pendientesFuturasError,
    canceladasFuturasError,
    reservasListaError,
    clientesListaError,
    reservasHoyDetalleError,
    reservasMesDetalleError,
  ].filter(Boolean);

  const businessInfo = (businessDetalle ?? null) as BusinessSummary | null;
  const subscriptionInfo =
    (subscriptionDetalle ?? null) as SubscriptionSummary | null;

  const empleadosActivosCount =
    (empleadosDetalle ?? []).filter(
      (empleado: any) =>
        normalizeText(empleado.status ?? "Activo") !== "inactivo"
    ).length ?? 0;

  const empleadosOnlineCount =
    (empleadosDetalle ?? []).filter(
      (empleado: any) =>
        normalizeText(empleado.status ?? "Activo") !== "inactivo" &&
        empleado.public_booking_enabled === true
    ).length ?? 0;

  const reservasHoy = reservasHoyDetalle ?? [];
  const reservasMes = reservasMesDetalle ?? [];

  const confirmadasHoy =
    reservasHoy.filter((reserva) => reserva.status === "Confirmada").length ?? 0;

  const pendientesHoy =
    reservasHoy.filter((reserva) => reserva.status === "Pendiente").length ?? 0;

  const canceladasHoy =
    reservasHoy.filter((reserva) => reserva.status === "Cancelada").length ?? 0;

  const completadasHoy =
    reservasHoy.filter((reserva) => reserva.status === "Completada").length ?? 0;

  const empleadosHoyMap: Record<string, number> = {};
  const serviciosHoyMap: Record<string, number> = {};
  const actividadPorEmpleadoMap: Record<
    string,
    {
      total: number;
      confirmadas: number;
      pendientes: number;
      canceladas: number;
      completadas: number;
    }
  > = {};

  reservasHoy.forEach((reserva) => {
    const empleadoNombre = getRelationName(reserva.empleado, "Sin asignar");
    const servicioNombre = getRelationName(reserva.servicio, "Sin servicio");

    actividadPorEmpleadoMap[empleadoNombre] ??= {
      total: 0,
      confirmadas: 0,
      pendientes: 0,
      canceladas: 0,
      completadas: 0,
    };

    actividadPorEmpleadoMap[empleadoNombre].total += 1;

    if (reserva.status === "Confirmada") {
      actividadPorEmpleadoMap[empleadoNombre].confirmadas += 1;
    } else if (reserva.status === "Pendiente") {
      actividadPorEmpleadoMap[empleadoNombre].pendientes += 1;
    } else if (reserva.status === "Cancelada") {
      actividadPorEmpleadoMap[empleadoNombre].canceladas += 1;
    } else if (reserva.status === "Completada") {
      actividadPorEmpleadoMap[empleadoNombre].completadas += 1;
    }

    if (reserva.status !== "Cancelada") {
      empleadosHoyMap[empleadoNombre] =
        (empleadosHoyMap[empleadoNombre] ?? 0) + 1;
      serviciosHoyMap[servicioNombre] =
        (serviciosHoyMap[servicioNombre] ?? 0) + 1;
    }
  });

  const actividadPorEmpleado = Object.entries(actividadPorEmpleadoMap)
    .map(([name, stats]) => ({
      name,
      ...stats,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.name.localeCompare(b.name);
    });

  const empleadoTopHoy = getTopItem(empleadosHoyMap);
  const servicioTopHoy = getTopItem(serviciosHoyMap);

  const recaudacionHoyPorEmpleado = buildRevenueByEmployee(reservasHoy);
  const recaudacionMesPorEmpleado = buildRevenueByEmployee(reservasMes);

  const totalRecaudacionHoy = recaudacionHoyPorEmpleado.reduce(
    (acc, item) => acc + item.amount,
    0
  );

  const totalRecaudacionMes = recaudacionMesPorEmpleado.reduce(
    (acc, item) => acc + item.amount,
    0
  );

  const topRecaudacionHoy = recaudacionHoyPorEmpleado[0] ?? null;
  const topRecaudacionMes = recaudacionMesPorEmpleado[0] ?? null;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
              Vista general del negocio
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
              Dashboard
            </h2>

            <p className="mt-2 max-w-2xl text-zinc-600">
              Consulta métricas clave, actividad de hoy, próximas reservas y
              recaudación por empleado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/reservas/nuevo"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Nueva reserva
            </Link>

            <Link
              href="/clientes/nuevo"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Nuevo cliente
            </Link>

            <Link
              href="/empleados/nuevo"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Nuevo empleado
            </Link>

            <LogoutButton />
          </div>
        </div>

        {errores.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              Hay una consulta con error en el dashboard.
            </p>
            <div className="mt-2 space-y-1">
              {errores.map((error: any, index) => (
                <p key={index}>{error.message}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Tu negocio</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              {businessInfo?.name ?? "Negocio sin nombre"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {businessInfo?.slug
                ? `Slug público: ${businessInfo.slug}`
                : "Sin identificador público"}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Plan actual</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              {formatPlanLabel(subscriptionInfo?.plan)}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Base SaaS preparada para futuros planes y mejoras.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Estado de suscripción
            </p>

            <div className="mt-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getSubscriptionStatusClasses(
                  subscriptionInfo?.status
                )}`}
              >
                {formatSubscriptionStatus(subscriptionInfo?.status)}
              </span>
            </div>

            <p className="mt-3 text-sm text-zinc-500">
              Estado actual del negocio dentro del sistema SaaS.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Clientes</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
              {clientesCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Total de clientes registrados
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Empleados</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
              {empleadosActivosCount}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Personal activo en el sistema
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Servicios</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
              {serviciosCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Servicios disponibles en catálogo
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Reservas de hoy</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
              {reservasHoyCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-zinc-500">Citas con fecha de hoy</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-sky-700">Próximos 7 días</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-sky-900">
              {reservasProximos7Count ?? 0}
            </p>
            <p className="mt-2 text-sm text-sky-700/80">
              Reservas entre hoy y los próximos 7 días
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">
              Futuras confirmadas
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-emerald-900">
              {confirmadasFuturasCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-emerald-700/80">
              Citas posteriores a hoy listas para atender
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-amber-700">
              Futuras pendientes
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-amber-900">
              {pendientesFuturasCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-amber-700/80">
              Pendientes de confirmar después de hoy
            </p>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-rose-700">
              Futuras canceladas
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-rose-900">
              {canceladasFuturasCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-rose-700/80">
              Citas posteriores a hoy anuladas
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Estado de hoy</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              {confirmadasHoy} confirmadas · {pendientesHoy} pendientes
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {completadasHoy} completadas · {canceladasHoy} canceladas
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Empleado con más carga hoy
            </p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              {empleadoTopHoy?.name ?? "Sin reservas hoy"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {empleadoTopHoy
                ? `${empleadoTopHoy.count} reserva(s) activas hoy`
                : "No hay citas activas para repartir"}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Servicio más solicitado hoy
            </p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              {servicioTopHoy?.name ?? "Sin reservas hoy"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {servicioTopHoy
                ? `${servicioTopHoy.count} reserva(s) activas hoy`
                : "Todavía no hay citas activas"}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Empleados con reserva online
            </p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              {empleadosOnlineCount}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Disponibles para reservas públicas
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">
              Recaudación total de hoy
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-emerald-900">
              {formatCurrency(totalRecaudacionHoy)}
            </p>
            <p className="mt-2 text-sm text-emerald-700/80">
              {topRecaudacionHoy
                ? `${topRecaudacionHoy.name} lidera hoy con ${formatCurrency(
                    topRecaudacionHoy.amount
                  )}`
                : "Todavía no hay ingresos registrados hoy"}
            </p>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-sky-700">
              Recaudación del mes
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-sky-900">
              {formatCurrency(totalRecaudacionMes)}
            </p>
            <p className="mt-2 text-sm text-sky-700/80">
              {topRecaudacionMes
                ? `${topRecaudacionMes.name} lidera ${mesActualLabel} con ${formatCurrency(
                    topRecaudacionMes.amount
                  )}`
                : `Todavía no hay ingresos registrados en ${mesActualLabel}`}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-zinc-900">
              Crear y gestionar rápido
            </h3>
            <p className="text-sm text-zinc-500">
              Acciones del día a día para trabajar más rápido
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Link
              href="/reservas/nuevo"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">
                Nueva reserva
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Crear una cita manual desde el panel
              </p>
            </Link>

            <Link
              href="/clientes/nuevo"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">
                Nuevo cliente
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Alta rápida de un cliente nuevo
              </p>
            </Link>

            <Link
              href="/empleados/nuevo"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">
                Nuevo empleado
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Añadir personal al negocio
              </p>
            </Link>

            <Link
              href="/servicios"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">Servicios</p>
              <p className="mt-2 text-sm text-zinc-500">
                Crear o cambiar precios y duración
              </p>
            </Link>

            <Link
              href="/reservar"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">
                Reserva pública
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Abrir el flujo online para clientes
              </p>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">
                  Recaudación por empleado hoy
                </h3>
                <p className="text-sm text-zinc-500">
                  Ingreso contabilizado del día actual
                </p>
              </div>
            </div>

            {recaudacionHoyPorEmpleado.length > 0 ? (
              <div className="space-y-3">
                {recaudacionHoyPorEmpleado.map((empleado) => (
                  <div
                    key={empleado.name}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">
                        {empleado.name}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {empleado.reservas} reserva(s) contabilizada(s)
                      </p>
                    </div>

                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-zinc-900">
                        {formatCurrency(empleado.amount)}
                      </p>
                      <p className="text-xs text-zinc-500">Hoy</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
                No hay ingresos registrados hoy.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">
                  Recaudación por empleado del mes
                </h3>
                <p className="text-sm text-zinc-500">
                  Ingreso contabilizado acumulado en {mesActualLabel}
                </p>
              </div>
            </div>

            {recaudacionMesPorEmpleado.length > 0 ? (
              <div className="space-y-3">
                {recaudacionMesPorEmpleado.map((empleado) => (
                  <div
                    key={empleado.name}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">
                        {empleado.name}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {empleado.reservas} reserva(s) contabilizada(s)
                      </p>
                    </div>

                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-zinc-900">
                        {formatCurrency(empleado.amount)}
                      </p>
                      <p className="text-xs text-zinc-500">Mes</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
                No hay ingresos registrados este mes.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                Actividad del equipo hoy
              </h3>
              <p className="text-sm text-zinc-500">
                Carga de trabajo por empleado para el día actual
              </p>
            </div>

            <Link
              href="/empleados"
              className="text-sm font-medium text-zinc-700 transition hover:text-black"
            >
              Ver empleados
            </Link>
          </div>

          {actividadPorEmpleado.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {actividadPorEmpleado.map((empleado) => (
                <div
                  key={empleado.name}
                  className="rounded-2xl border border-zinc-200 p-4"
                >
                  <p className="truncate text-base font-semibold text-zinc-900">
                    {empleado.name}
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
                    {empleado.total}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    reserva(s) totales hoy
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                      {empleado.confirmadas} confirmadas
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                      {empleado.pendientes} pendientes
                    </span>
                    <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">
                      {empleado.completadas} completadas
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-700">
                      {empleado.canceladas} canceladas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
              No hay reservas registradas para hoy.
            </div>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">
                  Próximas reservas
                </h3>
                <p className="text-sm text-zinc-500">
                  Agenda futura ordenada por fecha y hora
                </p>
              </div>

              <Link
                href="/reservas"
                className="text-sm font-medium text-zinc-700 transition hover:text-black"
              >
                Ver todas
              </Link>
            </div>

            <div className="space-y-3">
              {reservasProximas && reservasProximas.length > 0 ? (
                reservasProximas.map((reserva) => {
                  const clienteNombre =
                    getRelationName(reserva.cliente, "Sin cliente");
                  const servicioNombre =
                    getRelationName(reserva.servicio, "Sin servicio");
                  const empleadoNombre =
                    getRelationName(reserva.empleado, "Sin asignar");

                  return (
                    <div
                      key={reserva.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-900">
                          {clienteNombre}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {servicioNombre} · {empleadoNombre}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDate(reserva.date)} · {formatTime(reserva.time)}
                        </p>
                      </div>

                      <span
                        className={`ml-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                          reserva.status
                        )}`}
                      >
                        {reserva.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
                  No hay reservas futuras registradas.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">
                  Últimos clientes
                </h3>
                <p className="text-sm text-zinc-500">
                  Clientes añadidos recientemente
                </p>
              </div>

              <Link
                href="/clientes"
                className="text-sm font-medium text-zinc-700 transition hover:text-black"
              >
                Ver todos
              </Link>
            </div>

            <div className="space-y-3">
              {clientes && clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">
                        {cliente.name}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {cliente.phone || "Sin teléfono"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        Última visita:{" "}
                        {cliente.last_visit
                          ? formatDate(cliente.last_visit)
                          : "Sin visitas todavía"}
                      </p>
                    </div>

                    <div className="ml-4 rounded-2xl bg-zinc-100 px-3 py-2 text-right">
                      <p className="text-xs text-zinc-500">Visitas</p>
                      <p className="text-sm font-semibold text-zinc-900">
                        {cliente.visits ?? 0}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
                  No hay clientes registrados.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-zinc-900">
              Accesos rápidos
            </h3>
            <p className="text-sm text-zinc-500">
              Atajos para la gestión diaria del negocio
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Link
              href="/clientes"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">Clientes</p>
              <p className="mt-2 text-sm text-zinc-500">
                Consulta fichas e historial
              </p>
            </Link>

            <Link
              href="/empleados"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">Empleados</p>
              <p className="mt-2 text-sm text-zinc-500">
                Gestiona equipo, horarios y bloqueos
              </p>
            </Link>

            <Link
              href="/servicios"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">Servicios</p>
              <p className="mt-2 text-sm text-zinc-500">
                Edita precios y duración
              </p>
            </Link>

            <Link
              href="/reservas"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">Reservas</p>
              <p className="mt-2 text-sm text-zinc-500">
                Revisa la agenda diaria
              </p>
            </Link>

            <Link
              href="/reservar"
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">
                Reserva pública
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Abre el flujo de reserva online
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}