"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReactivarEmpleadoButtonProps = {
  id: number;
  name: string;
  disabled?: boolean;
};

export default function ReactivarEmpleadoButton({
  id,
  name,
  disabled = false,
}: ReactivarEmpleadoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      `¿Quieres reactivar a ${name}? Se marcará como Disponible.`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin-empleados/reactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        window.alert(data?.error ?? "No se pudo reactivar al empleado.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("No se pudo reactivar al empleado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Reactivando..." : "Reactivar"}
    </button>
  );
}