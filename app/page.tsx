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
    tone: "bronze",
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
    tone: "silver",
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
    tone: "gold",
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
  if (tone === "silver") {
    return {
      card: "border-[#c8ccd4] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,241,245,0.98))]",
      badge: "border-[#c9cdd4] bg-white/90 text-[#626b77]",
      title: "text-[#2f3640]",
      text: "text-[#58616d]",
      button:
        "bg-gradient-to-r from-[#66707d] to-[#7a8592] text-white shadow-lg shadow-[#66707d]/15 hover:opacity-95",
      extraCard: "border-slate-200 bg-slate-50",
      extraTitle: "text-slate-800",
      extraText: "text-slate-700",
      extraBadge: "border-slate-300 bg-white text-slate-700",
    };
  }

  if (tone === "gold") {
    return {
      card: "border-[#dcc16b] bg-[linear-gradient(180deg,rgba(255,252,241,0.98),rgba(250,240,198,0.92))]",
      badge: "border-[#dcc16b] bg-white/75 text-[#8a6400]",
      title: "text-[#4e3a0d]",
      text: "text-[#6d5a2b]",
      button:
        "bg-gradient-to-r from-[#8b6a16] to-[#b18b2c] text-white shadow-lg shadow-[#8b6a16]/15 hover:opacity-95",
      extraCard:
        "border-[#c99a37] bg-[linear-gradient(180deg,rgba(255,243,203,0.98),rgba(240,217,148,0.98))]",
      extraTitle: "text-[#6a4a09]",
      extraText: "text-[#6f5315]",
      extraBadge:
        "border-[#7a5a16] bg-[#6f5a22]/95 text-white shadow-sm shadow-[#6f5a22]/15",
    };
  }

  return {
    card: "border-[#cda77f] bg-[linear-gradient(180deg,rgba(255,250,246,0.98),rgba(243,226,211,0.96))]",
    badge: "border-[#cda77f] bg-white/80 text-[#8c5e36]",
    title: "text-[#4a2e1d]",
    text: "text-[#6d5446]",
    button:
      "bg-gradient-to-r from-[#9a6a43] to-[#b07a50] text-white shadow-lg shadow-[#9a6a43]/15 hover:opacity-95",
    extraCard: "border-amber-200 bg-amber-50",
    extraTitle: "text-amber-900",
    extraText: "text-amber-800",
    extraBadge: "border-amber-300 bg-white text-amber-900",
  };
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf7_0%,#fff7f3_22%,#fcf4f6_58%,#fffaf7_100%)] text-[#2f2430]">
      <section className="border-b border-[#eadfdd] bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-[#2f2430]">
              PeluqueGuía
            </p>
            <p className="text-sm text-[#7a6870]">
              Software web para peluquerías
            </p>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <a
              href="#funciones"
              className="text-sm font-medium text-[#7a6870] transition hover:text-[#7c3f58]"
            >
              Funciones
            </a>
            <a
              href="#planes"
              className="text-sm font-medium text-[#7a6870] transition hover:text-[#7c3f58]"
            >
              Planes
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-[#7a6870] transition hover:text-[#7c3f58]"
            >
              FAQ
            </a>
            <Link
              href="/contacto"
              className="text-sm font-medium text-[#7a6870] transition hover:text-[#7c3f58]"
            >
              Contacto
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-[#ddc9ce] bg-white/90 px-4 py-2 text-sm font-medium text-[#5f4753] transition hover:bg-[#fff7f8]"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="rounded-xl bg-gradient-to-r from-[#7c3f58] to-[#9b5c74] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#7c3f58]/15 transition hover:opacity-95"
            >
              Crear negocio
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,214,214,0.75),transparent_32%),radial-gradient(circle_at_top_right,rgba(221,214,243,0.48),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(248,235,232,0.9),transparent_30%)]" />

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-24">
          <div className="relative">
            <div className="inline-flex rounded-full border border-[#e7d7d7] bg-white/80 px-3 py-1 text-xs font-medium text-[#7a6870] backdrop-blur">
              Software para peluquerías
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#2f2430] sm:text-5xl lg:text-6xl">
              Software para peluquerías y centros de estética. Gestiona tu salón
              desde un solo panel.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[#6d5b64] sm:text-lg">
              PeluqueGuía es un software web para peluquerías y centros de
              estética que te ayuda a organizar reservas, clientes, equipo,
              servicios y reserva online desde un solo panel. Menos
              improvisación, mejor imagen y una operativa mucho más ordenada.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="rounded-2xl bg-gradient-to-r from-[#7c3f58] to-[#9b5c74] px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-[#7c3f58]/20 transition hover:opacity-95"
              >
                Crear mi negocio
              </Link>

              <a
                href="#planes"
                className="rounded-2xl border border-[#ddc9ce] bg-white/85 px-6 py-3.5 text-sm font-medium text-[#5f4753] transition hover:bg-[#fff7f8]"
              >
                Ver planes
              </a>

              <Link
                href="/contacto"
                className="rounded-2xl border border-[#ddc9ce] bg-white/85 px-6 py-3.5 text-sm font-medium text-[#5f4753] transition hover:bg-[#fff7f8]"
              >
                Solicitar demo
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#eadbdb] bg-white/80 px-4 py-3 text-sm font-medium text-[#604b56] shadow-[0_10px_30px_rgba(124,63,88,0.06)] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#ead8d5] bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(249,240,236,0.95))] px-4 py-3 text-sm text-[#6a5a61]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:-mt-24 xl:-mt-28">
            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(87,45,65,0.12)] backdrop-blur sm:p-8">
              <div className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(250,242,244,0.95))] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#7a6870]">
                      Vista general
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[#2f2430]">
                      Control del negocio
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Online
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#eadbdb] bg-white/90 p-4">
                    <p className="text-sm text-[#7a6870]">Reservas del día</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[#2f2430]">
                      Organizadas
                    </p>
                    <p className="mt-2 text-sm text-[#7a6870]">
                      Agenda clara para trabajar con más tranquilidad.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#eadbdb] bg-white/90 p-4">
                    <p className="text-sm text-[#7a6870]">Equipo</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[#2f2430]">
                      Coordinado
                    </p>
                    <p className="mt-2 text-sm text-[#7a6870]">
                      Horarios, bloqueos y disponibilidad desde un solo sitio.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#eadbdb] bg-white/90 p-4">
                    <p className="text-sm text-[#7a6870]">Reserva online</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[#2f2430]">
                      Activa
                    </p>
                    <p className="mt-2 text-sm text-[#7a6870]">
                      Comparte un enlace profesional con tus clientes.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#eadbdb] bg-white/90 p-4">
                    <p className="text-sm text-[#7a6870]">Servicios</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[#2f2430]">
                      Actualizados
                    </p>
                    <p className="mt-2 text-sm text-[#7a6870]">
                      Precios, duración y estado siempre bajo control.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-[linear-gradient(135deg,#6f3a52_0%,#8a506b_52%,#a76c80_100%)] p-5 text-white shadow-lg shadow-[#7c3f58]/20">
                <p className="text-sm font-medium text-white/75">
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

      <section className="border-y border-[#eadfdd] bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#faf2ef_100%)] p-5">
              <p className="text-sm font-medium text-[#7a6870]">
                Más orden interno
              </p>
              <p className="mt-2 text-lg font-semibold text-[#2f2430]">
                Centraliza reservas, clientes y equipo
              </p>
            </div>

            <div className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f8f1f5_100%)] p-5">
              <p className="text-sm font-medium text-[#7a6870]">
                Mejor imagen
              </p>
              <p className="mt-2 text-lg font-semibold text-[#2f2430]">
                Ofrece una reserva online más seria y profesional
              </p>
            </div>

            <div className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f5eff8_100%)] p-5">
              <p className="text-sm font-medium text-[#7a6870]">
                Preparado para crecer
              </p>
              <p className="mt-2 text-lg font-semibold text-[#2f2430]">
                Planes claros según el tamaño de tu negocio
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="funciones" className="border-y border-[#eadfdd] bg-white/65">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#7a6870]">
              Todo en un solo lugar
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2f2430]">
              Lo que necesitas para gestionar mejor tu peluquería
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6d5b64]">
              PeluqueGuía está pensado para cubrir la operativa real de un
              salón: citas, clientes, equipo, servicios y reserva online.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,242,244,0.96))] p-6 shadow-[0_12px_30px_rgba(124,63,88,0.05)]"
              >
                <h3 className="text-lg font-semibold text-[#2f2430]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#6d5b64]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#fff8f5_0%,#fcf4f6_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-[#eadada] bg-white/85 p-8 shadow-[0_20px_60px_rgba(87,45,65,0.08)] backdrop-blur">
              <p className="text-sm font-medium text-[#7a6870]">
                Por qué puede encajar contigo
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2f2430]">
                Menos improvisación y más control del salón
              </h2>
              <p className="mt-4 text-base leading-7 text-[#6d5b64]">
                Está orientado a peluquerías que quieren trabajar con una agenda
                más clara, una operativa más ordenada y una imagen más seria de
                cara al cliente.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#faf2ef_100%)] p-4">
                  <p className="text-sm font-semibold text-[#2f2430]">
                    Para peluquerías pequeñas
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6d5b64]">
                    Empieza con una base sencilla, clara y profesional.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f8f1f5_100%)] p-4">
                  <p className="text-sm font-semibold text-[#2f2430]">
                    Para equipos con más movimiento
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6d5b64]">
                    Gana visibilidad sobre el equipo, horarios y carga de
                    trabajo.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f5eff8_100%)] p-4">
                  <p className="text-sm font-semibold text-[#2f2430]">
                    Para negocios que quieren crecer
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6d5b64]">
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
                  className="rounded-[2rem] border border-[#eadada] bg-white/85 p-6 shadow-[0_18px_50px_rgba(87,45,65,0.07)] backdrop-blur"
                >
                  <p className="text-3xl leading-none text-[#d7b9c0]">“</p>
                  <p className="mt-3 text-sm leading-7 text-[#5f4e56]">
                    {testimonial.quote}
                  </p>
                  <div className="mt-6 border-t border-[#eadada] pt-4">
                    <p className="text-sm font-semibold text-[#2f2430]">
                      {testimonial.author}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-[#8a7880]">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="planes"
        className="bg-[linear-gradient(180deg,#fffaf7_0%,#fcf4f6_100%)]"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#7a6870]">
              Planes y crecimiento
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2f2430]">
              Un precio claro según el tamaño de tu equipo
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6d5b64]">
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
                  className={`rounded-3xl border p-6 shadow-[0_22px_60px_rgba(87,45,65,0.10)] ${styles.card}`}
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
                      <p className="mt-1 text-sm font-medium text-emerald-700">
                        {plan.subtitle}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm font-medium text-[#7a6870]">
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
                    <div
                      className={`mt-5 rounded-2xl border p-4 ${styles.extraCard}`}
                    >
                      {plan.tone === "gold" ? (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles.extraBadge}`}
                        >
                          Premium Plus
                        </span>
                      ) : (
                        <p className={`text-sm font-medium ${styles.extraTitle}`}>
                          Extra del plan
                        </p>
                      )}

                      <p
                        className={`text-sm leading-6 ${styles.extraText} ${
                          plan.tone === "gold" ? "mt-4" : "mt-2"
                        }`}
                      >
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
        </div>
      </section>

      <section className="border-y border-[#eadfdd] bg-white/70">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#7a6870]">
              Empieza en pocos pasos
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2f2430]">
              Una puesta en marcha simple y clara
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,242,244,0.96))] p-6 shadow-[0_12px_30px_rgba(124,63,88,0.05)]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3f58] to-[#9b5c74] text-sm font-semibold text-white shadow-md shadow-[#7c3f58]/20">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#2f2430]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#6d5b64]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="bg-[linear-gradient(180deg,#fff8f5_0%,#fcf4f6_100%)]"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#7a6870]">
              Preguntas frecuentes
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2f2430]">
              Respuestas claras antes de empezar
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6d5b64]">
              Aquí tienes algunas dudas habituales sobre el producto, los planes
              y la forma de trabajo.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-3xl border border-[#eadada] bg-white/85 p-6 shadow-[0_18px_50px_rgba(87,45,65,0.06)]"
              >
                <h3 className="text-lg font-semibold text-[#2f2430]">
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#6d5b64]">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-white/70">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#6f3a52_0%,#8a506b_50%,#a76c80_100%)] p-8 text-white shadow-[0_26px_80px_rgba(87,45,65,0.22)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-3xl">
                <p className="text-sm font-medium text-white/70">
                  Preparado para empezar
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Dale a tu salón una gestión más profesional
                </h2>
                <p className="mt-4 text-base leading-7 text-white/80">
                  Crea tu negocio, configura tu equipo y empieza a trabajar con
                  una herramienta más ordenada, moderna y preparada para crecer.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/registro"
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-medium text-[#5a3344] transition hover:bg-[#fff5f7]"
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
            <div className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#faf2ef_100%)] p-6">
              <p className="text-sm font-semibold text-[#2f2430]">
                Solicita una demo o más información
              </p>
              <p className="mt-3 text-sm leading-7 text-[#6d5b64]">
                Si quieres valorar si encaja con tu salón, puedes escribir
                directamente y ver el producto con más detalle.
              </p>
              <div className="mt-4">
                <Link
                  href="/contacto"
                  className="inline-flex rounded-2xl bg-gradient-to-r from-[#7c3f58] to-[#9b5c74] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[#7c3f58]/15 transition hover:opacity-95"
                >
                  Pedir demo
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f8f1f5_100%)] p-6">
              <p className="text-sm font-semibold text-[#2f2430]">
                Soporte y contacto
              </p>
              <p className="mt-3 text-sm text-[#6d5b64]">
                Alberto Ambroj López
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <a
                  href="mailto:alber.ambroj@gmail.com"
                  className="block text-[#6b4958] underline underline-offset-2 hover:text-[#7c3f58]"
                >
                  alber.ambroj@gmail.com
                </a>
                <a
                  href="mailto:aambroj@yahoo.es"
                  className="block text-[#6b4958] underline underline-offset-2 hover:text-[#7c3f58]"
                >
                  aambroj@yahoo.es
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f3edf7_100%)] p-6">
              <p className="text-sm font-semibold text-[#2f2430]">
                Información legal
              </p>
              <p className="mt-3 text-sm leading-7 text-[#6d5b64]">
                Consulta las políticas y condiciones visibles del servicio.
              </p>

              <div className="mt-4 flex flex-col gap-2 text-sm">
                <Link
                  href="/privacidad"
                  className="text-[#6b4958] underline underline-offset-2 hover:text-[#7c3f58]"
                >
                  Política de privacidad
                </Link>
                <Link
                  href="/terminos"
                  className="text-[#6b4958] underline underline-offset-2 hover:text-[#7c3f58]"
                >
                  Términos y condiciones
                </Link>
                <Link
                  href="/cookies"
                  className="text-[#6b4958] underline underline-offset-2 hover:text-[#7c3f58]"
                >
                  Política de cookies
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-[#eadada] bg-white/85 p-6 shadow-[0_18px_50px_rgba(87,45,65,0.06)]">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#faf2ef_100%)] p-4">
                <p className="text-sm font-medium text-[#7a6870]">
                  Ideal para empezar
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f2430]">
                  Basic con 30 días gratis
                </p>
              </div>

              <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f8f1f5_100%)] p-4">
                <p className="text-sm font-medium text-[#7a6870]">
                  Mejor imagen del salón
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f2430]">
                  Reserva online más profesional
                </p>
              </div>

              <div className="rounded-2xl border border-[#eadada] bg-[linear-gradient(180deg,#fffefe_0%,#f3edf7_100%)] p-4">
                <p className="text-sm font-medium text-[#7a6870]">
                  Preparado para crecer
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f2430]">
                  Planes según tu equipo
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-[#eadada] bg-white/85 px-6 py-5 shadow-[0_18px_50px_rgba(87,45,65,0.05)]">
            <div className="flex flex-col gap-4 text-sm text-[#8a7880] md:flex-row md:items-center md:justify-between">
              <p>© PeluqueGuía. Gestión profesional para peluquerías.</p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/privacidad"
                  className="underline underline-offset-2 hover:text-[#7c3f58]"
                >
                  Privacidad
                </Link>
                <Link
                  href="/terminos"
                  className="underline underline-offset-2 hover:text-[#7c3f58]"
                >
                  Términos
                </Link>
                <Link
                  href="/cookies"
                  className="underline underline-offset-2 hover:text-[#7c3f58]"
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