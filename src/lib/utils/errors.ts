/**
 * Formats database errors into user-friendly and readable messages.
 * In particular, handles Postgres unique constraint violations (code 23505)
 * and formats them clearly rather than exposing raw database constraint messages.
 */
export function formatDatabaseError(error: unknown): string {
  if (!error) return "An unexpected error occurred";

  const errObj = error as {
    code?: string;
    message?: string;
    detail?: string;
    details?: string;
  };

  const message =
    typeof error === "string"
      ? error
      : errObj.message || (error instanceof Error ? error.message : "");
  const code = errObj.code;
  const detail = errObj.detail || errObj.details || "";

  const isUniqueViolation =
    code === "23505" ||
    message.includes("unique constraint") ||
    message.includes("duplicate key value") ||
    detail.includes("already exists");

  if (isUniqueViolation) {
    const combined = `${message} ${detail}`.toLowerCase();

    // Table / constraint specific mappings
    if (
      combined.includes("employees_email_key") ||
      (combined.includes("employees") && combined.includes("email"))
    ) {
      return "An employee with this email already exists.";
    }

    if (
      combined.includes("warehouses_name_key") ||
      (combined.includes("warehouses") && combined.includes("name"))
    ) {
      return "A warehouse with this name already exists.";
    }

    if (
      combined.includes("inventory_items_sku_key") ||
      combined.includes("inventory_items_sku") ||
      (combined.includes("inventory_items") && combined.includes("sku")) ||
      (combined.includes("items") && combined.includes("sku"))
    ) {
      return "An inventory item with this SKU already exists.";
    }

    if (
      combined.includes("orders_order_number_key") ||
      (combined.includes("orders") && combined.includes("order_number"))
    ) {
      return "An order with this order number already exists.";
    }

    if (
      combined.includes("profiles_email_key") ||
      combined.includes("users_email_key") ||
      (combined.includes("profiles") && combined.includes("email")) ||
      (combined.includes("users") && combined.includes("email"))
    ) {
      return "A user with this email already exists.";
    }

    if (
      combined.includes("roles_name_key") ||
      (combined.includes("roles") && combined.includes("name"))
    ) {
      return "A role with this name already exists.";
    }

    if (
      combined.includes("payroll_periods") ||
      combined.includes("period_start")
    ) {
      return "A payroll period for this employee and date range already exists.";
    }

    if (
      combined.includes("order_inventory") ||
      combined.includes("order_id_item_id_warehouse_id")
    ) {
      return "This item is already assigned to the order from this warehouse.";
    }

    if (
      combined.includes("warehouse_stock") ||
      combined.includes("item_id_warehouse_id")
    ) {
      return "Stock record for this item in this warehouse already exists.";
    }

    // Generic extraction from Postgres detail string: e.g. "Key (email)=(...) already exists."
    const detailMatch =
      detail.match(/Key \((.*?)\)=\((.*?)\) already exists/i) ||
      message.match(/Key \((.*?)\)=\((.*?)\) already exists/i);
    if (detailMatch) {
      const field = detailMatch[1].replace(/_/g, " ");
      return `A record with this ${field} already exists.`;
    }

    // Generic extraction from constraint name: e.g. constraint "table_field_key"
    const constraintMatch = message.match(
      /violates unique constraint "([a-zA-Z0-9_]+)"/i
    );
    if (constraintMatch) {
      const parts = constraintMatch[1].split("_");
      if (parts.length >= 3 && parts[parts.length - 1] === "key") {
        const field = parts.slice(1, parts.length - 1).join(" ");
        return `A record with this ${field} already exists.`;
      }
    }

    return "A record with this value already exists.";
  }

  const isForeignKeyViolation =
    code === "23503" ||
    message.includes("violates foreign key constraint") ||
    message.includes("is still referenced from table") ||
    detail.includes("is still referenced from table");

  if (isForeignKeyViolation) {
    const combined = `${message} ${detail}`.toLowerCase();

    if (combined.includes("warehouse_stock")) {
      return "This item cannot be deleted because it is currently in use in warehouse stock.";
    }
    if (combined.includes("order_inventory")) {
      return "This item cannot be deleted because it is currently assigned to orders.";
    }
    if (combined.includes("inventory_activity_logs")) {
      return "This item cannot be deleted because it is referenced in inventory activity logs.";
    }
    if (combined.includes("orders")) {
      return "This record cannot be deleted because it is referenced by existing orders.";
    }
    if (combined.includes("profiles") || combined.includes("users")) {
      return "This record cannot be deleted because it is currently assigned to users.";
    }
    if (combined.includes("payroll")) {
      return "This record cannot be deleted because it is referenced by payroll records.";
    }

    const tableMatch =
      detail.match(/referenced from table "([^"]+)"/i) ||
      message.match(/on table "([^"]+)"/i);
    if (tableMatch) {
      const referencedTable = tableMatch[1].replace(/_/g, " ");
      return `This element cannot be deleted because it is currently being used in ${referencedTable}.`;
    }

    return "This element cannot be deleted because it is currently being used elsewhere.";
  }

  return message || "An unexpected error occurred";
}
