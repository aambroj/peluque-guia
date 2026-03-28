import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerBusinessContext } from "@/lib/supabase-server";
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

function getAppUrl() {
  return getRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isManagedSubscriptionStatus(status: string | null | undefined) {
  const normalized = normalizeText(status ?? "");

  return ["active", "trialing", "past_due", "paused", "unpaid"].includes(
    normalized
  );
}

export async function POST() {
  try {
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

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("business_id", businessId)
      .maybeSingle();

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        {
          error:
            "Este negocio todavía no tiene cliente de Stripe. Primero completa una suscripción.",
        },
        { status: 400 }
      );
    }

    if (
      !subscription?.stripe_subscription_id ||
      !isManagedSubscriptionStatus(subscription.status)
    ) {
      return NextResponse.json(
        {
          error:
            "Todavía no hay una suscripción gestionable desde Stripe para este negocio.",
        },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getAppUrl()}/cuenta/facturacion`,
    });

    if (!portalSession.url) {
      return NextResponse.json(
        { error: "Stripe no devolvió la URL del portal de facturación." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la sesión del portal de facturación.",
      },
      { status: 500 }
    );
  }
}