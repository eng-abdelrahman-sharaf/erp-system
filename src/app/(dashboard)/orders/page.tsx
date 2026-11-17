"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Edit, Trash2, ShoppingCart } from "lucide-react";
import { getOrders, deleteOrder } from "@/features/orders/actions";
import type { OrderWithEmployee } from "@/features/orders/types";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in_progress" | "paid" | "cancelled"
  >("all");
  const [sortBy, setSortBy] = useState("created_at-desc");

  const loadData = async () => {
    setLoading(true);
    setError("");

    const filters: {
      search?: string;
      status?: "pending" | "in_progress" | "paid" | "cancelled";
      sortBy?: string;
    } = {};
    if (searchQuery) filters.search = searchQuery;
    if (statusFilter !== "all") filters.status = statusFilter;
    filters.sortBy = sortBy;

    const data = await getOrders(filters);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, sortBy]);

  const handleDelete = async (orderId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this order? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteOrder(orderId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete order");
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
        <Button onClick={() => router.push("/orders/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Order
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "pending"
                      | "in_progress"
                      | "paid"
                      | "cancelled",
                  )
                }
                options={[
                  { value: "all", label: "All Status" },
                  { value: "pending", label: "Pending" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "paid", label: "Paid" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: "created_at-desc", label: "Newest First" },
                  { value: "created_at-asc", label: "Oldest First" },
                  { value: "order_date-desc", label: "Order Date (Newest)" },
                  { value: "order_date-asc", label: "Order Date (Oldest)" },
                  { value: "order_number-asc", label: "Order Number (A-Z)" },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600">No orders found</p>
          ) : (
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
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {order.order_number}
                        </button>
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
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/orders/${order.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
