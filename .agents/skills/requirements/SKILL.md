
---
name: erp-development
description: Develop and maintain a Next.js and Supabase ERP system covering inventory, warehouses, employees, payroll, users and roles, orders, analytics, and reporting. Use when implementing features, modifying database schemas, writing migrations or RPCs, handling business logic, reviewing code, or debugging any ERP module.
---

# ERP Development Skill

## 1. Project Overview

Build and maintain a centralized ERP system for managing:

1. Inventory Management
2. Employee Management
3. User and Role Management
4. Order Management
5. Analytics and Reporting

The application centralizes daily operations, tracks stock movements, handles employee payroll, processes customer orders, and generates business reports.

### Technology Stack

- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS
- Backend and database: Supabase
- Hosting: Vercel

Follow the existing project architecture, conventions, dependencies, and coding patterns. Do not introduce alternative technologies without a clear justification.

---

## 2. Core Engineering Principles

These rules apply across all modules.

### Data Integrity
- Use database transactions for operations modifying multiple related records.
- Never allow negative available, reserved, or used inventory quantities.
- Enforce database constraints in addition to frontend validation.
- Maintain immutable historical activity logs.
- Prevent duplicate stock movements when processing order status transitions more than once.
- Ensure related operations succeed or fail together.

### Authorization
- Enforce permissions on the backend/API, not only through frontend visibility.
- Every protected operation must verify the authenticated user's permissions.
- Do not trust role information or permissions supplied by the client.
- Respect account activation status.

### Implementation
- Prefer reusable components and modular business logic.
- Keep database operations and business rules separate from presentation components.
- Use TypeScript types consistently.
- Validate user input on both frontend and backend.
- Handle errors explicitly and provide meaningful feedback.
- Avoid unnecessary complexity and duplicated logic.

---

## 3. User and Role Management

### Users

Each user has:
- Full name
- Email
- Password (managed securely through authentication)
- Assigned role
- Account status (Active / Inactive)
- Created date

Administrators can:
- Create users.
- View users.
- Update user information.
- Deactivate users.
- Manage user access.

### Roles and Permissions

Each user has exactly one assigned role.

Administrators can create roles and independently configure permissions for each module.

| Module | Read permission | Write permission |
|---|---|---|
| Users | View users | Create, update, delete users |
| Orders | View orders | Create, update, delete orders |
| Employees | View employees | Create, update, delete employees |
| Inventory | View inventory | Manage items, stock, and warehouses |

Read permission allows viewing module data.

Write permission allows creating, updating, and deleting records where applicable.

Permissions must be enforced server-side.

---

## 4. Inventory Management

### 4.1 Warehouses

Each warehouse has:
- Name
- Address
- Description
- Created date

Support creating, viewing, updating, and deleting warehouses.

Prevent deletion when stock or historical business records make deletion unsafe. Prefer appropriate archival or deactivation behavior when necessary.

### 4.2 Inventory Items

Each inventory item has:
- Name
- Unique SKU
- Description
- Unit of measurement
- Created date

An item can exist in multiple warehouses.

Track quantities independently for each item/warehouse combination.

Maintain:
- Total quantity
- Reserved quantity
- Used quantity
- Available quantity

The fundamental invariant is:

Available Quantity = Total Quantity - Reserved Quantity - Used Quantity

All quantities must remain non-negative.

### 4.3 Stock Activities and Logs

Record every inventory movement:

- Stock addition
- Manual usage
- Reservation
- Release
- Transfer

Each activity log must include:
- Inventory item
- Warehouse
- Activity type
- Quantity
- Previous quantities
- New quantities
- Related order (optional)
- User who performed the operation
- Timestamp
- Notes

Activity logs are immutable through normal application operations.

Do not implement ordinary update or delete operations for historical inventory logs.

### 4.4 Warehouse Transfers

A transfer includes:
- Source warehouse
- Destination warehouse
- Inventory item
- Quantity
- Transfer date
- Notes
- User

Business rules:

1. Verify sufficient available stock in the source warehouse.
2. Decrease the source warehouse stock.
3. Increase the destination warehouse stock.
4. Record both sides of the movement in inventory activity logs.
5. Execute all changes in one atomic database transaction.
6. Prevent transferring stock to the same warehouse.
7. Validate quantity and warehouse existence.

A failed transfer must leave all stock quantities and logs unchanged.

---

## 5. Employee Management

### 5.1 Employee Records

Each employee has:
- Full name
- Email
- Phone number
- Address
- Job title / position
- Salary
- Employment date
- Employment status (Active / Inactive)
- Notes

### 5.2 Payroll Management

Display the agreed salary and allow authorized users to record individual salary payments.

Each payment includes:
- Employee
- Amount
- Payment date
- Payment method
- Optional reference number
- Notes
- Recorded-by user

Display:
- Employee agreed salary
- Payment history
- Total paid per payroll period
- Outstanding salary per payroll period

Calculate payroll balances for the relevant period and retain complete payment history.

Do not overwrite historical payments when employee salary information changes.

### 5.3 Assigned Orders

Each employee profile should display assigned orders with:

- Order number
- Title
- Client name
- Status
- Order date

Allow users to navigate directly to an order from the employee profile.

---

## 6. Order Management

### 6.1 Order Information

Each order contains:

Client details:
- Client name
- Phone number
- Address

Order details:
- Unique order number
- Title
- Description
- Order date
- Assigned employee
- Status
- Notes

### 6.2 Order Statuses

The supported statuses are:

| Status | Description |
|---|---|
| Pending | Order created; work has not started. |
| In Progress | Work on the order has started. |
| Paid | Order has been paid; reserved inventory is consumed. |
| Cancelled | Order cancelled; reserved inventory is released. |

Respect the existing order lifecycle and prevent invalid state transitions.

