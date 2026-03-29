"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

function getFriendlyErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit")) {
    return "Has hecho demasiados intentos. Espera un poco antes de volver a solicitar otro código.";
  }

  return message || "No se pudo enviar el código de recuperación.";
}

function maskEmail(value: string) {
  const email = value.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return "tu email";
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export default function RecuperarContrasenaPageClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const maskedEmail = maskEmail(cleanEmail);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || codeSent) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(
      cleanEmail
    );

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      setLoading(false);
      return;
    }

    setSuccessMessage(
      `Si existe una cuenta asociada a ${maskedEmail}, te hemos enviado un código de recuperación por correo.`
    );
    setCodeSent(true);
    setLoading(false);
  }

  function handleUseAnotherEmail() {
    setEmail("");
    setErrorMessage("");
    setSuccessMessage("");
    setCodeSent(false);
    setLoading(false);
  }

  function handleContinue() {
    router.push(
      `/reset-password${
        cleanEmail ? `?email=${encodeURIComponent(cleanEmail)}` : ""
      }`
    );
  }

  return (
    <section className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="w-full overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm sm:rounded-[2rem]">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white px-5 py-6 sm:px-8 sm:py-8 sm:px-10">
            <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              Acceso y seguridad
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Recuperar contraseña
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Introduce tu email y te enviaremos un código para crear una nueva
              contraseña.
            </p>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8 sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Email de acceso
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  disabled={loading || codeSent}
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
                  placeholder="tuemail@negocio.com"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || codeSent}
                className="w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-700 disabled:hover:opacity-100"
              >
                {loading
                  ? "Enviando código..."
                  : codeSent
                  ? "Código enviado"
                  : "Enviar código de recuperación"}
              </button>
            </form>

            {codeSent ? (
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full rounded-2xl border border-zinc-900 bg-white px-5 py-3.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                >
                  Ya tengo el código, continuar
                </button>

                <button
                  type="button"
                  onClick={handleUseAnotherEmail}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Usar otro email
                </button>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/login"
                className="font-medium text-black underline underline-offset-2"
              >
                Volver a entrar
              </Link>

              <Link
                href="/contacto"
                className="font-medium text-zinc-600 underline underline-offset-2"
              >
                Contactar con soporte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}