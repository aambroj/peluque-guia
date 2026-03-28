import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerBusinessContext } from "@/lib/supabase-server";

type PlanKey = "basic" | "pro" | "premium";

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

export async function POST(request: NextRequest) {
  try {
    const { user, businessId } = await getServerBusinessContext();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "No se ha podido resolver el negocio del usuario." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = Number(body?.id);

    if (!id) {
      return NextResponse.json(
        { error: "Falta el id del empleado." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const [
      { data: empleado, error: empleadoError },
      { data: subscription, error: subscriptionError },
      { count: activeEmployeesCount, error: activeEmployeesCountError },
    ] = await Promise.all([
      supabaseAdmin
        .from("empleados")
        .select("id, business_id, status, name")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle(),

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

    if (empleadoError) {
      return NextResponse.json(
        { error: empleadoError.message },
        { status: 500 }
      );
    }

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    if (activeEmployeesCountError) {
      return NextResponse.json(
        { error: activeEmployeesCountError.message },
        { status: 500 }
      );
    }

    if (!empleado) {
      return NextResponse.json(
        { error: "El empleado no existe en tu negocio." },
        { status: 404 }
      );
    }

    if (normalizeText(empleado.status ?? "") !== "inactivo") {
      return NextResponse.json(
        { error: "Este empleado ya está activo." },
        { status: 409 }
      );
    }

    const planKey = getPlanKey(subscription?.plan);
    const hasManagedSubscription = isManagedSubscriptionStatus(
      subscription?.status
    );

    const includedEmployeeLimit = getEffectiveEmployeeLimit({
      plan: subscription?.plan,
      status: subscription?.status,
      employeeLimit: subscription?.employee_limit,
    });

    const currentActiveEmployees = activeEmployeesCount ?? 0;
    const nextActiveEmployees = currentActiveEmployees + 1;

    const isPremiumManagedPlan =
      planKey === "premium" && hasManagedSubscription;

    const canScaleWithExtraEmployees =
      isPremiumManagedPlan && !!subscription?.stripe_subscription_id;

    if (
      nextActiveEmployees > includedEmployeeLimit &&
      !canScaleWithExtraEmployees
    ) {
      if (planKey === "premium" && hasManagedSubscription) {
        return NextResponse.json(
          {
            error:
              "Has superado los empleados incluidos en Premium, pero no se ha podido sincronizar el suplemento mensual por empleado extra. Revisa Stripe y vuelve a intentarlo.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${includedEmployeeLimit} empleados activos de tu plan. Mejora tu suscripción para reactivar más empleados.`,
        },
        { status: 409 }
      );
    }

    const { error: reactivateError } = await supabaseAdmin
      .from("empleados")
      .update({
        status: "Disponible",
      })
      .eq("id", id)
      .eq("business_id", businessId);

    if (reactivateError) {
      return NextResponse.json(
        { error: reactivateError.message },
        { status: 500 }
      );
    }

    if (canScaleWithExtraEmployees) {
      const extraEmployees = Math.max(
        nextActiveEmployees - includedEmployeeLimit,
        0
      );

      try {
        await syncPremiumExtraEmployees({
          stripeSubscriptionId: subscription!.stripe_subscription_id!,
          extraEmployees,
        });
      } catch (stripeError) {
        await supabaseAdmin
          .from("empleados")
          .update({
            status: "Inactivo",
          })
          .eq("id", id)
          .eq("business_id", businessId);

        return NextResponse.json(
          {
            error:
              stripeError instanceof Error
                ? stripeError.message
                : "No se pudo sincronizar el suplemento de empleados extra en Stripe.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al reactivar al empleado",
      },
      { status: 500 }
    );
  }
}