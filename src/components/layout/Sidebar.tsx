"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserProfile } from "@/app/actions/users";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  UserCog,
  FileText,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BoxesLinked,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/Button";

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
    name: "Employees",
    href: "/employees",
    icon: Users,
    module: "employees" as const,
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
    name: "Users & Roles",
    href: "/users",
    icon: UserCog,
    module: "users" as const,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    module: null as null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { hasPermission, loading } = usePermissions();
  const [isHovered, setIsHovered] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    startTransition(() => router.push("/login"));
  };

  useEffect(() => {
    const getUser = async () => {
      const result = await getCurrentUserProfile();
      if (result.success && result.data) {
        setUserName(result.data.full_name);
      }
    };
    getUser();
  }, []);

  const isExpanded = isHovered;

  return (
    <aside
      className={cn(
        "border-r border-gray-200 bg-white transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-start border-b border-gray-200 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <BoxesLinked className="h-6 w-6 flex-shrink-0 text-blue-600" />
            <span
              className={cn(
                "font-bold text-gray-900 text-lg transition-all duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
              )}
            >
              ERP System
            </span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span
                className={cn(
                  "text-xs transition-all duration-300 whitespace-nowrap",
                  isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
                )}
              >
                Loading...
              </span>
            </div>
          ) : (
            navigation.map((item) => {
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
                  "flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100",
                )}
                title={!isExpanded && !isHovered ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={cn(
                    "transition-all duration-300 whitespace-nowrap",
                    isExpanded
                      ? "opacity-100"
                      : "opacity-0 w-0 overflow-hidden",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })
        )}
        </nav>
        <div className="border-t border-gray-200 p-2">
          <div
            className={cn(
              "flex items-center justify-start gap-3 rounded-lg px-3 py-2 transition-colors",
            )}
          >
            <User className="h-5 w-5 flex-shrink-0 text-gray-600" />
            <span
              className={cn(
                "text-sm font-medium text-gray-700 transition-all duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
              )}
            >
              {userName || "Account"}
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn("w-full justify-start gap-3")}
            disabled={isPending}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                "transition-all duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
              )}
            >
              {isPending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : null}
              {isPending ? "Logging out" : "Logout"}
            </span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
