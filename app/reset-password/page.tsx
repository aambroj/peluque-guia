import type { Metadata } from "next";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

export const metadata: Metadata = {
  title: "Nueva contraseña | Peluque-Guía",
  description:
    "Crea una nueva contraseña para volver a acceder a tu cuenta de Peluque-Guía.",
  alternates: {
    canonical: "/reset-password",
  },
};

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}