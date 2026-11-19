
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const {
    SUPABASE_TEST_EMAIL,
    SUPABASE_TEST_PASSWORD,
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY,
} = process.env;

const required = {
    SUPABASE_TEST_EMAIL,
    SUPABASE_TEST_PASSWORD,
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY,
};

for (const [name, value] of Object.entries(required)) {
    if (!value) throw new Error(`Missing environment variable: ${name}`);
}

// Privileged client: setup and seed data only.
const admin = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Public client: authenticate as the test user.
const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

function check(result, operation) {
    if (result.error) {
        throw new Error(`${operation}: ${result.error.message}`);
    }

    return result.data;
}

async function upsert(table, values, conflict) {
    const result = await admin
        .from(table)
        .upsert(values, { onConflict: conflict })
        .select()
        .single();

    return check(result, `Upsert ${table}`);
}

async function getOrCreateTestUser() {
    console.log("\n1. Checking test user...");

    // Search existing Auth users before creating one.
    let user = null;
    let page = 1;

    while (!user) {
        const result = check(
            await admin.auth.admin.listUsers({
                page,
                perPage: 100,
            }),
            "List Auth users"
        );

        user = result.users.find(
            (u) => u.email?.toLowerCase() === SUPABASE_TEST_EMAIL.toLowerCase()
        );

        if (result.users.length < 100) break;
        page++;
    }

    if (!user) {
        const result = check(
            await admin.auth.admin.createUser({
                email: SUPABASE_TEST_EMAIL,
                password: SUPABASE_TEST_PASSWORD,
                email_confirm: true,
            }),
            "Create test user"
        );

        user = result.user;
        console.log("Created test Auth user.");
    } else {
        console.log("Test Auth user already exists.");
    }

    return user;
}

async function authenticateTestUser() {
    console.log("\n2. Authenticating test user...");

    const result = check(
        await supabase.auth.signInWithPassword({
            email: SUPABASE_TEST_EMAIL,
            password: SUPABASE_TEST_PASSWORD,
        }),
        "Sign in test user"
    );

    console.log("Authenticated:", result.user.email);

    return result.user;
}

async function setupAdminRole(user) {
    console.log("\n3. Setting up Admin role...");

    // Create or find the Admin role
    let role;
    try {
        role = check(
            await admin
                .from("roles")
                .select("id")
                .eq("name", "Admin")
                .single(),
            "Find Admin role"
        );
        console.log("Admin role found.");
    } catch (error) {
        // Role doesn't exist, create it
        role = check(
            await admin
                .from("roles")
                .insert({
                    name: "Admin",
                    description: "Administrator with full access to all modules",
                })
                .select()
                .single(),
            "Create Admin role"
        );
        console.log("Admin role created.");
    }

    // Ensure all four modules have full permissions.
    const modules = [
        "users",
        "orders",
        "employees",
        "inventory",
    ];

    check(
        await admin.from("role_permissions").upsert(
            modules.map((module) => ({
                role_id: role.id,
                module,
                can_read: true,
                can_write: true,
            })),
            { onConflict: "role_id,module" }
        ),
        "Set Admin permissions"
    );

    // The profile must reference the Auth user's UUID.
    check(
        await admin.from("profiles").upsert(
            {
                id: user.id,
                email: SUPABASE_TEST_EMAIL,
                full_name: "Test Administrator",
                role_id: role.id,
                status: "active",
            },
            { onConflict: "id" }
        ),
        "Create/update test profile"
    );

    console.log("Admin role and permissions configured.");

    return role.id;
}

