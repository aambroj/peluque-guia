"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: number;
  name?: string;
};

export default function DarBajaEmpleadoButton({ id, name }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const ok = window.confirm(
      `¿Seguro que quieres dar de baja a ${name ?? "este empleado"}?\n\nSeguirá existiendo para conservar el histórico, pero dejará de aparecer como activo.`
    );

    if (!ok) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin-empleados/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const rawText = await response.text();

      let result: { error?: string; ok?: boolean } = {};

      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          "La ruta API no está respondiendo bien. Revisa app/api/admin-empleados/deactivate/route.ts"
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "No se pudo dar de baja al empleado");
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo dar de baja al empleado"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "Dando de baja..." : "Dar de baja"}
    </button>
  );
}