import Link from "next/link";

export const metadata = {
  title: "Política de cookies",
  description:
    "Información sobre el uso de cookies en Peluque-Guía.",
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              Peluque-Guía
            </p>
            <p className="text-sm text-zinc-500">Política de cookies</p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Volver
          </Link>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Política de cookies
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-7 text-zinc-600">
            <p>
              En Peluque-Guía podemos utilizar cookies y tecnologías similares
              para mejorar la experiencia de navegación, recordar preferencias,
              analizar el uso de la web y ofrecer un funcionamiento más estable
              del servicio.
            </p>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                ¿Qué son las cookies?
              </h2>
              <p className="mt-2">
                Las cookies son pequeños archivos que se almacenan en tu
                dispositivo cuando visitas una página web. Sirven, por ejemplo,
                para recordar tu sesión, tus preferencias o recopilar
                información estadística de uso.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Tipos de cookies que pueden utilizarse
              </h2>
              <ul className="mt-2 space-y-2">
                <li>
                  <strong className="text-zinc-900">Cookies técnicas:</strong>{" "}
                  necesarias para el funcionamiento básico de la web.
                </li>
                <li>
                  <strong className="text-zinc-900">
                    Cookies de preferencias:
                  </strong>{" "}
                  permiten recordar ciertos ajustes o elecciones del usuario.
                </li>
                <li>
                  <strong className="text-zinc-900">
                    Cookies de análisis:
                  </strong>{" "}
                  ayudan a entender cómo se utiliza la página para mejorar el
                  servicio.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Gestión de cookies
              </h2>
              <p className="mt-2">
                Puedes configurar o bloquear las cookies desde tu navegador.
                Ten en cuenta que, si desactivas determinadas cookies, algunas
                funciones del sitio podrían no funcionar correctamente.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Cambios en esta política
              </h2>
              <p className="mt-2">
                Esta política de cookies podrá actualizarse para reflejar
                cambios legales, técnicos o funcionales del servicio.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Contacto
              </h2>
              <p className="mt-2">
                Para cualquier consulta relacionada con esta política puedes
                contactar en:
              </p>
              <div className="mt-2 space-y-1">
                <a
                  href="mailto:alber.ambroj@gmail.com"
                  className="block underline underline-offset-2 hover:text-black"
                >
                  alber.ambroj@gmail.com
                </a>
                <a
                  href="mailto:aambroj@yahoo.es"
                  className="block underline underline-offset-2 hover:text-black"
                >
                  aambroj@yahoo.es
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}