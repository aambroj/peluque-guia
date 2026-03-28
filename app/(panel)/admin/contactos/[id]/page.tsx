import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerBusinessContext } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type ContactRequestRow = {
  id: number;
  name: string;
  email: string;
  business_name: string | null;
  phone: string | null;
  employees_range: string | null;
  message: string;
  internal_notes: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
};

type AdminContactoDetallePageProps = {
  params?: Promise<{
    id?: string;
  }>;
};

const CONTACT_ADMIN_EMAILS = (
  process.env.CONTACT_ADMIN_EMAILS?.split(",") ?? [
    "alber.ambroj@gmail.com",
    "aambroj@yahoo.es",
  ]
)
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Madrid",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function normalizeStatusValue(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (!normalized) return "new";
  if (normalized === "new") return "new";
  if (normalized === "pending") return "pending";
  if (normalized === "done") return "done";

  return "new";
}

function normalizeStatusLabel(value: string | null | undefined) {
  const normalized = normalizeStatusValue(value);

  if (normalized === "pending") return "Pendiente";
  if (normalized === "done") return "Atendida";

  return "Nueva";
}

function getStatusClasses(value: string | null | undefined) {
  const normalized = normalizeStatusValue(value);

  if (normalized === "done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function getActionButtonClasses(params: {
  currentStatus: string | null | undefined;
  targetStatus: "new" | "pending" | "done";
}) {
  const current = normalizeStatusValue(params.currentStatus);
  const active = current === params.targetStatus;

  if (params.targetStatus === "done") {
    return active
      ? "border-emerald-900 bg-emerald-900 text-white"
      : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
  }

  if (params.targetStatus === "pending") {
    return active
      ? "border-amber-900 bg-amber-900 text-white"
      : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100";
  }

  return active
    ? "border-sky-900 bg-sky-900 text-white"
    : "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100";
}

export default async function AdminContactoDetallePage({
  params,
}: AdminContactoDetallePageProps) {
  const { user } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/admin/contactos");
  }

  const userEmail = user.email?.trim().toLowerCase() ?? "";

  if (!CONTACT_ADMIN_EMAILS.includes(userEmail)) {
    redirect("/dashboard");
  }

  const resolvedParams = params ? await params : undefined;
  const id = Number(resolvedParams?.id ?? "");

  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  async function updateContactRequestStatus(formData: FormData) {
    "use server";

    const { user: actionUser } = await getServerBusinessContext();

    if (!actionUser) {
      redirect("/login?redirectTo=/admin/contactos");
    }

    const actionUserEmail = actionUser.email?.trim().toLowerCase() ?? "";

    if (!CONTACT_ADMIN_EMAILS.includes(actionUserEmail)) {
      redirect("/dashboard");
    }

    const rawId = String(formData.get("id") ?? "");
    const rawStatus = String(formData.get("status") ?? "").trim().toLowerCase();

    const actionId = Number(rawId);
    const allowedStatuses = new Set(["new", "pending", "done"]);

    if (
      !Number.isFinite(actionId) ||
      actionId <= 0 ||
      !allowedStatuses.has(rawStatus)
    ) {
      revalidatePath("/admin/contactos");
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin
      .from("contact_requests")
      .update({ status: rawStatus })
      .eq("id", actionId);

    revalidatePath("/admin/contactos");
    revalidatePath(`/admin/contactos/${actionId}`);
    revalidatePath("/dashboard");
    redirect(`/admin/contactos/${actionId}`);
  }

  async function saveInternalNotes(formData: FormData) {
    "use server";

    const { user: actionUser } = await getServerBusinessContext();

    if (!actionUser) {
      redirect("/login?redirectTo=/admin/contactos");
    }

    const actionUserEmail = actionUser.email?.trim().toLowerCase() ?? "";

    if (!CONTACT_ADMIN_EMAILS.includes(actionUserEmail)) {
      redirect("/dashboard");
    }

    const rawId = String(formData.get("id") ?? "");
    const rawNotes = String(formData.get("internal_notes") ?? "");

    const actionId = Number(rawId);
    const internalNotes = rawNotes.trim();

    if (!Number.isFinite(actionId) || actionId <= 0) {
      revalidatePath("/admin/contactos");
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin
      .from("contact_requests")
      .update({ internal_notes: internalNotes || null })
      .eq("id", actionId);

    revalidatePath("/admin/contactos");
    revalidatePath(`/admin/contactos/${actionId}`);
    redirect(`/admin/contactos/${actionId}`);
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("contact_requests")
    .select(
      "id, name, email, business_name, phone, employees_range, message, internal_notes, source, status, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            No se pudo cargar la solicitud.
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    notFound();
  }

  const item = data as ContactRequestRow;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Administración interna
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Solicitud #{item.id}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Vista detallada de la solicitud enviada desde la web pública.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/contactos"
              className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver al listado
            </Link>

            <a
              href={`mailto:${item.email}`}
              className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Responder por email
            </a>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-zinc-900">
                  {item.name}
                </h2>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                    item.status
                  )}`}
                >
                  {normalizeStatusLabel(item.status)}
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Recibido el {formatDateTime(item.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Email
              </p>
              <p className="mt-2 break-all text-sm text-zinc-900">
                {item.email}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Salón
              </p>
              <p className="mt-2 text-sm text-zinc-900">
                {item.business_name || "No indicado"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Teléfono
              </p>
              <p className="mt-2 text-sm text-zinc-900">
                {item.phone || "No indicado"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Equipo
              </p>
              <p className="mt-2 text-sm text-zinc-900">
                {item.employees_range || "No indicado"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Mensaje
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
              {item.message}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Estado y seguimiento
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <form action={updateContactRequestStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value="new" />
                <button
                  type="submit"
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${getActionButtonClasses(
                    {
                      currentStatus: item.status,
                      targetStatus: "new",
                    }
                  )}`}
                >
                  Marcar como nueva
                </button>
              </form>

              <form action={updateContactRequestStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value="pending" />
                <button
                  type="submit"
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${getActionButtonClasses(
                    {
                      currentStatus: item.status,
                      targetStatus: "pending",
                    }
                  )}`}
                >
                  Marcar como pendiente
                </button>
              </form>

              <form action={updateContactRequestStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value="done" />
                <button
                  type="submit"
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${getActionButtonClasses(
                    {
                      currentStatus: item.status,
                      targetStatus: "done",
                    }
                  )}`}
                >
                  Marcar como atendida
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Notas internas
              </p>
              <p className="text-xs text-zinc-400">
                Solo visibles para administración
              </p>
            </div>

            <form action={saveInternalNotes} className="mt-3">
              <input type="hidden" name="id" value={item.id} />

              <textarea
                name="internal_notes"
                defaultValue={item.internal_notes ?? ""}
                rows={6}
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                placeholder="Ejemplo: quiere demo, le interesa reserva online, volver a contactar el viernes..."
              />

              <div className="mt-3">
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                >
                  Guardar notas
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
              Fuente: {item.source || "web"}
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
              ID: {item.id}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}