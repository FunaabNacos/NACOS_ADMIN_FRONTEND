import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Persistent Sidebar (Snug to the edge like the reference) */}
      <Sidebar />

      {/* Main Content Area Container */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto">
        <Topbar />
        <main className="w-full flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}