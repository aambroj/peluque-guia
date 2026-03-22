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

  const handleClick = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo abrir facturación.");
      }

      if (!data?.url) {
        throw new Error("Stripe no devolvió la URL del portal.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setLoading(false);
      return;
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? "Redirigiendo..." : children}
      </button>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}