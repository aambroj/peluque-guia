import Link from "next/link";
import { redirect } from "next/navigation";
import DarBajaEmpleadoButton from "@/components/DarBajaEmpleadoButton";
import { getServerBusinessContext } from "@/lib/supabase-server";

type EmpleadosPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default async function EmpleadosPage({
  searchParams,
}: EmpleadosPageProps) {
  const params = (await searchParams) ?? {};
  const q = normalizeText(params.q ?? "");

  const { supabase, user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/empleados");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const { data: empleados, error } = await supabase
    .from("empleados")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  const empleadosActivos =
    empleados?.filter(
      (empleado) => normalizeText(empleado.status ?? "Activo") !== "inactivo"
    ) ?? [];

  const empleadosFiltrados = empleadosActivos.filter((empleado) => {
    if (!q) return true;

    const texto = normalizeText(
      `${empleado.name ?? ""} ${empleado.role ?? ""} ${empleado.phone ?? ""} ${empleado.status ?? ""}`
    );

    return texto.includes(q);
  });

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Empleados
              </h2>
              <p className="mt-2 text-zinc-600">
                Gestiona el equipo, sus datos generales y el acceso a su ficha.
              </p>
            </div>

            <Link
              href="/empleados/nuevo"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Nuevo empleado
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                Listado de empleados
              </h3>
              <p className="text-sm text-zinc-500">
                Busca por nombre, rol, teléfono o estado
              </p>
            </div>

            <form className="flex flex-wrap gap-2">
              <input
                type="text"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Buscar empleado..."
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
              />

              <button className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100">
                Filtrar
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
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar empleados: {error.message}
            </div>
          ) : empleadosFiltrados.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-5 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                <span>Nombre</span>
                <span>Rol</span>
                <span>Teléfono</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>

              {empleadosFiltrados.map((empleado) => (
                <div
                  key={empleado.id}
                  className="grid grid-cols-5 items-center border-t border-zinc-200 px-4 py-4 text-sm"
                >
                  <span className="font-medium text-zinc-900">
                    {empleado.name ?? "-"}
                  </span>
                  <span>{empleado.role ?? "-"}</span>
                  <span>{empleado.phone ?? "-"}</span>
                  <span>{empleado.status ?? "-"}</span>

                  <div className="flex gap-2">
                    <Link
                      href={`/empleados/editar/${empleado.id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Editar
                    </Link>

                    <DarBajaEmpleadoButton
                      id={empleado.id}
                      name={empleado.name ?? "este empleado"}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 p-6 text-sm text-zinc-500">
              No hay empleados activos registrados.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}