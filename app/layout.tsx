import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <Sidebar />

      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}