async function seedEmployees() {
    console.log("\n4. Seeding employees...");

    const employees = [
        {
            full_name: "Ahmed Hassan",
            email: "ahmed.hassan@example.com",
            phone: "+201001111111",
            address: "Alexandria, Egypt",
            position: "Warehouse Manager",
            salary: 15000,
            employment_date: "2024-01-15",
            status: "active",
        },
        {
            full_name: "Mohamed Ali",
            email: "mohamed.ali@example.com",
            phone: "+201002222222",
            address: "Alexandria, Egypt",
            position: "Sales Representative",
            salary: 12000,
            employment_date: "2024-03-01",
            status: "active",
        },
        {
            full_name: "Sara Mahmoud",
            email: "sara.mahmoud@example.com",
            phone: "+201003333333",
            address: "Cairo, Egypt",
            position: "HR Specialist",
            salary: 13000,
            employment_date: "2023-11-01",
            status: "active",
        },
    ];

    const result = check(
        await admin
            .from("employees")
            .upsert(employees, { onConflict: "email" })
            .select(),
        "Seed employees"
    );

    console.log(`Created/updated ${result.length} employees.`);

    return result;
}

async function seedWarehouses() {
    console.log("\n5. Seeding warehouses...");

    const warehouses = [
        {
            name: "Alexandria Main Warehouse",
            address: "Smouha, Alexandria, Egypt",
            description: "Primary inventory storage facility",
        },
        {
            name: "Cairo Distribution Center",
            address: "Nasr City, Cairo, Egypt",
            description: "Secondary distribution facility",
        },
    ];

    const result = check(
        await admin
            .from("warehouses")
            .upsert(warehouses, { onConflict: "name" })
            .select(),
        "Seed warehouses"
    );

    console.log(`Created/updated ${result.length} warehouses.`);

    return result;
}

async function seedInventoryItems() {
    console.log("\n6. Seeding inventory items...");

    const items = [
        {
            name: "Laptop",
            sku: "ELEC-001",
            description: "Business laptop",
            unit: "piece",
        },
        {
            name: "Wireless Mouse",
            sku: "ELEC-002",
            description: "Wireless optical mouse",
            unit: "piece",
        },
        {
            name: "Mechanical Keyboard",
            sku: "ELEC-003",
            description: "Mechanical keyboard",
            unit: "piece",
        },
        {
            name: "Monitor",
            sku: "ELEC-004",
            description: "24-inch Full HD monitor",
            unit: "piece",
        },
        {
            name: "USB-C Cable",
            sku: "ACC-001",
            description: "USB-C charging cable",
            unit: "piece",
        },
    ];

    const result = check(
        await admin
            .from("inventory_items")
            .upsert(items, { onConflict: "sku" })
            .select(),
        "Seed inventory items"
    );

    console.log(`Created/updated ${result.length} inventory items.`);

    return result;
}

async function seedStock(items, warehouses) {
    console.log("\n7. Seeding warehouse stock...");

    const quantities = [100, 250, 150, 80, 300];
    const stock = [];

    for (const [index, item] of items.entries()) {
        stock.push({
            item_id: item.id,
            warehouse_id: warehouses[0].id,
            total_quantity: quantities[index],
            reserved_quantity: 0,
            used_quantity: 0,
        });

        stock.push({
            item_id: item.id,
            warehouse_id: warehouses[1].id,
            total_quantity: Math.floor(quantities[index] / 2),
            reserved_quantity: 0,
            used_quantity: 0,
        });
    }

    // Do not include available_quantity: PostgreSQL generates it.
    const result = check(
        await admin
            .from("warehouse_stock")
            .upsert(stock, {
                onConflict: "item_id,warehouse_id",
            })
            .select(),
        "Seed warehouse stock"
    );

    console.log(`Created/updated ${result.length} stock records.`);
}

async function seedPayroll(employees) {
    console.log("\n8. Seeding payroll periods...");

    const periods = employees.map((employee) => ({
        employee_id: employee.id,
        period_start: "2026-11-01",
        period_end: "2026-11-30",
        salary_amount: employee.salary,
    }));

    const result = check(
        await admin
            .from("payroll_periods")
            .upsert(periods, {
                onConflict: "employee_id,period_start,period_end",
            })
            .select(),
        "Seed payroll periods"
    );

    console.log(`Created/updated ${result.length} payroll periods.`);
}

