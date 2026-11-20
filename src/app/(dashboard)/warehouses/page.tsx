"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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
import { Plus, Search, Warehouse as WarehouseIcon, Trash2 } from "lucide-react";
import { ViewButton, EditButton } from "@/components/shared/NavigationActions";
import { getWarehouses, deleteWarehouse } from "@/features/inventory/actions";
import type { Warehouse } from "@/features/inventory/types";
import Link from "next/link";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const id = deleteId;
    const prevWarehouses = warehouses;

    // Immediate UI update
    setDeleteId(null);
    setWarehouses((prev) => prev.filter((w) => w.id !== id));

    try {
      await deleteWarehouse(id);
      toast.success("Warehouse deleted successfully");
      const data = await getWarehouses(search);
      setWarehouses(data);
    } catch (error) {
      setWarehouses(prevWarehouses);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete warehouse",
      );
    }
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row: Warehouse) => (
        <Link
          href={`/warehouses/${row.id}`}
          className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
        >
          <WarehouseIcon className="h-4 w-4" />
          {row.name}
        </Link>
      ),
    },
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
          <ViewButton
            href={`/warehouses/${row.id}`}
            title="View Warehouse"
          />
          <EditButton
            href={`/warehouses/${row.id}/edit`}
            title="Edit Warehouse"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            title="Delete Warehouse"
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
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <Link href="/warehouses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Warehouses</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <WarehouseIcon className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table columns={columns} data={warehouses} />
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this warehouse?
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
    </div>
  );
}
