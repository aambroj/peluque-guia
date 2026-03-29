import type { Metadata } from "next";
import RecuperarContrasenaPageClient from "./RecuperarContrasenaPageClient";

export const metadata: Metadata = {
  title: "Recuperar contraseña | PeluqueGuía",
  description:
    "Solicita un enlace para restablecer la contraseña de tu cuenta de PeluqueGuía.",
  alternates: {
    canonical: "/recuperar-contrasena",
  },
};

export default function RecuperarContrasenaPage() {
  return <RecuperarContrasenaPageClient />;
}