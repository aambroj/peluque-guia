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

export default function AdvancedDashboardCharts({
  reservasPorDia7,
  ingresosPorDia7,
}: AdvancedDashboardChartsProps) {
  const maxReservas = getMaxValue(reservasPorDia7);
  const maxIngresos = getMaxValue(ingresosPorDia7);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-semibold text-zinc-900">
            Reservas de los próximos 7 días
          </h3>
          <p className="text-sm text-zinc-500">
            Vista rápida de carga diaria prevista
          </p>
        </div>

        {reservasPorDia7.length > 0 ? (
          <div className="space-y-4">
            {reservasPorDia7.map((item) => {
              const width =
                maxReservas > 0 ? `${(item.value / maxReservas) * 100}%` : "0%";

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-zinc-700">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-zinc-100">
                    <div
                      className="h-3 rounded-full bg-black transition-all"
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
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-semibold text-zinc-900">
            Ingresos de los últimos 7 días
          </h3>
          <p className="text-sm text-zinc-500">
            Evolución reciente de ingresos contabilizados
          </p>
        </div>

        {ingresosPorDia7.length > 0 ? (
          <div className="space-y-4">
            {ingresosPorDia7.map((item) => {
              const width =
                maxIngresos > 0 ? `${(item.value / maxIngresos) * 100}%` : "0%";

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-zinc-700">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {item.value.toFixed(2)} €
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-zinc-100">
                    <div
                      className="h-3 rounded-full bg-zinc-700 transition-all"
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
      </section>
    </div>
  );
}