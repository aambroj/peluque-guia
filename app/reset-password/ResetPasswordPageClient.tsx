"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function getFriendlyErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("token has expired") ||
    normalized.includes("otp_expired") ||
    normalized.includes("invalid") ||
    normalized.includes("expired")
  ) {
    return "El código no es válido o ha caducado. Solicita uno nuevo.";
  }

  if (normalized.includes("same password")) {
    return "La nueva contraseña debe ser diferente de la anterior.";
  }

  if (normalized.includes("rate limit")) {
    return "Has hecho demasiados intentos. Espera un poco antes de volver a probar.";
  }

  if (normalized.includes("password")) {
    return "No se pudo actualizar la contraseña. Revisa los datos e inténtalo de nuevo.";
  }

  return message || "No se pudo actualizar la contraseña.";
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

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = useMemo(
    () => searchParams.get("email")?.trim().toLowerCase() ?? "",
    [searchParams]
  );

  const maskedEmail = useMemo(() => maskEmail(email), [email]);

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanEmail) {
      setErrorMessage(
        "Falta el email de recuperación. Vuelve atrás y solicita un nuevo código."
      );
      return;
    }

    if (!cleanToken || !password || !confirmPassword) {
      setErrorMessage("Debes completar todos los campos.");
      return;
    }

    if (cleanToken.length !== 6) {
      setErrorMessage("El código debe tener 6 dígitos.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabaseBrowser.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: "recovery",
    });

    if (verifyError) {
      setErrorMessage(getFriendlyErrorMessage(verifyError.message));
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabaseBrowser.auth.updateUser({
      password,
    });

    if (updateError) {
      setErrorMessage(getFriendlyErrorMessage(updateError.message));
      setLoading(false);
      return;
    }

    await supabaseBrowser.auth.signOut();
    window.location.href = "/login?passwordUpdated=1";
  }

  function handleUseAnotherEmail() {
    router.push("/recuperar-contrasena");
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
              Crear nueva contraseña
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Introduce el código que te hemos enviado y escribe tu nueva
              contraseña.
            </p>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8 sm:px-10">
            <div className="mb-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">
                Código enviado a {maskedEmail}
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Si no es tu correo o quieres probar con otro, vuelve a solicitar
                la recuperación.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Código de recuperación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={token}
                  onChange={(event) =>
                    setToken(
                      event.target.value.replace(/\D+/g, "").slice(0, 6)
                    )
                  }
                  required
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-center text-lg font-semibold tracking-[0.35em] outline-none transition focus:border-black"
                  placeholder="123456"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Introduce los 6 dígitos del código recibido por email.
                </p>
              </div>

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
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
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

            <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
              <button
                type="button"
                onClick={handleUseAnotherEmail}
                className="text-left font-medium text-black underline underline-offset-2"
              >
                Usar otro email
              </button>

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