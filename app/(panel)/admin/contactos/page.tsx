import Link from "next/link";
import { redirect } from "next/navigation";
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
  source: string | null;
  status: string | null;
  created_at: string;
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

function normalizeStatus(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (!normalized) return "Nueva";
  if (normalized === "new") return "Nueva";
  if (normalized === "pending") return "Pendiente";
  if (normalized === "done") return "Atendida";

  return value ?? "Nueva";
}

function getStatusClasses(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

export default async function AdminContactosPage() {
  const { user } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/admin/contactos");
  }

  const userEmail = user.email?.trim().toLowerCase() ?? "";

  if (!CONTACT_ADMIN_EMAILS.includes(userEmail)) {
    redirect("/dashboard");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("contact_requests")
    .select(
      "id, name, email, business_name, phone, employees_range, message, source, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const requests: ContactRequestRow[] = data ?? [];

  const newCount = requests.filter(
    (item) => (item.status ?? "new").toLowerCase() === "new"
  ).length;

  const pendingCount = requests.filter(
    (item) => (item.status ?? "").toLowerCase() === "pending"
  ).length;

  const doneCount = requests.filter(
    (item) => (item.status ?? "").toLowerCase() === "done"
  ).length;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Administración interna
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Solicitudes de contacto
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              Aquí puedes revisar los mensajes enviados desde la página pública
              de contacto y las peticiones de demo de Peluque-Guía.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Total</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              {requests.length}
            </p>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-sky-700">Nuevas</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-sky-950">
              {newCount}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">Pendientes</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-amber-950">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Atendidas</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-950">
              {doneCount}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            No se pudieron cargar las solicitudes de contacto.
          </div>
        ) : null}

        {!error && requests.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-zinc-900">
              Todavía no hay solicitudes
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Cuando alguien escriba desde la página de contacto, aparecerá aquí.
            </p>
          </div>
        ) : null}

        {!error && requests.length > 0 ? (
          <div className="mt-8 space-y-5">
            {requests.map((item) => (
              <article
                key={item.id}
                className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-zinc-900">
                        {item.name}
                      </h2>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                          item.status
                        )}`}
                      >
                        {normalizeStatus(item.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-zinc-500">
                      Recibido el {formatDateTime(item.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`mailto:${item.email}`}
                      className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      Responder por email
                    </a>
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

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
                    Fuente: {item.source || "web"}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
                    ID: {item.id}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}