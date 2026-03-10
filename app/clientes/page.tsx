const clients = [
  {
    name: "María López",
    phone: "612 345 678",
    visits: 12,
    lastVisit: "05/03/2026",
    notes: "Prefiere corte y peinado.",
  },
  {
    name: "Ana Ruiz",
    phone: "623 456 789",
    visits: 7,
    lastVisit: "08/03/2026",
    notes: "Color cada 6 semanas.",
  },
  {
    name: "Carmen Díaz",
    phone: "634 567 890",
    visits: 15,
    lastVisit: "09/03/2026",
    notes: "Mechas y tratamiento.",
  },
  {
    name: "Lucía Pérez",
    phone: "645 678 901",
    visits: 4,
    lastVisit: "01/03/2026",
    notes: "Primera clienta de bonos.",
  },
];

export default function ClientesPage() {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
            <p className="mt-2 text-zinc-600">
              Consulta fichas, historial y notas importantes de tus clientes.
            </p>
          </div>

          <button className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90">
            Nuevo cliente
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Clientes totales</p>
            <p className="mt-3 text-3xl font-bold">248</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Nuevos este mes</p>
            <p className="mt-3 text-3xl font-bold">18</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Con reserva activa</p>
            <p className="mt-3 text-3xl font-bold">34</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Clientes frecuentes</p>
            <p className="mt-3 text-3xl font-bold">92</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Base de clientes</h3>
              <p className="text-sm text-zinc-500">
                Vista general de clientes registrados
              </p>
            </div>

            <input
              type="text"
              placeholder="Buscar cliente..."
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <div className="grid grid-cols-5 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
              <span>Nombre</span>
              <span>Teléfono</span>
              <span>Visitas</span>
              <span>Última visita</span>
              <span>Notas</span>
            </div>

            {clients.map((client) => (
              <div
                key={`${client.name}-${client.phone}`}
                className="grid grid-cols-5 items-center border-t border-zinc-200 px-4 py-4 text-sm"
              >
                <span className="font-medium">{client.name}</span>
                <span>{client.phone}</span>
                <span>{client.visits}</span>
                <span>{client.lastVisit}</span>
                <span>{client.notes}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}