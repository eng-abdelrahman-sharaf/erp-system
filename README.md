# ERP System

A comprehensive Enterprise Resource Planning (ERP) system built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User & Role Management**: Role-based access control with module-level permissions
- **Inventory Management**: Track items, warehouses, stock levels, and activity logs
- **Employee Management**: Manage employee records, payroll, and assigned orders
- **Order Management**: Handle orders with inventory reservations and status tracking
- **Analytics & Reporting**: Dashboard metrics and PDF report generation

## Tech Stack

- **Frontend**: Next.js 16.4.6 (App Router), React 19.3.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.3.3
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Authentication pages
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── dashboard/         # Dashboard home
│   │   ├── orders/            # Order management
│   │   ├── inventory/         # Inventory management
│   │   ├── warehouses/        # Warehouse management
│   │   ├── employees/         # Employee management
│   │   ├── users/             # User & role management
│   │   └── analytics/         # Analytics & reports
│   └── layout.tsx             # Root layout
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── layout/                # Layout components (Sidebar, Header)
│   ├── shared/                # Shared components
│   └── charts/                # Chart components
├── features/                  # Feature-specific logic
│   ├── auth/
│   ├── users/
│   ├── inventory/
│   ├── warehouses/
│   ├── employees/
│   ├── payroll/
│   ├── orders/
│   ├── analytics/
│   └── reports/
├── lib/
│   ├── supabase/              # Supabase client configuration
│   ├── permissions/           # Permission logic
│   ├── validations/          # Zod validation schemas
│   ├── utils/                 # Utility functions
│   └── pdf/                   # PDF generation utilities
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript type definitions
└── config/                    # Configuration files
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Copy the database schema from `schema.sql` and run it in the Supabase SQL Editor
4. Create a `.env.local` file with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Generate TypeScript Types

After setting up your database, generate TypeScript types:

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Initial Admin User

1. Sign up a new user in the Supabase dashboard or through the app
2. Manually insert the user into the `users` table with admin role
3. Create the admin role and permissions in the database

## Database Schema

The database includes the following main tables:

- `roles` - User roles
- `role_permissions` - Module-level permissions per role
- `profiles` - Application users (linked to Supabase auth.users)
- `warehouses` - Storage locations
- `inventory_items` - Product catalog
- `warehouse_stock` - Stock levels per warehouse (with computed available_quantity)
- `inventory_activity_logs` - Stock movement history with before/after values
- `warehouse_transfers` - Stock transfers between warehouses
- `employees` - Employee records
- `payroll_periods` - Payroll periods per employee
- `salary_payments` - Salary payment history
- `orders` - Customer orders
- `order_inventory` - Inventory reserved for orders
- `order_activity_logs` - Order activity history
- `order_notes` - Order notes

**RPC Functions:**
- `adjust_inventory` - Stock additions and manual usage
- `transfer_inventory` - Atomic warehouse transfers
- `reserve_order_inventory` - Reserve inventory for orders
- `change_order_status` - Finalize orders as paid or cancelled
- `record_salary_payment` - Record salary payments with balance validation

**Reporting Views:**
- `payroll_summary` - Payroll overview with outstanding balances
- `inventory_summary` - Inventory across all warehouses
- `order_summary` - Orders with employee and inventory details

See `schema.sql` for the complete schema with constraints, indexes, triggers, RLS policies, and initial role seeding.

## Authentication

Authentication is handled by Supabase Auth. The middleware (`src/middleware.ts`) protects dashboard routes and redirects unauthenticated users to the login page.

## Permission System

Permissions are enforced at the API level. Each role can have read/write permissions for each module:
- Users
- Orders
- Employees
- Inventory

## Development

### Build for Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## License

MIT
