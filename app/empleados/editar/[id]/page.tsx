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

type PlanKey = "basic" | "pro" | "premium";

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isInactiveStatus(status: string | null | undefined) {
  return normalizeText(status ?? "") === "inactivo";
}

function getPlanKey(plan: string | null | undefined): PlanKey | null {
  const normalized = normalizeText(plan ?? "");

  if (normalized === "basic") return "basic";
  if (normalized === "pro") return "pro";
  if (normalized === "premium") return "premium";

  return null;
}

function formatPlanLabel(plan: string | null | undefined) {
  const planKey = getPlanKey(plan);

  if (planKey === "basic") return "Basic";
  if (planKey === "pro") return "Pro";
  if (planKey === "premium") return "Premium";

  return "Basic";
}

function getDefaultEmployeeLimit(plan: string | null | undefined) {
  const planKey = getPlanKey(plan);

  if (planKey === "basic") return 2;
  if (planKey === "pro") return 5;
  if (planKey === "premium") return 10;

  return 2;
}

function isManagedSubscriptionStatus(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  return ["active", "trialing", "past_due", "paused", "unpaid"].includes(
    normalized
  );
}

function getEffectiveEmployeeLimit(params: {
  plan: string | null | undefined;
  status: string | null | undefined;
  employeeLimit: number | null | undefined;
}) {
  if (
    isManagedSubscriptionStatus(params.status) &&
    typeof params.employeeLimit === "number" &&
    Number.isFinite(params.employeeLimit) &&
    params.employeeLimit > 0
  ) {
    return params.employeeLimit;
  }

  return getDefaultEmployeeLimit(params.plan);
}

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
  const { user, businessId, supabase } = await getServerBusinessContext();

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

  const [
    { data: empleado, error },
    { data: subscription },
    { count: activeEmployeesCount },
  ] = await Promise.all([
    supabaseAdmin
      .from("empleados")
      .select("*")
      .eq("id", empleadoId)
      .eq("business_id", businessId)
      .maybeSingle(),

    supabase
      .from("subscriptions")
      .select("plan, status, employee_limit")
      .eq("business_id", businessId)
      .maybeSingle(),

    supabase
      .from("empleados")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .neq("status", "Inactivo"),
  ]);

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

  const currentPlanLabel = formatPlanLabel(subscription?.plan);
  const employeeLimit = getEffectiveEmployeeLimit({
    plan: subscription?.plan,
    status: subscription?.status,
    employeeLimit: subscription?.employee_limit,
  });
  const currentActiveEmployees = activeEmployeesCount ?? 0;
  const isCurrentlyInactive = isInactiveStatus(empleado.status);
  const reactivationBlocked =
    isCurrentlyInactive && currentActiveEmployees >= employeeLimit;

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

    const [
      { data: empleadoActual, error: empleadoActualError },
      { data: subscription },
      { count: activeEmployeesCount, error: activeEmployeesCountError },
    ] = await Promise.all([
      supabaseAdmin
        .from("empleados")
        .select("id, business_id, status")
        .eq("id", empleadoIdValue)
        .eq("business_id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("subscriptions")
        .select("plan, status, employee_limit")
        .eq("business_id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("empleados")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .neq("status", "Inactivo"),
    ]);

    if (empleadoActualError) {
      redirect(
        `/empleados/editar/${id}?error=${encodeURIComponent(
          empleadoActualError.message
        )}`
      );
    }

    if (activeEmployeesCountError) {
      redirect(
        `/empleados/editar/${id}?error=${encodeURIComponent(
          activeEmployeesCountError.message
        )}`
      );
    }

    if (!empleadoActual) {
      redirect(
        `/empleados/editar/${id}?error=El+empleado+no+existe+en+tu+negocio`
      );
    }

    const employeeLimit = getEffectiveEmployeeLimit({
      plan: subscription?.plan,
      status: subscription?.status,
      employeeLimit: subscription?.employee_limit,
    });

    const currentActiveEmployees = activeEmployeesCount ?? 0;
    const wasInactive = isInactiveStatus(empleadoActual.status);
    const willBeInactive = isInactiveStatus(status);
    const isReactivating = wasInactive && !willBeInactive;

    if (isReactivating && currentActiveEmployees >= employeeLimit) {
      redirect(
        `/empleados/editar/${id}?error=${encodeURIComponent(
          `Has alcanzado el límite de ${employeeLimit} empleados activos de tu plan. Mejora tu suscripción en Cuenta > Planes para reactivar este empleado.`
        )}`
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
        willBeInactive ? false : formData.get("online_booking") === "on";
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
    revalidatePath("/cuenta");
    revalidatePath("/cuenta/planes");
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

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          <p className="font-medium">
            Plan actual: {currentPlanLabel} · Máximo {employeeLimit} empleados
            activos
          </p>
          <p className="mt-1">
            Ahora mismo tienes {currentActiveEmployees} empleados activos.
          </p>
        </div>

        {isCurrentlyInactive ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Este empleado está actualmente inactivo.
            {reactivationBlocked ? (
              <>
                {" "}
                Has alcanzado el límite de tu plan, así que solo podrás guardar
                cambios manteniéndolo como <strong>Inactivo</strong> o mejorar
                tu suscripción en{" "}
                <Link href="/cuenta/planes" className="font-medium underline">
                  Cuenta &gt; Planes
                </Link>
                .
              </>
            ) : (
              <>
                {" "}
                Puedes reactivarlo cambiando su estado a Disponible, Ocupado,
                Descanso o Vacaciones.
              </>
            )}
          </div>
        ) : null}

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

              {reactivationBlocked ? (
                <Link
                  href="/cuenta/planes"
                  className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                >
                  Ver planes
                </Link>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}