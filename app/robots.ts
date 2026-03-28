import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://peluque-guia.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/login",
        "/registro",
        "/privacidad",
        "/terminos",
        "/cookies",
      ],
      disallow: [
        "/dashboard",
        "/clientes",
        "/empleados",
        "/servicios",
        "/reservas",
        "/cuenta",
        "/api",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}