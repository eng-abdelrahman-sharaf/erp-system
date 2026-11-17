1. Project Overview
Build a simple ERP (Enterprise Resource Planning) system to manage a
company's inventory, employees, users, and customer orders. The application
should centralize daily operations, track stock movements, handle employee
payroll, process orders, and generate business reports.
The system consists of five modules: Inventory Management, Employee
Management, User & Role Management, Order Management, and Analytics &
Reporting.
2. User & Role Management
2.1 Users
- Each user has a full name, email, password, assigned role, account status
(Active / Inactive), and created date.
- Administrators can create, view, update, deactivate, and manage users.
2.2 Roles & Permissions
Administrators can create roles and assign permissions independently for each
module. Each user has one assigned role.
Module Read Write
Users View users Create, update, delete users
Orders View orders Create, update, delete orders
Employees View employees Create, update, delete employees
Inventory View inventory Manage items, stock, and
warehouses
Read permission allows viewing module data. Write permission allows creating,
updating, and deleting records where applicable. Permissions must be enforced
by the backend/API, not only by hiding frontend controls.
3. Inventory Management
3.1 Warehouses
- Each warehouse has a name, address, description, and created date.
- Users can create, update, view, and delete warehouses, subject to stockrelated restrictions.
3.2 Inventory Items
- Each item has a name, unique SKU, description, unit of measurement, and
created date.
· Items can exist in multiple warehouses. Quantities are tracked for each
item/warehouse combination.
- For each item in each warehouse, maintain total, available, reserved, and
used quantities.
Available Quantity = Total Quantity − Reserved Quantity − Used Quantity.
3.3 Stock Activities & Logs
Record every inventory movement: stock addition, manual usage, reservation,
release, and transfer. Each log includes the item, warehouse, activity type,
quantity, previous and new quantities, related order (if any), user, timestamp, and
notes. Activity logs must be immutable through normal application operations.
3.4 Warehouse Transfers
- A transfer records the source warehouse, destination warehouse, item,
quantity, transfer date, notes, and user.
- The source warehouse must have sufficient available stock.
- Decrease stock in the source warehouse and increase stock in the
destination warehouse.
- Record both sides of the movement in inventory activity logs.
- Process the transfer as one atomic database transaction.
4. Employee Management
4.1 Employee Records
- Each employee has a full name, email, phone number, address, job title/
position, salary, employment date, employment status (Active / Inactive),
and notes.
4.2 Payroll Management
- Display the employee's agreed salary and allow authorized users to record
individual salary payments.
- Show payment history, total paid, and outstanding salary for each payroll
period.
- Each payment includes employee, amount, payment date, payment
method, optional reference number, notes, and recorded-by user.
The system should calculate payroll balances for the relevant period and retain a
complete payment history.
4.3 Assigned Orders
Each employee profile should list assigned orders, including order number, title,
client name, status, and order date. Users should be able to open an order directly
from this list.
5. Order Management
5.1 Order Information
- Client details: name, phone number, and address.
- Order details: unique order number, title, description, order date, assigned
employee, status, and notes.
5.2 Order Statuses
Status Description
Pending Order created; work has not started.
In Progress Work on the order has started.
Paid Order has been paid; reserved inventory is consumed.
Cancelled Order cancelled; reserved inventory is released.
5.3 Inventory Assignment
Users can assign inventory items to an order. Each assignment includes the
inventory item, source warehouse, and quantity. The unit is inherited from the
inventory item.
- Check available stock before reservation; reject requests that exceed
available quantity.
- When assigned, move the quantity from Available to Reserved and create
an inventory activity log.
- When an order becomes Paid, move all its reserved quantities from
Reserved to Used and log the movements.
- When an order becomes Cancelled, release all its reserved quantities back
to Available and log the movements.
- All stock changes must be atomic and reflected in both the order and
inventory modules.
- Paid orders cannot be cancelled through the normal workflow; a separate
reversal process is required.
5.4 Employee Assignment
- Assign one employee when creating an order or later.
- Allow changing the assigned employee and viewing their details.
- Only active employees can be assigned to new orders.
5.5 Order Notes & Activity Logs
Allow users to add notes to an order. Display notes chronologically with the
author and creation date.
Automatically log order creation, information updates, status changes, employee
assignment or reassignment, inventory assignment or quantity changes,
cancellation, payment, and notes. Each activity includes its type, description, user,
and timestamp. Activity logs must be immutable.
6. Analytics & Reporting
6.1 Dashboard Metrics
- Orders: total, pending, in-progress, paid, and cancelled orders; order
volume over time.
- Inventory: total items, warehouses, available stock, reserved stock, used
stock, and low-stock items.
- Employees: total and active employees, payroll summary, total salary
payments, and outstanding payroll.
6.2 Filters
Support date-range filters and relevant filters for warehouse, employee, and order
status.
6.3 PDF Reports
Users should be able to generate and download PDF reports:
- Orders Report: orders in a selected date range, client details, assigned
employees, statuses, and assigned inventory.
- Inventory Report: quantities across warehouses, including available,
reserved, and used stock.
- Inventory Activity Report: additions, usage, reservations, releases, and
transfers.
- Employee Report: employee information, assigned orders, and payroll
summary.
- Payroll Report: employee salary payments and outstanding balances.
Each report should include a title, generation date, applied filters, relevant data
tables, and summary totals. Date filtering should be available where relevant.
7. General System Requirements
7.1 Dashboard & Navigation
Provide navigation to Dashboard / Analytics, Orders, Inventory, Warehouses,
Employees, and Users & Roles.
7.2 Search & Filtering
Main listing pages should support keyword search, pagination, relevant filters, and
sorting.
7.3 Data Integrity
- Use database transactions for operations that modify multiple records.
- Prevent negative available, reserved, or used inventory quantities.
- Maintain historical activity logs.
- Validate inputs on both frontend and backend.
- Enforce authorization on the backend/API.
- Prevent duplicate stock movements when an order is marked Paid or
Cancelled more than once.
7.4 Interface
- Clean, modern, responsive admin dashboard.
- Reusable UI components and consistent layouts.
- Tables with search, filters, sorting, and pagination.
- Forms with validation and clear error messages.
- Confirmation dialogs for sensitive actions and clear success/error feedback.
8. Technology Stack
The application should be developed using the following technology stack:
● Frontend and application framework: Next.js
● Programming language: TypeScript
● Styling: Tailwind CSS
● Database and backend services: Supabase
● Hosting and deployment: Vercel
9. Expected Deliverables
● Fully functional ERP web application.
● Database design and relationships.
● Authentication and role-based authorization.
● All modules implemented.
● Inventory reservation and warehouse transfer logic.
● Employee payroll and payment tracking.
● Order lifecycle, notes, and activity logging.
● Analytics dashboard and PDF report generation.
● Basic documentation covering architecture, database structure, and setup
instructions.