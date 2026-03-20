import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";

export default async function FacturacionPage() {
  const { user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/cuenta/facturacion");
  }

  if (!businessId) {
    redirect("/registro");
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                Facturación SaaS
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                Facturación
              </h2>

              <p className="mt-2 text-zinc-600">
                Aquí se mostrará el historial de cobros, facturas y datos de
                pago del negocio.
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

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Próximamente
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              Facturas
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Histórico descargable de documentos y recibos.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Próximamente
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              Cobros
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Estado de pagos, renovaciones y próximos vencimientos.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Próximamente
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              Método de pago
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Zona preparada para tarjeta, domiciliación u otros métodos.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-sky-900">
            Base preparada
          </h3>
          <p className="mt-2 text-sm text-sky-800">
            Esta pantalla ya deja lista la estructura para conectar facturación
            real en una siguiente fase.
          </p>
        </div>
      </div>
    </section>
  );
}