async function seedOrders(user, employees, items, warehouses) {
    console.log("\n9. Seeding customer orders...");

    const orders = [
        {
            order_number: "ORD-2026-001",
            title: "Laptop Delivery",
            description: "Delivery of business laptops",
            client_name: "ABC Technologies",
            client_phone: "+201111111111",
            client_address: "Alexandria, Egypt",
            employee_id: employees[1].id,
            status: "pending",
            order_date: "2026-11-10",
            notes: "Priority delivery",
            created_by: user.id,
        },
        {
            order_number: "ORD-2026-002",
            title: "Office Equipment",
            description: "Monitors and keyboards",
            client_name: "Modern Office",
            client_phone: "+201122222222",
            client_address: "Cairo, Egypt",
            employee_id: employees[1].id,
            status: "in_progress",
            order_date: "2026-11-12",
            notes: "Partially prepared",
            created_by: user.id,
        },
        {
            order_number: "ORD-2026-003",
            title: "Accessories Order",
            description: "USB-C cables and wireless mice",
            client_name: "Digital Solutions",
            client_phone: "+201133333333",
            client_address: "Giza, Egypt",
            employee_id: employees[1].id,
            status: "pending",
            order_date: "2026-11-15",
            notes: "Standard delivery",
            created_by: user.id,
        },
    ];

    const result = check(
        await admin
            .from("orders")
            .upsert(orders, { onConflict: "order_number" })
            .select(),
        "Seed orders"
    );

    console.log(`Created/updated ${result.length} orders.`);

    const orderItems = [
        {
            order_number: "ORD-2026-001",
            sku: "ELEC-001",
            quantity: 2,
        },
        {
            order_number: "ORD-2026-002",
            sku: "ELEC-004",
            quantity: 3,
        },
        {
            order_number: "ORD-2026-002",
            sku: "ELEC-003",
            quantity: 3,
        },
        {
            order_number: "ORD-2026-003",
            sku: "ACC-001",
            quantity: 10,
        },
        {
            order_number: "ORD-2026-003",
            sku: "ELEC-002",
            quantity: 5,
        },
    ];

    for (const assignment of orderItems) {
        const order = result.find(
            (o) => o.order_number === assignment.order_number
        );

        const item = items.find(
            (i) => i.sku === assignment.sku
        );

        if (!order || !item) {
            throw new Error("Could not resolve order/item assignment.");
        }

        check(
            await admin.rpc("reserve_order_inventory", {
                p_order_id: order.id,
                p_item_id: item.id,
                p_warehouse_id: warehouses[0].id,
                p_quantity: assignment.quantity,
            }),
            "Seed order inventory"
        );
    }

    console.log(`Created/updated ${orderItems.length} order assignments.`);
}

async function main() {
    console.log("==================================");
    console.log("ERP TEST DATA SEEDER");
    console.log("==================================");

    const user = await getOrCreateTestUser();

    // Authenticate BEFORE setting up the profile.
    // The admin client handles profile/role setup.
    await authenticateTestUser();

    await setupAdminRole(user);

    const employees = await seedEmployees();
    const warehouses = await seedWarehouses();
    const items = await seedInventoryItems();

    await seedStock(items, warehouses);
    await seedPayroll(employees);
    await seedOrders(user, employees, items, warehouses);

    console.log("\n==================================");
    console.log("ERP TEST DATA SEEDED SUCCESSFULLY");
    console.log("==================================");
    console.log("Test email:", SUPABASE_TEST_EMAIL);
    console.log("Role: Admin");
    console.log("Modules: users, orders, employees, inventory");
    console.log("Warehouses: 2");
    console.log("Inventory items: 5");
    console.log("Employees: 3");
    console.log("Orders: 3");
    console.log("Payroll periods: 3");
    console.log("\nYou can now log in to your application.");
}

main().catch((error) => {
    console.error("\nSEEDING FAILED:");
    console.error(error.message);
    process.exitCode = 1;
});
