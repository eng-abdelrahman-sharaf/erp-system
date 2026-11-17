"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Package } from "lucide-react";
import {
  getInventorySummary,
  getInventoryItems,
  getWarehouses,
} from "@/features/inventory/actions";
import type { InventorySummary } from "@/features/inventory/types";
import Link from "next/link";

export default function StockOverviewPage() {
  const [stock, setStock] = useState<InventorySummary[]>([]);
  const [items, setItems] = useState<{ value: string; label: string }[]>([]);
  const [warehouses, setWarehouses] = useState<
    { value: string; label: string }[]
  >([]);
  const [filters, setFilters] = useState({
    item_id: "",
    warehouse_id: "",
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
    async function loadStock() {
      setLoading(true);
      const data = await getInventorySummary(filters);
      setStock(data.filter((s) => s.total_quantity && s.total_quantity > 0));
      setLoading(false);
    }

    loadStock();
  }, [filters]);

  const columns = [
    { key: "item_name", header: "Item" },
    { key: "sku", header: "SKU" },
    { key: "warehouse_name", header: "Warehouse" },
    { key: "unit", header: "Unit" },
    {
      key: "total_quantity",
      header: "Total",
      render: (row: InventorySummary) => row.total_quantity?.toFixed(2) || "0",
    },
    {
      key: "available_quantity",
      header: "Available",
      render: (row: InventorySummary) =>
        row.available_quantity?.toFixed(2) || "0",
    },
    {
      key: "reserved_quantity",
      header: "Reserved",
      render: (row: InventorySummary) =>
        row.reserved_quantity?.toFixed(2) || "0",
    },
    {
      key: "used_quantity",
      header: "Used",
      render: (row: InventorySummary) => row.used_quantity?.toFixed(2) || "0",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1>
        <div className="flex gap-2">
          <Link href="/inventory/adjust">
            <Button>Adjust Stock</Button>
          </Link>
          <Link href="/inventory/transfers">
            <Button variant="secondary">Transfer Stock</Button>
          </Link>
        </div>
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Package className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Table columns={columns} data={stock} />
      )}
    </div>
  );
}
