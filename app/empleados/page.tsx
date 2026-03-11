import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteEmpleadoButton from "@/components/DeleteEmpleadoButton";
import { getStatusBadgeClasses } from "@/lib/utils";

type EmpleadosPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function EmpleadosPage({
  searchParams,
}: EmpleadosPageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";

  let query = supabase.from("empleados").select("*").order("id", { ascending: true });

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,role.ilike.%${q}%,phone.ilike.%${q}%,status.ilike.%${q}%`
    );
  }

  const { data: empleados, error } = await query;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Empleados</h2>
            <p className="mt-2 text-zinc-600">
              Gestiona el equipo, turnos y estado del personal.
            </p>
          </div>

          <Link
            href="/empleados/nuevo"
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Nuevo empleado
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Equipo</h3>
              <p className="text-sm text-zinc-500">
                Vista general del personal registrado
              </p>
            </div>

            <form className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar empleado..."
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
              />
              <button className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100">
                Buscar
              </button>
              {q ? (
                <Link
                  href="/empleados"
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
                >
                  Limpiar
                </Link>
              ) : null}
            </form>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Error al cargar empleados: {error.message}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-6 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                <span>Nombre</span>
                <span>Puesto</span>
                <span>Teléfono</span>
                <span>Horario</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>

              {empleados && empleados.length > 0 ? (
                empleados.map((empleado) => (
                  <div
                    key={empleado.id}
                    className="grid grid-cols-6 items-center border-t border-zinc-200 px-4 py-4 text-sm"
                  >
                    <span className="font-medium">{empleado.name}</span>
                    <span>{empleado.role || "-"}</span>
                    <span>{empleado.phone || "-"}</span>
                    <span>{empleado.schedule || "-"}</span>
                    <span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                          empleado.status
                        )}`}
                      >
                        {empleado.status || "-"}
                      </span>
                    </span>

                    <div className="flex gap-2">
                      <Link
                        href={`/empleados/editar/${empleado.id}`}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Editar
                      </Link>

                      <DeleteEmpleadoButton id={empleado.id} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-zinc-500">
                  No hay empleados que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}