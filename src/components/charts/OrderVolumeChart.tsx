"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { OrderVolumeData } from "@/features/analytics/types";

interface OrderVolumeChartProps {
  data: OrderVolumeData[];
}

export function OrderVolumeChart({ data }: OrderVolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No data available for the selected date range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) =>
            new Date(value).toLocaleDateString()
          }
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => {
            if (typeof value === "string") {
              return new Date(value).toLocaleDateString();
            }
            return "";
          }}
          formatter={(value) => [value, "Orders"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
