import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerBusinessContext } from "@/lib/supabase-server";

type EditarEmpleadoPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

function detectBookingField(row: Record<string, any> | null | undefined) {
  if (!row) return null;

  const preferredKeys = [
    "allow_online_booking",
    "is_bookable_online",
    "allow_public_booking",
    "public_booking_enabled",
    "online_booking_enabled",
  ];

  for (const key of preferredKeys) {
    if (key in row) return key;
  }

  const fallbackKey = Object.keys(row).find((key) =>
    /(online|public).*(booking|reserve)|booking.*(online|public)|reserv/i.test(
      key
    )
  );

  return fallbackKey ?? null;
}

export default async function EditarEmpleadoPage({
  params,
  searchParams,
}: EditarEmpleadoPageProps) {
  const { user, businessId } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/empleados");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { id } = await params;
  const search = (await searchParams) ?? {};
  const errorMessage = search.error ?? "";

  const empleadoId = Number(id);

  if (!Number.isFinite(empleadoId)) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Empleado inválido.
          </div>
        </div>
      </section>
    );
  }

  const { data: empleado, error } = await supabaseAdmin
    .from("empleados")
    .select("*")
    .eq("id", empleadoId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        </div>
      </section>
    );
  }

  if (!empleado) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No se encontró el empleado.
          </div>
        </div>
      </section>
    );
  }

  const bookingFieldName = detectBookingField(empleado);
  const onlineBookingValue = bookingFieldName
    ? Boolean(empleado[bookingFieldName])
    : false;

  async function updateEmpleado(formData: FormData) {
    "use server";

    const { user, businessId } = await getServerBusinessContext();

    if (!user) {
      redirect("/login?redirectTo=/empleados");
    }

    if (!businessId) {
      redirect("/registro");
    }

    const supabaseAdmin = getSupabaseAdmin();

    const empleadoIdValue = Number(formData.get("empleado_id"));
    const name = String(formData.get("name") ?? "").trim();
    const role = String(formData.get("role") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!Number.isFinite(empleadoIdValue)) {
      redirect(`/empleados/editar/${id}?error=Empleado+inv%C3%A1lido`);
    }

    if (!name) {
      redirect(`/empleados/editar/${id}?error=El+nombre+es+obligatorio`);
    }

    if (!status) {
      redirect(`/empleados/editar/${id}?error=El+estado+es+obligatorio`);
    }

    const { data: empleadoActual, error: empleadoActualError } =
      await supabaseAdmin
        .from("empleados")
        .select("id, business_id")
        .eq("id", empleadoIdValue)
        .eq("business_id", businessId)
        .maybeSingle();

    if (empleadoActualError) {
      redirect(
        `/empleados/editar/${id}?error=${encodeURIComponent(
          empleadoActualError.message
        )}`
      );
    }

    if (!empleadoActual) {
      redirect(
        `/empleados/editar/${id}?error=El+empleado+no+existe+en+tu+negocio`
      );
    }

    const payload: Record<string, any> = {
      name,
      role: role || null,
      phone: phone || null,
      status,
    };

    if (bookingFieldName) {
      payload[bookingFieldName] =
        status === "Inactivo"
          ? false
          : formData.get("online_booking") === "on";
    }

    const { error: updateError } = await supabaseAdmin
      .from("empleados")
      .update(payload)
      .eq("id", empleadoIdValue)
      .eq("business_id", businessId);

    if (updateError) {
      redirect(
        `/empleados/editar/${id}?error=${encodeURIComponent(updateError.message)}`
      );
    }

    revalidatePath("/empleados");
    revalidatePath("/dashboard");
    revalidatePath("/reservas");
    revalidatePath("/reservar");
    revalidatePath(`/reservar/${id}`);
    revalidatePath(`/empleados/editar/${id}`);
    revalidatePath(`/empleados/editar/${id}/horario`);
    revalidatePath(`/empleados/editar/${id}/bloqueos`);

    redirect("/empleados");
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Editar empleado
              </h2>
              <p className="mt-2 text-zinc-600">
                Modifica los datos generales y la disponibilidad de este
                empleado.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/empleados"
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Volver a empleados
              </Link>

              <Link
                href={`/empleados/editar/${id}/horario`}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Horario
              </Link>

              <Link
                href={`/empleados/editar/${id}/bloqueos`}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Bloqueos / vacaciones
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href={`/empleados/editar/${id}/horario`}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-zinc-900">
              Horario semanal
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Edita qué días trabaja y su hora de inicio y fin.
            </p>
          </Link>

          <Link
            href={`/empleados/editar/${id}/bloqueos`}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-zinc-900">Bloqueos</p>
            <p className="mt-2 text-sm text-zinc-500">
              Marca descansos, ocupaciones o ausencias por horas o días.
            </p>
          </Link>

          <Link
            href={`/reservar/${id}`}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-zinc-900">
              Reserva pública
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Ver la página pública de reserva de este empleado.
            </p>
          </Link>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form action={updateEmpleado} className="space-y-6">
            <input type="hidden" name="empleado_id" value={empleado.id} />

            <div className="grid gap-6 md:grid-cols-2">
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
                  defaultValue={empleado.name ?? ""}
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                  placeholder="Nombre del empleado"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Rol
                </label>
                <input
                  id="role"
                  name="role"
                  type="text"
                  defaultValue={empleado.role ?? ""}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                  placeholder="Ej. Estilista"
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
                  defaultValue={empleado.phone ?? ""}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                  placeholder="Teléfono de contacto"
                />
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
                  defaultValue={empleado.status ?? "Disponible"}
                  required
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Ocupado">Ocupado</option>
                  <option value="Descanso">Descanso</option>
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {bookingFieldName ? (
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="online_booking"
                  defaultChecked={onlineBookingValue}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Permitir reserva online para este empleado
              </label>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Guardar cambios
              </button>

              <Link
                href="/empleados"
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