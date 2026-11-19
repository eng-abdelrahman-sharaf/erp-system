import { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarFallback() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900">ERP System</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <p className="text-sm text-gray-600">Loading...</p>
        </nav>
      </div>
    </aside>
  );
}
