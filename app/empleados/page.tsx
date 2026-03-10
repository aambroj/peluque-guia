const employees = [
  {
    name: "Laura Gómez",
    role: "Estilista",
    schedule: "09:00 - 17:00",
    appointments: 6,
    commission: "12%",
    status: "Activa",
  },
  {
    name: "Marta Ruiz",
    role: "Colorista",
    schedule: "10:00 - 18:00",
    appointments: 5,
    commission: "15%",
    status: "Activa",
  },
  {
    name: "Sofía Díaz",
    role: "Estilista",
    schedule: "11:00 - 19:00",
    appointments: 4,
    commission: "10%",
    status: "Activa",
  },
  {
    name: "Elena Torres",
    role: "Recepción",
    schedule: "09:00 - 14:00",
    appointments: 0,
    commission: "-",
    status: "Activa",
  },
];

export default function EmpleadosPage() {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Empleados</h2>
            <p className="mt-2 text-zinc-600">
              Gestiona profesionales, horarios, citas y comisiones.
            </p>
          </div>

          <button className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90">
            Nuevo empleado
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Empleados activos</p>
            <p className="mt-3 text-3xl font-bold">4</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">En turno hoy</p>
            <p className="mt-3 text-3xl font-bold">4</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Citas asignadas</p>
            <p className="mt-3 text-3xl font-bold">15</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Comisión media</p>
            <p className="mt-3 text-3xl font-bold">12%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Equipo del salón</h3>
              <p className="text-sm text-zinc-500">
                Vista general de empleados y actividad
              </p>
            </div>

            <input
              type="text"
              placeholder="Buscar empleado..."
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <div className="grid grid-cols-6 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
              <span>Nombre</span>
              <span>Rol</span>
              <span>Horario</span>
              <span>Citas</span>
              <span>Comisión</span>
              <span>Estado</span>
            </div>

            {employees.map((employee) => (
              <div
                key={`${employee.name}-${employee.role}`}
                className="grid grid-cols-6 items-center border-t border-zinc-200 px-4 py-4 text-sm"
              >
                <span className="font-medium">{employee.name}</span>
                <span>{employee.role}</span>
                <span>{employee.schedule}</span>
                <span>{employee.appointments}</span>
                <span>{employee.commission}</span>
                <span>{employee.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}