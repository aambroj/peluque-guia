import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

type NuevoClientePageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NuevoClientePage({
  searchParams,
}: NuevoClientePageProps) {
  const params = (await searchParams) ?? {};
  const errorMessage = params.error ?? "";

  async function createCliente(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!name) {
      redirect("/clientes/nuevo?error=El+nombre+es+obligatorio");
    }

    if (!phone) {
      redirect("/clientes/nuevo?error=El+tel%C3%A9fono+es+obligatorio");
    }

    const { data: clienteExistente, error: clienteExistenteError } = await supabase
      .from("clientes")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (clienteExistenteError) {
      redirect(
        `/clientes/nuevo?error=${encodeURIComponent(clienteExistenteError.message)}`
      );
    }

    if (clienteExistente) {
      redirect("/clientes/nuevo?error=Ya+existe+un+cliente+con+ese+tel%C3%A9fono");
    }

    const { error } = await supabase.from("clientes").insert({
      name,
      phone,
      visits: 0,
      last_visit: null,
    });

    if (error) {
      redirect(`/clientes/nuevo?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/clientes");
    revalidatePath("/dashboard");

    redirect("/clientes");
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Nuevo cliente
            </h2>
            <p className="mt-2 text-zinc-600">
              Añade un cliente nuevo a la base de datos de la peluquería.
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
          <form action={createCliente} className="space-y-6">
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
                required
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="Teléfono del cliente"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Guardar cliente
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