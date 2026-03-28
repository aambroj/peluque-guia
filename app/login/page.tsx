import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Accede al panel de Peluque-Guía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Entrar | Peluque-Guía",
    description:
      "Accede al panel de Peluque-Guía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería.",
    url: "/login",
  },
  twitter: {
    title: "Entrar | Peluque-Guía",
    description:
      "Accede al panel de Peluque-Guía para gestionar reservas, clientes, empleados, servicios y la operativa diaria de tu peluquería.",
  },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-10">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            Cargando...
          </div>
        </section>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}