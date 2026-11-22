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

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/eng-abdelrahman-sharaf/erp-system
cd erp-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials

4. Run database migrations:
```bash
npx supabase db push
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

