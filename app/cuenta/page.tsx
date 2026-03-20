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

function getStatusClasses(status: string | null | undefined) {
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
      .select("plan, status")
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
  const statusLabel = formatSubscriptionStatus(subscription?.status);

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
                estado de la suscripción.
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
                      subscription?.status
                    )}`}
                  >
                    {statusLabel}
                  </span>
                </div>
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
                Base preparada para conectar planes, cobro y gestión comercial.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/cuenta/planes"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Mejorar plan
              </Link>

              <Link
                href="/cuenta/facturacion"
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Facturación
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Plan actual</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {planLabel}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Tu negocio está actualmente en este nivel de servicio.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Próximamente</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                Cambio de plan
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Preparado para pasar de Basic a Pro o Premium.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm font-medium text-zinc-500">Próximamente</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                Historial de facturas
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Espacio reservado para pagos, facturas y método de cobro.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-sky-900">
            Próxima evolución SaaS
          </h3>
          <p className="mt-2 text-sm text-sky-800">
            Esta pantalla ya deja preparada la base para mostrar límites,
            facturación, cambio de plan y gestión de suscripción en siguientes
            fases.
          </p>
        </div>
      </div>
    </section>
  );
}