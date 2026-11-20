"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Package, Warehouse } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import { EditButton } from "@/components/shared/NavigationActions";
import {
  getInventoryItem,
  getInventorySummary,
} from "@/features/inventory/actions";
import type {
  InventoryItem,
  InventorySummary,
} from "@/features/inventory/types";
import Link from "next/link";

function InventoryItemDetailsContent() {
  const params = useParams();
  const itemId = params.id as string;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [stock, setStock] = useState<InventorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [itemData, stockData] = await Promise.all([
          getInventoryItem(itemId),
          getInventorySummary({ item_id: itemId }),
        ]);
        setItem(itemData);
        setStock(
          stockData.filter(
            (s: InventorySummary) => s.total_quantity && s.total_quantity > 0,
          ),
        );
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Package className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!item) {
    return <div>Item not found</div>;
  }

  const stockColumns = [
    {
      key: "warehouse_name",
      header: "Warehouse",
      render: (row: InventorySummary) => (
        <span className="flex items-center gap-2 font-medium text-gray-900">
          <Warehouse className="h-4 w-4 text-gray-500" />
          {row.warehouse_name}
        </span>
      ),
    },
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
          <BackButton href="/inventory" label="Back" />
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
        </div>
        <EditButton
          href={`/inventory/items/${item.id}/edit`}
          variant="default"
          size="default"
        >
          Edit Item
        </EditButton>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Item Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">SKU</p>
            <p className="text-sm text-gray-900">{item.sku}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Unit</p>
            <p className="text-sm text-gray-900">{item.unit}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="text-sm text-gray-900">
              {item.description || "No description"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Created At</p>
            <p className="text-sm text-gray-900">
              {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock by Warehouse</CardTitle>
        </CardHeader>
        <CardContent>
          {stock.length === 0 ? (
            <p className="text-sm text-gray-500">
              No stock records found for this item
            </p>
          ) : (
            <Table columns={stockColumns} data={stock} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryItemDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InventoryItemDetailsContent />
    </Suspense>
  );
}
