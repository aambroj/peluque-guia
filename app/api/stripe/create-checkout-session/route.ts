import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerBusinessContext } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type CreateCheckoutSessionBody = {
  plan?: string;
};

type PlanKey = "basic" | "pro" | "premium";

type PlanConfig = {
  priceEnvName: string;
  employeeLimit: number;
  trialDays?: number;
};

const PLAN_CONFIG: Record<PlanKey, PlanConfig> = {
  basic: {
    priceEnvName: "STRIPE_PRICE_BASIC_MONTHLY",
    employeeLimit: 2,
    trialDays: 30,
  },
  pro: {
    priceEnvName: "STRIPE_PRICE_PRO_MONTHLY",
    employeeLimit: 5,
  },
  premium: {
    priceEnvName: "STRIPE_PRICE_PREMIUM_MONTHLY",
    employeeLimit: 10,
  },
};

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

function getAppUrl() {
  return getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
}

function getTargetPlan(plan: string | null | undefined): PlanKey | null {
  const normalized = normalizeText(plan ?? "");

  if (normalized === "basic" || normalized === "basico") return "basic";
  if (normalized === "pro") return "pro";
  if (normalized === "premium") return "premium";

  return null;
}

function getPlanDetails(plan: PlanKey) {
  const config = PLAN_CONFIG[plan];

  return {
    ...config,
    priceId: getRequiredEnv(config.priceEnvName),
  };
}

function isManagedSubscriptionStatus(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  return [
    "active",
    "trialing",
    "past_due",
    "paused",
    "unpaid",
    "incomplete",
  ].includes(normalized);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCheckoutSessionBody;
    const targetPlan = getTargetPlan(body.plan);

    if (!targetPlan) {
      return NextResponse.json(
        { error: "Debes indicar un plan válido." },
        { status: 400 }
      );
    }

    const { user, businessId } = await getServerBusinessContext();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "No se ha encontrado el negocio actual." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const stripe = getStripeClient();

    const [
      { data: business, error: businessError },
      { data: subscription, error: subscriptionError },
    ] = await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("id, name, email, slug")
        .eq("id", businessId)
        .maybeSingle(),

      supabaseAdmin
        .from("subscriptions")
        .select(
          "business_id, plan, status, stripe_customer_id, stripe_subscription_id, stripe_price_id"
        )
        .eq("business_id", businessId)
        .maybeSingle(),
    ]);

    if (businessError) {
      return NextResponse.json(
        { error: businessError.message },
        { status: 500 }
      );
    }

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "No se ha encontrado el negocio." },
        { status: 404 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "No se ha encontrado la suscripción local del negocio." },
        { status: 404 }
      );
    }

    if (
      subscription.stripe_subscription_id &&
      isManagedSubscriptionStatus(subscription.status)
    ) {
      return NextResponse.json(
        {
          error:
            "Este negocio ya tiene una suscripción activa o gestionable. Usa Facturación para administrarla.",
        },
        { status: 409 }
      );
    }

    const { priceId, employeeLimit, trialDays } = getPlanDetails(targetPlan);

    let stripeCustomerId = subscription.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: business.email || user.email || undefined,
        name: business.name || user.email || `Negocio ${businessId}`,
        metadata: {
          business_id: String(businessId),
          user_id: user.id,
          slug: business.slug ?? "",
        },
      });

      stripeCustomerId = customer.id;

      const { error: updateCustomerError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          stripe_customer_id: stripeCustomerId,
        })
        .eq("business_id", businessId);

      if (updateCustomerError) {
        return NextResponse.json(
          { error: updateCustomerError.message },
          { status: 500 }
        );
      }
    }

    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: String(businessId),
      success_url: `${appUrl}/cuenta?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cuenta/planes?checkout=canceled`,
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        business_id: String(businessId),
        user_id: user.id,
        target_plan: targetPlan,
        target_price_id: priceId,
        employee_limit: String(employeeLimit),
        trial_days: String(trialDays ?? 0),
      },
      subscription_data: {
        metadata: {
          business_id: String(businessId),
          user_id: user.id,
          target_plan: targetPlan,
          target_price_id: priceId,
          employee_limit: String(employeeLimit),
          trial_days: String(trialDays ?? 0),
        },
        ...(trialDays ? { trial_period_days: trialDays } : {}),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe no devolvió la URL de Checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la sesión de Checkout.",
      },
      { status: 500 }
    );
  }
}