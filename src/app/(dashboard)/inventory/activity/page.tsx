"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import { Table } from "@/components/ui/Table";
import { Package } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import {
  getInventoryActivityLogs,
  getInventoryItems,
  getWarehouses,
} from "@/features/inventory/actions";
import type { InventoryActivityLog } from "@/features/inventory/types";

interface InventoryActivityLogWithNames extends InventoryActivityLog {
  inventory_items?: { name: string; sku: string } | null;
  warehouses?: { name: string } | null;
  profiles?: { full_name: string } | null;
  orders?: { order_number: string } | null;
}
import Link from "next/link";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<InventoryActivityLogWithNames[]>([]);
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
    {
      key: "item",
      header: "Item",
      render: (row: InventoryActivityLogWithNames) => (
        <span className="flex items-center gap-2 font-medium text-gray-900">
          <Package className="h-4 w-4 text-gray-500" />
          {row.inventory_items?.name || row.item_id}
        </span>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (row: InventoryActivityLogWithNames) =>
        row.warehouses?.name || row.warehouse_id,
    },
    { key: "activity_type", header: "Activity Type" },
    {
      key: "quantity",
      header: "Quantity",
      render: (row: InventoryActivityLogWithNames) =>
        row.quantity?.toFixed(2) || "0",
    },
    {
      key: "previous_total",
      header: "Prev Total",
      render: (row: InventoryActivityLogWithNames) =>
        row.previous_total?.toFixed(2) || "0",
    },
    {
      key: "new_total",
      header: "New Total",
      render: (row: InventoryActivityLogWithNames) =>
        row.new_total?.toFixed(2) || "0",
    },
    {
      key: "notes",
      header: "Notes",
      render: (row: InventoryActivityLogWithNames) => row.notes || "-",
    },
    {
      key: "created_at",
      header: "Date",
      render: (row: InventoryActivityLogWithNames) =>
        new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <BackButton href="/inventory" label="Back" />
        <h1 className="text-2xl font-bold text-gray-900">
          Inventory Activity Logs
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Activity Logs</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Item:</span>
                <SelectShadcn
                  value={filters.item_id}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, item_id: value }))
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Items</SelectItem>
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectShadcn>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Warehouse:
                </span>
                <SelectShadcn
                  value={filters.warehouse_id}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, warehouse_id: value }))
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Warehouses</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.value} value={wh.value}>
                        {wh.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectShadcn>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <SelectShadcn
                  value={filters.activity_type}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, activity_type: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="addition">Addition</SelectItem>
                    <SelectItem value="manual_usage">Manual Usage</SelectItem>
                    <SelectItem value="reservation">Reservation</SelectItem>
                    <SelectItem value="release">Release</SelectItem>
                    <SelectItem value="consumption">Consumption</SelectItem>
                    <SelectItem value="transfer_out">Transfer Out</SelectItem>
                    <SelectItem value="transfer_in">Transfer In</SelectItem>
                  </SelectContent>
                </SelectShadcn>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Package className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table columns={columns} data={logs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
