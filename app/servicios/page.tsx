import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteServicioButton from "@/components/DeleteServicioButton";

type ServiciosPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function ServiciosPage({
  searchParams,
}: ServiciosPageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";

  let query = supabase.from("servicios").select("*").order("id", { ascending: true });

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,category.ilike.%${q}%,duration.ilike.%${q}%,description.ilike.%${q}%`
    );
  }

  const { data: servicios, error } = await query;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Servicios</h2>
            <p className="mt-2 text-zinc-600">
              Gestiona los servicios, categorías, duración y precios.
            </p>
          </div>

          <Link
            href="/servicios/nuevo"
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Nuevo servicio
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Catálogo de servicios</h3>
              <p className="text-sm text-zinc-500">
                Vista general de servicios registrados
              </p>
            </div>

            <form className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar servicio..."
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
              />
              <button className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100">
                Buscar
              </button>
              {q ? (
                <Link
                  href="/servicios"
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
                >
                  Limpiar
                </Link>
              ) : null}
            </form>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Error al cargar servicios: {error.message}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-6 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                <span>Nombre</span>
                <span>Categoría</span>
                <span>Duración</span>
                <span>Precio</span>
                <span>Descripción</span>
                <span>Acciones</span>
              </div>

              {servicios && servicios.length > 0 ? (
                servicios.map((servicio) => (
                  <div
                    key={servicio.id}
                    className="grid grid-cols-6 items-center border-t border-zinc-200 px-4 py-4 text-sm"
                  >
                    <span className="font-medium">{servicio.name}</span>
                    <span>{servicio.category || "-"}</span>
                    <span>{servicio.duration || "-"}</span>
                    <span>{Number(servicio.price ?? 0).toFixed(2)} €</span>
                    <span className="truncate">{servicio.description || "-"}</span>

                    <div className="flex gap-2">
                      <Link
                        href={`/servicios/editar/${servicio.id}`}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Editar
                      </Link>

                      <DeleteServicioButton id={servicio.id} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-zinc-500">
                  No hay servicios que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}