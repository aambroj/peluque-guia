import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";

const MADRID_TIME_ZONE = "Europe/Madrid";

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
  const month = Number(
    parts.find((part) => part.type === "month")?.value ?? "0"
  );
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function getCurrentMonthRange() {
  const today = getMadridDateAtNoonUTC();

  const from = `${today.getUTCFullYear()}-${String(
    today.getUTCMonth() + 1
  ).padStart(2, "0")}-01`;

  const monthEndDate = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth() + 1,
      0,
      12,
      0,
      0
    )
  );

  const to = toDateValue(monthEndDate);

  return { from, to };
}

export default async function ExportarIngresosPage() {
  const { user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const { from, to } = getCurrentMonthRange();

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                Exportación avanzada
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                Exportar ingresos CSV
              </h2>

              <p className="mt-2 text-zinc-600">
                Descarga un resumen de ingresos agrupado por día, empleado o
                servicio.
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

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form
            action="/api/export/ingresos"
            method="GET"
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="from"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Desde
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={from}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="to"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Hasta
                </label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={to}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="groupBy"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Agrupar por
              </label>
              <select
                id="groupBy"
                name="groupBy"
                defaultValue="employee"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-black"
              >
                <option value="employee">Empleado</option>
                <option value="service">Servicio</option>
                <option value="day">Día</option>
              </select>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              Se tienen en cuenta solo reservas con estado{" "}
              <strong>Confirmada</strong> o <strong>Completada</strong>.
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Descargar CSV
              </button>

              <Link
                href="/dashboard"
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}