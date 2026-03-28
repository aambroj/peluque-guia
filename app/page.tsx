import Link from "next/link";

const features = [
  {
    title: "Agenda y reservas más ordenadas",
    description:
      "Gestiona citas, cambios, estados y disponibilidad desde un panel claro, rápido y pensado para trabajar de verdad en el día a día.",
  },
  {
    title: "Clientes y equipo en un solo sitio",
    description:
      "Centraliza clientes, empleados, horarios, bloqueos y vacaciones sin depender de notas sueltas, mensajes o herramientas separadas.",
  },
  {
    title: "Servicios y precios bajo control",
    description:
      "Configura duración, precio, visibilidad y estado de cada servicio para mantener tu negocio actualizado y bien organizado.",
  },
  {
    title: "Reserva online para tus clientes",
    description:
      "Comparte tu enlace público y deja que tus clientes reserven de forma cómoda, directa y con una imagen más profesional.",
  },
  {
    title: "Dashboard del negocio",
    description:
      "Consulta actividad, ingresos, reservas próximas y rendimiento del equipo desde un panel visual y fácil de entender.",
  },
  {
    title: "Preparado para crecer como SaaS",
    description:
      "Base multi-negocio y estructura moderna para evolucionar con planes, suscripciones y una imagen de producto más sólida.",
  },
];

const steps = [
  {
    title: "Crea tu negocio",
    description:
      "Registra tu salón y activa tu acceso privado en pocos pasos.",
  },
  {
    title: "Configura equipo y servicios",
    description:
      "Añade empleados, horarios, bloqueos, precios y duración de servicios.",
  },
  {
    title: "Empieza a gestionar y recibir reservas",
    description:
      "Trabaja desde el panel y comparte tu página pública de reservas con tus clientes.",
  },
];

const highlights = [
  "Agenda y reservas",
  "Clientes",
  "Equipo y horarios",
  "Servicios y precios",
  "Reserva pública online",
  "Dashboard del negocio",
];

const plans = [
  {
    name: "Basic",
    title: "Para empezar",
    price: "19 €/mes",
    subtitle: "30 días gratis y después 19 €/mes",
    employees: "Hasta 2 empleados activos",
    description:
      "Ideal para peluquerías pequeñas que quieren empezar a trabajar con más orden y una imagen más profesional.",
    features: [
      "Clientes y reservas",
      "Equipo y horarios",
      "Servicios y precios",
      "Reserva pública online",
    ],
    tone: "zinc",
  },
  {
    name: "Pro",
    title: "Para crecer",
    price: "39 €/mes",
    employees: "Hasta 5 empleados activos",
    description:
      "Pensado para negocios con más movimiento, más equipo y necesidad de una operativa más completa.",
    features: [
      "Todo lo de Basic",
      "Más capacidad de equipo",
      "Métricas avanzadas",
      "Más visión operativa",
    ],
    tone: "sky",
  },
  {
    name: "Premium",
    title: "Para escalar",
    price: "69 €/mes",
    employees: "Hasta 10 empleados activos",
    description:
      "La opción más completa para salones con una operativa más potente, mejor imagen y margen real para escalar.",
    features: [
      "Todo lo de Pro",
      "Personalización Premium",
      "Mayor capacidad operativa",
      "Base preparada para crecer más",
    ],
    extra:
      "Desde el empleado 11 se añade un suplemento mensual por empleado activo extra.",
    tone: "violet",
  },
];

