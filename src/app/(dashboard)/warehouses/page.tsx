"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Plus, Search, Warehouse as WarehouseIcon } from "lucide-react";
import { getWarehouses, deleteWarehouse } from "@/features/inventory/actions";
import type { Warehouse } from "@/features/inventory/types";
import Link from "next/link";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadWarehouses() {
    setLoading(true);
    const data = await getWarehouses(search);
    setWarehouses(data);
    setLoading(false);
  }

  useEffect(() => {
    loadWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this warehouse?")) return;
    try {
      await deleteWarehouse(id);
      loadWarehouses();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to delete warehouse",
      );
    }
  }

  const columns = [
    { key: "name", header: "Name" },
    {
      key: "address",
      header: "Address",
      render: (row: Warehouse) => row.address || "-",
    },
    {
      key: "description",
      header: "Description",
      render: (row: Warehouse) => row.description || "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: Warehouse) => (
        <div className="flex gap-2">
          <Link href={`/warehouses/${row.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
          <Link href={`/warehouses/${row.id}/edit`}>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <Link href="/warehouses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <WarehouseIcon className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Table columns={columns} data={warehouses} />
      )}
    </div>
  );
}
