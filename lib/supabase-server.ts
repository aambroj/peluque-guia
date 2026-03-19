import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type ProfileRow = {
  id: string;
  business_id: number | null;
  full_name?: string | null;
  role?: string | null;
};

export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // En algunos Server Components no se pueden escribir cookies.
          }
        },
      },
    }
  );
}

export async function getCurrentUser() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`No se pudo obtener el usuario autenticado: ${error.message}`);
  }

  return user ?? null;
}

export async function getCurrentProfile() {
  const supabase = await getSupabaseServer();
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, business_id, full_name, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(`No se pudo obtener el perfil actual: ${error.message}`);
  }

  return data ?? null;
}

export async function getCurrentBusinessId() {
  const profile = await getCurrentProfile();
  return profile?.business_id ?? null;
}

export async function getServerBusinessContext() {
  const supabase = await getSupabaseServer();
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  return {
    supabase,
    user,
    profile,
    businessId: profile?.business_id ?? null,
  };
}