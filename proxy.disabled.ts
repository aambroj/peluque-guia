import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/clientes",
  "/empleados",
  "/servicios",
  "/reservas",
  "/cuenta",
];

const ALLOWED_INACTIVE_BUSINESS_ROUTES = [
  "/cuenta",
  "/cuenta/planes",
  "/cuenta/facturacion",
];

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAllowedInactiveBusinessRoute(pathname: string) {
  if (pathname.startsWith("/api/stripe/")) {
    return true;
  }

  return ALLOWED_INACTIVE_BUSINESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
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

export async function proxy(request: NextRequest) {
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

  const { pathname, search } = request.nextUrl;

  if (isProtectedRoute(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (!user) {
    return response;
  }

  const accessState = await getBusinessAccessState(supabase, user.id);

  if (pathname === "/login") {
    const url = request.nextUrl.clone();

    url.pathname = accessState.isPendingActivation ? "/cuenta" : "/dashboard";
    url.searchParams.delete("redirectTo");

    return NextResponse.redirect(url);
  }

  if (pathname === "/registro") {
    if (accessState.hasBusiness) {
      const url = request.nextUrl.clone();

      url.pathname = accessState.isPendingActivation ? "/cuenta" : "/dashboard";
      url.searchParams.delete("redirectTo");

      return NextResponse.redirect(url);
    }

    return response;
  }

  if (
    accessState.isPendingActivation &&
    isProtectedRoute(pathname) &&
    !isAllowedInactiveBusinessRoute(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/cuenta";
    url.searchParams.delete("redirectTo");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};