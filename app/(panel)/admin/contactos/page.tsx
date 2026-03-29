import Link from "next/link";
import { redirect } from "next/navigation";
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
  last_contact_at: string | null;
  next_follow_up_on: string | null;
};

type AdminContactosPageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
    priority?: string;
  }>;
};

type FollowUpPriority = "none" | "future" | "today" | "overdue";
type FollowUpFilter = "all" | "overdue" | "today" | "with_follow_up";

const CONTACT_ADMIN_EMAILS = (
  process.env.CONTACT_ADMIN_EMAILS?.split(",") ?? [
    "alber.ambroj@gmail.com",
    "aambroj@yahoo.es",
  ]
)
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Sin registrar";

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

function formatDateValue(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(`${value}T12:00:00Z`));
  } catch {
    return value;
  }
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function normalizeFilterStatus(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "new") return "new";
  if (normalized === "pending") return "pending";
  if (normalized === "done") return "done";

  return "all";
}

function normalizeFilterPriority(value: string | null | undefined): FollowUpFilter {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "overdue") return "overdue";
  if (normalized === "today") return "today";
  if (normalized === "with_follow_up") return "with_follow_up";

  return "all";
}

function getFilterLinkClasses(active: boolean) {
  return active
    ? "border-black bg-black text-white"
    : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50";
}

function buildContactosUrl(params: {
  filter?: string;
  q?: string;
  priority?: string;
}) {
  const filter = normalizeFilterStatus(params.filter);
  const priority = normalizeFilterPriority(params.priority);
  const q = (params.q ?? "").trim();

  const search = new URLSearchParams();

  if (filter !== "all") {
    search.set("status", filter);
  }

  if (priority !== "all") {
    search.set("priority", priority);
  }

  if (q) {
    search.set("q", q);
  }

  const queryString = search.toString();

  return queryString ? `/admin/contactos?${queryString}` : "/admin/contactos";
}

function matchesSearch(item: ContactRequestRow, rawQuery: string) {
  const query = normalizeText(rawQuery);

  if (!query) return true;

  const haystack = [
    item.name,
    item.email,
    item.business_name,
    item.phone,
    item.employees_range,
    item.message,
    item.internal_notes,
    item.source,
  ]
    .map((value) => normalizeText(value))
    .join(" ");

  return haystack.includes(query);
}

