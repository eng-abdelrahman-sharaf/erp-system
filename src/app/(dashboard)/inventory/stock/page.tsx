"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import { Table } from "@/components/ui/Table";
import { ArrowLeft, Package } from "lucide-react";
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
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1>
        </div>
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
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Filter by Item
          </label>
          <SelectShadcn
            value={filters.item_id}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, item_id: value }))
            }
          >
            <SelectTrigger className="w-48">
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
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Filter by Warehouse
          </label>
          <SelectShadcn
            value={filters.warehouse_id}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, warehouse_id: value }))
            }
          >
            <SelectTrigger className="w-48">
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
