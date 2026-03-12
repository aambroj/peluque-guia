"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: number;
  name: string;
  phone: string | null;
  visits: number | null;
  last_visit: string | null;
  notes: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClientes = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("clientes")
        .select("id, name, phone, visits, last_visit, notes")
        .order("name", { ascending: true });

      if (error) {
        setError(error.message || "No se pudieron cargar los clientes.");
        setLoading(false);
        return;
      }

      setClientes((data ?? []) as Cliente[]);
      setLoading(false);
    };

    loadClientes();
  }, []);

  if (loading) {
    return (
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          Cargando clientes...
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
              <p className="mt-2 text-zinc-600">
                Gestiona los datos de tus clientes y su historial básico.
              </p>
            </div>

            <Link
              href="/clientes/nuevo"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Nuevo cliente
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {clientes.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm text-zinc-600">
            No hay clientes registrados.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {clientes.map((cliente) => (
              <article
                key={cliente.id}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <h2 className="text-xl font-semibold">{cliente.name}</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {cliente.phone || "Sin teléfono"}
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-sm text-zinc-600">
                  <p>
                    <span className="font-medium text-zinc-800">Visitas:</span>{" "}
                    {cliente.visits ?? 0}
                  </p>

                  <p>
                    <span className="font-medium text-zinc-800">
                      Última visita:
                    </span>{" "}
                    {formatDate(cliente.last_visit)}
                  </p>

                  <p className="line-clamp-2">
                    <span className="font-medium text-zinc-800">Notas:</span>{" "}
                    {cliente.notes || "Sin notas"}
                  </p>
                </div>

                <div className="mt-6">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 inline-flex"
                  >
                    Editar cliente
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}