const services = [
  {
    name: "Corte Mujer",
    duration: "45 min",
    price: "22 €",
    category: "Corte",
    status: "Activo",
  },
  {
    name: "Corte Hombre",
    duration: "30 min",
    price: "14 €",
    category: "Corte",
    status: "Activo",
  },
  {
    name: "Color",
    duration: "90 min",
    price: "45 €",
    category: "Coloración",
    status: "Activo",
  },
  {
    name: "Mechas",
    duration: "120 min",
    price: "65 €",
    category: "Coloración",
    status: "Activo",
  },
  {
    name: "Tratamiento Capilar",
    duration: "60 min",
    price: "30 €",
    category: "Tratamientos",
    status: "Activo",
  },
];

export default function ServiciosPage() {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Servicios</h2>
            <p className="mt-2 text-zinc-600">
              Gestiona servicios, categorías, duración y precios del salón.
            </p>
          </div>

          <button className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90">
            Nuevo servicio
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Servicios activos</p>
            <p className="mt-3 text-3xl font-bold">12</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Categorías</p>
            <p className="mt-3 text-3xl font-bold">4</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Duración media</p>
            <p className="mt-3 text-3xl font-bold">65 min</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Ticket medio</p>
            <p className="mt-3 text-3xl font-bold">34 €</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Catálogo de servicios</h3>
              <p className="text-sm text-zinc-500">
                Servicios disponibles para reservas y gestión interna
              </p>
            </div>

            <input
              type="text"
              placeholder="Buscar servicio..."
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <div className="grid grid-cols-5 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
              <span>Servicio</span>
              <span>Duración</span>
              <span>Precio</span>
              <span>Categoría</span>
              <span>Estado</span>
            </div>

            {services.map((service) => (
              <div
                key={`${service.name}-${service.price}`}
                className="grid grid-cols-5 items-center border-t border-zinc-200 px-4 py-4 text-sm"
              >
                <span className="font-medium">{service.name}</span>
                <span>{service.duration}</span>
                <span>{service.price}</span>
                <span>{service.category}</span>
                <span>{service.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}