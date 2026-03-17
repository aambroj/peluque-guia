"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RegistroPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedSlug = useMemo(() => slugify(businessName), [businessName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const finalSlug = slugify(slug || suggestedSlug);

    if (!businessName.trim() || !ownerName.trim() || !email.trim() || !password || !finalSlug) {
      setErrorMessage("Debes completar todos los campos.");
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

    try {
      const response = await fetch("/api/register-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          ownerName,
          slug: finalSlug,
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se pudo crear la cuenta.");
      }

      router.push("/login?registered=1");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo crear la cuenta."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">Nuevo salón</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Registra tu peluquería y crea tu acceso al panel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Nombre del salón
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(event) => {
                setBusinessName(event.target.value);
                if (!slug.trim()) {
                  setSlug(slugify(event.target.value));
                }
              }}
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="Peluquería Lola"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Identificador del salón
            </label>
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="peluqueria-lola"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Se usará más adelante para el enlace público de reservas.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Nombre del propietario
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="Ana García"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="admin@tusalon.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Repetir contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="••••••••"
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-zinc-600">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-black hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}