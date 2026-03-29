import type { Metadata } from "next";
import ContactoPageClient from "./ContactoPageClient";

export const metadata: Metadata = {
  title: "Contacto y demo | PeluqueGuía",
  description:
    "Contacta con PeluqueGuía para solicitar una demo, resolver dudas sobre planes o valorar si encaja con tu peluquería.",
  alternates: {
    canonical: "/contacto",
  },
  openGraph: {
    title: "Contacto y demo | PeluqurGuía",
    description:
      "Contacta con PeluqueGuía para solicitar una demo, resolver dudas sobre planes o valorar si encaja con tu peluquería.",
    url: "/contacto",
  },
  twitter: {
    title: "Contacto y demo | PeluqueGuía",
    description:
      "Contacta con PeluqueGuía para solicitar una demo, resolver dudas sobre planes o valorar si encaja con tu peluquería.",
  },
};

export default function ContactoPage() {
  return <ContactoPageClient />;
}