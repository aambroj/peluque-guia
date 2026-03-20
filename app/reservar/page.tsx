"use client";

import Link from "next/link";

export default function ReservarPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">
            Reserva tu cita online
          </h1>

          <p className="mt-3 text-zinc-600">
            Para reservar una cita necesitas acceder al enlace público de tu
            salón.
          </p>

          <p className="mt-2 text-zinc-600">
            Ese enlace suele tener un formato parecido a:
          </p>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
            /reservar/nombre-del-salon
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Después podrás elegir el profesional disponible y ver su calendario
            de reservas.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Si has llegado aquí sin enlace, pide al salón que te comparta su
            página pública de reserva.
          </p>

          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Ir al acceso del panel
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}