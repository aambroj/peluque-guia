import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <div className="relative z-50">
        <Sidebar />
      </div>

      <div className="relative z-0 flex min-h-screen min-w-0 flex-col">
        <AppHeader />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}