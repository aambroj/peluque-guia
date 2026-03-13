import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EditarReservaPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarReservaPage({
  params,
}: EditarReservaPageProps) {
  const { id } = await params;
  const reservaId = Number(id);

  if (!Number.isFinite(reservaId)) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ID de reserva no válido.
          </div>
        </div>
      </section>
    );
  }

  async function updateReserva(formData: FormData) {
    "use server";

    const reservaIdValue = Number(formData.get("reserva_id"));
    const client_id = Number(formData.get("client_id"));
    const employee_id = Number(formData.get("employee_id"));
    const service_id = Number(formData.get("service_id"));
    const date = String(formData.get("date") ?? "").trim();
    const time = String(formData.get("time") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!Number.isFinite(reservaIdValue)) {
      redirect(`/reservas/editar/${id}?error=ID+de+reserva+no+v%C3%A1lido`);
    }

    if (!Number.isFinite(client_id) || client_id <= 0) {
      redirect(
        `/reservas/editar/${id}?error=Debes+seleccionar+un+cliente`
      );
    }

    if (!Number.isFinite(employee_id) || employee_id <= 0) {
      redirect(
        `/reservas/editar/${id}?error=Debes+seleccionar+un+empleado`
      );
    }

    if (!Number.isFinite(service_id) || service_id <= 0) {
      redirect(
        `/reservas/editar/${id}?error=Debes+seleccionar+un+servicio`
      );
    }

    if (!date) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+una+fecha`);
    }

    if (!time) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+una+hora`);
    }

    if (!status) {
      redirect(`/reservas/editar/${id}?error=Debes+seleccionar+un+estado`);
    }

    const { error } = await supabase
      .from("reservas")
      .update({
        client_id,
        employee_id,
        service_id,
        date,
        time,
        status,
        notes: notes || null,
      })
      .eq("id", reservaIdValue);

    if (error) {
      redirect(
        `/reservas/editar/${id}?error=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath("/reservas");
    revalidatePath("/dashboard");
    revalidatePath(`/reservas/editar/${id}`);

    redirect("/reservas");
  }

  const [
    { data: reserva, error: reservaError },
    { data: clientes, error: clientesError },
    { data: empleados, error: empleadosError },
    { data: servicios, error: serviciosError },
  ] = await Promise.all([
    supabase
      .from("reservas")
      .select("id, client_id, employee_id, service_id, date, time, status, notes")
      .eq("id", reservaId)
      .maybeSingle(),

    supabase
      .from("clientes")
      .select("id, name")
      .order("name", { ascending: true }),

    supabase
      .from("empleados")
      .select("id, name")
      .order("name", { ascending: true }),

    supabase
      .from("servicios")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  const errores = [
    reservaError?.message,
    clientesError?.message,
    empleadosError?.message,
    serviciosError?.message,
  ].filter(Boolean);

  if (!reserva && !reservaError) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Editar reserva
              </h2>
              <p className="mt-2 text-zinc-600">
                La reserva solicitada no existe.
              </p>
            </div>

            <Link
              href="/reservas"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver
            </Link>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No se encontró la reserva que intentas editar.
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
              Editar reserva
            </h2>
            <p className="mt-2 text-zinc-600">
              Modifica los datos de la reserva seleccionada.
            </p>
          </div>

          <Link
            href="/reservas"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Volver a reservas
          </Link>
        </div>

        {errores.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Error al cargar la edición de la reserva.</p>
            <div className="mt-2 space-y-1">
              {errores.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form action={updateReserva} className="space-y-6">
            <input type="hidden" name="reserva_id" value={reserva?.id ?? ""} />

            <div>
              <label
                htmlFor="client_id"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Cliente
              </label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={reserva?.client_id ?? ""}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="">Selecciona un cliente</option>
                {(clientes ?? []).map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="employee_id"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Empleado
              </label>
              <select
                id="employee_id"
                name="employee_id"
                defaultValue={reserva?.employee_id ?? ""}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="">Selecciona un empleado</option>
                {(empleados ?? []).map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="service_id"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Servicio
              </label>
              <select
                id="service_id"
                name="service_id"
                defaultValue={reserva?.service_id ?? ""}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="">Selecciona un servicio</option>
                {(servicios ?? []).map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Fecha
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  defaultValue={reserva?.date ?? ""}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Hora
                </label>
                <input
                  id="time"
                  type="time"
                  name="time"
                  defaultValue={reserva?.time ?? ""}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue={reserva?.status ?? "Pendiente"}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                defaultValue={reserva?.notes ?? ""}
                rows={4}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="Añade observaciones si lo necesitas"
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
                href="/reservas"
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