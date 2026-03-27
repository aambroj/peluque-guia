export function normalizeStatus(value: unknown) {
  return typeof value === "string"
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
    : "";
}

export function isServiceActive(
  servicio: Record<string, any> | null | undefined
) {
  if (!servicio) return false;

  const status = normalizeStatus(servicio.status);

  if (
    status === "inactivo" ||
    status === "desactivado" ||
    status === "deshabilitado"
  ) {
    return false;
  }

  if ("is_active" in servicio) return Boolean(servicio.is_active);
  if ("active" in servicio) return Boolean(servicio.active);
  if ("enabled" in servicio) return Boolean(servicio.enabled);
  if ("is_disabled" in servicio) return !Boolean(servicio.is_disabled);
  if ("disabled" in servicio) return !Boolean(servicio.disabled);
  if ("deleted_at" in servicio) return !servicio.deleted_at;

  return true;
}