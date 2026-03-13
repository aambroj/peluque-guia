import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type BloqueosPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    ok?: string;
    error?: string;
  }>;
};

type TimeOffRow = {
  id: string;
  employee_id: number;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  is_full_day: boolean;
};

function normalizeTimeForInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 5);
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export default async function EmpleadoBloqueosPage({
  params,
  searchParams,
}: BloqueosPageProps) {
  const supabaseAdmin = getSupabaseAdmin();

  const { id } = await params;
  const query = (await searchParams) ?? {};
  const empleadoId = Number(id);

  if (!Number.isFinite(empleadoId)) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Empleado inválido.
        </div>
      </section>
    );
  }

  async function createBlock(formData: FormData) {
    "use server";

    const supabaseAdmin = getSupabaseAdmin();

    const employeeIdValue = Number(formData.get("employee_id"));
    const reason = String(formData.get("reason") ?? "").trim();
    const startDate = String(formData.get("start_date") ?? "").trim();
    const endDate = String(formData.get("end_date") ?? "").trim();
    const startTime = String(formData.get("start_time") ?? "").trim();
    const endTime = String(formData.get("end_time") ?? "").trim();
    const isFullDay = formData.get("is_full_day") === "on";

    if (!Number.isFinite(employeeIdValue)) {
      redirect(`/empleados/editar/${id}/bloqueos?error=Empleado+inv%C3%A1lido`);
    }

    if (!reason) {
      redirect(`/empleados/editar/${id}/bloqueos?error=Debes+elegir+un+tipo`);
    }

    if (!startDate) {
      redirect(
        `/empleados/editar/${id}/bloqueos?error=Debes+elegir+fecha+inicio`
      );
    }

    if (!endDate) {
      redirect(`/empleados/editar/${id}/bloqueos?error=Debes+elegir+fecha+fin`);
    }

    if (endDate < startDate) {
      redirect(
        `/empleados/editar/${id}/bloqueos?error=La+fecha+fin+no+puede+ser+anterior+a+la+de+inicio`
      );
    }

    if (!isFullDay) {
      if (!startTime || !endTime) {
        redirect(
          `/empleados/editar/${id}/bloqueos?error=Debes+indicar+hora+inicio+y+hora+fin`
        );
      }

      if (endTime <= startTime) {
        redirect(
          `/empleados/editar/${id}/bloqueos?error=La+hora+fin+debe+ser+posterior+a+la+hora+inicio`
        );
      }
    }

    const { error } = await supabaseAdmin.from("employee_time_off").insert({
      employee_id: employeeIdValue,
      date: startDate,
      end_date: endDate,
      start_time: isFullDay ? null : startTime,
      end_time: isFullDay ? null : endTime,
      reason,
      is_full_day: isFullDay,
    });

    if (error) {
      redirect(
        `/empleados/editar/${id}/bloqueos?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    revalidatePath(`/empleados/editar/${id}/bloqueos`);
    revalidatePath(`/empleados/editar/${id}`);
    revalidatePath("/reservar");
    revalidatePath(`/reservar/${id}`);

    redirect(`/empleados/editar/${id}/bloqueos?ok=1`);
  }

  async function deleteBlock(formData: FormData) {
    "use server";

    const supabaseAdmin = getSupabaseAdmin();

    const blockId = String(formData.get("block_id") ?? "").trim();

    if (!blockId) {
      redirect(`/empleados/editar/${id}/bloqueos?error=Bloqueo+inv%C3%A1lido`);
    }

    const { error } = await supabaseAdmin
      .from("employee_time_off")
      .delete()
      .eq("id", blockId);

    if (error) {
      redirect(
        `/empleados/editar/${id}/bloqueos?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    revalidatePath(`/empleados/editar/${id}/bloqueos`);
    revalidatePath("/reservar");
    revalidatePath(`/reservar/${id}`);

    redirect(`/empleados/editar/${id}/bloqueos?ok=1`);
  }

  const [
    { data: empleado, error: empleadoError },
    { data: bloqueos, error: bloqueosError },
  ] = await Promise.all([
    supabaseAdmin
      .from("empleados")
      .select("id, name")
      .eq("id", empleadoId)
      .maybeSingle(),
    supabaseAdmin
      .from("employee_time_off")
      .select(
        "id, employee_id, date, end_date, start_time, end_time, reason, is_full_day"
      )
      .eq("employee_id", empleadoId)
      .order("date", { ascending: true }),
  ]);

  if (empleadoError || !empleado) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {empleadoError?.message || "No se encontró el empleado."}
        </div>
      </section>
    );
  }

  if (bloqueosError) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {bloqueosError.message}
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/empleados/editar/${id}`}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Volver al empleado
          </Link>

          <Link
            href={`/empleados/editar/${id}/horario`}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Ver horario
          </Link>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Bloqueos de {empleado.name}
          </h1>
          <p className="mt-2 text-zinc-600">
            Aquí puedes marcar descansos, ocupaciones o vacaciones por rango de
            días y horas.
          </p>
        </div>

        {query.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {query.error}
          </div>
        ) : null}

        {query.ok ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Cambios guardados correctamente.
          </div>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Añadir bloqueo</h2>

          <form action={createBlock} className="mt-6 space-y-6">
            <input type="hidden" name="employee_id" value={empleado.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Tipo
                </label>
                <select
                  name="reason"
                  defaultValue="Descanso"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="Descanso">Descanso</option>
                  <option value="Ocupado">Ocupado</option>
                  <option value="Vacaciones">Vacaciones</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    name="is_full_day"
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  Día completo
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Desde día
                </label>
                <input
                  type="date"
                  name="start_date"
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Hasta día
                </label>
                <input
                  type="date"
                  name="end_date"
                  required
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Hora inicio
                </label>
                <input
                  type="time"
                  name="start_time"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Hora fin
                </label>
                <input
                  type="time"
                  name="end_time"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Guardar bloqueo
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">
            Bloqueos existentes
          </h2>

          <div className="mt-6 space-y-4">
            {((bloqueos ?? []) as TimeOffRow[]).length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500">
                No hay bloqueos registrados.
              </div>
            ) : (
              ((bloqueos ?? []) as TimeOffRow[]).map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1 text-sm text-zinc-700">
                    <p className="font-semibold text-zinc-900">
                      {row.reason || "Bloqueo"}
                    </p>
                    <p>
                      Desde: {formatDate(row.date)} · Hasta:{" "}
                      {formatDate(row.end_date || row.date)}
                    </p>
                    <p>
                      {row.is_full_day
                        ? "Día completo"
                        : `Horario: ${normalizeTimeForInput(
                            row.start_time
                          )} - ${normalizeTimeForInput(row.end_time)}`}
                    </p>
                  </div>

                  <form action={deleteBlock}>
                    <input type="hidden" name="block_id" value={row.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}