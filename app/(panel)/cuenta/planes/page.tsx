import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";

type PlanKey = "basic" | "pro" | "premium";

type PlanDefinition = {
  key: PlanKey;
  badge: string;
  title: string;
  priceLabel: string;
  subtitle?: string;
  employeesLabel: string;
  description: string;
  features: string[];
  highlight?: string;
  cardClassName: string;
  badgeClassName: string;
  titleClassName: string;
  textClassName: string;
};

type ActionState =
  | { kind: "current"; label: string }
  | { kind: "portal"; label: string; href: string }
  | { kind: "checkout"; label: string };

const PLAN_ORDER: Record<PlanKey, number> = {
  basic: 0,
  pro: 1,
  premium: 2,
};

const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: "basic",
    badge: "Basic",
    title: "Empezar",
    priceLabel: "19 €/mes",
    subtitle: "30 días gratis y después 19 €/mes",
    employeesLabel: "Hasta 2 empleados activos",
    description:
      "Pensado para salones pequeños que quieren empezar a trabajar con una gestión clara, moderna y profesional.",
    features: [
      "Clientes y agenda",
      "Servicios y empleados",
      "Reserva pública online",
      "Base sólida para organizar el día a día",
    ],
    cardClassName: "border-zinc-200 bg-white",
    badgeClassName: "border-zinc-200 bg-zinc-50 text-zinc-700",
    titleClassName: "text-zinc-900",
    textClassName: "text-zinc-700",
  },
  {
    key: "pro",
    badge: "Pro",
    title: "Crecer",
    priceLabel: "39 €/mes",
    employeesLabel: "Hasta 5 empleados activos",
    description:
      "Preparado para peluquerías con más movimiento, más equipo y necesidad de una gestión más completa.",
    features: [
      "Todo lo de Basic",
      "Más capacidad para equipo",
      "Métricas y operativa más avanzadas",
      "Mejor base para crecer con orden",
    ],
    cardClassName: "border-sky-200 bg-sky-50",
    badgeClassName: "border-sky-200 bg-white text-sky-700",
    titleClassName: "text-sky-950",
    textClassName: "text-sky-900",
  },
  {
    key: "premium",
    badge: "Premium Plus",
    title: "Escalar",
    priceLabel: "69 €/mes",
    employeesLabel: "Hasta 10 empleados activos",
    description:
      "La opción más completa para negocios con una operativa más potente, una imagen más cuidada y margen real para escalar.",
    features: [
      "Todo lo de Pro",
      "Personalización Premium Plus",
      "Mayor capacidad operativa",
      "Preparado para integraciones y crecimiento",
    ],
    highlight:
      "Desde el empleado 11 se añade un suplemento mensual por empleado activo extra.",
    cardClassName: "border-violet-200 bg-violet-50",
    badgeClassName: "border-violet-200 bg-white text-violet-700",
    titleClassName: "text-violet-950",
    textClassName: "text-violet-900",
  },
];

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getPlanKey(plan: string | null | undefined): PlanKey | null {
  const normalized = normalizeText(plan ?? "");

  if (normalized === "basic") return "basic";
  if (normalized === "pro") return "pro";
  if (normalized === "premium") return "premium";

  return null;
}

