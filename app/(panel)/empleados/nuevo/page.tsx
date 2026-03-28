import Stripe from "stripe";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerBusinessContext } from "@/lib/supabase-server";

type NuevoEmpleadoPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

type PlanKey = "basic" | "pro" | "premium";

const BOOKING_FIELD_NAME = "public_booking_enabled";

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function getStripeClient() {
  return new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
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

async function syncPremiumExtraEmployees(params: {
  stripeSubscriptionId: string;
  extraEmployees: number;
}) {
  const stripe = getStripeClient();
  const extraEmployeePriceId = getRequiredEnv(
    "STRIPE_PRICE_EXTRA_EMPLOYEE_MONTHLY"
  );

  const stripeSubscription = await stripe.subscriptions.retrieve(
    params.stripeSubscriptionId
  );

  const extraItem =
    stripeSubscription.items.data.find(
      (item) => item.price?.id === extraEmployeePriceId
    ) ?? null;

  if (params.extraEmployees <= 0) {
    if (extraItem) {
      await stripe.subscriptionItems.del(extraItem.id);
    }
    return;
  }

  if (extraItem) {
    await stripe.subscriptionItems.update(extraItem.id, {
      quantity: params.extraEmployees,
      proration_behavior: "create_prorations",
    });
    return;
  }

  await stripe.subscriptionItems.create({
    subscription: params.stripeSubscriptionId,
    price: extraEmployeePriceId,
    quantity: params.extraEmployees,
    proration_behavior: "create_prorations",
  });
}

export default async function NuevoEmpleadoPage({
  searchParams,
}: NuevoEmpleadoPageProps) {
  const params = (await searchParams) ?? {};
  const errorMessage = params.error ?? "";

  const { user, businessId, supabase } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/empleados/nuevo");
  }

  if (!businessId) {
    redirect("/registro");
  }

  const [{ data: subscription }, { count: activeEmployeesCount }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, status, employee_limit, stripe_subscription_id")
        .eq("business_id", businessId)
        .maybeSingle(),

      supabase
        .from("empleados")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .neq("status", "Inactivo"),
    ]);

  const currentPlanLabel = formatPlanLabel(subscription?.plan);
  const planKey = getPlanKey(subscription?.plan);
  const hasManagedSubscription = isManagedSubscriptionStatus(
    subscription?.status
  );
  const employeeLimit = getEffectiveEmployeeLimit({
    plan: subscription?.plan,
    status: subscription?.status,
    employeeLimit: subscription?.employee_limit,
  });
  const currentActiveEmployees = activeEmployeesCount ?? 0;
  const remainingSlots = Math.max(employeeLimit - currentActiveEmployees, 0);
  const currentExtraEmployees = Math.max(
    currentActiveEmployees - employeeLimit,
    0
  );
  const nextExtraEmployees = Math.max(
    currentActiveEmployees + 1 - employeeLimit,
    0
  );

  const canScaleWithExtraEmployees =
    planKey === "premium" &&
    hasManagedSubscription &&
    !!subscription?.stripe_subscription_id;

  const isBlockedByPlan =
    currentActiveEmployees >= employeeLimit && !canScaleWithExtraEmployees;

  async function createEmpleado(formData: FormData) {
    "use server";

    const { user, businessId } = await getServerBusinessContext();
    const supabaseAdmin = getSupabaseAdmin();

    if (!user) {
      redirect("/login?redirectTo=/empleados/nuevo");
    }

    if (!businessId) {
      redirect("/registro");
    }

    const name = String(formData.get("name") ?? "").trim();
    const role = String(formData.get("role") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();

    if (!name) {
      redirect("/empleados/nuevo?error=El+nombre+es+obligatorio");
    }

    if (!status) {
      redirect("/empleados/nuevo?error=El+estado+es+obligatorio");
    }

    const [
      { data: subscription },
      { count: activeEmployeesCount, error: activeEmployeesCountError },
    ] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("plan, status, employee_limit, stripe_subscription_id")
        .eq("business_id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("empleados")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .neq("status", "Inactivo"),
    ]);

    if (activeEmployeesCountError) {
      redirect(
        `/empleados/nuevo?error=${encodeURIComponent(
          activeEmployeesCountError.message
        )}`
      );
    }

    const planKey = getPlanKey(subscription?.plan);
    const hasManagedSubscription = isManagedSubscriptionStatus(
      subscription?.status
    );

    const employeeLimit = getEffectiveEmployeeLimit({
      plan: subscription?.plan,
      status: subscription?.status,
      employeeLimit: subscription?.employee_limit,
    });

    const currentActiveEmployees = activeEmployeesCount ?? 0;
    const nextActiveEmployees = currentActiveEmployees + 1;

    const canScaleWithExtraEmployees =
      planKey === "premium" &&
      hasManagedSubscription &&
      !!subscription?.stripe_subscription_id;

    if (nextActiveEmployees > employeeLimit && !canScaleWithExtraEmployees) {
      redirect(
        `/empleados/nuevo?error=${encodeURIComponent(
          `Has alcanzado el límite de ${employeeLimit} empleados activos de tu plan. Mejora tu suscripción en Cuenta > Planes para añadir más empleados.`
        )}`
      );
    }

    const payload: Record<string, any> = {
      business_id: businessId,
      name,
      role: role || null,
      phone: phone || null,
      status,
      [BOOKING_FIELD_NAME]: formData.get("online_booking") === "on",
    };

    const { data: nuevoEmpleado, error } = await supabaseAdmin
      .from("empleados")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      redirect(`/empleados/nuevo?error=${encodeURIComponent(error.message)}`);
    }

    if (canScaleWithExtraEmployees) {
      const extraEmployees = Math.max(nextActiveEmployees - employeeLimit, 0);

      try {
        await syncPremiumExtraEmployees({
          stripeSubscriptionId: subscription!.stripe_subscription_id!,
          extraEmployees,
        });
      } catch (stripeError) {
        await supabaseAdmin
          .from("empleados")
          .delete()
          .eq("id", nuevoEmpleado.id)
          .eq("business_id", businessId);

        redirect(
          `/empleados/nuevo?error=${encodeURIComponent(
            stripeError instanceof Error
              ? stripeError.message
              : "No se pudo sincronizar el suplemento de empleados extra en Stripe."
          )}`
        );
      }
    }

    revalidatePath("/empleados");
    revalidatePath("/dashboard");
    revalidatePath("/reservas");
    revalidatePath("/reservar");
    revalidatePath("/cuenta");
    revalidatePath("/cuenta/planes");
    revalidatePath("/cuenta/facturacion");

    redirect(`/empleados/editar/${nuevoEmpleado.id}/horario`);
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Nuevo empleado
              </h2>
              <p className="mt-2 text-zinc-600">
                Añade un empleado nuevo al sistema.
              </p>
            </div>

            <Link
              href="/empleados"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver a empleados
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Plan actual</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
              {currentPlanLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Empleados activos</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
              {currentActiveEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Incluidos en el plan</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
              {employeeLimit}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          <p className="font-medium">
            Plan actual: {currentPlanLabel} · Máximo {employeeLimit} empleados
            incluidos
          </p>
          <p className="mt-1">
            Ahora mismo tienes {currentActiveEmployees} activos y te quedan{" "}
            {remainingSlots} plaza{remainingSlots === 1 ? "" : "s"} dentro de la
            capacidad incluida.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          El empleado puede crearse sin horario, pero no podrá recibir reservas
          hasta tener al menos un horario válido configurado. Al guardarlo te
          llevaremos directamente a su pantalla de horario.
        </div>

        {canScaleWithExtraEmployees ? (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
            <p className="font-medium">
              Premium permite crecer por encima de la capacidad incluida
            </p>
            <p className="mt-1">
              Tu plan incluye {employeeLimit} empleados activos. A partir del
              empleado 11 se aplicará un suplemento mensual por empleado extra.
            </p>
            <p className="mt-1">
              Ahora mismo tienes {currentExtraEmployees} empleado
              {currentExtraEmployees === 1 ? "" : "s"} extra y, si guardas este
              nuevo empleado, pasarías a {nextExtraEmployees}.
            </p>
          </div>
        ) : null}

        {isBlockedByPlan ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Has alcanzado el límite de empleados de tu plan. Para añadir más,
            mejora tu suscripción en{" "}
            <Link href="/cuenta/planes" className="font-medium underline">
              Cuenta &gt; Planes
            </Link>
            .
          </div>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form action={createEmpleado} className="space-y-6">
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
                  defaultValue="Disponible"
                  required
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Ocupado">Ocupado</option>
                  <option value="Descanso">Descanso</option>
                  <option value="Vacaciones">Vacaciones</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="online_booking"
                defaultChecked
                className="h-4 w-4 rounded border-zinc-300"
              />
              Permitir reserva online para este empleado
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isBlockedByPlan}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar y configurar horario
              </button>

              <Link
                href="/empleados"
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Cancelar
              </Link>

              {isBlockedByPlan ? (
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