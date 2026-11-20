"use client";

import { useState, useTransition, createContext, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ─── Filter Context ──────────────────────────────────────────────────────────

interface FilterContextType {
  isPending: boolean;
  activeSection: string | null;
  apply: (overrides: Record<string, string | undefined>, section?: string) => void;
}

const FilterContext = createContext<FilterContextType>({
  isPending: false,
  activeSection: null,
  apply: () => {},
});

export function DashboardFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const apply = (
    overrides: Record<string, string | undefined>,
    section?: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (section) {
      setActiveSection(section);
    }
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  return (
    <FilterContext.Provider
      value={{
        isPending,
        activeSection: isPending ? activeSection : null,
        apply,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

// ─── Dashboard Section with Spinner Overlay ──────────────────────────────────

export function DashboardSection({
  sectionId,
  title,
  filters,
  children,
  className,
}: {
  sectionId: "orders" | "inventory" | "employees";
  title: string;
  filters: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { isPending, activeSection } = useContext(FilterContext);
  const isSectionPending =
    isPending && (activeSection === sectionId || !activeSection);

  return (
    <section className={cn("relative mb-8", className)}>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      {filters}
      <div className="relative">
        {children}
        {isSectionPending && (
          <div className="absolute inset-0 z-20 flex min-h-[140px] items-center justify-center rounded-lg bg-white/60 backdrop-blur-[1px] transition-all">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Shared hook ─────────────────────────────────────────────────────────────

function useFilterNav(section?: string) {
  const context = useContext(FilterContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localPending, startTransition] = useTransition();

  if (context.apply && context.apply.name !== "") {
    return {
      apply: (overrides: Record<string, string | undefined>) =>
        context.apply(overrides, section),
      isPending: context.isPending,
      searchParams,
    };
  }

  const apply = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    startTransition(() => router.push(`/dashboard?${params.toString()}`));
  };

  return { apply, isPending: localPending, searchParams };
}

// ─── Orders Filters ──────────────────────────────────────────────────────────

interface OrdersFiltersProps {
  startDate?: string;
  endDate?: string;
  orderStatus?: string;
}

export function OrdersFilters({
  startDate,
  endDate,
  orderStatus,
}: OrdersFiltersProps) {
  const { apply } = useFilterNav("orders");

  const startDateValue = startDate ? new Date(startDate) : undefined;
  const endDateValue = endDate ? new Date(endDate) : undefined;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Start Date</label>
        <DatePicker
          value={startDateValue}
          onChange={(date) => {
            apply({ startDate: date ? date.toISOString() : undefined });
          }}
          placeholder="Start date"
          className="w-44"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">End Date</label>
        <DatePicker
          value={endDateValue}
          onChange={(date) => {
            apply({ endDate: date ? date.toISOString() : undefined });
          }}
          placeholder="End date"
          className="w-44"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Status</label>
        <SelectShadcn
          value={orderStatus ?? ""}
          onValueChange={(v) => apply({ orderStatus: v || undefined })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </SelectShadcn>
      </div>
    </div>
  );
}

// ─── Inventory Filters ───────────────────────────────────────────────────────

interface InventoryFiltersProps {
  warehouseId?: string;
  warehouses: { id: string; name: string }[];
  lowStockThreshold?: string;
}

export function InventoryFilters({
  warehouseId,
  warehouses,
  lowStockThreshold,
}: InventoryFiltersProps) {
  const { apply, searchParams } = useFilterNav("inventory");

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Warehouse</label>
        <SelectShadcn
          value={warehouseId ?? ""}
          onValueChange={(v) => apply({ warehouseId: v || undefined })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Warehouses</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectShadcn>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">
          Low Stock Threshold
        </label>
        <input
          type="number"
          min="0"
          defaultValue={
            lowStockThreshold ?? searchParams.get("lowStockThreshold") ?? "10"
          }
          onChange={(e) =>
            apply({ lowStockThreshold: e.target.value || undefined })
          }
          className="flex h-10 w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        />
      </div>
    </div>
  );
}

// ─── Employees Filters ───────────────────────────────────────────────────────

interface EmployeesFiltersProps {
  employeeId?: string;
  employees: { id: string; full_name: string }[];
}

export function EmployeesFilters({
  employeeId,
  employees,
}: EmployeesFiltersProps) {
  const { apply } = useFilterNav("employees");

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Employee</label>
        <SelectShadcn
          value={employeeId ?? ""}
          onValueChange={(v) => apply({ employeeId: v || undefined })}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Employees</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectShadcn>
      </div>
    </div>
  );
}
