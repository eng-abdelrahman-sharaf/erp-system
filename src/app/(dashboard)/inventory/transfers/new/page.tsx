"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  transferInventory,
  getInventoryItems,
  getWarehouses,
} from "@/features/inventory/actions";
import Link from "next/link";

export default function NewTransferPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    item_id: "",
    source_warehouse_id: "",
    destination_warehouse_id: "",
    quantity: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<
    { value: string; label: string; id: string }[]
  >([]);
  const [warehouses, setWarehouses] = useState<
    { value: string; label: string; id: string }[]
  >([]);

  useEffect(() => {
    async function loadFilters() {
      const [itemsData, warehousesData] = await Promise.all([
        getInventoryItems(),
        getWarehouses(),
      ]);

      setItems(
        itemsData.map((i) => ({ value: i.id, label: i.name, id: i.id })),
      );
      setWarehouses(
        warehousesData.map((w) => ({ value: w.id, label: w.name, id: w.id })),
      );
    }

    loadFilters();
  }, []);

  function handleChange(
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | { target: { name: string; value: string } },
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.item_id) newErrors.item_id = "Item is required";
    if (!formData.source_warehouse_id)
      newErrors.source_warehouse_id = "Source warehouse is required";
    if (!formData.destination_warehouse_id)
      newErrors.destination_warehouse_id = "Destination warehouse is required";
    if (formData.source_warehouse_id === formData.destination_warehouse_id)
      newErrors.destination_warehouse_id =
        "Source and destination must be different";
    if (!formData.quantity || parseFloat(formData.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await transferInventory(
        formData.item_id,
        formData.source_warehouse_id,
        formData.destination_warehouse_id,
        parseFloat(formData.quantity),
        formData.notes || undefined,
      );
      toast.success("Transfer completed successfully");
      startTransition(() => router.push("/inventory/transfers"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to transfer inventory",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/inventory/transfers">
          <Button variant="ghost" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeft className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Loading" : "Back"}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Transfer</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Item</label>
          <SelectShadcn
            value={formData.item_id}
            onValueChange={(value) =>
              handleChange({ target: { name: "item_id", value } })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select an item</SelectItem>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <div className="flex flex-col items-start">
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-400">{item.id}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </SelectShadcn>
          {errors.item_id && (
            <span className="text-sm text-red-600">{errors.item_id}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Source Warehouse
          </label>
          <SelectShadcn
            value={formData.source_warehouse_id}
            onValueChange={(value) =>
              handleChange({ target: { name: "source_warehouse_id", value } })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select source warehouse</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.value} value={warehouse.value}>
                  <div className="flex flex-col">
                    <span>{warehouse.label}</span>
                    <span className="text-xs text-gray-400">
                      {warehouse.id}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </SelectShadcn>
          {errors.source_warehouse_id && (
            <span className="text-sm text-red-600">
              {errors.source_warehouse_id}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Destination Warehouse
          </label>
          <SelectShadcn
            value={formData.destination_warehouse_id}
            onValueChange={(value) =>
              handleChange({
                target: { name: "destination_warehouse_id", value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select destination warehouse</SelectItem>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.value} value={warehouse.value}>
                  <div className="flex flex-col">
                    <span>{warehouse.label}</span>
                    <span className="text-xs text-gray-400">
                      {warehouse.id}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </SelectShadcn>
          {errors.destination_warehouse_id && (
            <span className="text-sm text-red-600">
              {errors.destination_warehouse_id}
            </span>
          )}
        </div>

        <Input
          label="Quantity"
          name="quantity"
          type="number"
          step="0.01"
          min="0.01"
          value={formData.quantity}
          onChange={handleChange}
          error={errors.quantity}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="flex min-h-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Transfer"}
          </Button>
          <Link href="/inventory/transfers">
            <Button type="button" variant="secondary" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isPending ? "Loading" : "Cancel"}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
