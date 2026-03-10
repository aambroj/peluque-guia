const appointments = [
  {
    time: "09:00",
    client: "María López",
    service: "Corte + Peinado",
    employee: "Laura",
    status: "Confirmada",
  },
  {
    time: "10:00",
    client: "Ana Ruiz",
    service: "Color",
    employee: "Marta",
    status: "Pendiente",
  },
  {
    time: "11:30",
    client: "Carmen Díaz",
    service: "Mechas",
    employee: "Sofía",
    status: "Confirmada",
  },
  {
    time: "13:00",
    client: "Lucía Pérez",
    service: "Tratamiento Capilar",
    employee: "Laura",
    status: "Completada",
  },
  {
    time: "16:00",
    client: "Elena Torres",
    service: "Corte Mujer",
    employee: "Marta",
    status: "Confirmada",
  },
];

function getStatusStyles(status: string) {
  switch (status) {
    case "Confirmada":
      return "bg-green-100 text-green-700";
    case "Pendiente":
      return "bg-yellow-100 text-yellow-700";
    case "Completada":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export default function ReservasPage() {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reservas</h2>
            <p className="mt-2 text-zinc-600">
              Gestiona las citas del salón y controla el estado de cada reserva.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90">
              Nueva reserva
            </button>
            <button className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium transition hover:bg-zinc-100">
              Ver calendario
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Reservas del día</p>
            <p className="mt-3 text-3xl font-bold">18</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Confirmadas</p>
            <p className="mt-3 text-3xl font-bold">12</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Pendientes</p>
            <p className="mt-3 text-3xl font-bold">4</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Completadas</p>
            <p className="mt-3 text-3xl font-bold">2</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Agenda del día</h3>
              <p className="text-sm text-zinc-500">
                Vista rápida de citas programadas
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
              />
              <select className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black">
                <option>Todos los estados</option>
                <option>Confirmada</option>
                <option>Pendiente</option>
                <option>Completada</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <div className="grid grid-cols-5 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
              <span>Hora</span>
              <span>Cliente</span>
              <span>Servicio</span>
              <span>Profesional</span>
              <span>Estado</span>
            </div>

            {appointments.map((appointment) => (
              <div
                key={`${appointment.time}-${appointment.client}`}
                className="grid grid-cols-5 items-center border-t border-zinc-200 px-4 py-4 text-sm"
              >
                <span className="font-medium">{appointment.time}</span>
                <span>{appointment.client}</span>
                <span>{appointment.service}</span>
                <span>{appointment.employee}</span>
                <span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}