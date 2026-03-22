import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";
import StripeCheckoutButton from "@/components/StripeCheckoutButton";

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

  const currentPlan = formatPlanLabel(subscription?.plan);

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
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Basic</p>
            <h3 className="mt-2 text-2xl font-bold text-zinc-900">Empezar</h3>
            <p className="mt-3 text-sm text-zinc-500">
              Ideal para una peluquería que empieza con la gestión digital.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-zinc-700">
              <li>Gestión de clientes</li>
              <li>Agenda y reservas</li>
              <li>Servicios y empleados</li>
              <li>Reserva pública</li>
            </ul>
            <div className="mt-6">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                Plan base actual del producto.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-sky-700">Pro</p>
            <h3 className="mt-2 text-2xl font-bold text-sky-900">Crecer</h3>
            <p className="mt-3 text-sm text-sky-800">
              Preparado para negocios con más volumen y funciones avanzadas.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-sky-900">
              <li>Todo lo de Basic</li>
              <li>Métricas avanzadas</li>
              <li>Más automatizaciones</li>
              <li>Base para facturación</li>
            </ul>
            <div className="mt-6">
              <StripeCheckoutButton
                plan="pro"
                className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                Pasar a Pro
              </StripeCheckoutButton>
            </div>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-violet-700">Premium</p>
            <h3 className="mt-2 text-2xl font-bold text-violet-900">
              Escalar
            </h3>
            <p className="mt-3 text-sm text-violet-800">
              Pensado para una operativa más completa y una gestión más potente.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-violet-900">
              <li>Todo lo de Pro</li>
              <li>Funciones avanzadas SaaS</li>
              <li>Mayor personalización</li>
              <li>Preparado para futuras integraciones</li>
            </ul>
            <div className="mt-6">
              <StripeCheckoutButton
                plan="premium"
                className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                Pasar a Premium
              </StripeCheckoutButton>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-amber-900">
            Próximamente
          </h3>
          <p className="mt-2 text-sm text-amber-800">
            En una siguiente fase aquí conectaremos cambio de plan, downgrade y
            gestión más fina de límites.
          </p>
        </div>
      </div>
    </section>
  );
}