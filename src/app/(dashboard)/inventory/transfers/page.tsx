"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { ArrowRightLeft, Package, Plus } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import { getWarehouseTransfers } from "@/features/inventory/actions";
import type { WarehouseTransfer } from "@/features/inventory/types";

interface WarehouseTransferWithNames extends WarehouseTransfer {
  inventory_items?: { name: string; sku: string } | null;
  source_warehouse?: { name: string } | null;
  destination_warehouse?: { name: string } | null;
  profiles?: { full_name: string } | null;
}
import Link from "next/link";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<WarehouseTransferWithNames[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransfers() {
      setLoading(true);
      const data = await getWarehouseTransfers({});
      setTransfers(data);
      setLoading(false);
    }

    loadTransfers();
  }, []);

  const columns = [
    {
      key: "item",
      header: "Item",
      render: (row: WarehouseTransferWithNames) => (
        <span className="flex items-center gap-2 font-medium text-gray-900">
          <Package className="h-4 w-4 text-gray-500" />
          {row.inventory_items?.name || row.item_id}
        </span>
      ),
    },
    {
      key: "source_warehouse",
      header: "Source Warehouse",
      render: (row: WarehouseTransferWithNames) =>
        row.source_warehouse?.name || row.source_warehouse_id,
    },
    {
      key: "destination_warehouse",
      header: "Destination Warehouse",
      render: (row: WarehouseTransferWithNames) =>
        row.destination_warehouse?.name || row.destination_warehouse_id,
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (row: WarehouseTransferWithNames) =>
        row.quantity?.toFixed(2) || "0",
    },
    {
      key: "transfer_date",
      header: "Date",
      render: (row: WarehouseTransferWithNames) =>
        new Date(row.transfer_date).toLocaleDateString(),
    },
    {
      key: "notes",
      header: "Notes",
      render: (row: WarehouseTransferWithNames) => row.notes || "-",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton href="/inventory/stock" label="Back" />
          <h1 className="text-2xl font-bold text-gray-900">
            Warehouse Transfers
          </h1>
        </div>
        <Link href="/inventory/transfers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transfers</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Package className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table columns={columns} data={transfers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
