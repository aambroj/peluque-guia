"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

function getFriendlyErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit")) {
    return "Has hecho demasiados intentos. Supabase está limitando temporalmente el envío de correos de recuperación.";
  }

  return message || "No se pudo enviar el código de recuperación.";
}

export default function RecuperarContrasenaPageClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (codeSent || loading) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(
      cleanEmail
    );

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      setLoading(false);
      return;
    }

    setSuccessMessage(
      "Si existe una cuenta con ese email, te hemos enviado un código de recuperación por correo. Revisa también la carpeta de spam."
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

  function goToResetPassword() {
    const cleanEmail = email.trim();

    router.push(
      `/reset-password${
        cleanEmail ? `?email=${encodeURIComponent(cleanEmail)}` : ""
      }`
    );
  }

  return (
    <section className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10 lg:px-8">
        <div className="w-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white px-8 py-8 sm:px-10">
            <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              Acceso y seguridad
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
              Recuperar contraseña
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Introduce tu email y te enviaremos un código para restablecer tu
              contraseña.
            </p>
          </div>

          <div className="px-8 py-8 sm:px-10">
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
                  disabled={loading || codeSent}
                  autoComplete="email"
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
                  placeholder="tuemail@negocio.com"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
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
                  onClick={goToResetPassword}
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

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
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