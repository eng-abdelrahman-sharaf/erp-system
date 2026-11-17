"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ArrowLeft } from "lucide-react";
import {
  transferInventory,
  getInventoryItems,
  getWarehouses,
} from "@/features/inventory/actions";
import Link from "next/link";

export default function NewTransferPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    item_id: "",
    source_warehouse_id: "",
    destination_warehouse_id: "",
    quantity: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ value: string; label: string }[]>([]);
  const [warehouses, setWarehouses] = useState<
    { value: string; label: string }[]
  >([]);

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

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
      router.push("/inventory/transfers");
    } catch (error) {
      alert(
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
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Transfer</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Select
          label="Item"
          name="item_id"
          options={[{ value: "", label: "Select an item" }, ...items]}
          value={formData.item_id}
          onChange={handleChange}
          error={errors.item_id}
          required
        />

        <Select
          label="Source Warehouse"
          name="source_warehouse_id"
          options={[
            { value: "", label: "Select source warehouse" },
            ...warehouses,
          ]}
          value={formData.source_warehouse_id}
          onChange={handleChange}
          error={errors.source_warehouse_id}
          required
        />

        <Select
          label="Destination Warehouse"
          name="destination_warehouse_id"
          options={[
            { value: "", label: "Select destination warehouse" },
            ...warehouses,
          ]}
          value={formData.destination_warehouse_id}
          onChange={handleChange}
          error={errors.destination_warehouse_id}
          required
        />

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
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
