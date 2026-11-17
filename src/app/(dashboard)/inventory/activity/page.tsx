"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { ArrowLeft, Package } from "lucide-react";
import {
  getInventoryActivityLogs,
  getInventoryItems,
  getWarehouses,
} from "@/features/inventory/actions";
import type { InventoryActivityLog } from "@/features/inventory/types";
import Link from "next/link";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<InventoryActivityLog[]>([]);
  const [items, setItems] = useState<{ value: string; label: string }[]>([]);
  const [warehouses, setWarehouses] = useState<
    { value: string; label: string }[]
  >([]);
  const [filters, setFilters] = useState({
    item_id: "",
    warehouse_id: "",
    activity_type: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFilters() {
      const [itemsData, warehousesData] = await Promise.all([
        getInventoryItems(),
        getWarehouses(),
      ]);

      setItems(itemsData.map((i) => ({ value: i.id, label: i.name })));
      setWarehouses(
        warehousesData.map((w) => ({ value: w.id, label: w.name })),
      );
    }

    loadFilters();
  }, []);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const data = await getInventoryActivityLogs(filters);
      setLogs(data);
      setLoading(false);
    }

    loadLogs();
  }, [filters]);

  const columns = [
    { key: "item_id", header: "Item ID" },
    { key: "warehouse_id", header: "Warehouse ID" },
    { key: "activity_type", header: "Activity Type" },
    {
      key: "quantity",
      header: "Quantity",
      render: (row: InventoryActivityLog) => row.quantity?.toFixed(2) || "0",
    },
    {
      key: "previous_total",
      header: "Prev Total",
      render: (row: InventoryActivityLog) =>
        row.previous_total?.toFixed(2) || "0",
    },
    {
      key: "new_total",
      header: "New Total",
      render: (row: InventoryActivityLog) => row.new_total?.toFixed(2) || "0",
    },
    {
      key: "notes",
      header: "Notes",
      render: (row: InventoryActivityLog) => row.notes || "-",
    },
    {
      key: "created_at",
      header: "Date",
      render: (row: InventoryActivityLog) =>
        new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Inventory Activity Logs
        </h1>
      </div>

      <div className="mb-4 flex gap-4">
        <Select
          label="Filter by Item"
          options={[{ value: "", label: "All Items" }, ...items]}
          value={filters.item_id}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, item_id: e.target.value }))
          }
        />
        <Select
          label="Filter by Warehouse"
          options={[{ value: "", label: "All Warehouses" }, ...warehouses]}
          value={filters.warehouse_id}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, warehouse_id: e.target.value }))
          }
        />
        <Select
          label="Filter by Activity Type"
          options={[
            { value: "", label: "All Types" },
            { value: "addition", label: "Addition" },
            { value: "manual_usage", label: "Manual Usage" },
            { value: "reservation", label: "Reservation" },
            { value: "release", label: "Release" },
            { value: "consumption", label: "Consumption" },
            { value: "transfer_out", label: "Transfer Out" },
            { value: "transfer_in", label: "Transfer In" },
          ]}
          value={filters.activity_type}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, activity_type: e.target.value }))
          }
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Package className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Table columns={columns} data={logs} />
      )}
    </div>
  );
}