Paid orders cannot be cancelled through the normal workflow. A separate reversal process is required.

### 6.3 Inventory Assignment

Users can assign inventory items to an order.

Each assignment contains:
- Inventory item
- Source warehouse
- Quantity

The unit is inherited from the inventory item.

When assigning inventory:

1. Verify available stock.
2. Reject requests exceeding available quantity.
3. Move the requested quantity from Available to Reserved.
4. Record an inventory activity log.
5. Associate the reservation with the order.

When an order becomes Paid:

1. Process all its reserved inventory.
2. Move Reserved quantities to Used.
3. Record the corresponding inventory activity logs.
4. Ensure each reservation is consumed exactly once.

When an order becomes Cancelled:

1. Release all its reserved inventory.
2. Move Reserved quantities back to Available.
3. Record the corresponding inventory activity logs.
4. Ensure each reservation is released exactly once.

All stock changes and order status changes must be atomic.

Never allow duplicate stock movements from repeated status updates or concurrent requests.

### 6.4 Employee Assignment

- Assign one employee when creating an order or afterward.
- Allow changing the assigned employee.
- Allow viewing assigned employee details.
- Only active employees can be assigned to new orders.

Validate employee status on the backend when assigning or reassigning employees.

### 6.5 Order Notes and Activity Logs

Allow users to add notes to orders.

Display notes chronologically with:
- Note content
- Author
- Creation date

Automatically log:
- Order creation
- Information updates
- Status changes
- Employee assignment and reassignment
- Inventory assignment
- Inventory quantity changes
- Cancellation
- Payment
- Notes

Each activity includes:
- Activity type
- Description
- User
- Timestamp

Order activity logs must be immutable through normal application operations.

---

## 7. Analytics and Reporting

### 7.1 Dashboard Metrics

Orders:
- Total orders
- Pending orders
- In-progress orders
- Paid orders
- Cancelled orders
- Order volume over time

Inventory:
- Total items
- Total warehouses
- Available stock
- Reserved stock
- Used stock
- Low-stock items

Employees:
- Total employees
- Active employees
- Payroll summary
- Total salary payments
- Outstanding payroll

Ensure metrics are calculated from consistent and authoritative database data.

### 7.2 Filters

Support:
- Date-range filters
- Warehouse filters
- Employee filters
- Order status filters

Apply relevant filters to the corresponding reports and dashboard metrics.

### 7.3 PDF Reports

Support generating and downloading the following PDF reports:

**Orders Report**
- Orders in the selected date range
- Client details
- Assigned employees
- Order statuses
- Assigned inventory

**Inventory Report**
- Inventory quantities across warehouses
- Available quantities
- Reserved quantities
- Used quantities

**Inventory Activity Report**
- Stock additions
- Manual usage
- Reservations
- Releases
- Transfers

**Employee Report**
- Employee information
- Assigned orders
- Payroll summary

**Payroll Report**
- Employee salary payments
- Outstanding balances

Each PDF report must include:
- Report title
- Generation date
- Applied filters
- Relevant data tables
- Summary totals

Provide date filtering wherever relevant.

---

## 8. General System Requirements

### 8.1 Dashboard and Navigation

Provide navigation to:

- Dashboard / Analytics
- Orders
- Inventory
- Warehouses
- Employees
- Users and Roles

### 8.2 Search and Filtering

Main listing pages must support:
- Keyword search
- Pagination
- Relevant filters
- Sorting

Prefer server-side pagination and filtering for large datasets.

### 8.3 Interface Requirements

Build a clean, modern, responsive administrative dashboard.

Requirements:
- Reusable UI components
- Consistent layouts and design patterns
- Tables with search, filters, sorting, and pagination
- Forms with validation and clear error messages
- Confirmation dialogs for sensitive operations
- Clear success and error feedback
- Responsive behavior across screen sizes

Maintain consistent UI/UX across modules.

---

## 9. Development and Database Guidelines

Before implementing a feature:

1. Understand the existing architecture.
2. Inspect related database tables and relationships.
3. Identify business rules and affected modules.
4. Check existing database functions, triggers, and policies.
5. Identify possible concurrency and transaction issues.
6. Plan the implementation before modifying code.

When modifying the database:

- Use Supabase migrations for schema changes.
- Keep migrations organized and reproducible.
- Use foreign keys and appropriate constraints.
- Add indexes for frequently queried columns.
- Implement Row Level Security where appropriate.
- Ensure database functions enforce required authorization.
- Avoid duplicating business logic between the application and database.
- Never silently modify or remove existing historical records.

When implementing business operations involving multiple records, prefer transactional database functions (RPCs) where appropriate.

Test both successful and failed operations.

---

## 10. Expected Deliverables

The complete application should provide:

- Fully functional ERP web application.
- Database schema, relationships, and migrations.
- Authentication and role-based authorization.
- Inventory and warehouse management.
- Inventory reservation and transfer logic.
- Employee management.
- Payroll and payment tracking.
- Order lifecycle and inventory assignments.
- Order notes and immutable activity logging.
- Analytics dashboard.
- PDF report generation.
- Basic documentation covering architecture, database structure, and setup instructions.

---

## 11. Critical Rules for the Agent

1. Never assume business rules that are not documented or established in the existing implementation.
2. Never bypass backend authorization for convenience.
3. Never modify historical audit records through normal operations.
4. Never perform multi-record inventory operations without transaction safety.
5. Never allow duplicate reservation, consumption, or release operations.
6. Never trust frontend validation as the only validation layer.
7. Never introduce breaking database changes without examining their impact.
8. Reuse existing components, utilities, and established project conventions.
9. Keep implementations maintainable, readable, and appropriately scoped.
10. Explain important architectural or database decisions before making risky changes.
