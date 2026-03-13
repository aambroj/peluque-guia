import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

type HorarioPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    ok?: string;
    error?: string;
  }>;
};

const DAYS = [
  { dbWeekday: 1, label: "Lunes" },
  { dbWeekday: 2, label: "Martes" },
  { dbWeekday: 3, label: "Miércoles" },
  { dbWeekday: 4, label: "Jueves" },
  { dbWeekday: 5, label: "Viernes" },
  { dbWeekday: 6, label: "Sábado" },
  { dbWeekday: 0, label: "Domingo" },
];

type ScheduleRow = {
  id: string;
  employee_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
};

function normalizeTimeForInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 5);
}

export default async function EmpleadoHorarioPage({
  params,
  searchParams,
}: HorarioPageProps) {
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

  async function saveSchedule(formData: FormData) {
    "use server";

    const employeeIdValue = Number(formData.get("employee_id"));

    if (!Number.isFinite(employeeIdValue)) {
      redirect(`/empleados/editar/${id}/horario?error=Empleado+inv%C3%A1lido`);
    }

    const rows = DAYS.map((day) => {
      const isWorking = formData.get(`is_working_${day.dbWeekday}`) === "on";
      const startTime = String(
        formData.get(`start_time_${day.dbWeekday}`) ?? ""
      ).trim();
      const endTime = String(
        formData.get(`end_time_${day.dbWeekday}`) ?? ""
      ).trim();

      if (isWorking && (!startTime || !endTime)) {
        throw new Error(`Debes indicar horario para ${day.label}.`);
      }

      return {
        employee_id: employeeIdValue,
        weekday: day.dbWeekday,
        start_time: isWorking ? startTime : "00:00",
        end_time: isWorking ? endTime : "00:00",
        is_working: isWorking,
      };
    });

    await supabase
      .from("employee_schedules")
      .delete()
      .eq("employee_id", employeeIdValue);

    const { error } = await supabase.from("employee_schedules").insert(rows);

    if (error) {
      redirect(
        `/empleados/editar/${id}/horario?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    revalidatePath(`/empleados/editar/${id}/horario`);
    revalidatePath(`/empleados/editar/${id}`);
    revalidatePath("/reservar");
    revalidatePath(`/reservar/${id}`);

    redirect(`/empleados/editar/${id}/horario?ok=1`);
  }

  const [
    { data: empleado, error: empleadoError },
    { data: horarios, error: horariosError },
  ] = await Promise.all([
    supabase.from("empleados").select("id, name").eq("id", empleadoId).maybeSingle(),
    supabase
      .from("employee_schedules")
      .select("id, employee_id, weekday, start_time, end_time, is_working")
      .eq("employee_id", empleadoId),
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

  if (horariosError) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {horariosError.message}
        </div>
      </section>
    );
  }

  const map = new Map<number, ScheduleRow>();
  for (const row of ((horarios ?? []) as ScheduleRow[])) {
    map.set(row.weekday, row);
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
            href={`/empleados/editar/${id}/bloqueos`}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Ver bloqueos
          </Link>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Horario de {empleado.name}
          </h1>
          <p className="mt-2 text-zinc-600">
            Define qué días trabaja y su hora de inicio y fin.
          </p>
        </div>

        {query.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {query.error}
          </div>
        ) : null}

        {query.ok ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Horario guardado correctamente.
          </div>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form action={saveSchedule} className="space-y-6">
            <input type="hidden" name="employee_id" value={empleado.id} />

            <div className="space-y-4">
              {DAYS.map((day) => {
                const row = map.get(day.dbWeekday);

                return (
                  <div
                    key={day.dbWeekday}
                    className="grid gap-4 rounded-2xl border border-zinc-200 p-4 md:grid-cols-[180px_140px_140px_1fr]"
                  >
                    <div className="flex items-center">
                      <p className="font-semibold text-zinc-900">{day.label}</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Inicio
                      </label>
                      <input
                        type="time"
                        name={`start_time_${day.dbWeekday}`}
                        defaultValue={normalizeTimeForInput(row?.start_time) || "09:00"}
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Fin
                      </label>
                      <input
                        type="time"
                        name={`end_time_${day.dbWeekday}`}
                        defaultValue={normalizeTimeForInput(row?.end_time) || "18:00"}
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                      />
                    </div>

                    <div className="flex items-center pt-7">
                      <label className="flex items-center gap-3 text-sm text-zinc-700">
                        <input
                          type="checkbox"
                          name={`is_working_${day.dbWeekday}`}
                          defaultChecked={row ? row.is_working : day.dbWeekday !== 0}
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        Trabaja este día
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Guardar horario
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}