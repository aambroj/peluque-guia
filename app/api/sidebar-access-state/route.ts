import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CONTACT_ADMIN_EMAILS = (
  process.env.CONTACT_ADMIN_EMAILS?.split(",") ?? [
    "alber.ambroj@gmail.com",
    "aambroj@yahoo.es",
  ]
)
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isPendingActivationSubscription(
  plan: string | null | undefined,
  status: string | null | undefined
) {
  return (
    normalizeText(plan ?? "") === "basic" &&
    normalizeText(status ?? "") === "inactive"
  );
}

async function getBusinessAccessState(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.business_id) {
    return {
      hasBusiness: false,
      isPendingActivation: false,
    };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("business_id", profile.business_id)
    .maybeSingle();

  return {
    hasBusiness: true,
    isPendingActivation: isPendingActivationSubscription(
      subscription?.plan,
      subscription?.status
    ),
  };
}

export async function GET(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      hasBusiness: false,
      isPendingActivation: false,
      isContactAdmin: false,
    });
  }

  const userEmail = user.email?.trim().toLowerCase() ?? "";
  const isContactAdmin = CONTACT_ADMIN_EMAILS.includes(userEmail);
  const accessState = await getBusinessAccessState(supabase, user.id);

  return NextResponse.json({
    authenticated: true,
    hasBusiness: accessState.hasBusiness,
    isPendingActivation: accessState.isPendingActivation,
    isContactAdmin,
  });
}