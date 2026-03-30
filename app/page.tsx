import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Software para peluquerías | PeluqueGuía",
  description:
    "Software para peluquerías: reservas online, clientes, empleados, servicios y gestión del negocio en un solo panel.",
};

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

const trustPoints = [
  "Sin instalación",
  "Acceso desde cualquier dispositivo",
  "Configuración sencilla",
  "Imagen más profesional para tu salón",
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

const faqs = [
  {
    question: "¿Necesito instalar algo en el ordenador?",
    answer:
      "No. PeluqueGuía funciona como software web, así que puedes acceder desde el navegador sin instalaciones complicadas.",
  },
  {
    question: "¿Puedo usarlo aunque tenga un salón pequeño?",
    answer:
      "Sí. El plan Basic está pensado precisamente para peluquerías pequeñas que quieren ordenar su agenda, sus clientes y su operativa diaria.",
  },
  {
    question: "¿Mis clientes pueden reservar online?",
    answer:
      "Sí. Puedes compartir tu enlace público de reservas para que tus clientes pidan cita de forma más cómoda y con una imagen más profesional.",
  },
  {
    question: "¿Puedo gestionar horarios, bloqueos y vacaciones del equipo?",
    answer:
      "Sí. La herramienta está preparada para organizar horarios semanales, descansos, bloqueos y periodos de ausencia de cada empleado.",
  },
  {
    question: "¿Qué pasa si mi negocio crece?",
    answer:
      "Puedes pasar a un plan superior según el número de empleados activos y la evolución de tu salón.",
  },
  {
    question: "¿Hay un periodo de prueba?",
    answer:
      "Sí. El plan Basic está planteado con 30 días gratis antes del cobro mensual.",
  },
];

const testimonials = [
  {
    quote:
      "Ahora tengo las reservas, los clientes y el equipo mucho más ordenados. Se nota incluso en la atención diaria.",
    author: "Salón pequeño",
    role: "Uso orientativo de presentación",
  },
  {
    quote:
      "La reserva online da una imagen mucho más seria y evita muchas llamadas para huecos y cambios de cita.",
    author: "Negocio en crecimiento",
    role: "Uso orientativo de presentación",
  },
  {
    quote:
      "Lo que más valoro es tener horarios, servicios y agenda en el mismo sitio, sin depender de notas o mensajes.",
    author: "Equipo con varias personas",
    role: "Uso orientativo de presentación",
  },
];

function getPlanClasses(tone: string) {
  if (tone === "sky") {
    return {
      card: "border-sky-200 bg-sky-50",
      badge: "border-sky-200 bg-white text-sky-700",
      title: "text-sky-950",
      text: "text-sky-900",
      button: "bg-sky-900 text-white hover:bg-sky-950",
    };
  }

  if (tone === "violet") {
    return {
      card: "border-violet-200 bg-violet-50",
      badge: "border-violet-200 bg-white text-violet-700",
      title: "text-violet-950",
      text: "text-violet-900",
      button: "bg-violet-900 text-white hover:bg-violet-950",
    };
  }

  return {
    card: "border-zinc-200 bg-white",
    badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
    title: "text-zinc-900",
    text: "text-zinc-700",
    button: "bg-black text-white hover:opacity-90",
  };
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              PeluqueGuía
            </p>
            <p className="text-sm text-zinc-500">
              Software web para peluquerías
            </p>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <a
              href="#funciones"
              className="text-sm font-medium text-zinc-600 transition hover:text-black"
            >
              Funciones
            </a>
            <a
              href="#planes"
              className="text-sm font-medium text-zinc-600 transition hover:text-black"
            >
              Planes
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-zinc-600 transition hover:text-black"
            >
              FAQ
            </a>
            <Link
              href="/contacto"
              className="text-sm font-medium text-zinc-600 transition hover:text-black"
            >
              Contacto
            </Link>
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
              Software para peluquerías
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Software para peluquerías para gestionar reservas, clientes,
              empleados y servicios desde un solo panel
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              PeluqueGuía es un software web para peluquerías que te ayuda a
              organizar reservas, clientes, equipo, servicios y reserva online
              desde un solo panel. Menos improvisación, mejor imagen y una
              operativa mucho más ordenada.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="rounded-2xl bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Crear mi negocio
              </Link>

              <a
                href="#planes"
                className="rounded-2xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Ver planes
              </a>

              <Link
                href="/contacto"
                className="rounded-2xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                Solicitar demo
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

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-700"
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
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-medium text-zinc-500">
                Más orden interno
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                Centraliza reservas, clientes y equipo
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-medium text-zinc-500">
                Mejor imagen
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                Ofrece una reserva online más seria y profesional
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-medium text-zinc-500">
                Preparado para crecer
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                Planes claros según el tamaño de tu negocio
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="funciones" className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-zinc-500">
              Todo en un solo lugar
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Lo que necesitas para gestionar mejor tu peluquería
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              PeluqueGuía está pensado para cubrir la operativa real de un
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
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">
                Por qué puede encajar contigo
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                Menos improvisación y más control del salón
              </h2>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                Está orientado a peluquerías que quieren trabajar con una agenda
                más clara, una operativa más ordenada y una imagen más seria de
                cara al cliente.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-900">
                    Para peluquerías pequeñas
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Empieza con una base sencilla, clara y profesional.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-900">
                    Para equipos con más movimiento
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Gana visibilidad sobre el equipo, horarios y carga de
                    trabajo.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-900">
                    Para negocios que quieren crecer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Mejora la imagen del salón y prepara una operativa más
                    sólida para el futuro.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.quote}
                  className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-3xl leading-none text-zinc-300">“</p>
                  <p className="mt-3 text-sm leading-7 text-zinc-700">
                    {testimonial.quote}
                  </p>
                  <div className="mt-6 border-t border-zinc-200 pt-4">
                    <p className="text-sm font-semibold text-zinc-900">
                      {testimonial.author}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="bg-zinc-50">
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

                  <div className="mt-6">
                    <Link
                      href="/registro"
                      className={`inline-flex rounded-2xl px-5 py-3 text-sm font-medium transition ${styles.button}`}
                    >
                      Empezar con {plan.name}
                    </Link>
                  </div>
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

      <section id="faq" className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-zinc-500">
              Preguntas frecuentes
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Respuestas claras antes de empezar
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Aquí tienes algunas dudas habituales sobre el producto, los planes
              y la forma de trabajo.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-white">
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
                  href="/contacto"
                  className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Solicitar demo
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="text-sm font-semibold text-zinc-900">
                Solicita una demo o más información
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                Si quieres valorar si encaja con tu salón, puedes escribir
                directamente y ver el producto con más detalle.
              </p>
              <div className="mt-4">
                <Link
                  href="/contacto"
                  className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Pedir demo
                </Link>
              </div>
            </div>

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
                Información legal
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                Consulta las políticas y condiciones visibles del servicio.
              </p>

              <div className="mt-4 flex flex-col gap-2 text-sm">
                <Link
                  href="/privacidad"
                  className="text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  Política de privacidad
                </Link>
                <Link
                  href="/terminos"
                  className="text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  Términos y condiciones
                </Link>
                <Link
                  href="/cookies"
                  className="text-zinc-700 underline underline-offset-2 hover:text-black"
                >
                  Política de cookies
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-medium text-zinc-500">
                  Ideal para empezar
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  Basic con 30 días gratis
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-medium text-zinc-500">
                  Mejor imagen del salón
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  Reserva online más profesional
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-sm font-medium text-zinc-500">
                  Preparado para crecer
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  Planes según tu equipo
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
              <p>© PeluqueGuía. Gestión profesional para peluquerías.</p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/privacidad"
                  className="underline underline-offset-2 hover:text-black"
                >
                  Privacidad
                </Link>
                <Link
                  href="/terminos"
                  className="underline underline-offset-2 hover:text-black"
                >
                  Términos
                </Link>
                <Link
                  href="/cookies"
                  className="underline underline-offset-2 hover:text-black"
                >
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}