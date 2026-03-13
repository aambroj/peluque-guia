import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

type ClientesPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function ClientesPage({
  searchParams,
}: ClientesPageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim().toLowerCase() ?? "";

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("id, name, phone, visits, last_visit")
    .order("name", { ascending: true });

  const clientesFiltrados =
    clientes?.filter((cliente) => {
      if (!q) return true;

      const texto = `${cliente.name ?? ""} ${cliente.phone ?? ""}`.toLowerCase();
      return texto.includes(q);
    }) ?? [];

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Clientes
              </h2>
              <p className="mt-2 text-zinc-600">
                Gestiona los datos de tus clientes y su historial básico.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/clientes/nuevo"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Nuevo cliente
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">
                Listado de clientes
              </h3>
              <p className="text-sm text-zinc-500">
                Busca por nombre o teléfono
              </p>
            </div>

            <form className="flex flex-wrap gap-2">
              <input
                type="text"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Buscar cliente..."
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
              />

              <button className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100">
                Filtrar
              </button>

              {q ? (
                <Link
                  href="/clientes"
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
                >
                  Limpiar
                </Link>
              ) : null}
            </form>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Error al cargar clientes: {error.message}
            </div>
          ) : clientesFiltrados.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-5 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                <span>Nombre</span>
                <span>Teléfono</span>
                <span>Visitas</span>
                <span>Última visita</span>
                <span>Acciones</span>
              </div>

              {clientesFiltrados.map((cliente) => (
                <div
                  key={cliente.id}
                  className="grid grid-cols-5 items-center border-t border-zinc-200 px-4 py-4 text-sm"
                >
                  <span className="font-medium text-zinc-900">
                    {cliente.name}
                  </span>
                  <span>{cliente.phone || "-"}</span>
                  <span>{cliente.visits ?? 0}</span>
                  <span>
                    {cliente.last_visit
                      ? formatDate(cliente.last_visit)
                      : "Sin visitas"}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/clientes/editar/${cliente.id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 p-6 text-sm text-zinc-500">
              No hay clientes registrados.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}