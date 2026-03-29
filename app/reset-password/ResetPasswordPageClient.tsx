"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

function getFriendlyErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("same password")) {
    return "La nueva contraseña debe ser diferente de la anterior.";
  }

  if (normalized.includes("password")) {
    return "No se pudo actualizar la contraseña. Revisa los datos e inténtalo de nuevo.";
  }

  return message || "No se pudo actualizar la contraseña.";
}

export default function ResetPasswordPageClient() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (mounted) {
        setReady(Boolean(session));
      }
    }

    loadSession();

    const { data } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setReady(Boolean(session));
      }
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error } = await supabaseBrowser.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error.message));
      setLoading(false);
      return;
    }

    await supabaseBrowser.auth.signOut();
    window.location.href = "/login?passwordUpdated=1";
  }

  if (ready === null) {
    return (
      <section className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10 lg:px-8">
          <div className="w-full rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-sm">
            <p className="text-sm text-zinc-600">Comprobando enlace…</p>
          </div>
        </div>
      </section>
    );
  }

  if (!ready) {
    return (
      <section className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10 lg:px-8">
          <div className="w-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 bg-gradient-to-r from-white via-zinc-50 to-white px-8 py-8 sm:px-10">
              <div className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                Acceso y seguridad
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
                Enlace no válido
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Este enlace de recuperación ha caducado o ya no es válido.
                Solicita uno nuevo para continuar.
              </p>
            </div>

            <div className="px-8 py-8 sm:px-10">
              <div className="flex flex-wrap gap-4 text-sm">
                <Link
                  href="/recuperar-contrasena"
                  className="font-medium text-black underline underline-offset-2"
                >
                  Pedir un nuevo enlace
                </Link>

                <Link
                  href="/login"
                  className="font-medium text-zinc-600 underline underline-offset-2"
                >
                  Volver a entrar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
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
              Crear nueva contraseña
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Elige una nueva contraseña para volver a acceder a tu cuenta de
              Peluque-Guía.
            </p>
          </div>

          <div className="px-8 py-8 sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="••••••••"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Mínimo 6 caracteres.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Repetir nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-black"
                  placeholder="••••••••"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>

            <div className="mt-6 text-sm">
              <Link
                href="/login"
                className="font-medium text-zinc-600 underline underline-offset-2"
              >
                Volver a entrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}