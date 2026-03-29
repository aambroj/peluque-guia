import Link from "next/link";

export const metadata = {
  title: "Términos y condiciones",
  description:
    "Condiciones generales de uso de la plataforma PeluqueGuía.",
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              PeluqueGuía
            </p>
            <p className="text-sm text-zinc-500">Términos y condiciones</p>
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
            Términos y condiciones
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-7 text-zinc-600">
            <p>
              El acceso y uso de PeluqueGuía implica la aceptación de estos
              términos y condiciones. El usuario se compromete a utilizar la
              plataforma de forma lícita, responsable y conforme a su finalidad.
            </p>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Objeto del servicio
              </h2>
              <p className="mt-2">
                PeluqueGuía es una plataforma orientada a la gestión de
                peluquerías y negocios similares, permitiendo organizar
                reservas, clientes, empleados, servicios y otras funciones
                relacionadas con la actividad del negocio.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Registro y acceso
              </h2>
              <p className="mt-2">
                Para utilizar determinadas funciones puede ser necesario crear
                una cuenta. El usuario es responsable de custodiar sus datos de
                acceso y de toda la actividad realizada desde su cuenta.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Uso permitido
              </h2>
              <ul className="mt-2 space-y-2">
                <li>
                  El usuario debe utilizar la plataforma únicamente para fines
                  relacionados con la gestión legítima de su negocio.
                </li>
                <li>
                  No está permitido utilizar el servicio para actividades
                  ilícitas, fraudulentas o que puedan perjudicar a terceros.
                </li>
                <li>
                  No se permite intentar acceder sin autorización a datos,
                  cuentas, sistemas o funcionalidades restringidas.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Suscripciones y facturación
              </h2>
              <p className="mt-2">
                El acceso a determinadas funcionalidades puede depender del plan
                contratado. Los precios, límites y condiciones del servicio
                podrán variar según el plan activo y la evolución del producto.
              </p>
              <p className="mt-2">
                Cuando exista facturación recurrente, esta se gestionará a
                través del proveedor de pagos correspondiente.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Disponibilidad del servicio
              </h2>
              <p className="mt-2">
                Se intentará mantener la plataforma disponible de forma
                continuada, aunque pueden producirse interrupciones por motivos
                técnicos, mantenimiento, seguridad o causas ajenas al control
                del titular del servicio.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Responsabilidad
              </h2>
              <p className="mt-2">
                PeluqueGuía se ofrece como herramienta de apoyo a la gestión
                del negocio. El usuario sigue siendo responsable del uso que
                haga de la información, de la relación con sus clientes y de la
                correcta configuración de su operativa.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Propiedad intelectual
              </h2>
              <p className="mt-2">
                Los contenidos, diseño, marca, código y elementos del servicio,
                salvo que se indique lo contrario, pertenecen a PeluqueGuía o
                a sus legítimos titulares y no podrán utilizarse sin
                autorización.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Suspensión o cancelación
              </h2>
              <p className="mt-2">
                Podrá limitarse o suspenderse el acceso al servicio en caso de
                incumplimiento de estos términos, uso indebido, impago o riesgo
                para la seguridad o integridad de la plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Modificaciones
              </h2>
              <p className="mt-2">
                Estos términos podrán actualizarse en cualquier momento para
                adaptarse a cambios legales, técnicos, comerciales o
                funcionales.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Contacto
              </h2>
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
          </div>
        </div>
      </section>
    </main>
  );
}