"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";

interface DashboardFiltersProps {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  employeeId?: string;
  orderStatus?: string;
  warehouses: { id: string; name: string }[];
  employees: { id: string; full_name: string }[];
}

export function DashboardFilters({
  startDate,
  endDate,
  warehouseId,
  employeeId,
  orderStatus,
  warehouses,
  employees,
}: DashboardFiltersProps) {
  return (
    <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Start Date
        </label>
        <DatePicker
          value={startDate ? new Date(startDate) : undefined}
          onChange={() => {
            // This is a form submission, value will be handled by hidden input
          }}
          placeholder="Select start date"
          className="w-full"
        />
        <input type="hidden" name="startDate" defaultValue={startDate} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          End Date
        </label>
        <DatePicker
          value={endDate ? new Date(endDate) : undefined}
          onChange={() => {
            // This is a form submission, value will be handled by hidden input
          }}
          placeholder="Select end date"
          className="w-full"
        />
        <input type="hidden" name="endDate" defaultValue={endDate} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Warehouse
        </label>
        <SelectShadcn name="warehouseId" defaultValue={warehouseId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Warehouses</SelectItem>
            {warehouses.map((w: { id: string; name: string }) => (
              <SelectItem key={w.id} value={w.id}>
                <div className="flex flex-col items-start">
                  <span>{w.name}</span>
                  <span className="text-xs text-gray-400">{w.id}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </SelectShadcn>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Employee
        </label>
        <SelectShadcn name="employeeId" defaultValue={employeeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Employees</SelectItem>
            {employees.map((e: { id: string; full_name: string }) => (
              <SelectItem key={e.id} value={e.id}>
                <div className="flex flex-col items-start">
                  <span>{e.full_name}</span>
                  <span className="text-xs text-gray-400">{e.id}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </SelectShadcn>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Order Status
        </label>
        <SelectShadcn name="orderStatus" defaultValue={orderStatus}>
          <SelectTrigger className="w-full">
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
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Low Stock Threshold
        </label>
        <input
          type="number"
          name="lowStockThreshold"
          defaultValue={startDate ? undefined : "10"}
          min="0"
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        />
      </div>
      <div className="flex items-end md:col-span-2">
        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
}
