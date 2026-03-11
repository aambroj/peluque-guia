import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatDate, formatTime, getStatusBadgeClasses } from "@/lib/utils";

export default async function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: clientesCount, error: clientesError },
    { count: empleadosCount, error: empleadosError },
    { count: serviciosCount, error: serviciosError },
    { count: reservasCount, error: reservasError },
    { data: reservasProximas, error: reservasListaError },
    { data: clientes, error: clientesListaError },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("empleados").select("*", { count: "exact", head: true }),
    supabase.from("servicios").select("*", { count: "exact", head: true }),
    supabase.from("reservas").select("*", { count: "exact", head: true }),
    supabase
      .from("reservas")
      .select(`
        *,
        cliente:clientes(id, name),
        servicio:servicios(id, name)
      `)
      .gte("date", today)
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(5),
    supabase.from("clientes").select("*").order("id", { ascending: false }).limit(5),
  ]);

  const confirmadas =
    reservasProximas?.filter((reserva) => reserva.status === "Confirmada").length ?? 0;

  const pendientes =
    reservasProximas?.filter((reserva) => reserva.status === "Pendiente").length ?? 0;

  const canceladas =
    reservasProximas?.filter((reserva) => reserva.status === "Cancelada").length ?? 0;

  const hayError =
    clientesError ||
    empleadosError ||
    serviciosError ||
    reservasError ||
    reservasListaError ||
    clientesListaError;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
              Vista general del negocio
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
              Dashboard
            </h2>

            <p className="mt-2 max-w-2xl text-zinc-600">
              Consulta métricas clave, reservas próximas y actividad general de
              tu peluquería desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/reservas"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Ver reservas
            </Link>

            <Link
              href="/clientes"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Ver clientes
            </Link>
          </div>
        </div>

        {hayError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Error al cargar el dashboard.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Clientes</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
              {clientesCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Total de clientes registrados
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Empleados</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
              {empleadosCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Personal activo en el sistema
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Servicios</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
              {serviciosCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Servicios disponibles en catálogo
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Reservas totales</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
              {reservasCount ?? 0}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Citas registradas actualmente
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">
              Próximas confirmadas
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-emerald-900">
              {confirmadas}
            </p>
            <p className="mt-2 text-sm text-emerald-700/80">
              Citas futuras listas para atender
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-amber-700">
              Próximas pendientes
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-amber-900">
              {pendientes}
            </p>
            <p className="mt-2 text-sm text-amber-700/80">
              Pendientes de confirmar
            </p>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-rose-700">
              Próximas canceladas
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-rose-900">
              {canceladas}
            </p>
            <p className="mt-2 text-sm text-rose-700/80">
              Citas futuras anuladas
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">
                  Próximas reservas
                </h3>
                <p className="text-sm text-zinc-500">
                  Agenda futura ordenada por fecha y hora
                </p>
              </div>

              <Link
                href="/reservas"
                className="text-sm font-medium text-zinc-700 transition hover:text-black"
              >
                Ver todas
              </Link>
            </div>

            <div className="space-y-3">
              {reservasProximas && reservasProximas.length > 0 ? (
                reservasProximas.map((reserva) => {
                  const clienteNombre =
                    (Array.isArray(reserva.cliente)
                      ? reserva.cliente[0]?.name
                      : reserva.cliente?.name) ||
                    reserva.client_name ||
                    "-";

                  const servicioNombre =
                    (Array.isArray(reserva.servicio)
                      ? reserva.servicio[0]?.name
                      : reserva.servicio?.name) ||
                    reserva.service_name ||
                    "-";

                  return (
                    <div
                      key={reserva.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-900">
                          {clienteNombre}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {servicioNombre}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDate(reserva.date)} · {formatTime(reserva.time)}
                        </p>
                      </div>

                      <span
                        className={`ml-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                          reserva.status
                        )}`}
                      >
                        {reserva.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
                  No hay reservas futuras registradas.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">
                  Últimos clientes
                </h3>
                <p className="text-sm text-zinc-500">
                  Clientes añadidos recientemente
                </p>
              </div>

              <Link
                href="/clientes"
                className="text-sm font-medium text-zinc-700 transition hover:text-black"
              >
                Ver todos
              </Link>
            </div>

            <div className="space-y-3">
              {clientes && clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">
                        {cliente.name}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {cliente.phone}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Última visita: {formatDate(cliente.last_visit)}
                      </p>
                    </div>

                    <div className="ml-4 rounded-2xl bg-zinc-100 px-3 py-2 text-right">
                      <p className="text-xs text-zinc-500">Visitas</p>
                      <p className="text-sm font-semibold text-zinc-900">
                        {cliente.visits}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
                  No hay clientes registrados.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/clientes"
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-zinc-900">Clientes</p>
            <p className="mt-2 text-sm text-zinc-500">
              Consulta fichas e historial
            </p>
          </Link>

          <Link
            href="/empleados"
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-zinc-900">Empleados</p>
            <p className="mt-2 text-sm text-zinc-500">
              Gestiona equipo y turnos
            </p>
          </Link>

          <Link
            href="/servicios"
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-zinc-900">Servicios</p>
            <p className="mt-2 text-sm text-zinc-500">
              Edita precios y duración
            </p>
          </Link>

          <Link
            href="/reservas"
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-zinc-900">Reservas</p>
            <p className="mt-2 text-sm text-zinc-500">
              Revisa la agenda diaria
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}