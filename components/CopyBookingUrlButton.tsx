"use client";

import { useState } from "react";

type CopyBookingUrlButtonProps = {
  value: string;
  className?: string;
  defaultLabel?: string;
  copiedLabel?: string;
};

export default function CopyBookingUrlButton({
  value,
  className = "",
  defaultLabel = "Copiar enlace",
  copiedLabel = "Enlace copiado",
}: CopyBookingUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia este enlace:", value);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
    >
      {copied ? copiedLabel : defaultLabel}
    </button>
  );
}