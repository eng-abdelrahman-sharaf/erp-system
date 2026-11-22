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
  transferInventory,
  getInventoryItems,
  getWarehouses,
} from "@/features/inventory/actions";
import { TransferInventorySchema } from "@/lib/validations";

export default function NewTransferPage() {
  const router = useAppRouter();
  const [formData, setFormData] = useState({
    item_id: "",
    source_warehouse_id: "",
    destination_warehouse_id: "",
    quantity: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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

    // Validate using Zod schema
    const validationResult = TransferInventorySchema.safeParse({
      p_item_id: formData.item_id,
      p_source_warehouse_id: formData.source_warehouse_id,
      p_destination_warehouse_id: formData.destination_warehouse_id,
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

    router.startNavigation("transfer");
    try {
      await transferInventory(
        validationResult.data.p_item_id,
        validationResult.data.p_source_warehouse_id,
        validationResult.data.p_destination_warehouse_id,
        validationResult.data.p_quantity,
        validationResult.data.p_notes ?? undefined,
      );
      toast.success("Transfer completed successfully");
      router.push("/inventory/transfers");
    } catch (error) {
      router.stopNavigation();
      toast.error(
        error instanceof Error ? error.message : "Failed to transfer inventory",
      );
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <BackButton label="Back" />
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
          <Button
            type="submit"
            disabled={router.isNavigatingTarget("transfer")}
          >
            {router.isNavigatingTarget("transfer")
              ? "Processing..."
              : "Transfer"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              router.push("/inventory/transfers", { target: "cancel" })
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