function getPlanClasses(tone: string) {
  if (tone === "sky") {
    return {
      card: "border-sky-200 bg-sky-50",
      badge: "border-sky-200 bg-white text-sky-700",
      title: "text-sky-950",
      text: "text-sky-900",
    };
  }

  if (tone === "violet") {
    return {
      card: "border-violet-200 bg-violet-50",
      badge: "border-violet-200 bg-white text-violet-700",
      title: "text-violet-950",
      text: "text-violet-900",
    };
  }

  return {
    card: "border-zinc-200 bg-white",
    badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
    title: "text-zinc-900",
    text: "text-zinc-700",
  };
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              Peluque-Guía
            </p>
            <p className="text-sm text-zinc-500">
              Software web para peluquerías
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Crear negocio
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.06),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.04),transparent_24%)]" />

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-24">
          <div className="relative">
            <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              Gestión profesional para peluquerías
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Organiza tu salón con una herramienta clara, moderna y preparada
              para crecer contigo.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              Peluque-Guía te ayuda a gestionar reservas, clientes, equipo,
              servicios y reserva online desde un solo panel. Menos
              improvisación, mejor imagen y una operativa mucho más ordenada.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="rounded-2xl bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Crear mi negocio
              </Link>

              <Link
                href="/cuenta/planes"
                className="rounded-2xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Ver planes
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">
                      Vista general
                    </p>
                    <p className="mt-1 text-xl font-semibold text-zinc-900">
                      Control del negocio
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Online
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-sm text-zinc-500">Reservas del día</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                      Organizadas
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      Agenda clara para trabajar con más tranquilidad.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-sm text-zinc-500">Equipo</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                      Coordinado
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      Horarios, bloqueos y disponibilidad desde un solo sitio.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-sm text-zinc-500">Reserva online</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                      Activa
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      Comparte un enlace profesional con tus clientes.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-sm text-zinc-500">Servicios</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                      Actualizados
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      Precios, duración y estado siempre bajo control.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-zinc-200 bg-black p-5 text-white">
                <p className="text-sm font-medium text-white/70">
                  Pensado para el día a día
                </p>
                <p className="mt-2 text-lg font-semibold">
                  Una herramienta preparada para que tu salón se vea más serio,
                  más ordenado y más profesional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-zinc-500">
              Todo en un solo lugar
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Lo que necesitas para gestionar mejor tu peluquería
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Peluque-Guía está pensado para cubrir la operativa real de un
              salón: citas, clientes, equipo, servicios y reserva online.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-zinc-500">
              Planes y crecimiento
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Un precio claro según el tamaño de tu equipo
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Elige el plan que mejor encaja con tu salón hoy y crece con una
              estructura más lógica mañana.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const styles = getPlanClasses(plan.tone);

              return (
                <div
                  key={plan.name}
                  className={`rounded-3xl border p-6 shadow-sm ${styles.card}`}
                >
                  <div
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles.badge}`}
                  >
                    {plan.name}
                  </div>

                  <h3 className={`mt-4 text-2xl font-bold ${styles.title}`}>
                    {plan.title}
                  </h3>

                  <div className="mt-4">
                    <p className={`text-3xl font-bold ${styles.title}`}>
                      {plan.price}
                    </p>

                    {plan.subtitle ? (
                      <p className="mt-1 text-sm text-emerald-700">
                        {plan.subtitle}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm font-medium text-zinc-600">
                      {plan.employees}
                    </p>
                  </div>

                  <p className={`mt-4 text-sm leading-7 ${styles.text}`}>
                    {plan.description}
                  </p>

                  <ul className={`mt-5 space-y-2 text-sm ${styles.text}`}>
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span>•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.extra ? (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-medium text-amber-900">
                        Escalado del plan
                      </p>
                      <p className="mt-2 text-sm leading-6 text-amber-800">
                        {plan.extra}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">
              Resumen rápido
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-500">Basic</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  Hasta 2 empleados
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-sm font-medium text-sky-700">Pro</p>
                <p className="mt-2 text-lg font-semibold text-sky-950">
                  Hasta 5 empleados
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="text-sm font-medium text-violet-700">Premium</p>
                <p className="mt-2 text-lg font-semibold text-violet-950">
                  Hasta 10 empleados
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-700">
                  Equipo adicional
                </p>
                <p className="mt-2 text-lg font-semibold text-amber-950">
                  Desde el empleado 11
                </p>
                <p className="mt-2 text-sm text-amber-800">
                  Suplemento mensual por empleado activo extra.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-zinc-500">
              Empieza en pocos pasos
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Una puesta en marcha simple y clara
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-[2rem] border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-8 text-white sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-3xl">
                <p className="text-sm font-medium text-white/70">
                  Preparado para empezar
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Dale a tu salón una gestión más profesional
                </h2>
                <p className="mt-4 text-base leading-7 text-zinc-300">
                  Crea tu negocio, configura tu equipo y empieza a trabajar con
                  una herramienta más ordenada, moderna y preparada para crecer.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/registro"
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-zinc-100"
                >
                  Crear negocio
                </Link>
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="text-sm font-semibold text-zinc-900">
                Soporte y contacto
              </p>
              <p className="mt-3 text-sm text-zinc-600">
                Alberto Ambroj López
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <a
                  href="mailto:alber.ambroj@gmail.com"
                  className="block text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  alber.ambroj@gmail.com
                </a>
                <a
                  href="mailto:aambroj@yahoo.es"
                  className="block text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  aambroj@yahoo.es
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="text-sm font-semibold text-zinc-900">
                Enfoque del producto
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                Peluque-Guía está orientado a peluquerías que quieren trabajar
                con más orden, dar mejor imagen y facilitar la reserva online a
                sus clientes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}