import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

export const metadata: Metadata = {
  title: "Nueva contraseña | PeluqueGuía",
  description:
    "Crea una nueva contraseña para volver a acceder a tu cuenta de PeluqueGuía.",
  alternates: {
    canonical: "/reset-password",
  },
};

function ResetPasswordPageFallback() {
  return (
    <section className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10 lg:px-8">
        <div className="w-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white px-8 py-8 sm:px-10">
            <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              Acceso y seguridad
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
              Crear nueva contraseña
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Cargando recuperación de contraseña…
            </p>
          </div>

          <div className="px-8 py-8 sm:px-10">
            <div className="animate-pulse space-y-5">
              <div>
                <div className="mb-2 h-4 w-32 rounded bg-zinc-200" />
                <div className="h-12 w-full rounded-2xl bg-zinc-100" />
              </div>

              <div>
                <div className="mb-2 h-4 w-40 rounded bg-zinc-200" />
                <div className="h-12 w-full rounded-2xl bg-zinc-100" />
              </div>

              <div>
                <div className="mb-2 h-4 w-36 rounded bg-zinc-200" />
                <div className="h-12 w-full rounded-2xl bg-zinc-100" />
              </div>

              <div>
                <div className="mb-2 h-4 w-48 rounded bg-zinc-200" />
                <div className="h-12 w-full rounded-2xl bg-zinc-100" />
              </div>

              <div className="h-12 w-full rounded-2xl bg-zinc-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}