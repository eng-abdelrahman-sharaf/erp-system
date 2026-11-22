"use client";

import { useState, useEffect } from "react";
import { useAppRouter } from "@/hooks/useAppRouter";
import { BackButton } from "@/components/shared/BackButton";
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
import {
  adjustInventory,
  getInventoryItems,
  getWarehouses,
} from "@/features/inventory/actions";
import { AdjustInventorySchema } from "@/lib/validations";

export default function StockAdjustPage() {
  const router = useAppRouter();
  const [formData, setFormData] = useState({
    item_id: "",
    warehouse_id: "",
    activity_type: "addition" as "addition" | "manual_usage",
    quantity: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate using Zod schema
    const validationResult = AdjustInventorySchema.safeParse({
      p_item_id: formData.item_id,
      p_warehouse_id: formData.warehouse_id,
      p_activity: formData.activity_type,
      p_quantity: parseFloat(formData.quantity),
      p_notes: formData.notes || undefined,
    });

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          const field = issue.path[0] as string;
          if (field.startsWith("p_")) {
            newErrors[field.replace("p_", "")] = issue.message;
          } else {
            newErrors[field] = issue.message;
          }
        }
      });
      setErrors(newErrors);
      return;
    }

    router.startNavigation("adjust");
    try {
      await adjustInventory(
        validationResult.data.p_item_id,
        validationResult.data.p_warehouse_id,
        validationResult.data.p_activity,
        validationResult.data.p_quantity,
        validationResult.data.p_notes ?? undefined,
      );
      toast.success("Stock adjusted successfully");
      router.push("/inventory/stock");
    } catch (error) {
      router.stopNavigation();
      toast.error(
        error instanceof Error ? error.message : "Failed to adjust stock",
      );
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <BackButton label="Back" />
        <h1 className="text-2xl font-bold text-gray-900">Adjust Stock</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Item <span className="text-red-500">*</span>
          </label>
          <SelectShadcn
            value={formData.item_id}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, item_id: value }));
              if (errors.item_id)
                setErrors((prev) => ({ ...prev, item_id: "" }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
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
            Warehouse <span className="text-red-500">*</span>
          </label>
          <SelectShadcn
            value={formData.warehouse_id}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, warehouse_id: value }));
              if (errors.warehouse_id)
                setErrors((prev) => ({ ...prev, warehouse_id: "" }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((wh) => (
                <SelectItem key={wh.value} value={wh.value}>
                  {wh.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectShadcn>
          {errors.warehouse_id && (
            <span className="text-sm text-red-600">{errors.warehouse_id}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Activity Type <span className="text-red-500">*</span>
          </label>
          <SelectShadcn
            value={formData.activity_type}
            onValueChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                activity_type: value as "addition" | "manual_usage",
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="addition">Add Stock</SelectItem>
              <SelectItem value="manual_usage">Manual Usage</SelectItem>
            </SelectContent>
          </SelectShadcn>
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
          <Button type="submit" disabled={router.isNavigatingTarget("adjust")}>
            {router.isNavigatingTarget("adjust")
              ? "Processing..."
              : "Adjust Stock"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              router.push("/inventory/stock", { target: "cancel" })
            }
            disabled={router.isNavigatingTarget("cancel")}
          >
            {router.isNavigatingTarget("cancel") ? "Loading..." : "Cancel"}
          </Button>
        </div>
      </form>
    </div>
  );
}
