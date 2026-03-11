import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteReservaButton from "@/components/DeleteReservaButton";
import { formatDate, formatTime, getStatusBadgeClasses } from "@/lib/utils";

type ReservasPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function ReservasPage({
  searchParams,
}: ReservasPageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";

  let query = supabase
    .from("reservas")
    .select(`
      *,
      cliente:clientes(id, name),
      empleado:empleados(id, name),
      servicio:servicios(id, name)
    `)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: reservas, error } = await query;

  const reservasFiltradas =
    reservas?.filter((reserva) => {
      if (!q) return true;

      const clienteNombre =
        (Array.isArray(reserva.cliente)
          ? reserva.cliente[0]?.name
          : reserva.cliente?.name) ||
        reserva.client_name ||
        "";

      const empleadoNombre =
        (Array.isArray(reserva.empleado)
          ? reserva.empleado[0]?.name
          : reserva.empleado?.name) ||
        reserva.employee_name ||
        "";

      const servicioNombre =
        (Array.isArray(reserva.servicio)
          ? reserva.servicio[0]?.name
          : reserva.servicio?.name) ||
        reserva.service_name ||
        "";

      const texto = `${clienteNombre} ${empleadoNombre} ${servicioNombre}`.toLowerCase();
      return texto.includes(q.toLowerCase());
    }) ?? [];

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reservas</h2>
            <p className="mt-2 text-zinc-600">
              Gestiona citas, estado de reservas y asignación de servicios.
            </p>
          </div>

          <Link
            href="/reservas/nuevo"
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"

          >
            Nueva reserva
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Reservas visibles</p>
            <p className="mt-3 text-3xl font-bold">{reservasFiltradas.length}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Confirmadas</p>
            <p className="mt-3 text-3xl font-bold">
              {reservasFiltradas.filter((r) => r.status === "Confirmada").length}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Pendientes</p>
            <p className="mt-3 text-3xl font-bold">
              {reservasFiltradas.filter((r) => r.status === "Pendiente").length}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Canceladas</p>
            <p className="mt-3 text-3xl font-bold">
              {reservasFiltradas.filter((r) => r.status === "Cancelada").length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Agenda de reservas</h3>
              <p className="text-sm text-zinc-500">
                Vista general de citas registradas
              </p>
            </div>

            <form className="flex flex-wrap gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar reserva..."
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
              />

              <select
                name="status"
                defaultValue={status}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-black"
              >
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Cancelada">Cancelada</option>
              </select>

              <button className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100">
                Filtrar
              </button>

              {q || status ? (
                <Link
                  href="/reservas"
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
                >
                  Limpiar
                </Link>
              ) : null}
            </form>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Error al cargar reservas: {error.message}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-7 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                <span>Cliente</span>
                <span>Empleado</span>
                <span>Servicio</span>
                <span>Fecha</span>
                <span>Hora</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>

              {reservasFiltradas.length > 0 ? (
                reservasFiltradas.map((reserva) => {
                  const clienteNombre =
                    (Array.isArray(reserva.cliente)
                      ? reserva.cliente[0]?.name
                      : reserva.cliente?.name) ||
                    reserva.client_name ||
                    "-";

                  const empleadoNombre =
                    (Array.isArray(reserva.empleado)
                      ? reserva.empleado[0]?.name
                      : reserva.empleado?.name) ||
                    reserva.employee_name ||
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
                      className="grid grid-cols-7 items-center border-t border-zinc-200 px-4 py-4 text-sm"
                    >
                      <span className="font-medium">{clienteNombre}</span>
                      <span>{empleadoNombre}</span>
                      <span>{servicioNombre}</span>
                      <span>{formatDate(reserva.date)}</span>
                      <span>{formatTime(reserva.time)}</span>
                      <span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                            reserva.status
                          )}`}
                        >
                          {reserva.status}
                        </span>
                      </span>

                      <div className="flex gap-2">
                        <Link
                          href={`/reservas/editar/${reserva.id}`}
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                        >
                          Editar
                        </Link>

                        <DeleteReservaButton id={reserva.id} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-sm text-zinc-500">
                  No hay reservas que coincidan con los filtros.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}