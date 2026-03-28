import Link from "next/link";
import { getServerBusinessContext } from "@/lib/supabase-server";

const CONTACT_ADMIN_EMAILS = (
  process.env.CONTACT_ADMIN_EMAILS?.split(",") ?? [
    "alber.ambroj@gmail.com",
    "aambroj@yahoo.es",
  ]
)
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

type AdminContactRequestsLinkProps = {
  variant?: "sidebar" | "card";
};

export default async function AdminContactRequestsLink({
  variant = "sidebar",
}: AdminContactRequestsLinkProps) {
  const { user } = await getServerBusinessContext();

  const userEmail = user?.email?.trim().toLowerCase() ?? "";

  if (!userEmail || !CONTACT_ADMIN_EMAILS.includes(userEmail)) {
    return null;
  }

  if (variant === "card") {
    return (
      <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
        <p className="text-sm font-medium text-sky-700">Captación SaaS</p>
        <h3 className="mt-2 text-lg font-semibold text-sky-950">
          Solicitudes de contacto
        </h3>
        <p className="mt-3 text-sm leading-6 text-sky-900">
          Revisa desde aquí las demos y formularios enviados desde la web pública.
        </p>
        <div className="mt-4">
          <Link
            href="/admin/contactos"
            className="inline-flex rounded-2xl bg-sky-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-950"
          >
            Ver solicitudes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/admin/contactos"
      className="flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
    >
      Solicitudes de contacto
    </Link>
  );
}