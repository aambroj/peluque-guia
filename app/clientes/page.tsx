import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteClienteButton from "@/components/DeleteClienteButton";
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
  const q = params.q?.trim() ?? "";

  let query = supabase.from("clientes").select("*").order("id", { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,notes.ilike.%${q}%`);
  }

  const { data: clients, error } = await query;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
            <p className="mt-2 text-zinc-600">
              Consulta fichas, historial y notas importantes de tus clientes.
            </p>
          </div>

          <Link
            href="/clientes/nuevo"
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Nuevo cliente
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Clientes visibles</p>
            <p className="mt-3 text-3xl font-bold">{clients?.length ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Búsqueda activa</p>
            <p className="mt-3 text-lg font-semibold">{q || "Sin filtro"}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Con teléfono</p>
            <p className="mt-3 text-3xl font-bold">
              {clients?.filter((c) => c.phone).length ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Con notas</p>
            <p className="mt-3 text-3xl font-bold">
              {clients?.filter((c) => c.notes).length ?? 0}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Base de clientes</h3>
              <p className="text-sm text-zinc-500">
                Vista general de clientes registrados
              </p>
            </div>

            <form className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar cliente..."
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
              />
              <button className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100">
                Buscar
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Error al cargar clientes: {error.message}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-6 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                <span>Nombre</span>
                <span>Teléfono</span>
                <span>Visitas</span>
                <span>Última visita</span>
                <span>Notas</span>
                <span>Acciones</span>
              </div>

              {clients && clients.length > 0 ? (
                clients.map((client) => (
                  <div
                    key={client.id}
                    className="grid grid-cols-6 items-center border-t border-zinc-200 px-4 py-4 text-sm"
                  >
                    <span className="font-medium">{client.name}</span>
                    <span>{client.phone || "-"}</span>
                    <span>{client.visits ?? 0}</span>
                    <span>{formatDate(client.last_visit)}</span>
                    <span className="truncate">{client.notes || "-"}</span>

                    <div className="flex gap-2">
                      <Link
                        href={`/clientes/editar/${client.id}`}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Editar
                      </Link>

                      <DeleteClienteButton id={client.id} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-zinc-500">
                  No hay clientes que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}