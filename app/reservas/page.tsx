import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteReservaButton from "@/components/DeleteReservaButton";
import { formatDate, formatTime, getStatusBadgeClasses } from "@/lib/utils";

type ReservasPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    employee?: string;
    date?: string;
  }>;
};

function getRelationName(value: any, fallback = "-") {
  if (Array.isArray(value)) return value[0]?.name ?? fallback;
  return value?.name ?? fallback;
}

export default async function ReservasPage({
  searchParams,
}: ReservasPageProps) {
  const params = (await searchParams) ?? {};

  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const employee = params.employee?.trim() ?? "";
  const date = params.date?.trim() ?? "";

  const today = new Date().toISOString().split("T")[0];
  const agendaDate = date || today;

  let query = supabase
    .from("reservas")
    .select(`
      id,
      date,
      time,
      status,
      client_id,
      employee_id,
      service_id,
      cliente:clientes!reservas_client_id_fkey(id, name),
      empleado:empleados!reservas_employee_id_fkey(id, name),
      servicio:servicios!reservas_service_id_fkey(id, name)
    `)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  if (employee) {
    query = query.eq("employee_id", employee);
  }

  if (date) {
    query = query.eq("date", date);
  }

  const [
    { data: reservas, error },
    { data: empleados, error: empleadosError },
    { data: agendaReservas, error: agendaError },
  ] = await Promise.all([
    query,
    supabase.from("empleados").select("id, name").order("name", { ascending: true }),
    supabase
      .from("reservas")
      .select(`
        id,
        date,
        time,
        status,
        cliente:clientes!reservas_client_id_fkey(id, name),
        empleado:empleados!reservas_employee_id_fkey(id, name),
        servicio:servicios!reservas_service_id_fkey(id, name)
      `)
      .eq("date", agendaDate)
      .order("time", { ascending: true }),
  ]);

  const reservasFiltradas =
    reservas?.filter((reserva) => {
      if (!q) return true;

      const clienteNombre = getRelationName(reserva.cliente, "");
      const empleadoNombre = getRelationName(reserva.empleado, "");
      const servicioNombre = getRelationName(reserva.servicio, "");

      const texto =
        `${clienteNombre} ${empleadoNombre} ${servicioNombre}`.toLowerCase();

      return texto.includes(q.toLowerCase());
    }) ?? [];

  const agendaFiltrada =
    agendaReservas?.filter((reserva) => {
      if (employee && String((reserva as any).empleado?.id ?? "") !== employee) {
        return false;
      }

      if (!q) return true;

      const clienteNombre = getRelationName(reserva.cliente, "");
      const empleadoNombre = getRelationName(reserva.empleado, "");
      const servicioNombre = getRelationName(reserva.servicio, "");

      const texto =
        `${clienteNombre} ${empleadoNombre} ${servicioNombre}`.toLowerCase();

      return texto.includes(q.toLowerCase());
    }) ?? [];

  const agendaPorEmpleadoMap: Record<string, typeof agendaFiltrada> = {};

  for (const reserva of agendaFiltrada) {
    const empleadoNombre = getRelationName(reserva.empleado, "Sin asignar");

    if (!agendaPorEmpleadoMap[empleadoNombre]) {
      agendaPorEmpleadoMap[empleadoNombre] = [];
    }

    agendaPorEmpleadoMap[empleadoNombre].push(reserva);
  }

  const agendaPorEmpleado = Object.entries(agendaPorEmpleadoMap).sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    return a[0].localeCompare(b[0]);
  });

  const empleadosConReservasVisibles = new Set(
    reservasFiltradas.map((reserva) => getRelationName(reserva.empleado, "Sin asignar"))
  ).size;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reservas</h2>
            <p className="mt-2 text-zinc-600">
              Gestiona citas, filtra por empleado y fecha, y consulta la agenda
              diaria agrupada por trabajador.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/reservas?date=${today}`}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Ver hoy
            </Link>

            <Link
              href="/reservas/nuevo"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Nueva reserva
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Empleados visibles</p>
            <p className="mt-3 text-3xl font-bold">{empleadosConReservasVisibles}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Filtros</h3>
              <p className="text-sm text-zinc-500">
                Busca por cliente, empleado o servicio y limita por fecha o estado
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
                name="employee"
                defaultValue={employee}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-black"
              >
                <option value="">Todos los empleados</option>
                {(empleados ?? []).map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="date"
                defaultValue={date}
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

              {q || status || employee || date ? (
                <Link
                  href="/reservas"
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
                >
                  Limpiar
                </Link>
              ) : null}
            </form>
          </div>

          {empleadosError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Error al cargar empleados: {empleadosError.message}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Agenda del día</h3>
              <p className="text-sm text-zinc-500">
                Reservas del{" "}
                <span className="font-medium text-zinc-700">
                  {formatDate(agendaDate)}
                </span>{" "}
                agrupadas por empleado
              </p>
            </div>

            {agendaDate !== today ? (
              <Link
                href="/reservas"
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
              >
                Volver a hoy
              </Link>
            ) : null}
          </div>

          {agendaError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Error al cargar la agenda del día: {agendaError.message}
            </div>
          ) : agendaPorEmpleado.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {agendaPorEmpleado.map(([empleadoNombre, reservasEmpleado]) => (
                <div
                  key={empleadoNombre}
                  className="rounded-2xl border border-zinc-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-zinc-900">
                        {empleadoNombre}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {reservasEmpleado.length} reserva(s)
                      </p>
                    </div>

                    <Link
                      href={`/reservas?date=${agendaDate}&employee=${
                        reservasEmpleado[0] &&
                        (Array.isArray(reservasEmpleado[0].empleado)
                          ? reservasEmpleado[0].empleado[0]?.id
                          : reservasEmpleado[0].empleado?.id)
                          ? Array.isArray(reservasEmpleado[0].empleado)
                            ? reservasEmpleado[0].empleado[0]?.id
                            : reservasEmpleado[0].empleado?.id
                          : ""
                      }`}
                      className="text-sm font-medium text-zinc-700 hover:text-black"
                    >
                      Ver solo este empleado
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {reservasEmpleado.map((reserva) => {
                      const clienteNombre = getRelationName(
                        reserva.cliente,
                        "Sin cliente"
                      );
                      const servicioNombre = getRelationName(
                        reserva.servicio,
                        "Sin servicio"
                      );

                      return (
                        <div
                          key={reserva.id}
                          className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900">
                              {formatTime(reserva.time)} · {clienteNombre}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                              {servicioNombre}
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
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
              No hay reservas para la fecha seleccionada.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Listado general</h3>
              <p className="text-sm text-zinc-500">
                Vista completa de reservas según los filtros aplicados
              </p>
            </div>
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
                  const clienteNombre = getRelationName(
                    reserva.cliente,
                    "Sin cliente"
                  );

                  const empleadoNombre = getRelationName(
                    reserva.empleado,
                    "Sin asignar"
                  );

                  const servicioNombre = getRelationName(
                    reserva.servicio,
                    "Sin servicio"
                  );

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