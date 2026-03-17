import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type RegisterBusinessPayload = {
  businessName?: string;
  slug?: string;
  ownerName?: string;
  email?: string;
  password?: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  let createdUserId: string | null = null;
  let createdBusinessId: number | null = null;

  try {
    const body = (await request.json()) as RegisterBusinessPayload;

    const businessName = body.businessName?.trim() ?? "";
    const ownerName = body.ownerName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const slug = slugify(body.slug ?? "");

    if (!businessName || !ownerName || !email || !password || !slug) {
      return NextResponse.json(
        { error: "Debes completar todos los campos." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const { data: existingBusiness, error: existingBusinessError } =
      await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (existingBusinessError) {
      throw new Error(existingBusinessError.message);
    }

    if (existingBusiness) {
      return NextResponse.json(
        { error: "Ese identificador del salón ya está en uso." },
        { status: 409 }
      );
    }

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: ownerName,
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        { error: createUserError?.message || "No se pudo crear el usuario." },
        { status: 400 }
      );
    }

    createdUserId = createdUser.user.id;

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert({
        name: businessName,
        slug,
        email,
      })
      .select("id")
      .single();

    if (businessError || !business) {
      throw new Error(businessError?.message || "No se pudo crear el negocio.");
    }

    createdBusinessId = business.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: createdUserId,
      business_id: createdBusinessId,
      full_name: ownerName,
      role: "owner",
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        business_id: createdBusinessId,
        status: "inactive",
        plan: "basic",
      });

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    return NextResponse.json({
      ok: true,
      message: "Negocio creado correctamente.",
    });
  } catch (error) {
    if (createdBusinessId) {
      await supabaseAdmin.from("subscriptions").delete().eq("business_id", createdBusinessId);
      await supabaseAdmin.from("profiles").delete().eq("business_id", createdBusinessId);
      await supabaseAdmin.from("businesses").delete().eq("id", createdBusinessId);
    }

    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al registrar el negocio.",
      },
      { status: 500 }
    );
  }
}