import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

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

function mapPriceIdToPlan(priceId: string | null | undefined) {
  if (!priceId) return null;

  const proPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const premiumPriceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;

  if (priceId === proPriceId) return "pro";
  if (priceId === premiumPriceId) return "premium";

  return null;
}

function mapStripeStatusToLocal(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  if (!normalized) return null;
  if (normalized === "active") return "active";
  if (normalized === "trialing") return "trialing";
  if (normalized === "past_due") return "past_due";
  if (normalized === "paused") return "paused";
  if (normalized === "canceled") return "canceled";
  if (normalized === "unpaid") return "past_due";
  if (normalized === "incomplete") return "inactive";
  if (normalized === "incomplete_expired") return "inactive";

  return normalized;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
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
}) {
  const supabaseAdmin = getSupabaseAdmin();

  const payload: Record<string, string | null> = {};

  if (params.stripeCustomerId !== undefined) {
    payload.stripe_customer_id = params.stripeCustomerId;
  }

  if (params.stripeSubscriptionId !== undefined) {
    payload.stripe_subscription_id = params.stripeSubscriptionId;
  }

  if (params.stripePriceId !== undefined) {
    payload.stripe_price_id = params.stripePriceId;
  }

  if (params.status !== undefined && params.status !== null) {
    payload.status = params.status;
  }

  if (params.plan !== undefined && params.plan !== null) {
    payload.plan = params.plan;
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  if (params.businessId) {
    await supabaseAdmin
      .from("subscriptions")
      .update(payload)
      .eq("business_id", params.businessId);

    return;
  }

  if (params.stripeSubscriptionId) {
    await supabaseAdmin
      .from("subscriptions")
      .update(payload)
      .eq("stripe_subscription_id", params.stripeSubscriptionId);

    return;
  }

  if (params.stripeCustomerId) {
    await supabaseAdmin
      .from("subscriptions")
      .update(payload)
      .eq("stripe_customer_id", params.stripeCustomerId);
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
  });
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const stripePriceId = subscription.items.data[0]?.price?.id ?? null;
  const mappedPlan = mapPriceIdToPlan(stripePriceId);
  const localStatus = mapStripeStatusToLocal(subscription.status);
  const businessId = toNullableInt(subscription.metadata?.business_id);

  await updateSubscriptionRow({
    businessId,
    stripeCustomerId: toNullableString(subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId,
    status: localStatus,
    plan: mappedPlan,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const businessId = toNullableInt(subscription.metadata?.business_id);

  await updateSubscriptionRow({
    businessId,
    stripeCustomerId: toNullableString(subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price?.id ?? null,
    status: "canceled",
    plan: "basic",
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await updateSubscriptionRow({
    stripeCustomerId: toNullableString(invoice.customer),
    stripeSubscriptionId: getInvoiceSubscriptionId(invoice),
    status: "past_due",
  });
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
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
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