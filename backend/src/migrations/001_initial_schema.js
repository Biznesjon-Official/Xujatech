/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Users table
    .createTable('users', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('username', 50).unique().notNullable();
      table.string('email', 100).unique();
      table.string('password_hash', 255).notNullable();
      table.enum('role', ['admin', 'manager', 'cashier']).notNullable();
      table.string('full_name', 100).notNullable();
      table.string('phone', 20);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.timestamp('last_login');
    })
    
    // Categories table
    .createTable('categories', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 100).notNullable();
      table.text('description');
      table.uuid('parent_id').references('id').inTable('categories');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Suppliers table
    .createTable('suppliers', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 100).notNullable();
      table.string('contact_person', 100);
      table.string('phone', 20);
      table.string('email', 100);
      table.text('address');
      table.decimal('credit_limit', 15, 2).defaultTo(0);
      table.decimal('current_balance', 15, 2).defaultTo(0);
      table.integer('payment_terms').defaultTo(30);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Products table
    .createTable('products', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('barcode', 50).unique();
      table.string('name', 200).notNullable();
      table.text('description');
      table.uuid('category_id').references('id').inTable('categories');
      table.uuid('supplier_id').references('id').inTable('suppliers');
      table.decimal('cost_price', 15, 2).notNullable();
      table.decimal('selling_price', 15, 2).notNullable();
      table.integer('warranty_months').defaultTo(0);
      table.integer('minimum_stock').defaultTo(0);
      table.integer('current_stock').defaultTo(0);
      table.string('unit', 20).defaultTo('pcs');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Product variants table
    .createTable('product_variants', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.string('variant_name', 100).notNullable();
      table.string('barcode', 50).unique();
      table.decimal('cost_price', 15, 2);
      table.decimal('selling_price', 15, 2);
      table.integer('current_stock').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
    })
    
    // Customers table
    .createTable('customers', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('customer_code', 20).unique();
      table.string('full_name', 100).notNullable();
      table.string('phone', 20);
      table.string('email', 100);
      table.text('address');
      table.decimal('credit_limit', 15, 2).defaultTo(0);
      table.decimal('current_debt', 15, 2).defaultTo(0);
      table.decimal('discount_percentage', 5, 2).defaultTo(0);
      table.integer('bonus_points').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Sales table
    .createTable('sales', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('sale_number', 50).unique().notNullable();
      table.uuid('customer_id').references('id').inTable('customers');
      table.uuid('cashier_id').notNullable().references('id').inTable('users');
      table.timestamp('sale_date').defaultTo(knex.fn.now());
      table.decimal('subtotal', 15, 2).notNullable();
      table.decimal('discount_amount', 15, 2).defaultTo(0);
      table.decimal('tax_amount', 15, 2).defaultTo(0);
      table.decimal('total_amount', 15, 2).notNullable();
      table.enum('payment_status', ['completed', 'partial', 'pending']).defaultTo('completed');
      table.text('notes');
      table.boolean('is_return').defaultTo(false);
      table.uuid('original_sale_id').references('id').inTable('sales');
      table.timestamps(true, true);
    })
    
    // Sale items table
    .createTable('sale_items', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('sale_id').notNullable().references('id').inTable('sales').onDelete('CASCADE');
      table.uuid('product_id').references('id').inTable('products');
      table.uuid('product_variant_id').references('id').inTable('product_variants');
      table.integer('quantity').notNullable();
      table.decimal('unit_price', 15, 2).notNullable();
      table.decimal('discount_amount', 15, 2).defaultTo(0);
      table.decimal('total_amount', 15, 2).notNullable();
      table.decimal('cost_price', 15, 2).notNullable();
    })
    
    // Payments table
    .createTable('payments', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('sale_id').references('id').inTable('sales');
      table.uuid('customer_id').references('id').inTable('customers');
      table.enum('payment_method', ['cash', 'card', 'click', 'payme', 'debt']).notNullable();
      table.decimal('amount', 15, 2).notNullable();
      table.string('reference_number', 100);
      table.timestamp('payment_date').defaultTo(knex.fn.now());
      table.uuid('cashier_id').notNullable().references('id').inTable('users');
      table.text('notes');
    })
    
    // Stock movements table
    .createTable('stock_movements', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('product_id').references('id').inTable('products');
      table.uuid('product_variant_id').references('id').inTable('product_variants');
      table.enum('movement_type', ['in', 'out', 'adjustment', 'transfer']).notNullable();
      table.integer('quantity').notNullable();
      table.string('reference_type', 20);
      table.uuid('reference_id');
      table.decimal('cost_price', 15, 2);
      table.text('notes');
      table.uuid('created_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    
    // Settings table
    .createTable('settings', function (table) {
      table.string('key', 100).primary();
      table.text('value').notNullable();
      table.text('description');
      table.uuid('updated_by').references('id').inTable('users');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('settings')
    .dropTableIfExists('stock_movements')
    .dropTableIfExists('payments')
    .dropTableIfExists('sale_items')
    .dropTableIfExists('sales')
    .dropTableIfExists('customers')
    .dropTableIfExists('product_variants')
    .dropTableIfExists('products')
    .dropTableIfExists('suppliers')
    .dropTableIfExists('categories')
    .dropTableIfExists('users');
};