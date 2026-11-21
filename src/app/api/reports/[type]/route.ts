import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions/permissions";
import { ReportType, ReportFilters } from "@/lib/reports/types";
import {
  fetchOrdersReportData,
  fetchInventoryReportData,
  fetchInventoryActivityReportData,
  fetchEmployeeReportData,
  fetchPayrollReportData,
} from "@/lib/reports/data-fetchers";
import { generateReportBuffer } from "@/lib/reports/generator";

const VALID_REPORT_TYPES: ReportType[] = [
  "orders",
  "inventory",
  "inventory-activity",
  "employees",
  "payroll",
];

const REQUIRED_MODULE_PERMISSION: Record<
  ReportType,
  "orders" | "inventory" | "employees"
> = {
  orders: "orders",
  inventory: "inventory",
  "inventory-activity": "inventory",
  employees: "employees",
  payroll: "employees",
};

async function handleReportRequest(
  typeParam: string,
  filters: ReportFilters,
) {
  const reportType = typeParam as ReportType;

  if (!VALID_REPORT_TYPES.includes(reportType)) {
    return NextResponse.json(
      {
        error: `Invalid report type "${typeParam}". Valid types are: ${VALID_REPORT_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized: You must be logged in to generate reports." },
      { status: 401 },
    );
  }

  // 2. Validate permissions
  const requiredModule = REQUIRED_MODULE_PERMISSION[reportType];
  const canRead = await hasPermission(requiredModule, "read");

  if (!canRead) {
    return NextResponse.json(
      {
        error: `Forbidden: You do not have permission to view ${requiredModule} reports.`,
      },
      { status: 403 },
    );
  }

  // 3. Resolve human-readable filter names if IDs provided
  const enrichedFilters: ReportFilters = { ...filters };

  if (filters.warehouseId && !filters.warehouseName) {
    const { data: wh } = await supabase
      .from("warehouses")
      .select("name")
      .eq("id", filters.warehouseId)
      .single();
    if (wh) enrichedFilters.warehouseName = wh.name;
  }

  if (filters.employeeId && !filters.employeeName) {
    const { data: emp } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", filters.employeeId)
      .single();
    if (emp) enrichedFilters.employeeName = emp.full_name;
  }

  // 4. Retrieve data from Supabase
  let reportData: any;
  const generationDate = new Date().toISOString();

  try {
    switch (reportType) {
      case "orders":
        reportData = await fetchOrdersReportData(supabase, enrichedFilters);
        break;
      case "inventory":
        reportData = await fetchInventoryReportData(supabase, enrichedFilters);
        break;
      case "inventory-activity":
        reportData = await fetchInventoryActivityReportData(
          supabase,
          enrichedFilters,
        );
        break;
      case "employees":
        reportData = await fetchEmployeeReportData(supabase, enrichedFilters);
        break;
      case "payroll":
        reportData = await fetchPayrollReportData(supabase, enrichedFilters);
        break;
    }
  } catch (dataError: any) {
    console.error("Data fetch error during report generation:", dataError);
    return NextResponse.json(
      { error: dataError.message || "Failed to retrieve report data" },
      { status: 500 },
    );
  }

  // 5. Generate PDF buffer
  try {
    const pdfBuffer = await generateReportBuffer(
      reportType,
      reportData,
      enrichedFilters,
      generationDate,
    );

    const dateStr = generationDate.split("T")[0];
    const filename = `${reportType}-report-${dateStr}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (pdfError: any) {
    console.error("PDF generation error:", pdfError);
    return NextResponse.json(
      { error: "Failed to generate PDF document" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const searchParams = request.nextUrl.searchParams;

  const filters: ReportFilters = {};
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const warehouseId = searchParams.get("warehouseId");
  const employeeId = searchParams.get("employeeId");
  const orderStatus = searchParams.get("orderStatus");

  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (warehouseId) filters.warehouseId = warehouseId;
  if (employeeId) filters.employeeId = employeeId;
  if (orderStatus) filters.orderStatus = orderStatus;

  return handleReportRequest(type, filters);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  let filters: ReportFilters = {};

  try {
    const body = await request.json();
    if (body && typeof body === "object") {
      filters = body;
    }
  } catch {
    // Body is optional or empty
  }

  return handleReportRequest(type, filters);
}
