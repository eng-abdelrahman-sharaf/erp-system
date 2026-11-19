"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { ArrowLeft, Edit, Warehouse as WarehouseIcon } from "lucide-react";
import { getWarehouse, getWarehouseStock } from "@/features/inventory/actions";
import type { Warehouse, InventorySummary } from "@/features/inventory/types";
import Link from "next/link";

function WarehouseDetailsContent() {
  const params = useParams();
  const warehouseId = params.id as string;

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [stock, setStock] = useState<InventorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [warehouseData, stockData] = await Promise.all([
          getWarehouse(warehouseId),
          getWarehouseStock(warehouseId),
        ]);
        setWarehouse(warehouseData);
        setStock(
          stockData.filter((s) => s.total_quantity && s.total_quantity > 0),
        );
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [warehouseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <WarehouseIcon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!warehouse) {
    return <div>Warehouse not found</div>;
  }

  const stockColumns = [
    { key: "item_name", header: "Item" },
    { key: "sku", header: "SKU" },
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
          <Link href="/warehouses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
        </div>
        <Link href={`/warehouses/${warehouse.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Warehouse
          </Button>
        </Link>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Warehouse Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-sm text-gray-900">
              {warehouse.address || "No address"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Created At</p>
            <p className="text-sm text-gray-900">
              {new Date(warehouse.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="text-sm text-gray-900">
              {warehouse.description || "No description"}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Inventory Stock
        </h2>
        {stock.length === 0 ? (
          <p className="text-sm text-gray-500">
            No stock records found for this warehouse
          </p>
        ) : (
          <Table columns={stockColumns} data={stock} />
        )}
      </div>
    </div>
  );
}

export default function WarehouseDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WarehouseDetailsContent />
    </Suspense>
  );
}
