"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { ArrowLeft, Package } from "lucide-react";
import { getWarehouseTransfers } from "@/features/inventory/actions";
import type { WarehouseTransfer } from "@/features/inventory/types";
import Link from "next/link";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
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
    { key: "item_id", header: "Item ID" },
    { key: "source_warehouse_id", header: "Source Warehouse ID" },
    { key: "destination_warehouse_id", header: "Destination Warehouse ID" },
    {
      key: "quantity",
      header: "Quantity",
      render: (row: WarehouseTransfer) => row.quantity?.toFixed(2) || "0",
    },
    {
      key: "transfer_date",
      header: "Date",
      render: (row: WarehouseTransfer) =>
        new Date(row.transfer_date).toLocaleDateString(),
    },
    {
      key: "notes",
      header: "Notes",
      render: (row: WarehouseTransfer) => row.notes || "-",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory/stock">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Warehouse Transfers
          </h1>
        </div>
        <Link href="/inventory/transfers/new">
          <Button>New Transfer</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Package className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Table columns={columns} data={transfers} />
      )}
    </div>
  );
}
