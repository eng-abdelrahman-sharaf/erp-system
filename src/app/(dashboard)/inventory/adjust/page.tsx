"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ArrowLeft } from "lucide-react";
import {
  adjustInventory,
  getInventoryItems,
  getWarehouses,
} from "@/features/inventory/actions";
import Link from "next/link";

export default function StockAdjustPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    item_id: "",
    warehouse_id: "",
    activity_type: "addition" as "addition" | "manual_usage",
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
    if (!formData.warehouse_id)
      newErrors.warehouse_id = "Warehouse is required";
    if (!formData.quantity || parseFloat(formData.quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await adjustInventory(
        formData.item_id,
        formData.warehouse_id,
        formData.activity_type,
        parseFloat(formData.quantity),
        formData.notes || undefined,
      );
      router.push("/inventory/stock");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/inventory/stock">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Adjust Stock</h1>
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
          label="Warehouse"
          name="warehouse_id"
          options={[{ value: "", label: "Select a warehouse" }, ...warehouses]}
          value={formData.warehouse_id}
          onChange={handleChange}
          error={errors.warehouse_id}
          required
        />

        <Select
          label="Activity Type"
          name="activity_type"
          options={[
            { value: "addition", label: "Add Stock" },
            { value: "manual_usage", label: "Manual Usage" },
          ]}
          value={formData.activity_type}
          onChange={handleChange}
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
            {loading ? "Processing..." : "Adjust Stock"}
          </Button>
          <Link href="/inventory/stock">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
