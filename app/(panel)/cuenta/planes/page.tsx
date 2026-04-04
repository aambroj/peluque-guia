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
  highlightBadge?: string;
  cardClassName: string;
  badgeClassName: string;
  titleClassName: string;
  textClassName: string;
  buttonClassName: string;
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
    title: "Para empezar",
    priceLabel: "19 €/mes",
    subtitle: "30 días gratis y después 19 €/mes",
    employeesLabel: "Hasta 2 empleados",
    description:
      "Ideal para peluquerías pequeñas que quieren empezar a trabajar con más orden y una imagen más profesional.",
    features: [
      "Clientes y reservas",
      "Equipo y horarios",
      "Servicios y precios",
      "Reserva pública online",
    ],
    cardClassName: "border-[#d7ae87] bg-[#f8efe7]",
    badgeClassName: "border-[#d7ae87] bg-white/80 text-[#a06433]",
    titleClassName: "text-[#5b3416]",
    textClassName: "text-[#7b5436]",
    buttonClassName:
      "bg-[#b9804e] text-white shadow-[0_10px_24px_rgba(185,128,78,0.28)] hover:bg-[#a87345]",
  },
  {
    key: "pro",
    badge: "Pro",
    title: "Para crecer",
    priceLabel: "39 €/mes",
    employeesLabel: "Hasta 5 empleados activos",
    description:
      "Pensado para negocios con más movimiento, más equipo y necesidad de una operativa más completa.",
    features: [
      "Todo lo de Basic",
      "Más capacidad de equipo",
      "Métricas avanzadas",
      "Más visión operativa",
    ],
    cardClassName: "border-[#c6ced8] bg-[#f2f5f9]",
    badgeClassName: "border-[#c6ced8] bg-white/80 text-[#64758b]",
    titleClassName: "text-[#223a57]",
    textClassName: "text-[#5a6c82]",
    buttonClassName:
      "bg-[#6e7b8f] text-white shadow-[0_10px_24px_rgba(110,123,143,0.24)] hover:bg-[#627084]",
  },
  {
    key: "premium",
    badge: "Premium",
    title: "Para escalar",
    priceLabel: "69 €/mes",
    employeesLabel: "Hasta 10 empleados activos",
    description:
      "La opción más completa para salones con una operativa más potente, mejor imagen y margen real para escalar.",
    features: [
      "Todo lo de Pro",
      "Personalización Premium",
      "Mayor capacidad operativa",
      "Base preparada para crecer más",
    ],
    highlightBadge: "PREMIUM PLUS",
    highlight:
      "Desde el empleado 11 se añade un suplemento mensual por empleado activo extra.",
    cardClassName: "border-[#e1bf57] bg-[#fbf5de]",
    badgeClassName: "border-[#e1bf57] bg-white/80 text-[#9c7b14]",
    titleClassName: "text-[#6c4a09]",
    textClassName: "text-[#7b6532]",
    buttonClassName:
      "bg-[#a88718] text-white shadow-[0_10px_24px_rgba(168,135,24,0.26)] hover:bg-[#967713]",
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
  return "Premium";
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
  if (planKey === "pro") return "Empezar con Pro";
  return "Empezar con Premium";
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
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Elige el plan que mejor encaja con tu salón
            </h2>
            <p className="mt-3 text-zinc-600">
              Mantén una estructura clara desde el inicio y escala cuando tu
              equipo y tu operativa lo necesiten.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/cuenta"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver a cuenta
            </Link>

            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600">
              <span className="font-medium text-zinc-800">Plan actual:</span>{" "}
              {currentPlan} · {currentStatus}
            </div>
          </div>
        </div>

        {hasManagedSubscription ? (
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-sky-900">
              Tu suscripción ya se gestiona desde facturación
            </h3>
            <p className="mt-2 text-sm leading-7 text-sky-800">
              Como tu negocio ya tiene una suscripción activa, los cambios de
              plan, método de pago, facturas y cancelación se hacen desde la
              pantalla de facturación.
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
                className={`rounded-[2rem] border p-6 shadow-sm ${plan.cardClassName}`}
              >
                <div
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${plan.badgeClassName}`}
                >
                  {plan.badge}
                </div>

                <h3 className={`mt-6 text-[2.1rem] font-bold leading-none ${plan.titleClassName}`}>
                  {plan.title}
                </h3>

                <div className="mt-6">
                  <p className={`text-4xl font-bold tracking-tight ${plan.titleClassName}`}>
                    {plan.priceLabel}
                  </p>

                  {plan.subtitle ? (
                    <p className="mt-2 text-sm text-emerald-700">
                      {plan.subtitle}
                    </p>
                  ) : null}

                  <p className={`mt-3 text-sm font-medium ${plan.textClassName}`}>
                    {plan.employeesLabel}
                  </p>
                </div>

                <p className={`mt-6 text-sm leading-9 ${plan.textClassName}`}>
                  {plan.description}
                </p>

                <ul className={`mt-6 space-y-3 text-sm ${plan.textClassName}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-[2px]">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.highlight ? (
                  <div className="mt-6 rounded-[1.6rem] border border-[#d8b54a] bg-[#f3e3a7] p-5">
                    {plan.highlightBadge ? (
                      <div className="inline-flex rounded-full bg-[#9a7820] px-4 py-2 text-[11px] font-bold tracking-[0.22em] text-white">
                        {plan.highlightBadge}
                      </div>
                    ) : null}

                    <p className="mt-5 text-sm leading-8 text-[#6f5920]">
                      {plan.highlight}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6">
                  {actionState.kind === "current" ? (
                    <div className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center text-sm font-medium text-zinc-600">
                      {actionState.label}
                    </div>
                  ) : actionState.kind === "portal" ? (
                    <Link
                      href={actionState.href}
                      className="block w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-center text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                    >
                      {actionState.label}
                    </Link>
                  ) : (
                    <StripeCheckoutButton
                      plan={plan.key}
                      className={`w-full rounded-2xl px-5 py-4 text-sm font-medium transition disabled:opacity-50 ${plan.buttonClassName}`}
                    >
                      {actionState.label}
                    </StripeCheckoutButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}