import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";
import StripePortalButton from "@/components/StripePortalButton";

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatPlanLabel(plan: string | null | undefined) {
  const normalized = normalizeText(plan ?? "");

  if (!normalized) return "Sin plan";
  if (normalized === "basic") return "Basic";
  if (normalized === "pro") return "Pro";
  if (normalized === "premium") return "Premium";

  return plan ?? "Sin plan";
}

function formatStatusLabel(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  if (!normalized) return "Sin estado";
  if (normalized === "trialing") return "En prueba";
  if (normalized === "active") return "Activa";
  if (normalized === "past_due") return "Pago pendiente";
  if (normalized === "paused") return "Pausada";
  if (normalized === "unpaid") return "Impagada";
  if (normalized === "incomplete") return "Pendiente de completar";
  if (normalized === "inactive") return "Inactiva";
  if (normalized === "canceled") return "Cancelada";

  return status ?? "Sin estado";
}

function getStatusClasses(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  if (normalized === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "trialing") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (
    normalized === "past_due" ||
    normalized === "unpaid" ||
    normalized === "incomplete"
  ) {
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

function getDefaultEmployeeLimit(plan: string | null | undefined) {
  const normalized = normalizeText(plan ?? "");

  if (normalized === "basic") return 2;
  if (normalized === "pro") return 5;
  if (normalized === "premium") return 10;

  return 2;
}

function canManageSubscription(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  return ["trialing", "active", "past_due", "unpaid", "paused"].includes(
    normalized
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function FacturacionPage() {
  const { supabase, user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/cuenta/facturacion");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const [
    { data: subscription, error: subscriptionError },
    { count: activeEmployeesCount, error: activeEmployeesCountError },
    { data: business, error: businessError },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, employee_limit, current_period_end, trial_end")
      .eq("business_id", businessId)
      .maybeSingle(),

    supabase
      .from("empleados")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .neq("status", "Inactivo"),

    supabase
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .maybeSingle(),
  ]);

  const errores = [
    subscriptionError,
    activeEmployeesCountError,
    businessError,
  ].filter(Boolean);

  const planLabel = formatPlanLabel(subscription?.plan);
  const statusLabel = formatStatusLabel(subscription?.status);
  const employeeLimit =
    typeof subscription?.employee_limit === "number" &&
    Number.isFinite(subscription.employee_limit) &&
    subscription.employee_limit > 0
      ? subscription.employee_limit
      : getDefaultEmployeeLimit(subscription?.plan);

  const activeEmployees = activeEmployeesCount ?? 0;
  const extraBillableEmployees = Math.max(activeEmployees - employeeLimit, 0);
  const currentPeriodEndLabel = formatDate(subscription?.current_period_end);
  const trialEndLabel = formatDate(subscription?.trial_end);
  const showPortal = canManageSubscription(subscription?.status);

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                  Facturación SaaS
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                  Facturación y suscripción
                </h2>

                <p className="mt-3 text-zinc-600">
                  Consulta el estado de tu plan, la capacidad incluida y cómo
                  afecta el número de empleados activos a la cuenta del negocio.
                </p>
              </div>

              <Link
                href="/cuenta"
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Volver a cuenta
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Negocio</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {business?.name ?? "Sin nombre"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Plan actual</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {planLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Estado</p>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClasses(
                    subscription?.status
                  )}`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Empleados activos</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {activeEmployees}
              </p>
            </div>
          </div>
        </div>

        {errores.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Hay un error cargando facturación.</p>
            <div className="mt-2 space-y-1">
              {errores.map((error: any, index) => (
                <p key={index}>{error.message}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Incluidos en el plan
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              {employeeLimit}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Capacidad base incluida según tu suscripción actual.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Empleados activos
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              {activeEmployees}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Equipo que cuenta ahora mismo en tu negocio.
            </p>
          </div>

          <div
            className={`rounded-3xl border p-6 shadow-sm ${
              extraBillableEmployees > 0
                ? "border-amber-200 bg-amber-50"
                : "border-zinc-200 bg-white"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                extraBillableEmployees > 0
                  ? "text-amber-700"
                  : "text-zinc-500"
              }`}
            >
              Empleados extra facturables
            </p>
            <p
              className={`mt-2 text-3xl font-bold tracking-tight ${
                extraBillableEmployees > 0
                  ? "text-amber-950"
                  : "text-zinc-900"
              }`}
            >
              {extraBillableEmployees}
            </p>
            <p
              className={`mt-2 text-sm ${
                extraBillableEmployees > 0
                  ? "text-amber-800"
                  : "text-zinc-500"
              }`}
            >
              {extraBillableEmployees > 0
                ? "Hay capacidad extra por encima del límite incluido en el plan."
                : "No hay exceso de empleados sobre la capacidad incluida."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                Portal de facturación
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Abre el portal de Stripe para revisar pagos, métodos de cobro,
                facturas y gestión de suscripción.
              </p>
            </div>

            {showPortal ? (
              <StripePortalButton className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">
                Abrir facturación
              </StripePortalButton>
            ) : (
              <Link
                href="/cuenta/planes"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Ver planes
              </Link>
            )}
          </div>

          {showPortal ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              Stripe centraliza cambios de tarjeta, facturas, renovaciones,
              cambios de plan y cancelación de forma segura.
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Todavía no hay una suscripción gestionable desde Stripe. Activa o
              mejora un plan para usar la facturación completa.
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Fin de prueba</p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              {trialEndLabel ?? "No aplica"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Fecha de finalización del trial si está activo.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Fin de periodo actual
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              {currentPeriodEndLabel ?? "No disponible"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Cobertura vigente del periodo de suscripción actual.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Capacidad y equipo
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              {activeEmployees} / {employeeLimit}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Relación entre tu equipo activo y la capacidad incluida.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-sky-900">
              Cómo se interpreta esta pantalla
            </h3>
            <p className="mt-2 text-sm leading-7 text-sky-800">
              Aquí ves tu plan actual, el estado de suscripción y la relación
              entre empleados activos y capacidad incluida. Esto ayuda a
              entender mejor cuándo el negocio está dentro del plan y cuándo
              puede haber capacidad extra facturable.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-amber-900">
              Modelo de capacidad
            </h3>
            <p className="mt-2 text-sm leading-7 text-amber-800">
              Basic incluye hasta 2 empleados, Pro hasta 5 y Premium hasta 10.
              A partir del empleado 11, el sistema queda preparado para aplicar
              un suplemento mensual por cada empleado activo extra.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}