export function formatDate(value: string) {
  if (!value) return "-";

  if (value.includes("/")) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-ES");
}

export function formatTime(value: string) {
  if (!value) return "-";
  return value.slice(0, 5);
}

export function getStatusBadgeClasses(status: string) {
  if (status === "Confirmada") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "Pendiente") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  if (status === "Cancelada") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  if (status === "Completada") {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }

  if (status === "Activo") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "Descanso") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  if (status === "Vacaciones") {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }

  return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
}