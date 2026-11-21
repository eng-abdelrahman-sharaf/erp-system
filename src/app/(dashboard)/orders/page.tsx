"use client";

import { useState, useEffect } from "react";
import { useAppRouter } from "@/hooks/useAppRouter";
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
import { Plus, Edit, Trash2, ShoppingCart, Loader2, Eye } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getOrders, deleteOrder } from "@/features/orders/actions";
import type { OrderWithEmployee } from "@/features/orders/types";
import { Pagination } from "@/components/shared/Pagination";

const PAGE_SIZE = 8;

export default function OrdersPage() {
  const router = useAppRouter();
  const [orders, setOrders] = useState<OrderWithEmployee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const isAddingOrder = router.isNavigatingTarget("new");
  const isNavigatingOrder = (id: string) =>
    router.isNavigatingTarget(`view-${id}`);
  const isNavigatingEdit = (id: string) =>
    router.isNavigatingTarget(`edit-${id}`);

  const setError = (msg: string) => {
    if (msg) toast.error(msg);
  };

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in_progress" | "paid" | "cancelled"
  >("all");
  const [sortBy, setSortBy] = useState("created_at-desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const loadData = async (pageNum = page, showLoading = true) => {
    if (showLoading) setLoading(true);

    const filters: {
      search?: string;
      status?: "pending" | "in_progress" | "paid" | "cancelled";
      sortBy?: string;
      page?: number;
      pageSize?: number;
    } = {
      page: pageNum,
      pageSize: PAGE_SIZE,
    };
    if (searchQuery) filters.search = searchQuery;
    if (statusFilter !== "all") filters.status = statusFilter;
    filters.sortBy = sortBy;

    try {
      const res = await getOrders(filters);
      setOrders(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    loadData(page, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    const id = orderToDelete;
    const previousOrders = orders;

    // Immediate optimistic deletion
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
    setOrders((prev) => prev.filter((o) => o.id !== id));

    try {
      await deleteOrder(id);
      toast.success("Order deleted successfully");
      loadData(page, false);
    } catch (err) {
      // Revert on error
      setOrders(previousOrders);
      const msg = err instanceof Error ? err.message : "Failed to delete order";
      setError(msg);
      toast.error(msg);
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Button
          onClick={() => {
            router.push("/orders/new", { target: "new" });
          }}
          disabled={isAddingOrder}
        >
          {isAddingOrder ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAddingOrder ? "Loading" : "Add Order"}
        </Button>
      </div>



      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Orders</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <SelectShadcn
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(
                    value as
                      | "all"
                      | "pending"
                      | "in_progress"
                      | "paid"
                      | "cancelled",
                  )
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </SelectShadcn>
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
                  <SelectItem value="order_date-desc">
                    Order Date (Newest)
                  </SelectItem>
                  <SelectItem value="order_date-asc">
                    Order Date (Oldest)
                  </SelectItem>
                  <SelectItem value="order_number-asc">
                    Order Number (A-Z)
                  </SelectItem>
                </SelectContent>
              </SelectShadcn>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600">No orders found</p>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Order Number
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Order Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const canEdit =
                      order.status === "pending" || order.status === "in_progress";
                    const canDelete = false;

                    const getDeleteTitle = () => {
                      if (order.status === "paid")
                        return "Paid orders cannot be deleted";
                      if (order.status === "cancelled")
                        return "Cancelled orders cannot be deleted";
                      return "Orders cannot be deleted once created to preserve audit history. Cancel the order instead.";
                    };

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              router.push(`/orders/${order.id}`, {
                                target: `view-${order.id}`,
                              });
                            }}
                            className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
                            disabled={isNavigatingOrder(order.id)}
                          >
                            {isNavigatingOrder(order.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="h-4 w-4" />
                            )}
                            {order.order_number}
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {order.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>
                            <div className="font-medium">{order.client_name}</div>
                            {order.client_phone && (
                              <div className="text-xs text-gray-500">
                                {order.client_phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {order.employees?.full_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                router.push(`/orders/${order.id}`, {
                                  target: `view-${order.id}`,
                                });
                              }}
                              disabled={isNavigatingOrder(order.id)}
                              title="View Order"
                            >
                              {isNavigatingOrder(order.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                router.push(`/orders/${order.id}/edit`, {
                                  target: `edit-${order.id}`,
                                });
                              }}
                              disabled={!canEdit || isNavigatingEdit(order.id)}
                              title={
                                !canEdit
                                  ? "Paid and cancelled orders cannot be edited"
                                  : "Edit Order"
                              }
                            >
                              {isNavigatingEdit(order.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Edit
                                  className={cn(
                                    "h-4 w-4",
                                    canEdit ? "text-gray-600" : "text-gray-300",
                                  )}
                                />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(order.id)}
                              disabled={!canDelete}
                              title={getDeleteTitle()}
                            >
                              <Trash2
                                className={cn(
                                  "h-4 w-4",
                                  canDelete
                                    ? "text-red-500 hover:text-red-700"
                                    : "text-gray-300",
                                )}
                              />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be
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
    </div>
  );
}
