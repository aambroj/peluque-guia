import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";

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

function getEffectiveStatusLabel(params: {
  plan: string | null | undefined;
  status: string | null | undefined;
}) {
  const normalizedPlan = normalizeText(params.plan ?? "");
  const normalizedStatus = normalizeText(params.status ?? "");

  if (normalizedPlan === "basic" && normalizedStatus === "inactive") {
    return "Pendiente de activar";
  }

  if (!normalizedStatus) return "Sin suscripción";
  if (normalizedStatus === "active") return "Activa";
  if (normalizedStatus === "inactive") return "Inactiva";
  if (normalizedStatus === "trialing") return "En prueba";
  if (normalizedStatus === "past_due") return "Pago pendiente";
  if (normalizedStatus === "canceled") return "Cancelada";
  if (normalizedStatus === "paused") return "Pausada";
  if (normalizedStatus === "unpaid") return "Impagada";
  if (normalizedStatus === "incomplete") return "Pendiente de completar";

  return params.status ?? "Sin suscripción";
}

function getStatusClasses(params: {
  plan: string | null | undefined;
  status: string | null | undefined;
}) {
  const normalizedPlan = normalizeText(params.plan ?? "");
  const normalizedStatus = normalizeText(params.status ?? "");

  if (normalizedPlan === "basic" && normalizedStatus === "inactive") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "trialing") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (normalizedStatus === "past_due" || normalizedStatus === "unpaid") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "canceled") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (normalizedStatus === "paused") {
    return "border-zinc-300 bg-zinc-100 text-zinc-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getPlanCardClasses(plan: string | null | undefined) {
  const normalized = normalizeText(plan ?? "");

  if (normalized === "premium") {
    return "border-violet-200 bg-violet-50";
  }

  if (normalized === "pro") {
    return "border-sky-200 bg-sky-50";
  }

  return "border-zinc-200 bg-white";
}

function getDefaultEmployeeLimit(plan: string | null | undefined) {
  const normalized = normalizeText(plan ?? "");

  if (normalized === "basic") return 2;
  if (normalized === "pro") return 5;
  if (normalized === "premium") return 10;

  return 2;
}

function getSubscriptionNotice(params: {
  plan: string | null | undefined;
  status: string | null | undefined;
  trialEnd: string | null | undefined;
  currentPeriodEnd: string | null | undefined;
}) {
  const normalizedPlan = normalizeText(params.plan ?? "");
  const normalizedStatus = normalizeText(params.status ?? "");
  const trialEndLabel = formatDate(params.trialEnd);
  const currentPeriodEndLabel = formatDate(params.currentPeriodEnd);

  if (normalizedPlan === "basic" && normalizedStatus === "inactive") {
    return {
      tone: "amber" as const,
      title: "Tu prueba gratis aún no está activada",
      description:
        "Has creado el negocio, pero todavía no has iniciado la prueba de 30 días. Activa Basic desde Planes para empezar.",
    };
  }

  if (normalizedStatus === "trialing") {
    return {
      tone: "sky" as const,
      title: "Tu prueba gratuita está activa",
      description: trialEndLabel
        ? `Tu periodo de prueba finaliza el ${trialEndLabel}.`
        : "Tu suscripción está en periodo de prueba.",
    };
  }

  if (normalizedStatus === "active") {
    return {
      tone: "emerald" as const,
      title: "Tu suscripción está activa",
      description: currentPeriodEndLabel
        ? `Tu periodo actual está cubierto hasta el ${currentPeriodEndLabel}.`
        : "Tu negocio tiene una suscripción activa.",
    };
  }

  if (normalizedStatus === "past_due" || normalizedStatus === "unpaid") {
    return {
      tone: "amber" as const,
      title: "Hay un problema con el cobro",
      description:
        "Revisa tu facturación o el método de pago para evitar interrupciones en la suscripción.",
    };
  }

  if (normalizedStatus === "canceled") {
    return {
      tone: "rose" as const,
      title: "La suscripción está cancelada",
      description:
        "Puedes volver a activar un plan desde la pantalla de Planes.",
    };
  }

  if (normalizedStatus === "paused") {
    return {
      tone: "zinc" as const,
      title: "La suscripción está pausada",
      description:
        "Revisa el estado de la cuenta y la configuración de facturación.",
    };
  }

  return {
    tone: "zinc" as const,
    title: "Estado de suscripción",
    description:
      "Consulta aquí el plan actual, su estado y las acciones disponibles.",
  };
}

