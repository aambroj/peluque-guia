"use client";

type ChartItem = {
  label: string;
  value: number;
};

type AdvancedDashboardChartsProps = {
  reservasPorDia7: ChartItem[];
  ingresosPorDia7: ChartItem[];
};

function getMaxValue(items: ChartItem[]) {
  return items.reduce((max, item) => Math.max(max, item.value), 0);
}

function getTotalValue(items: ChartItem[]) {
  return items.reduce((acc, item) => acc + item.value, 0);
}

function getTopItem(items: ChartItem[]) {
  if (items.length === 0) return null;

  return items.reduce((top, item) => {
    if (!top) return item;
    return item.value > top.value ? item : top;
  }, null as ChartItem | null);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

function getBarWidth(value: number, max: number) {
  if (max <= 0 || value <= 0) return "0%";

  const raw = (value / max) * 100;
  const clamped = Math.max(raw, 8);

  return `${Math.min(clamped, 100)}%`;
}

export default function AdvancedDashboardCharts({
  reservasPorDia7,
  ingresosPorDia7,
}: AdvancedDashboardChartsProps) {
  const maxReservas = getMaxValue(reservasPorDia7);
  const maxIngresos = getMaxValue(ingresosPorDia7);

  const totalReservas = getTotalValue(reservasPorDia7);
  const totalIngresos = getTotalValue(ingresosPorDia7);

  const mediaReservas =
    reservasPorDia7.length > 0 ? totalReservas / reservasPorDia7.length : 0;

  const mediaIngresos =
    ingresosPorDia7.length > 0 ? totalIngresos / ingresosPorDia7.length : 0;

  const topReservas = getTopItem(reservasPorDia7);
  const topIngresos = getTopItem(ingresosPorDia7);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-gradient-to-r from-sky-50 via-white to-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                Reservas de los próximos 7 días
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Vista rápida de carga diaria prevista
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">
                Total: {totalReservas}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
                Media: {mediaReservas.toFixed(1)}/día
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
                Pico: {topReservas ? `${topReservas.label} · ${topReservas.value}` : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {reservasPorDia7.length > 0 ? (
            <div className="space-y-4">
              {reservasPorDia7.map((item) => {
                const width = getBarWidth(item.value, maxReservas);

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-zinc-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">
                          {item.label}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Carga prevista del día
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-right">
                        <p className="text-xs text-zinc-500">Reservas</p>
                        <p className="text-sm font-bold text-zinc-900">
                          {item.value}
                        </p>
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-3 rounded-full bg-sky-500 transition-all duration-500"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
              No hay datos de reservas para mostrar.
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-gradient-to-r from-emerald-50 via-white to-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                Ingresos de los últimos 7 días
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Evolución reciente de ingresos contabilizados
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                Total: {formatCurrency(totalIngresos)}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
                Media: {formatCurrency(mediaIngresos)}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
                Pico:{" "}
                {topIngresos
                  ? `${topIngresos.label} · ${formatCurrency(topIngresos.value)}`
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {ingresosPorDia7.length > 0 ? (
            <div className="space-y-4">
              {ingresosPorDia7.map((item) => {
                const width = getBarWidth(item.value, maxIngresos);

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-zinc-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">
                          {item.label}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Ingreso contabilizado
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-right">
                        <p className="text-xs text-zinc-500">Importe</p>
                        <p className="text-sm font-bold text-zinc-900">
                          {formatCurrency(item.value)}
                        </p>
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-3 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
              No hay datos de ingresos para mostrar.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}