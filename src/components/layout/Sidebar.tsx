"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  UserCog,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePermissions } from "@/hooks/usePermissions";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: null as null,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    module: "orders" as const,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
    module: "inventory" as const,
  },
  {
    name: "Warehouses",
    href: "/warehouses",
    icon: Warehouse,
    module: "inventory" as const,
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
    module: "employees" as const,
  },
  {
    name: "Users & Roles",
    href: "/users",
    icon: UserCog,
    module: "users" as const,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    module: null as null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900">ERP System</h1>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <p className="text-sm text-gray-600">Loading permissions...</p>
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900">ERP System</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            // Hide items that require permissions if user doesn't have read access
            if (item.module && !hasPermission(item.module, "read")) {
              return null;
            }

            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