function getTodayDateInMadrid() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function hasFollowUpDate(value: string | null | undefined) {
  const rawDate = (value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
}

function getFollowUpPriority(
  value: string | null | undefined,
  status: string | null | undefined
): FollowUpPriority {
  const rawDate = (value ?? "").trim();

  if (!hasFollowUpDate(rawDate)) {
    return "none";
  }

  if (normalizeStatusValue(status) === "done") {
    return "future";
  }

  const today = getTodayDateInMadrid();

  if (rawDate < today) return "overdue";
  if (rawDate === today) return "today";

  return "future";
}

function getFollowUpPriorityLabel(priority: FollowUpPriority) {
  if (priority === "overdue") return "Seguimiento vencido";
  if (priority === "today") return "Seguimiento hoy";
  if (priority === "future") return "Seguimiento programado";
  return "Sin seguimiento";
}

function getFollowUpPriorityClasses(priority: FollowUpPriority) {
  if (priority === "overdue") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "today") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === "future") {
    return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function getContactCardClasses(priority: FollowUpPriority) {
  if (priority === "overdue") {
    return "rounded-[2rem] border border-red-300 bg-white p-6 shadow-sm ring-1 ring-red-100";
  }

  if (priority === "today") {
    return "rounded-[2rem] border border-amber-300 bg-white p-6 shadow-sm ring-1 ring-amber-100";
  }

  return "rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm";
}

function getFollowUpPanelClasses(priority: FollowUpPriority) {
  if (priority === "overdue") {
    return "border-red-200 bg-red-50";
  }

  if (priority === "today") {
    return "border-amber-200 bg-amber-50";
  }

  return "border-zinc-200 bg-white";
}

function getFollowUpBoxClasses(priority: FollowUpPriority) {
  if (priority === "overdue") {
    return "rounded-2xl border border-red-200 bg-red-50 p-4";
  }

  if (priority === "today") {
    return "rounded-2xl border border-amber-200 bg-amber-50 p-4";
  }

  return "rounded-2xl border border-zinc-200 bg-zinc-50 p-4";
}

function getFollowUpRank(priority: FollowUpPriority) {
  if (priority === "overdue") return 0;
  if (priority === "today") return 1;
  if (priority === "future") return 2;
  return 3;
}

export default async function AdminContactosPage({
  searchParams,
}: AdminContactosPageProps) {
  const { user } = await getServerBusinessContext();

  if (!user) {
    redirect("/login?redirectTo=/admin/contactos");
  }

  const userEmail = user.email?.trim().toLowerCase() ?? "";

  if (!CONTACT_ADMIN_EMAILS.includes(userEmail)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeFilter = normalizeFilterStatus(resolvedSearchParams?.status);
  const activePriority = normalizeFilterPriority(resolvedSearchParams?.priority);
  const searchQuery = (resolvedSearchParams?.q ?? "").trim();

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
    const rawFilter = String(formData.get("filter") ?? "").trim().toLowerCase();
    const rawPriority = String(formData.get("priority") ?? "").trim().toLowerCase();
    const rawQuery = String(formData.get("q") ?? "");

    const id = Number(rawId);
    const allowedStatuses = new Set(["new", "pending", "done"]);

    if (!Number.isFinite(id) || id <= 0 || !allowedStatuses.has(rawStatus)) {
      revalidatePath("/admin/contactos");
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin
      .from("contact_requests")
      .update({ status: rawStatus })
      .eq("id", id);

    revalidatePath("/admin/contactos");
    revalidatePath("/dashboard");
    redirect(
      buildContactosUrl({
        filter: rawFilter,
        priority: rawPriority,
        q: rawQuery,
      })
    );
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
    const rawFilter = String(formData.get("filter") ?? "").trim().toLowerCase();
    const rawPriority = String(formData.get("priority") ?? "").trim().toLowerCase();
    const rawQuery = String(formData.get("q") ?? "");
    const rawNotes = String(formData.get("internal_notes") ?? "");

    const id = Number(rawId);
    const internalNotes = rawNotes.trim();

    if (!Number.isFinite(id) || id <= 0) {
      revalidatePath("/admin/contactos");
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin
      .from("contact_requests")
      .update({ internal_notes: internalNotes || null })
      .eq("id", id);

    revalidatePath("/admin/contactos");
    redirect(
      buildContactosUrl({
        filter: rawFilter,
        priority: rawPriority,
        q: rawQuery,
      })
    );
  }

  async function markLastContactNow(formData: FormData) {
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
    const rawFilter = String(formData.get("filter") ?? "").trim().toLowerCase();
    const rawPriority = String(formData.get("priority") ?? "").trim().toLowerCase();
    const rawQuery = String(formData.get("q") ?? "");

    const id = Number(rawId);

    if (!Number.isFinite(id) || id <= 0) {
      revalidatePath("/admin/contactos");
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin
      .from("contact_requests")
      .update({ last_contact_at: new Date().toISOString() })
      .eq("id", id);

    revalidatePath("/admin/contactos");
    revalidatePath("/dashboard");
    redirect(
      buildContactosUrl({
        filter: rawFilter,
        priority: rawPriority,
        q: rawQuery,
      })
    );
  }

  async function saveNextFollowUp(formData: FormData) {
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
    const rawFilter = String(formData.get("filter") ?? "").trim().toLowerCase();
    const rawPriority = String(formData.get("priority") ?? "").trim().toLowerCase();
    const rawQuery = String(formData.get("q") ?? "");
    const rawDate = String(formData.get("next_follow_up_on") ?? "").trim();

    const id = Number(rawId);

    if (!Number.isFinite(id) || id <= 0) {
      revalidatePath("/admin/contactos");
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin
      .from("contact_requests")
      .update({ next_follow_up_on: rawDate || null })
      .eq("id", id);

    revalidatePath("/admin/contactos");
    redirect(
      buildContactosUrl({
        filter: rawFilter,
        priority: rawPriority,
        q: rawQuery,
      })
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("contact_requests")
    .select(
      "id, name, email, business_name, phone, employees_range, message, internal_notes, source, status, created_at, last_contact_at, next_follow_up_on"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const requests: ContactRequestRow[] = data ?? [];

  const newCount = requests.filter(
    (item) => normalizeStatusValue(item.status) === "new"
  ).length;

  const pendingCount = requests.filter(
    (item) => normalizeStatusValue(item.status) === "pending"
  ).length;

  const doneCount = requests.filter(
    (item) => normalizeStatusValue(item.status) === "done"
  ).length;

  const overdueCount = requests.filter(
    (item) => getFollowUpPriority(item.next_follow_up_on, item.status) === "overdue"
  ).length;

  const todayCount = requests.filter(
    (item) => getFollowUpPriority(item.next_follow_up_on, item.status) === "today"
  ).length;

  const withFollowUpCount = requests.filter((item) =>
    hasFollowUpDate(item.next_follow_up_on)
  ).length;

  const filteredRequests = requests
    .filter((item) => {
      const statusMatches =
        activeFilter === "all" ||
        normalizeStatusValue(item.status) === activeFilter;

      const followUpPriority = getFollowUpPriority(
        item.next_follow_up_on,
        item.status
      );

      const priorityMatches =
        activePriority === "all"
          ? true
          : activePriority === "overdue"
          ? followUpPriority === "overdue"
          : activePriority === "today"
          ? followUpPriority === "today"
          : hasFollowUpDate(item.next_follow_up_on);

      const queryMatches = matchesSearch(item, searchQuery);

      return statusMatches && priorityMatches && queryMatches;
    })
    .sort((a, b) => {
      const priorityA = getFollowUpPriority(a.next_follow_up_on, a.status);
      const priorityB = getFollowUpPriority(b.next_follow_up_on, b.status);

      const rankA = getFollowUpRank(priorityA);
      const rankB = getFollowUpRank(priorityB);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

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
              de contacto y las peticiones de demo de PeluqueGuía.
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

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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

          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              Seguimiento vencido
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-red-950">
              {overdueCount}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">
              Seguimiento hoy
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-amber-950">
              {todayCount}
            </p>
          </div>
        </div>

        {overdueCount > 0 || todayCount > 0 ? (
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">
              Prioridad de seguimiento
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {overdueCount > 0
                ? `${overdueCount} ${
                    overdueCount === 1 ? "solicitud tiene" : "solicitudes tienen"
                  } seguimiento vencido`
                : "No hay seguimientos vencidos"}
              {overdueCount > 0 && todayCount > 0 ? " y " : ". "}
              {todayCount > 0
                ? `${todayCount} ${
                    todayCount === 1 ? "solicitud toca" : "solicitudes tocan"
                  } hoy`
                : overdueCount > 0
                ? ""
                : "No hay seguimientos para hoy."}
              {todayCount > 0 ? "." : ""}
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Buscar solicitud
              </label>
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Buscar por nombre, email, salón, teléfono, mensaje o notas..."
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {activeFilter !== "all" ? (
                <input type="hidden" name="status" value={activeFilter} />
              ) : null}

              {activePriority !== "all" ? (
                <input type="hidden" name="priority" value={activePriority} />
              ) : null}

              <button
                type="submit"
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Buscar
              </button>

              <Link
                href={buildContactosUrl({
                  filter: activeFilter,
                  priority: activePriority,
                })}
                className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Limpiar búsqueda
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            Filtros de estado
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={buildContactosUrl({
                filter: "all",
                q: searchQuery,
                priority: activePriority,
              })}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${getFilterLinkClasses(
                activeFilter === "all"
              )}`}
            >
              Todas ({requests.length})
            </Link>

            <Link
              href={buildContactosUrl({
                filter: "new",
                q: searchQuery,
                priority: activePriority,
              })}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${getFilterLinkClasses(
                activeFilter === "new"
              )}`}
            >
              Nuevas ({newCount})
            </Link>

            <Link
              href={buildContactosUrl({
                filter: "pending",
                q: searchQuery,
                priority: activePriority,
              })}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${getFilterLinkClasses(
                activeFilter === "pending"
              )}`}
            >
              Pendientes ({pendingCount})
            </Link>

            <Link
              href={buildContactosUrl({
                filter: "done",
                q: searchQuery,
                priority: activePriority,
              })}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${getFilterLinkClasses(
                activeFilter === "done"
              )}`}
            >
              Atendidas ({doneCount})
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            Filtros de prioridad
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={buildContactosUrl({
                filter: activeFilter,
                q: searchQuery,
                priority: "all",
              })}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${getFilterLinkClasses(
                activePriority === "all"
              )}`}
            >
              Todas
            </Link>

            <Link
              href={buildContactosUrl({
                filter: activeFilter,
                q: searchQuery,
                priority: "overdue",
              })}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${getFilterLinkClasses(
                activePriority === "overdue"
              )}`}
            >
              Vencidos ({overdueCount})
            </Link>

            <Link
              href={buildContactosUrl({
                filter: activeFilter,
                q: searchQuery,
                priority: "today",
              })}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${getFilterLinkClasses(
                activePriority === "today"
              )}`}
            >
              Hoy ({todayCount})
            </Link>

            <Link
              href={buildContactosUrl({
                filter: activeFilter,
                q: searchQuery,
                priority: "with_follow_up",
              })}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${getFilterLinkClasses(
                activePriority === "with_follow_up"
              )}`}
            >
              Con seguimiento ({withFollowUpCount})
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            No se pudieron cargar las solicitudes de contacto.
          </div>
        ) : null}

        {!error && filteredRequests.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-zinc-900">
              No hay solicitudes para este filtro o búsqueda
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Cambia los filtros, limpia la búsqueda o espera a que lleguen nuevas
              solicitudes.
            </p>
          </div>
        ) : null}

        {!error && filteredRequests.length > 0 ? (
          <div className="mt-8 space-y-5">
            {filteredRequests.map((item) => {
              const followUpPriority = getFollowUpPriority(
                item.next_follow_up_on,
                item.status
              );

              return (
                <article
                  key={item.id}
                  className={getContactCardClasses(followUpPriority)}
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
                          {normalizeStatusLabel(item.status)}
                        </span>

                        {followUpPriority === "overdue" ||
                        followUpPriority === "today" ? (
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getFollowUpPriorityClasses(
                              followUpPriority
                            )}`}
                          >
                            {getFollowUpPriorityLabel(followUpPriority)}
                          </span>
                        ) : null}
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

                      <Link
                        href={`/admin/contactos/${item.id}`}
                        className="rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>

                  {followUpPriority === "overdue" ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-800">
                        Seguimiento vencido
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        Estaba previsto volver a contactar el{" "}
                        {formatDateValue(item.next_follow_up_on)}.
                      </p>
                    </div>
                  ) : null}

                  {followUpPriority === "today" ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-800">
                        Seguimiento para hoy
                      </p>
                      <p className="mt-1 text-sm text-amber-700">
                        Conviene revisar esta solicitud hoy para no perder el
                        seguimiento.
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Último contacto
                      </p>
                      <p className="mt-2 text-sm text-zinc-900">
                        {formatDateTime(item.last_contact_at)}
                      </p>
                    </div>

                    <div className={getFollowUpBoxClasses(followUpPriority)}>
                      <p
                        className={`text-xs font-medium uppercase tracking-wide ${
                          followUpPriority === "overdue"
                            ? "text-red-700"
                            : followUpPriority === "today"
                            ? "text-amber-700"
                            : "text-zinc-500"
                        }`}
                      >
                        Próximo seguimiento
                      </p>
                      <p
                        className={`mt-2 text-sm ${
                          followUpPriority === "overdue"
                            ? "font-semibold text-red-900"
                            : followUpPriority === "today"
                            ? "font-semibold text-amber-900"
                            : "text-zinc-900"
                        }`}
                      >
                        {formatDateValue(item.next_follow_up_on)}
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

                  <div
                    className={`mt-4 rounded-2xl border p-4 ${getFollowUpPanelClasses(
                      followUpPriority
                    )}`}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Estado y seguimiento
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={updateContactRequestStatus}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="new" />
                        <input type="hidden" name="filter" value={activeFilter} />
                        <input type="hidden" name="priority" value={activePriority} />
                        <input type="hidden" name="q" value={searchQuery} />
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
                        <input type="hidden" name="filter" value={activeFilter} />
                        <input type="hidden" name="priority" value={activePriority} />
                        <input type="hidden" name="q" value={searchQuery} />
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
                        <input type="hidden" name="filter" value={activeFilter} />
                        <input type="hidden" name="priority" value={activePriority} />
                        <input type="hidden" name="q" value={searchQuery} />
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

                      <form action={markLastContactNow}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="filter" value={activeFilter} />
                        <input type="hidden" name="priority" value={activePriority} />
                        <input type="hidden" name="q" value={searchQuery} />
                        <button
                          type="submit"
                          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                        >
                          Marcar contacto ahora
                        </button>
                      </form>
                    </div>
                  </div>

                  <div
                    className={`mt-4 rounded-2xl border p-4 ${getFollowUpPanelClasses(
                      followUpPriority
                    )}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Próximo seguimiento
                      </p>
                      <p className="text-xs text-zinc-400">
                        Fecha prevista para volver a contactar
                      </p>
                    </div>

                    <form action={saveNextFollowUp} className="mt-3">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="filter" value={activeFilter} />
                      <input type="hidden" name="priority" value={activePriority} />
                      <input type="hidden" name="q" value={searchQuery} />

                      <div className="flex flex-col gap-3 md:flex-row">
                        <input
                          type="date"
                          name="next_follow_up_on"
                          defaultValue={item.next_follow_up_on ?? ""}
                          className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                        />

                        <button
                          type="submit"
                          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                        >
                          Guardar seguimiento
                        </button>
                      </div>
                    </form>
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
                      <input type="hidden" name="filter" value={activeFilter} />
                      <input type="hidden" name="priority" value={activePriority} />
                      <input type="hidden" name="q" value={searchQuery} />

                      <textarea
                        name="internal_notes"
                        defaultValue={item.internal_notes ?? ""}
                        rows={4}
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
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}