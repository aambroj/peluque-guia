"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

type Props = {
  id: number;
};

export default function DeleteEmpleadoButton({ id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm("¿Seguro que quieres borrar este empleado?");
    if (!ok) return;

    setLoading(true);

    const { error } = await supabase.from("empleados").delete().eq("id", id);

    setLoading(false);

    if (error) {
      alert(`Error al borrar: ${error.message}`);
      return;
    }

    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "Borrando..." : "Borrar"}
    </button>
  );
}