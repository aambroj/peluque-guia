"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { supabase } from "@/lib/supabase";

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const FULL_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumen del negocio",
  },
  {
    href: "/reservas",
    label: "Reservas",
    description: "Agenda y citas",
  },
  {
    href: "/clientes",
    label: "Clientes",
    description: "Fichas y datos",
  },
  {
    href: "/empleados",
    label: "Empleados",
    description: "Equipo, horarios y bloqueos",
  },
  {
    href: "/servicios",
    label: "Servicios",
    description: "Precios y duración",
  },
  {
    href: "/cuenta",
    label: "Cuenta",
    description: "Negocio y suscripción",
  },
  {
    href: "/reservar",
    label: "Reserva pública",
    description: "Flujo online para clientes",
  },
];

const ONBOARDING_NAV_ITEMS: NavItem[] = [
  {
    href: "/cuenta",
    label: "Cuenta",
    description: "Activa tu negocio",
  },
  {
    href: "/cuenta/planes",
    label: "Planes",
    description: "Inicia la prueba gratis",
  },
];

const CONTACT_ADMIN_EMAILS = ["alber.ambroj@gmail.com", "aambroj@yahoo.es"];

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isPendingActivationSubscription(
  plan: string | null | undefined,
  status: string | null | undefined
) {
  return (
    normalizeText(plan ?? "") === "basic" &&
    normalizeText(status ?? "") === "inactive"
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();

  const [isLoadingAccessState, setIsLoadingAccessState] = useState(true);
  const [isPendingActivation, setIsPendingActivation] = useState(false);
  const [isContactAdmin, setIsContactAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccessState() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setIsPendingActivation(false);
            setIsContactAdmin(false);
            setIsLoadingAccessState(false);
          }
          return;
        }

        const userEmail = user.email?.trim().toLowerCase() ?? "";

        if (!cancelled) {
          setIsContactAdmin(CONTACT_ADMIN_EMAILS.includes(userEmail));
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.business_id) {
          if (!cancelled) {
            setIsPendingActivation(false);
            setIsLoadingAccessState(false);
          }
          return;
        }

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("business_id", profile.business_id)
          .maybeSingle();

        if (!cancelled) {
          setIsPendingActivation(
            isPendingActivationSubscription(
              subscription?.plan,
              subscription?.status
            )
          );
          setIsLoadingAccessState(false);
        }
      } catch {
        if (!cancelled) {
          setIsPendingActivation(false);
          setIsContactAdmin(false);
          setIsLoadingAccessState(false);
        }
      }
    }

    loadAccessState();

    return () => {
      cancelled = true;
    };
  }, []);

  const restrictedMode = isLoadingAccessState || isPendingActivation;

  const navItems = useMemo(
    () => (restrictedMode ? ONBOARDING_NAV_ITEMS : FULL_NAV_ITEMS),
    [restrictedMode]
  );

  const homeHref = restrictedMode ? "/cuenta" : "/dashboard";
  const adminContactosActive = isActive(pathname, "/admin/contactos");

  return (
    <aside className="border-r border-zinc-200 bg-white">
      <div className="sticky top-0 flex h-full min-h-screen flex-col">
        <div className="border-b border-zinc-200 px-6 py-6">
          <Link href={homeHref} className="block">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Peluque-Guía
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900">
              Panel de gestión
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {restrictedMode
                ? "Activa tu prueba para empezar"
                : "Todo el negocio en un solo lugar"}
            </p>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-5">
          <div className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl border px-4 py-4 transition ${
                    active
                      ? "border-black bg-black text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      active ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      active ? "text-zinc-200" : "text-zinc-500"
                    }`}
                  >
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="space-y-4 border-t border-zinc-200 px-4 py-5">
          {restrictedMode ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Negocio pendiente de activación
              </p>
              <p className="mt-2 text-xs text-amber-800">
                Completa la activación del plan Basic para desbloquear clientes,
                empleados, reservas y el resto del panel.
              </p>
              <Link
                href="/cuenta/planes"
                className="mt-3 inline-flex rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
              >
                Ir a planes
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">
                Acceso rápido
              </p>
              <div className="mt-3 grid gap-2">
                <Link
                  href="/reservas/nuevo"
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-black"
                >
                  Nueva reserva
                </Link>
                <Link
                  href="/clientes/nuevo"
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-black"
                >
                  Nuevo cliente
                </Link>
                <Link
                  href="/empleados/nuevo"
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-black"
                >
                  Nuevo empleado
                </Link>
              </div>
            </div>
          )}

          {isContactAdmin ? (
            <Link
              href="/admin/contactos"
              className={`block rounded-2xl border px-4 py-4 transition ${
                adminContactosActive
                  ? "border-sky-900 bg-sky-900 text-white shadow-sm"
                  : "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  adminContactosActive ? "text-white" : "text-sky-950"
                }`}
              >
                Solicitudes de contacto
              </p>
              <p
                className={`mt-1 text-xs ${
                  adminContactosActive ? "text-sky-100" : "text-sky-800"
                }`}
              >
                Demos y formularios de la web pública
              </p>
            </Link>
          ) : null}

          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}