function getNoticeClasses(
  tone: "amber" | "sky" | "emerald" | "rose" | "zinc"
) {
  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tone === "sky") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "rose") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getPrimaryAction(params: {
  plan: string | null | undefined;
  status: string | null | undefined;
}) {
  const normalizedPlan = normalizeText(params.plan ?? "");
  const normalizedStatus = normalizeText(params.status ?? "");

  if (normalizedPlan === "basic" && normalizedStatus === "inactive") {
    return {
      href: "/cuenta/planes",
      label: "Activar prueba gratis",
    };
  }

  return {
    href: "/cuenta/planes",
    label: "Ver planes",
  };
}

function canManageSubscription(status: string | null | undefined) {
  const normalizedStatus = normalizeText(status ?? "");

  return ["trialing", "active", "past_due", "unpaid", "paused"].includes(
    normalizedStatus
  );
}

export default async function CuentaPage() {
  const { supabase, user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/cuenta");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const [
    { data: business, error: businessError },
    { data: subscription, error: subscriptionError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, slug, email")
      .eq("id", businessId)
      .maybeSingle(),

    supabase
      .from("subscriptions")
      .select("plan, status, employee_limit, trial_end, current_period_end")
      .eq("business_id", businessId)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const errores = [businessError, subscriptionError, profileError].filter(Boolean);

  const planLabel = formatPlanLabel(subscription?.plan);
  const statusLabel = getEffectiveStatusLabel({
    plan: subscription?.plan,
    status: subscription?.status,
  });

  const employeeLimit =
    typeof subscription?.employee_limit === "number" &&
    Number.isFinite(subscription.employee_limit) &&
    subscription.employee_limit > 0
      ? subscription.employee_limit
      : getDefaultEmployeeLimit(subscription?.plan);

  const notice = getSubscriptionNotice({
    plan: subscription?.plan,
    status: subscription?.status,
    trialEnd: subscription?.trial_end,
    currentPeriodEnd: subscription?.current_period_end,
  });

  const primaryAction = getPrimaryAction({
    plan: subscription?.plan,
    status: subscription?.status,
  });

  const showCustomerPortalActions = canManageSubscription(subscription?.status);

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                Configuración SaaS
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                Cuenta y suscripción
              </h2>

              <p className="mt-2 text-zinc-600">
                Consulta los datos principales del negocio, el plan actual y el
                estado real de la suscripción.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>

        {errores.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Hay un error cargando la cuenta.</p>
            <div className="mt-2 space-y-1">
              {errores.map((error: any, index) => (
                <p key={index}>{error.message}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={`rounded-3xl border p-6 shadow-sm ${getNoticeClasses(
            notice.tone
          )}`}
        >
          <h3 className="text-xl font-semibold">{notice.title}</h3>
          <p className="mt-2 text-sm">{notice.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-zinc-900">
              Datos del negocio
            </h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm text-zinc-500">Nombre del negocio</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {business?.name ?? "Sin nombre"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm text-zinc-500">Slug público</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {business?.slug ?? "Sin slug"}
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Enlace base de reserva online:
                </p>
                <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                  {business?.slug ? `/reservar/${business.slug}` : "No disponible"}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4">
                <p className="text-sm text-zinc-500">Email del negocio</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {business?.email ?? user.email ?? "Sin email"}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-3xl border p-6 shadow-sm ${getPlanCardClasses(
              subscription?.plan
            )}`}
          >
            <h3 className="text-xl font-semibold text-zinc-900">
              Suscripción actual
            </h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm text-zinc-500">Plan</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {planLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm text-zinc-500">Estado</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClasses(
                      {
                        plan: subscription?.plan,
                        status: subscription?.status,
                      }
                    )}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm text-zinc-500">Límite de empleados</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {employeeLimit} activos
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm text-zinc-500">Titular / perfil</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {profile?.full_name || user.email || "Usuario"}
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Rol: {profile?.role ?? "owner"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                Acciones de suscripción
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Gestiona la activación del plan, la facturación y la evolución
                de tu suscripción.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={primaryAction.href}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {primaryAction.label}
              </Link>

              {showCustomerPortalActions ? (
                <>
                  <Link
                    href="/cuenta/facturacion"
                    className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                  >
                    Gestionar suscripción
                  </Link>

                  <Link
                    href="/cuenta/facturacion"
                    className="rounded-xl border border-rose-300 bg-white px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                  >
                    Cancelar suscripción
                  </Link>
                </>
              ) : (
                <Link
                  href="/cuenta/facturacion"
                  className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                >
                  Facturación
                </Link>
              )}
            </div>
          </div>

          {showCustomerPortalActions ? (
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              El cambio de tarjeta, facturas, cambios de plan y cancelación se
              gestionan de forma segura desde Stripe.
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Plan actual</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {planLabel}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Tu negocio está asignado a este nivel de servicio.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Estado actual</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {statusLabel}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {notice.description}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">
                Capacidad incluida
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {employeeLimit} empleados activos
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                El límite de empleados se aplica al crear o reactivar miembros
                del equipo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}