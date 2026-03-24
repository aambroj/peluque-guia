import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type PlanKey = "basic" | "pro" | "premium";

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

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toNullableString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) {
      return id;
    }
  }

  return null;
}

function toNullableInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toIsoDateTime(value: unknown): string | null {
  const unixSeconds = toNullableInt(value);

  if (!unixSeconds) {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function mapPriceIdToPlan(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;

  const basicPriceId = process.env.STRIPE_PRICE_BASIC_MONTHLY;
  const proPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const premiumPriceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;

  if (priceId === basicPriceId) return "basic";
  if (priceId === proPriceId) return "pro";
  if (priceId === premiumPriceId) return "premium";

  return null;
}

function getEmployeeLimitForPlan(plan: string | null | undefined): number | null {
  const normalized = normalizeText(plan ?? "");

  if (normalized === "basic") return 2;
  if (normalized === "pro") return 5;
  if (normalized === "premium") return 10;

  return null;
}

function mapStripeStatusToLocal(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  if (!normalized) return null;

  const allowed = [
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "paused",
  ];

  return allowed.includes(normalized) ? normalized : normalized;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacyInvoice = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  if (legacyInvoice.subscription) {
    return toNullableString(legacyInvoice.subscription);
  }

  const parent = invoice.parent;

  if (
    parent &&
    parent.type === "subscription_details" &&
    parent.subscription_details?.subscription
  ) {
    return toNullableString(parent.subscription_details.subscription);
  }

  return null;
}

async function updateSubscriptionRow(params: {
  businessId?: number | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  status?: string | null;
  plan?: string | null;
  employeeLimit?: number | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialEnd?: string | null;
  cancelAt?: string | null;
  cancelAtPeriodEnd?: boolean | null;
}) {
  const supabaseAdmin = getSupabaseAdmin();

  const payload: Record<string, unknown> = {};

  if (params.stripeCustomerId !== undefined) {
    payload.stripe_customer_id = params.stripeCustomerId;
  }

  if (params.stripeSubscriptionId !== undefined) {
    payload.stripe_subscription_id = params.stripeSubscriptionId;
  }

  if (params.stripePriceId !== undefined) {
    payload.stripe_price_id = params.stripePriceId;
  }

  if (params.status !== undefined) {
    payload.status = params.status;
  }

  if (params.plan !== undefined) {
    payload.plan = params.plan;
  }

  if (params.employeeLimit !== undefined) {
    payload.employee_limit = params.employeeLimit;
  }

  if (params.currentPeriodStart !== undefined) {
    payload.current_period_start = params.currentPeriodStart;
  }

  if (params.currentPeriodEnd !== undefined) {
    payload.current_period_end = params.currentPeriodEnd;
  }

  if (params.trialEnd !== undefined) {
    payload.trial_end = params.trialEnd;
  }

  if (params.cancelAt !== undefined) {
    payload.cancel_at = params.cancelAt;
  }

  if (params.cancelAtPeriodEnd !== undefined) {
    payload.cancel_at_period_end = params.cancelAtPeriodEnd;
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  if (params.businessId) {
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update(payload)
      .eq("business_id", params.businessId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if (params.stripeSubscriptionId) {
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update(payload)
      .eq("stripe_subscription_id", params.stripeSubscriptionId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if (params.stripeCustomerId) {
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update(payload)
      .eq("stripe_customer_id", params.stripeCustomerId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") {
    return;
  }

  const businessId = toNullableInt(
    session.metadata?.business_id ?? session.client_reference_id
  );

  await updateSubscriptionRow({
    businessId,
    stripeCustomerId: toNullableString(session.customer),
    stripeSubscriptionId: toNullableString(session.subscription),
    stripePriceId: session.metadata?.target_price_id ?? null,
    plan: session.metadata?.target_plan ?? null,
    employeeLimit: toNullableInt(session.metadata?.employee_limit),
  });
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0];
  const stripePriceId = firstItem?.price?.id ?? null;

  const planFromPrice = mapPriceIdToPlan(stripePriceId);
  const planFromMetadata = subscription.metadata?.target_plan ?? null;
  const plan = planFromPrice ?? planFromMetadata;

  const employeeLimit =
    toNullableInt(subscription.metadata?.employee_limit) ??
    getEmployeeLimitForPlan(plan);

  const localStatus = mapStripeStatusToLocal(subscription.status);
  const businessId = toNullableInt(subscription.metadata?.business_id);

  await updateSubscriptionRow({
    businessId,
    stripeCustomerId: toNullableString(subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId,
    status: localStatus,
    plan,
    employeeLimit,
    currentPeriodStart: toIsoDateTime(firstItem?.current_period_start),
    currentPeriodEnd: toIsoDateTime(firstItem?.current_period_end),
    trialEnd: toIsoDateTime(subscription.trial_end),
    cancelAt: toIsoDateTime(subscription.cancel_at),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0];
  const stripePriceId = firstItem?.price?.id ?? null;

  const planFromPrice = mapPriceIdToPlan(stripePriceId);
  const planFromMetadata = subscription.metadata?.target_plan ?? null;
  const plan = planFromPrice ?? planFromMetadata;

  const employeeLimit =
    toNullableInt(subscription.metadata?.employee_limit) ??
    getEmployeeLimitForPlan(plan);

  const businessId = toNullableInt(subscription.metadata?.business_id);

  await updateSubscriptionRow({
    businessId,
    stripeCustomerId: toNullableString(subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId,
    status: "canceled",
    plan,
    employeeLimit,
    currentPeriodStart: toIsoDateTime(firstItem?.current_period_start),
    currentPeriodEnd: toIsoDateTime(firstItem?.current_period_end),
    trialEnd: toIsoDateTime(subscription.trial_end),
    cancelAt: toIsoDateTime(subscription.cancel_at),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

async function syncInvoiceSubscription(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await handleSubscriptionUpsert(subscription);
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const webhookSecret = getRequiredEnv("STRIPE_WEBHOOK_SECRET");
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Falta la firma de Stripe." },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `Firma de webhook inválida: ${error.message}`
              : "Firma de webhook inválida.",
        },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_failed":
      case "invoice.payment_succeeded":
        await syncInvoiceSubscription(event.data.object as Stripe.Invoice);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error procesando el webhook de Stripe.",
      },
      { status: 500 }
    );
  }
}