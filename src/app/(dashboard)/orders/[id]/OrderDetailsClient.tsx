"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppRouter } from "@/hooks/useAppRouter";
import { BackButton } from "@/components/shared/BackButton";
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
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Package,
  FileText,
  Clock,
  User,
  Phone,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getOrder,
  getOrderInventory,
  getOrderNotes,
  getOrderActivityLogs,
  reserveOrderInventory,
  removeOrderInventory,
  changeOrderStatus,
  addOrderNote,
  getInventoryItems,
  getWarehouses,
  getWarehouseStock,
} from "@/features/orders/actions";
import type {
  OrderWithEmployee,
  OrderInventoryWithDetails,
  OrderNoteWithProfile,
  OrderActivityLogWithProfile,
} from "@/features/orders/types";

function OrderDetailsContent() {
  const router = useAppRouter();
  const params = useParams();
  const orderId = params.id as string;

  const isNavigatingEdit = router.isNavigatingTarget("edit");

  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState("");

  const setError = (msg: string) => {
    setErrorState(msg);
    if (msg) toast.error(msg);
  };
  const [order, setOrder] = useState<OrderWithEmployee | null>(null);
  const [inventory, setInventory] = useState<OrderInventoryWithDetails[]>([]);
  const [notes, setNotes] = useState<OrderNoteWithProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<
    OrderActivityLogWithProfile[]
  >([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "notes" | "activity"
  >("overview");

  // Inventory assignment form
  const [inventoryItems, setInventoryItems] = useState<
    { id: string; name: string; sku: string; unit: string }[]
  >([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [inventoryForm, setInventoryForm] = useState({
    item_id: "",
    warehouse_id: "",
    quantity: "",
  });
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [assigningInventory, setAssigningInventory] = useState(false);

  // Notes form
  const [noteContent, setNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Status change
  const [changingStatus, setChangingStatus] = useState(false);

  // Dialog states
  const [removeInventoryDialogOpen, setRemoveInventoryDialogOpen] =
    useState(false);
  const [inventoryToRemove, setInventoryToRemove] = useState<string | null>(
    null,
  );
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [statusToChange, setStatusToChange] = useState<
    "paid" | "cancelled" | null
  >(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          orderData,
          inventoryData,
          notesData,
          activityData,
          itemsData,
          warehousesData,
        ] = await Promise.all([
          getOrder(orderId),
          getOrderInventory(orderId),
          getOrderNotes(orderId),
          getOrderActivityLogs(orderId),
          getInventoryItems(),
          getWarehouses(),
        ]);
        setOrder(orderData);
        setInventory(inventoryData);
        setNotes(notesData);
        setActivityLogs(activityData);
        setInventoryItems(itemsData);
        setWarehouses(warehousesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [orderId]);

  useEffect(() => {
    const loadStock = async () => {
      if (inventoryForm.item_id && inventoryForm.warehouse_id) {
        const stock = await getWarehouseStock(
          inventoryForm.item_id,
          inventoryForm.warehouse_id,
        );
        setAvailableStock(stock?.available_quantity || 0);
      } else {
        setAvailableStock(null);
      }
    };
    loadStock();
  }, [inventoryForm.item_id, inventoryForm.warehouse_id]);

  const handleReserveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigningInventory(true);
    setError("");

    if (
      !inventoryForm.item_id ||
      !inventoryForm.warehouse_id ||
      !inventoryForm.quantity
    ) {
      setError("Please fill in all inventory fields");
      setAssigningInventory(false);
      return;
    }

    const quantity = parseFloat(inventoryForm.quantity);
    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      setAssigningInventory(false);
      return;
    }

    if (availableStock !== null && quantity > availableStock) {
      setError(`Insufficient available stock. Available: ${availableStock}`);
      setAssigningInventory(false);
      return;
    }

    const previousInventory = inventory;
    const selectedItem = inventoryItems.find(
      (i) => i.id === inventoryForm.item_id,
    );
    const selectedWarehouse = warehouses.find(
      (w) => w.id === inventoryForm.warehouse_id,
    );
    const tempOrderInv: OrderInventoryWithDetails = {
      id: `temp-${Date.now()}`,
      order_id: orderId,
      item_id: inventoryForm.item_id,
      warehouse_id: inventoryForm.warehouse_id,
      quantity,
      unit: selectedItem?.unit || "",
      created_at: new Date().toISOString(),
      inventory_items: {
        id: inventoryForm.item_id,
        name: selectedItem?.name || "",
        sku: selectedItem?.sku || "",
      },
      warehouses: {
        id: inventoryForm.warehouse_id,
        name: selectedWarehouse?.name || "",
      },
    };

    // Optimistically update inventory table immediately
    setInventory((prev) => [...prev, tempOrderInv]);
    const savedItemId = inventoryForm.item_id;
    const savedWarehouseId = inventoryForm.warehouse_id;
    setInventoryForm({ item_id: "", warehouse_id: "", quantity: "" });
    setAvailableStock(null);

    try {
      await reserveOrderInventory(
        orderId,
        savedItemId,
        savedWarehouseId,
        quantity,
      );
      toast.success("Inventory reserved successfully");
      const updatedInventory = await getOrderInventory(orderId);
      setInventory(updatedInventory);
      const updatedActivity = await getOrderActivityLogs(orderId);
      setActivityLogs(updatedActivity);
    } catch (err) {
      setInventory(previousInventory);
      setError(
        err instanceof Error ? err.message : "Failed to reserve inventory",
      );
    } finally {
      setAssigningInventory(false);
    }
  };

  const handleRemoveInventory = async (orderInventoryId: string) => {
    setInventoryToRemove(orderInventoryId);
    setRemoveInventoryDialogOpen(true);
  };

  const confirmRemoveInventory = async () => {
    if (!inventoryToRemove) return;
    const id = inventoryToRemove;
    const prevInventory = inventory;

    // Immediate optimistic removal
    setRemoveInventoryDialogOpen(false);
    setInventoryToRemove(null);
    setInventory((prev) => prev.filter((item) => item.id !== id));

    try {
      await removeOrderInventory(id, orderId);
      toast.success("Inventory item removed");
      const updatedInventory = await getOrderInventory(orderId);
      setInventory(updatedInventory);
      const updatedActivity = await getOrderActivityLogs(orderId);
      setActivityLogs(updatedActivity);
    } catch (err) {
      setInventory(prevInventory);
      setError(
        err instanceof Error ? err.message : "Failed to remove inventory",
      );
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingNote(true);
    setError("");

    if (!noteContent.trim()) {
      setError("Note content cannot be empty");
      setAddingNote(false);
      return;
    }

    try {
      await addOrderNote(orderId, noteContent);
      const updatedNotes = await getOrderNotes(orderId);
      setNotes(updatedNotes);
      const updatedActivity = await getOrderActivityLogs(orderId);
      setActivityLogs(updatedActivity);
      setNoteContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleStartProgress = async () => {
    setChangingStatus(true);
    setError("");

    try {
      await changeOrderStatus(orderId, "in_progress");
      const updatedOrder = await getOrder(orderId);
      setOrder(updatedOrder);
      const updatedActivity = await getOrderActivityLogs(orderId);
      setActivityLogs(updatedActivity);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError("Failed to change status");
      }
    } finally {
      setChangingStatus(false);
    }
  };

  const handleChangeStatus = async (newStatus: "paid" | "cancelled") => {
    setStatusToChange(newStatus);
    setStatusChangeDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!statusToChange) return;

    setChangingStatus(true);
    setError("");

    try {
      await changeOrderStatus(orderId, statusToChange);
      const updatedOrder = await getOrder(orderId);
      setOrder(updatedOrder);
      const updatedActivity = await getOrderActivityLogs(orderId);
      setActivityLogs(updatedActivity);
      setStatusChangeDialogOpen(false);
      setStatusToChange(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError("Failed to change status");
      }
      setStatusChangeDialogOpen(false);
      setStatusToChange(null);
    } finally {
      setChangingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  if (!order) {
    return <div className="text-red-600">Order not found</div>;
  }

  const canEdit = order.status === "pending" || order.status === "in_progress";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton href="/orders" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {order.order_number}
            </h1>
            <p className="text-sm text-gray-600">{order.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (!canEdit) return;
              router.push(`/orders/${orderId}/edit`, { target: "edit" });
            }}
            disabled={!canEdit || isNavigatingEdit}
            title={
              !canEdit
                ? "Paid and cancelled orders cannot be edited"
                : "Edit Order"
            }
          >
            {isNavigatingEdit ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isNavigatingEdit ? "Loading" : "Edit Order"}
          </Button>
          {order.status === "pending" && (
            <Button onClick={handleStartProgress} disabled={changingStatus}>
              Start Progress
            </Button>
          )}
          {(order.status === "pending" || order.status === "in_progress") && (
            <>
              <Button
                onClick={() => handleChangeStatus("paid")}
                disabled={changingStatus || inventory.length === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
              <Button
                variant="danger"
                onClick={() => handleChangeStatus("cancelled")}
                disabled={changingStatus}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex gap-4">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("overview")}
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === "overview"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShoppingCart className="mr-1 inline h-4 w-4" />
            Overview
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("inventory")}
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === "inventory"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package className="mr-1 inline h-4 w-4" />
            Inventory ({inventory.length})
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("notes")}
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === "notes"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="mr-1 inline h-4 w-4" />
            Notes ({notes.length})
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("activity")}
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === "activity"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock className="mr-1 inline h-4 w-4" />
            Activity ({activityLogs.length})
          </Button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Order Date
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Assigned Employee
                  </p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {order.employees?.full_name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Created At
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {order.description && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">
                    Description
                  </p>
                  <p className="text-sm text-gray-900">{order.description}</p>
                </div>
              )}
              {order.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">
                    Order Notes
                  </p>
                  <p className="text-sm text-gray-900">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Client Name
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {order.client_name}
                  </p>
                </div>
                {order.client_phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {order.client_phone}
                    </p>
                  </div>
                )}
                {order.client_address && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {order.client_address}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReserveInventory} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Inventory Item
                      </label>
                      <SelectShadcn
                        value={inventoryForm.item_id}
                        onValueChange={(value) =>
                          setInventoryForm({
                            ...inventoryForm,
                            item_id: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              <div className="flex flex-col items-start">
                                <span>
                                  {item.name} ({item.sku}) - {item.unit}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.id}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectShadcn>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Warehouse
                      </label>
                      <SelectShadcn
                        value={inventoryForm.warehouse_id}
                        onValueChange={(value) =>
                          setInventoryForm({
                            ...inventoryForm,
                            warehouse_id: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              <div className="flex flex-col items-start">
                                <span>{wh.name}</span>
                                <span className="text-xs text-gray-400">
                                  {wh.id}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectShadcn>
                    </div>
                    <Input
                      label="Quantity"
                      type="number"
                      step="0.01"
                      value={inventoryForm.quantity}
                      onChange={(e) =>
                        setInventoryForm({
                          ...inventoryForm,
                          quantity: e.target.value,
                        })
                      }
                      placeholder="Enter quantity"
                    />
                  </div>
                  {availableStock !== null && (
                    <p className="text-sm text-gray-600">
                      Available stock:{" "}
                      <span className="font-medium">{availableStock}</span>
                    </p>
                  )}
                  <Button type="submit" disabled={assigningInventory}>
                    <Plus className="mr-2 h-4 w-4" />
                    {assigningInventory ? "Reserving..." : "Reserve Inventory"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Assigned Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <p className="text-gray-600">
                  No inventory assigned to this order
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Item
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Warehouse
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Unit
                        </th>
                        {canEdit && (
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((inv) => (
                        <tr
                          key={inv.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-500 shrink-0" />
                              <div>
                                <div className="font-medium">
                                  {inv.inventory_items.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {inv.inventory_items.sku}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {inv.warehouses.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                            {inv.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {inv.unit}
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveInventory(inv.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Content
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter your note..."
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" disabled={addingNote}>
                  {addingNote ? "Adding..." : "Add Note"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-gray-600">No notes added to this order</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-md border border-gray-200 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {note.profiles?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <p className="text-gray-600">
                No activity recorded for this order
              </p>
            ) : (
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-4 border-b border-gray-100 pb-4 last:border-0"
                  >
                    <div className="shrink-0">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {log.activity_type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">{log.description}</p>
                      {log.profiles && (
                        <p className="mt-1 text-xs text-gray-500">
                          by {log.profiles.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Remove Inventory Dialog */}
      <AlertDialog
        open={removeInventoryDialogOpen}
        onOpenChange={setRemoveInventoryDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Inventory Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this inventory assignment? This
              will release the reserved stock back to available inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveInventory}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <AlertDialog
        open={statusChangeDialogOpen}
        onOpenChange={setStatusChangeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusToChange === "paid" ? "Mark as Paid" : "Cancel Order"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this order as {statusToChange}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              {statusToChange === "paid" ? "Mark as Paid" : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderDetailsContent />
    </Suspense>
  );
}
