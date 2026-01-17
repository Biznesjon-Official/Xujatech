/**
 * Supplier Orders Migration
 * Ta'minotchi buyurtmalari uchun jadvallar
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Supplier orders table - Ta'minotchi buyurtmalari
    .createTable('supplier_orders', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('order_number', 50).unique().notNullable();
      table.uuid('supplier_id').notNullable().references('id').inTable('suppliers');
      table.enum('status', ['draft', 'ordered', 'partial', 'received', 'cancelled']).defaultTo('draft');
      table.timestamp('order_date').defaultTo(knex.fn.now());
      table.timestamp('expected_date');
      table.timestamp('received_date');
      table.decimal('subtotal', 15, 2).defaultTo(0);
      table.decimal('tax_amount', 15, 2).defaultTo(0);
      table.decimal('shipping_cost', 15, 2).defaultTo(0);
      table.decimal('total_amount', 15, 2).defaultTo(0);
      table.decimal('paid_amount', 15, 2).defaultTo(0);
      table.text('notes');
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.uuid('received_by').references('id').inTable('users');
      table.timestamps(true, true);
    })
    
    // Supplier order items table - Buyurtma elementlari
    .createTable('supplier_order_items', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('order_id').notNullable().references('id').inTable('supplier_orders').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('products');
      table.uuid('product_variant_id').references('id').inTable('product_variants');
      table.integer('quantity').notNullable();
      table.integer('received_quantity').defaultTo(0);
      table.decimal('unit_cost', 15, 2).notNullable();
      table.decimal('total_cost', 15, 2).notNullable();
      table.text('notes');
    })
    
    // Supplier payments table - Ta'minotchiga to'lovlar
    .createTable('supplier_payments', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('supplier_id').notNullable().references('id').inTable('suppliers');
      table.uuid('order_id').references('id').inTable('supplier_orders');
      table.enum('payment_method', ['cash', 'bank_transfer', 'check']).notNullable();
      table.decimal('amount', 15, 2).notNullable();
      table.string('reference_number', 100);
      table.timestamp('payment_date').defaultTo(knex.fn.now());
      table.text('notes');
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('supplier_payments')
    .dropTableIfExists('supplier_order_items')
    .dropTableIfExists('supplier_orders');
};
