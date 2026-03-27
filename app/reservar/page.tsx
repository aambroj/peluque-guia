import Link from "next/link";
import { getServerBusinessContext } from "@/lib/supabase-server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://peluque-guia.vercel.app";

export default async function PublicBookingHomePage() {
  const { supabase, businessId } = await getServerBusinessContext();

  let businessSlug: string | null = null;

  if (businessId) {
    const { data: business } = await supabase
      .from("businesses")
      .select("slug")
      .eq("id", businessId)
      .maybeSingle();

    businessSlug = business?.slug ?? null;
  }

  const publicBookingUrl = businessSlug
    ? `${APP_URL}/reservar/${businessSlug}`
    : `${APP_URL}/reservar/nombre-del-salon`;

  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Reserva tu cita online
        </h1>

        <p className="mt-6 text-lg text-zinc-700">
          Para reservar una cita necesitas acceder al enlace público de tu salón.
        </p>

        <p className="mt-3 text-lg text-zinc-700">
          Ese enlace suele tener este formato:
        </p>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-base text-zinc-900">
          {publicBookingUrl}
        </div>

        <p className="mt-6 text-lg text-zinc-700">
          Después podrás elegir el profesional disponible y ver su calendario de
          reservas.
        </p>

        <p className="mt-3 text-lg text-zinc-700">
          Si has llegado aquí sin enlace, pide al salón que te comparta su
          página pública de reserva.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-base font-medium text-zinc-900 transition hover:bg-zinc-50"
          >
            Ir al acceso del panel
          </Link>

          {businessSlug ? (
            <a
              href={publicBookingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-2xl bg-black px-5 py-3 text-base font-medium text-white transition hover:opacity-90"
            >
              Abrir mi web de reservas
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}