import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";

type PlanKey = "basic" | "pro" | "premium";

type PlanDefinition = {
  key: PlanKey;
  label: string;
  title: string;
  priceLabel: string;
  subtitle?: string;
  employeesLabel: string;
  description: string;
  features: string[];
  cardClassName: string;
  labelClassName: string;
  titleClassName: string;
  textClassName: string;
};

const PLAN_ORDER: Record<PlanKey, number> = {
  basic: 0,
  pro: 1,
  premium: 2,
};

const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: "basic",
    label: "Basic",
    title: "Empezar",
    priceLabel: "19 €/mes",
    subtitle: "30 días gratis y después 19 €/mes",
    employeesLabel: "1 a 2 empleados",
    description: "Ideal para una peluquería que empieza con la gestión digital.",
    features: [
      "Gestión de clientes",
      "Agenda y reservas",
      "Servicios y empleados",
      "Reserva pública",
    ],
    cardClassName: "border-zinc-200 bg-white",
    labelClassName: "text-zinc-500",
    titleClassName: "text-zinc-900",
    textClassName: "text-zinc-700",
  },
  {
    key: "pro",
    label: "Pro",
    title: "Crecer",
    priceLabel: "39 €/mes",
    employeesLabel: "3 a 5 empleados",
    description:
      "Preparado para negocios con más volumen y funciones avanzadas.",
    features: [
      "Todo lo de Basic",
      "Métricas avanzadas",
      "Más automatizaciones",
      "Base para facturación",
    ],
    cardClassName: "border-sky-200 bg-sky-50",
    labelClassName: "text-sky-700",
    titleClassName: "text-sky-900",
    textClassName: "text-sky-900",
  },
  {
    key: "premium",
    label: "Premium",
    title: "Escalar",
    priceLabel: "69 €/mes",
    employeesLabel: "6 a 10 empleados",
    description:
      "Pensado para una operativa más completa y una gestión más potente.",
    features: [
      "Todo lo de Pro",
      "Funciones avanzadas SaaS",
      "Mayor personalización",
      "Preparado para futuras integraciones",
    ],
    cardClassName: "border-violet-200 bg-violet-50",
    labelClassName: "text-violet-700",
    titleClassName: "text-violet-900",
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
    .select("plan, status")
    .eq("business_id", businessId)
    .maybeSingle();

  const currentPlanKey = getPlanKey(subscription?.plan);
  const currentPlan = formatPlanLabel(subscription?.plan);
  const currentStatus = formatStatusLabel(subscription?.status);
  const hasManagedSubscription = isManagedSubscriptionStatus(subscription?.status);

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                Planes SaaS
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                Mejorar plan
              </h2>

              <p className="mt-2 text-zinc-600">
                Aquí podrás comparar planes y elegir el que mejor encaje con tu
                peluquería.
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

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Plan actual</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
            {currentPlan}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Estado de suscripción: {currentStatus}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLAN_DEFINITIONS.map((plan) => {
            const isCurrentPlan =
              hasManagedSubscription && currentPlanKey === plan.key;

            const isDowngrade =
              hasManagedSubscription &&
              currentPlanKey !== null &&
              PLAN_ORDER[plan.key] < PLAN_ORDER[currentPlanKey];

            const canStartOrUpgrade =
              !hasManagedSubscription ||
              currentPlanKey === null ||
              PLAN_ORDER[plan.key] > PLAN_ORDER[currentPlanKey];

            return (
              <div
                key={plan.key}
                className={`rounded-3xl border p-6 shadow-sm ${plan.cardClassName}`}
              >
                <p className={`text-sm font-medium ${plan.labelClassName}`}>
                  {plan.label}
                </p>

                <h3 className={`mt-2 text-2xl font-bold ${plan.titleClassName}`}>
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

                <p className={`mt-4 text-sm ${plan.textClassName}`}>
                  {plan.description}
                </p>

                <ul className={`mt-5 space-y-2 text-sm ${plan.textClassName}`}>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrentPlan ? (
                    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-3 text-center text-sm font-medium text-zinc-600">
                      Plan actual
                    </div>
                  ) : isDowngrade ? (
                    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-3 text-center text-sm font-medium text-zinc-600">
                      Downgrade próximamente
                    </div>
                  ) : canStartOrUpgrade ? (
                    <StripeCheckoutButton
                      plan={plan.key}
                      className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {plan.key === "basic"
                        ? "Empezar con Basic"
                        : `Pasar a ${plan.label}`}
                    </StripeCheckoutButton>
                  ) : (
                    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-3 text-center text-sm font-medium text-zinc-600">
                      No disponible
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-amber-900">
            Próximamente
          </h3>
          <p className="mt-2 text-sm text-amber-800">
            En una siguiente fase aquí conectaremos downgrade, cambio de plan
            desde Customer Portal y una gestión más fina de límites por número
            de empleados.
          </p>
        </div>
      </div>
    </section>
  );
}