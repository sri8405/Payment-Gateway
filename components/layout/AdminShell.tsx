import { AdminSidebar } from "@/components/layout/AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-6">{children}</main>
    </div>
  );
}
