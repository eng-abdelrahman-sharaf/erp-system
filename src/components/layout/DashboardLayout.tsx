import { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { BoxesLinked, Loader2 } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

function SidebarFallback() {
  return (
    <aside className="w-16 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-start border-b border-gray-200 px-4">
          <BoxesLinked className="h-6 w-6 flex-shrink-0 text-blue-600" />
        </div>
        <div className="flex-1 p-2 flex justify-center pt-6">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      </div>
    </aside>
  );
}
