import Link from "next/link";

const stats = [
  { title: "Citas de hoy", value: "18", helper: "+4 respecto a ayer" },
  { title: "Ingresos del día", value: "€486", helper: "+12% esta semana" },
  { title: "Clientes nuevos", value: "6", helper: "2 con reserva online" },
  { title: "Empleados activos", value: "4", helper: "Todos en horario" },
];

const todayAppointments = [
  { time: "09:30", client: "María López", service: "Corte + Peinado", employee: "Laura" },
  { time: "10:15", client: "Ana Ruiz", service: "Color", employee: "Marta" },
  { time: "11:00", client: "Carmen Díaz", service: "Mechas", employee: "Sofía" },
  { time: "12:30", client: "Lucía Pérez", service: "Tratamiento", employee: "Laura" },
];

const quickActions = [
  { title: "Nueva reserva", href: "/reservas" },
  { title: "Añadir cliente", href: "/clientes" },
  { title: "Gestionar servicios", href: "/servicios" },
  { title: "Ver empleados", href: "/empleados" },
];

export default function DashboardPage() {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-2 text-zinc-600">
            Resumen rápido del negocio y actividad del día.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-zinc-500">{stat.title}</p>
              <p className="mt-3 text-3xl font-bold">{stat.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{stat.helper}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Citas de hoy</h3>
                <p className="text-sm text-zinc-500">
                  Próximas reservas programadas
                </p>
              </div>

              <Link
                href="/reservas"
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100"
              >
                Ver todas
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-4 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                <span>Hora</span>
                <span>Cliente</span>
                <span>Servicio</span>
                <span>Profesional</span>
              </div>

              {todayAppointments.map((appointment) => (
                <div
                  key={`${appointment.time}-${appointment.client}`}
                  className="grid grid-cols-4 border-t border-zinc-200 px-4 py-4 text-sm"
                >
                  <span className="font-medium">{appointment.time}</span>
                  <span>{appointment.client}</span>
                  <span>{appointment.service}</span>
                  <span>{appointment.employee}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Accesos rápidos</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Acciones frecuentes del salón
              </p>

              <div className="mt-5 grid gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="rounded-xl border border-zinc-200 px-4 py-3 font-medium transition hover:bg-zinc-50"
                  >
                    {action.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Estado del negocio</h3>
              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <p>Horario de hoy: 09:00 - 19:00</p>
                <p>Reservas online activas: Sí</p>
                <p>Servicios publicados: 12</p>
                <p>Ocupación estimada: 78%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}