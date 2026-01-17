/**
 * Warehouse transfers migration
 * Omborlar o'rtasida mahsulot ko'chirish uchun jadvallar
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Warehouses table - Omborlar jadvali
    .createTable('warehouses', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 100).notNullable();
      table.string('code', 20).unique().notNullable();
      table.text('address');
      table.string('phone', 20);
      table.uuid('manager_id').references('id').inTable('users');
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_main').defaultTo(false);
      table.timestamps(true, true);
    })
    
    // Warehouse stock table - Ombordagi mahsulotlar
    .createTable('warehouse_stock', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('warehouse_id').notNullable().references('id').inTable('warehouses').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.uuid('product_variant_id').references('id').inTable('product_variants');
      table.integer('quantity').defaultTo(0);
      table.timestamps(true, true);
      
      // Unique constraint
      table.unique(['warehouse_id', 'product_id', 'product_variant_id']);
    })
    
    // Warehouse transfers table - Ko'chirishlar jadvali
    .createTable('warehouse_transfers', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('transfer_number', 50).unique().notNullable();
      table.uuid('from_warehouse_id').notNullable().references('id').inTable('warehouses');
      table.uuid('to_warehouse_id').notNullable().references('id').inTable('warehouses');
      table.enum('status', ['pending', 'in_transit', 'completed', 'cancelled']).defaultTo('pending');
      table.text('notes');
      table.uuid('created_by').notNullable().references('id').inTable('users');
      table.uuid('approved_by').references('id').inTable('users');
      table.timestamp('approved_at');
      table.uuid('completed_by').references('id').inTable('users');
      table.timestamp('completed_at');
      table.timestamps(true, true);
    })
    
    // Transfer items table - Ko'chirish elementlari
    .createTable('transfer_items', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('transfer_id').notNullable().references('id').inTable('warehouse_transfers').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('products');
      table.uuid('product_variant_id').references('id').inTable('product_variants');
      table.integer('quantity').notNullable();
      table.integer('received_quantity').defaultTo(0);
      table.text('notes');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('transfer_items')
    .dropTableIfExists('warehouse_transfers')
    .dropTableIfExists('warehouse_stock')
    .dropTableIfExists('warehouses');
};
