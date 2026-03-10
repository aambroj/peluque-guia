import Link from "next/link";

export default function Home() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Peluque-Guía
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Gestiona tu peluquería desde una sola plataforma
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-zinc-600">
          Controla citas, clientes, empleados, servicios y reservas online con
          una app web sencilla y profesional.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90"
          >
            Ir al panel
          </Link>

          <Link
            href="/reservas"
            className="rounded-xl border border-zinc-300 px-6 py-3 transition hover:bg-zinc-100"
          >
            Ver reservas
          </Link>
        </div>
      </div>
    </section>
  );
}