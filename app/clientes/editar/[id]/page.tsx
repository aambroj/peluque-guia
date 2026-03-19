import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerBusinessContext } from "@/lib/supabase-server";

type EditarClientePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditarClientePage({
  params,
  searchParams,
}: EditarClientePageProps) {
  const { supabase, user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/clientes");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const { id } = await params;
  const search = (await searchParams) ?? {};
  const errorMessage = search.error ?? "";

  const clienteId = Number(id);

  if (!Number.isFinite(clienteId)) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ID de cliente no válido.
          </div>
        </div>
      </section>
    );
  }

  async function updateCliente(formData: FormData) {
    "use server";

    const { supabase, user, businessId } = await getServerBusinessContext();

    if (!user) {
      redirect("/login?redirectTo=/clientes");
    }

    if (!businessId) {
      redirect("/registro");
    }

    const clienteIdValue = Number(formData.get("cliente_id"));
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const visits = Number(formData.get("visits") ?? 0);
    const last_visit = String(formData.get("last_visit") ?? "").trim();

    if (!Number.isFinite(clienteIdValue)) {
      redirect(`/clientes/editar/${id}?error=ID+de+cliente+no+v%C3%A1lido`);
    }

    if (!name) {
      redirect(`/clientes/editar/${id}?error=El+nombre+es+obligatorio`);
    }

    if (!phone) {
      redirect(`/clientes/editar/${id}?error=El+tel%C3%A9fono+es+obligatorio`);
    }

    if (!Number.isFinite(visits) || visits < 0) {
      redirect(
        `/clientes/editar/${id}?error=El+campo+visitas+no+es+v%C3%A1lido`
      );
    }

    const { data: clienteActual, error: clienteActualError } = await supabase
      .from("clientes")
      .select("id, business_id")
      .eq("id", clienteIdValue)
      .eq("business_id", businessId)
      .maybeSingle();

    if (clienteActualError) {
      redirect(
        `/clientes/editar/${id}?error=${encodeURIComponent(
          clienteActualError.message
        )}`
      );
    }

    if (!clienteActual) {
      redirect(
        `/clientes/editar/${id}?error=El+cliente+seleccionado+no+existe+en+tu+negocio`
      );
    }

    const { data: otroCliente, error: otroClienteError } = await supabase
      .from("clientes")
      .select("id")
      .eq("business_id", businessId)
      .eq("phone", phone)
      .neq("id", clienteIdValue)
      .maybeSingle();

    if (otroClienteError) {
      redirect(
        `/clientes/editar/${id}?error=${encodeURIComponent(
          otroClienteError.message
        )}`
      );
    }

    if (otroCliente) {
      redirect(
        `/clientes/editar/${id}?error=Ya+existe+otro+cliente+con+ese+tel%C3%A9fono`
      );
    }

    const { error } = await supabase
      .from("clientes")
      .update({
        name,
        phone,
        visits,
        last_visit: last_visit || null,
      })
      .eq("id", clienteIdValue)
      .eq("business_id", businessId);

    if (error) {
      redirect(
        `/clientes/editar/${id}?error=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath("/clientes");
    revalidatePath("/dashboard");
    revalidatePath(`/clientes/editar/${id}`);

    redirect("/clientes");
  }

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("id, name, phone, visits, last_visit")
    .eq("id", clienteId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Editar cliente
              </h2>
              <p className="mt-2 text-zinc-600">
                No se pudo cargar el cliente.
              </p>
            </div>

            <Link
              href="/clientes"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver
            </Link>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        </div>
      </section>
    );
  }

  if (!cliente) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Editar cliente
              </h2>
              <p className="mt-2 text-zinc-600">
                El cliente solicitado no existe.
              </p>
            </div>

            <Link
              href="/clientes"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver
            </Link>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No se encontró el cliente que intentas editar.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Editar cliente
            </h2>
            <p className="mt-2 text-zinc-600">
              Modifica los datos del cliente seleccionado.
            </p>
          </div>

          <Link
            href="/clientes"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Volver a clientes
          </Link>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form action={updateCliente} className="space-y-6">
            <input type="hidden" name="cliente_id" value={cliente.id} />

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={cliente.name ?? ""}
                required
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                defaultValue={cliente.phone ?? ""}
                required
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="Teléfono del cliente"
              />
            </div>

            <div>
              <label
                htmlFor="visits"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Visitas
              </label>
              <input
                id="visits"
                name="visits"
                type="number"
                min="0"
                defaultValue={cliente.visits ?? 0}
                required
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="last_visit"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Última visita
              </label>
              <input
                id="last_visit"
                name="last_visit"
                type="date"
                defaultValue={cliente.last_visit ?? ""}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Guardar cambios
              </button>

              <Link
                href="/clientes"
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}