function formatPlanLabel(plan: string | null | undefined) {
  const planKey = getPlanKey(plan);

  if (!planKey) return "Sin plan";

  if (planKey === "basic") return "Basic";
  if (planKey === "pro") return "Pro";
  return "Premium Plus";
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

function isManagedSubscriptionStatus(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  return [
    "active",
    "trialing",
    "past_due",
    "paused",
    "unpaid",
    "incomplete",
  ].includes(normalized);
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

function getActionLabel(planKey: PlanKey) {
  if (planKey === "basic") return "Empezar con Basic";
  if (planKey === "pro") return "Pasar a Pro";
  return "Pasar a Premium Plus";
}

function buildPlanActionState(params: {
  plan: PlanKey;
  currentPlanKey: PlanKey | null;
  hasManagedSubscription: boolean;
}): ActionState {
  const { plan, currentPlanKey, hasManagedSubscription } = params;

  if (hasManagedSubscription && currentPlanKey === plan) {
    return {
      kind: "current",
      label: "Plan actual",
    };
  }

  if (hasManagedSubscription) {
    if (currentPlanKey === null) {
      return {
        kind: "portal",
        label: "Gestionar en facturación",
        href: "/cuenta/facturacion",
      };
    }

    if (PLAN_ORDER[plan] > PLAN_ORDER[currentPlanKey]) {
      return {
        kind: "portal",
        label: `Cambiar a ${formatPlanLabel(plan)}`,
        href: "/cuenta/facturacion",
      };
    }

    return {
      kind: "portal",
      label: "Gestionar en facturación",
      href: "/cuenta/facturacion",
    };
  }

  return {
    kind: "checkout",
    label: getActionLabel(plan),
  };
}

export default async function PlanesPage() {
  const { supabase, user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/cuenta/planes");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, employee_limit")
    .eq("business_id", businessId)
    .maybeSingle();

  const currentPlanKey = getPlanKey(subscription?.plan);
  const currentPlan = formatPlanLabel(subscription?.plan);
  const currentStatus = formatStatusLabel(subscription?.status);
  const hasManagedSubscription = isManagedSubscriptionStatus(subscription?.status);

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                  Planes SaaS
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                  Elige el plan que encaja con tu equipo
                </h2>

                <p className="mt-3 text-zinc-600">
                  Compara planes, capacidad incluida y evolución del precio para
                  que tu peluquería pueda crecer con una estructura clara.
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

          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Plan actual</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {currentPlan}
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
                  {currentStatus}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Gestión del plan</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {hasManagedSubscription ? "Desde facturación" : "Desde checkout"}
              </p>
            </div>
          </div>
        </div>

        {hasManagedSubscription ? (
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-sky-900">
              Tu suscripción ya se gestiona desde facturación
            </h3>
            <p className="mt-2 text-sm leading-7 text-sky-800">
              Como tu negocio ya tiene una suscripción gestionable, los cambios
              de plan, facturas, método de pago y cancelación deben hacerse
              desde la pantalla de facturación.
            </p>

            <div className="mt-4">
              <Link
                href="/cuenta/facturacion"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Ir a facturación
              </Link>
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-zinc-900">
            Cómo crecerá el precio según tu equipo
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-500">Basic</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                Hasta 2 empleados
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-medium text-sky-700">Pro</p>
              <p className="mt-2 text-lg font-semibold text-sky-950">
                Hasta 5 empleados
              </p>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm font-medium text-violet-700">
                Premium Plus
              </p>
              <p className="mt-2 text-lg font-semibold text-violet-950">
                Hasta 10 empleados
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">
                Equipo adicional
              </p>
              <p className="mt-2 text-lg font-semibold text-amber-950">
                Desde el 11
              </p>
              <p className="mt-2 text-sm text-amber-800">
                Suplemento mensual por cada empleado activo extra.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLAN_DEFINITIONS.map((plan) => {
            const actionState = buildPlanActionState({
              plan: plan.key,
              currentPlanKey,
              hasManagedSubscription,
            });

            return (
              <div
                key={plan.key}
                className={`rounded-3xl border p-6 shadow-sm ${plan.cardClassName}`}
              >
                <div
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${plan.badgeClassName}`}
                >
                  {plan.badge}
                </div>

                <h3 className={`mt-4 text-2xl font-bold ${plan.titleClassName}`}>
                  {plan.title}
                </h3>

                <div className="mt-4">
                  <p className={`text-3xl font-bold ${plan.titleClassName}`}>
                    {plan.priceLabel}
                  </p>

                  {plan.subtitle ? (
                    <p className="mt-1 text-sm text-emerald-700">
                      {plan.subtitle}
                    </p>
                  ) : null}

                  <p className="mt-2 text-sm font-medium text-zinc-600">
                    {plan.employeesLabel}
                  </p>
                </div>

                <p className={`mt-4 text-sm leading-7 ${plan.textClassName}`}>
                  {plan.description}
                </p>

                <ul className={`mt-5 space-y-2 text-sm ${plan.textClassName}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span>•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.highlight ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-900">
                      Escalado del plan
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      {plan.highlight}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6">
                  {actionState.kind === "current" ? (
                    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-3 text-center text-sm font-medium text-zinc-600">
                      {actionState.label}
                    </div>
                  ) : actionState.kind === "portal" ? (
                    <Link
                      href={actionState.href}
                      className="block w-full rounded-xl border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      {actionState.label}
                    </Link>
                  ) : (
                    <StripeCheckoutButton
                      plan={plan.key}
                      className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {actionState.label}
                    </StripeCheckoutButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-900">
              Método de cobro pensado para crecer
            </h3>
            <p className="mt-2 text-sm leading-7 text-emerald-800">
              La idea es mantener un precio base claro por plan y, en Premium
              Plus, ampliar capacidad cuando el salón supere los 10 empleados
              activos.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-zinc-900">
              Métodos de pago
            </h3>
            <p className="mt-2 text-sm leading-7 text-zinc-600">
              El objetivo es aceptar tarjeta y wallets modernas desde Stripe
              Checkout, y después ampliar con métodos adicionales según
              disponibilidad.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Tarjeta", "Apple Pay", "Google Pay", "PayPal"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-amber-900">
            Siguiente fase
          </h3>
          <p className="mt-2 text-sm leading-7 text-amber-800">
            Lo siguiente será terminar de validar en real el flujo de cobro y,
            después, habilitar más métodos de pago y ajustes finos del portal de
            facturación.
          </p>
        </div>
      </div>
    </section>
  );
}