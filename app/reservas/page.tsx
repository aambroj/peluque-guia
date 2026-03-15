import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteReservaButton from "@/components/DeleteReservaButton";
import { formatDate, formatTime, getStatusBadgeClasses } from "@/lib/utils";

type SortField = "client" | "employee" | "service" | "date" | "time" | "status";
type SortDirection = "asc" | "desc";

type ReservasPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    employee?: string;
    date?: string;
    sort?: string;
    dir?: string;
  }>;
};

function getRelationName(value: any, fallback = "-") {
  if (Array.isArray(value)) return value[0]?.name ?? fallback;
  return value?.name ?? fallback;
}

function getRelationId(value: any, fallback = "") {
  if (Array.isArray(value)) return value[0]?.id ?? fallback;
  return value?.id ?? fallback;
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSortField(value: string): value is SortField {
  return (
    value === "client" ||
    value === "employee" ||
    value === "service" ||
    value === "date" ||
    value === "time" ||
    value === "status"
  );
}

function compareStrings(a: unknown, b: unknown) {
  return String(a ?? "").localeCompare(String(b ?? ""), "es", {
    sensitivity: "base",
  });
}

export default async function ReservasPage({
  searchParams,
}: ReservasPageProps) {
  const params = (await searchParams) ?? {};

  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const employee = params.employee?.trim() ?? "";
  const date = params.date?.trim() ?? "";
  const sort: SortField = isSortField(params.sort?.trim() ?? "")
    ? (params.sort!.trim() as SortField)
    : "date";
  const dir: SortDirection = params.dir?.trim() === "desc" ? "desc" : "asc";

  const normalizedQ = normalizeSearchText(q);

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
      if (!normalizedQ) return true;

      const clienteNombre = getRelationName(reserva.cliente, "");
      const empleadoNombre = getRelationName(reserva.empleado, "");
      const servicioNombre = getRelationName(reserva.servicio, "");

      const textoNormalizado = normalizeSearchText(
        `${clienteNombre} ${empleadoNombre} ${servicioNombre}`
      );

      return textoNormalizado.includes(normalizedQ);
    }) ?? [];

  const reservasOrdenadas = [...reservasFiltradas].sort((a, b) => {
    let compare = 0;

    if (sort === "client") {
      compare = compareStrings(
        getRelationName(a.cliente, ""),
        getRelationName(b.cliente, "")
      );
    } else if (sort === "employee") {
      compare = compareStrings(
        getRelationName(a.empleado, ""),
        getRelationName(b.empleado, "")
      );
    } else if (sort === "service") {
      compare = compareStrings(
        getRelationName(a.servicio, ""),
        getRelationName(b.servicio, "")
      );
    } else if (sort === "date") {
      compare = compareStrings(a.date, b.date);
    } else if (sort === "time") {
      compare = compareStrings(a.time, b.time);
    } else if (sort === "status") {
      compare = compareStrings(a.status, b.status);
    }

    if (compare === 0) {
      const fallbackDate = compareStrings(a.date, b.date);
      if (fallbackDate !== 0) return dir === "asc" ? fallbackDate : -fallbackDate;

      const fallbackTime = compareStrings(a.time, b.time);
      if (fallbackTime !== 0) return dir === "asc" ? fallbackTime : -fallbackTime;

      return compareStrings(String(a.id), String(b.id));
    }

    return dir === "asc" ? compare : -compare;
  });

  const agendaFiltrada =
    agendaReservas?.filter((reserva) => {
      if (employee && String(getRelationId(reserva.empleado, "")) !== employee) {
        return false;
      }

      if (!normalizedQ) return true;

      const clienteNombre = getRelationName(reserva.cliente, "");
      const empleadoNombre = getRelationName(reserva.empleado, "");
      const servicioNombre = getRelationName(reserva.servicio, "");

      const textoNormalizado = normalizeSearchText(
        `${clienteNombre} ${empleadoNombre} ${servicioNombre}`
      );

      return textoNormalizado.includes(normalizedQ);
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
    reservasOrdenadas.map((reserva) => getRelationName(reserva.empleado, "Sin asignar"))
  ).size;

  function buildSortHref(field: SortField) {
    const nextDir: SortDirection =
      sort === field ? (dir === "asc" ? "desc" : "asc") : "asc";

    const search = new URLSearchParams();

    if (q) search.set("q", q);
    if (status) search.set("status", status);
    if (employee) search.set("employee", employee);
    if (date) search.set("date", date);

    search.set("sort", field);
    search.set("dir", nextDir);

    return `/reservas?${search.toString()}`;
  }

  function getSortLabel(label: string, field: SortField) {
    if (sort !== field) return `${label} ↕`;
    return dir === "asc" ? `${label} ↑` : `${label} ↓`;
  }

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
            <p className="mt-3 text-3xl font-bold">{reservasOrdenadas.length}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Confirmadas</p>
            <p className="mt-3 text-3xl font-bold">
              {reservasOrdenadas.filter((r) => r.status === "Confirmada").length}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Pendientes</p>
            <p className="mt-3 text-3xl font-bold">
              {reservasOrdenadas.filter((r) => r.status === "Pendiente").length}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Canceladas</p>
            <p className="mt-3 text-3xl font-bold">
              {reservasOrdenadas.filter((r) => r.status === "Cancelada").length}
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
              <input type="hidden" name="sort" value={sort} />
              <input type="hidden" name="dir" value={dir} />

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
              {agendaPorEmpleado.map(([empleadoNombre, reservasEmpleado]) => {
                const empleadoId = getRelationId(reservasEmpleado[0]?.empleado, "");

                return (
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
                        href={`/reservas?date=${agendaDate}&employee=${empleadoId}`}
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
                );
              })}
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
                <Link href={buildSortHref("client")} className="hover:text-black">
                  {getSortLabel("Cliente", "client")}
                </Link>
                <Link href={buildSortHref("employee")} className="hover:text-black">
                  {getSortLabel("Empleado", "employee")}
                </Link>
                <Link href={buildSortHref("service")} className="hover:text-black">
                  {getSortLabel("Servicio", "service")}
                </Link>
                <Link href={buildSortHref("date")} className="hover:text-black">
                  {getSortLabel("Fecha", "date")}
                </Link>
                <Link href={buildSortHref("time")} className="hover:text-black">
                  {getSortLabel("Hora", "time")}
                </Link>
                <Link href={buildSortHref("status")} className="hover:text-black">
                  {getSortLabel("Estado", "status")}
                </Link>
                <span>Acciones</span>
              </div>

              {reservasOrdenadas.length > 0 ? (
                reservasOrdenadas.map((reserva) => {
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