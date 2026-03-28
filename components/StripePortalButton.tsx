"use client";

import { useState } from "react";

type StripePortalButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export default function StripePortalButton({
  children,
  className = "",
}: StripePortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo abrir facturación.");
      }

      if (!data?.url || typeof data.url !== "string") {
        throw new Error("Stripe no devolvió una URL válida del portal.");
      }

      window.location.href = data.url;
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-disabled={loading}
        className={className}
      >
        {loading ? "Redirigiendo..." : children}
      </button>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}