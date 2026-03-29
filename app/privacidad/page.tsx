import Link from "next/link";

export const metadata = {
  title: "Política de privacidad",
  description:
    "Información sobre el tratamiento de datos personales en PeluqueGuía.",
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              PeluqueGuía
            </p>
            <p className="text-sm text-zinc-500">Política de privacidad</p>
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
            Política de privacidad
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-7 text-zinc-600">
            <p>
              En PeluqueGuía respetamos la privacidad de los usuarios y nos
              comprometemos a tratar los datos personales de forma responsable,
              segura y conforme a la normativa aplicable.
            </p>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Responsable del tratamiento
              </h2>
              <p className="mt-2">
                El responsable del tratamiento de los datos es el titular del
                servicio PeluqueGuía.
              </p>
              <div className="mt-2 space-y-1">
                <p>Alberto Ambroj López</p>
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

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Datos que pueden recogerse
              </h2>
              <p className="mt-2">
                Dependiendo del uso del servicio, PeluqueGuía puede tratar
                datos como nombre, correo electrónico, teléfono, datos del
                negocio, datos de clientes, empleados, reservas y cualquier otra
                información introducida por el usuario dentro de la plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Finalidad del tratamiento
              </h2>
              <ul className="mt-2 space-y-2">
                <li>Gestionar el acceso y uso de la plataforma.</li>
                <li>
                  Permitir la administración de clientes, empleados, servicios y
                  reservas.
                </li>
                <li>Prestar soporte y atención al usuario.</li>
                <li>Mejorar el funcionamiento, seguridad y calidad del servicio.</li>
                <li>
                  Cumplir obligaciones legales o atender requerimientos
                  administrativos.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Base legitimadora
              </h2>
              <p className="mt-2">
                El tratamiento de los datos podrá basarse en la ejecución de la
                relación contractual, el consentimiento del usuario, el interés
                legítimo en mejorar y proteger el servicio y el cumplimiento de
                obligaciones legales.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Conservación de los datos
              </h2>
              <p className="mt-2">
                Los datos se conservarán durante el tiempo necesario para
                prestar el servicio, atender obligaciones legales o resolver
                incidencias, salvo que el usuario solicite su supresión cuando
                legalmente proceda.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Comunicación de datos
              </h2>
              <p className="mt-2">
                Los datos no se cederán a terceros salvo obligación legal o
                cuando sea necesario para la prestación técnica del servicio,
                por ejemplo mediante proveedores de infraestructura,
                autenticación, pagos o almacenamiento.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Seguridad
              </h2>
              <p className="mt-2">
                Se aplican medidas razonables de seguridad para proteger la
                confidencialidad, integridad y disponibilidad de la información
                tratada dentro de la plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Derechos del usuario
              </h2>
              <p className="mt-2">
                El usuario puede solicitar el acceso, rectificación, supresión,
                limitación, oposición o portabilidad de sus datos, cuando
                resulte aplicable, contactando por correo electrónico.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Cambios en esta política
              </h2>
              <p className="mt-2">
                Esta política de privacidad podrá actualizarse para adaptarse a
                cambios legales, técnicos o de funcionamiento del servicio.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}