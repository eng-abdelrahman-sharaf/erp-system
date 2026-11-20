"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import { Table } from "@/components/ui/Table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Plus, Search, Package, Trash2 } from "lucide-react";
import { ViewButton, EditButton } from "@/components/shared/NavigationActions";
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
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const id = deleteId;
    const prevItems = items;

    // Immediate UI update
    setDeleteId(null);
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteInventoryItem(id);
      toast.success("Item deleted successfully");
      const data = await getInventoryItems(search, sortBy);
      setItems(data);
    } catch (error) {
      setItems(prevItems);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item",
      );
    }
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row: InventoryItem) => (
        <Link
          href={`/inventory/items/${row.id}`}
          className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
        >
          <Package className="h-4 w-4" />
          {row.name}
        </Link>
      ),
    },
    { key: "sku", header: "SKU" },
    { key: "unit", header: "Unit" },
    {
      key: "created_at",
      header: "Date Added",
      render: (row: InventoryItem) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-",
    },
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
          <ViewButton
            href={`/inventory/items/${row.id}`}
            title="View Item"
          />
          <EditButton
            href={`/inventory/items/${row.id}/edit`}
            title="Edit Item"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            title="Delete Item"
          >
            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Inventory Items</CardTitle>
            <div className="flex flex-1 items-center justify-end gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <SelectShadcn
                value={sortBy}
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="sku-asc">SKU (A-Z)</SelectItem>
                  <SelectItem value="sku-desc">SKU (Z-A)</SelectItem>
                </SelectContent>
              </SelectShadcn>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Package className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table columns={columns} data={items} />
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
