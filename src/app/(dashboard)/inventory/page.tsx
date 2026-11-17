"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Plus, Search, Package } from "lucide-react";
import {
  getInventoryItems,
  deleteInventoryItem,
} from "@/features/inventory/actions";
import type { InventoryItem } from "@/features/inventory/types";
import Link from "next/link";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at-desc");
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    setLoading(true);
    const data = await getInventoryItems(search, sortBy);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteInventoryItem(id);
      loadItems();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete item");
    }
  }

  const columns = [
    { key: "name", header: "Name" },
    { key: "sku", header: "SKU" },
    { key: "unit", header: "Unit" },
    {
      key: "description",
      header: "Description",
      render: (row: InventoryItem) => row.description || "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: InventoryItem) => (
        <div className="flex gap-2">
          <Link href={`/inventory/items/${row.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
          <Link href={`/inventory/items/${row.id}/edit`}>
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
        <h1 className="text-2xl font-bold text-gray-900">Inventory Items</h1>
        <Link href="/inventory/items/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="sku-asc">SKU (A-Z)</option>
          <option value="sku-desc">SKU (Z-A)</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Package className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Table columns={columns} data={items} />
      )}

      <div className="mt-6 flex gap-4">
        <Link href="/inventory/stock">
          <Button variant="secondary">Stock Overview</Button>
        </Link>
        <Link href="/inventory/activity">
          <Button variant="secondary">Activity Logs</Button>
        </Link>
        <Link href="/inventory/transfers">
          <Button variant="secondary">Transfers</Button>
        </Link>
      </div>
    </div>
  );
}
