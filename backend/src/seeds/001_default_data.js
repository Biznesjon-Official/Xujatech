const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing entries
  await knex('settings').del();
  await knex('categories').del();
  await knex('users').del();

  // Insert default admin user
  const adminId = uuidv4();
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  await knex('users').insert([
    {
      id: adminId,
      username: 'admin',
      email: 'admin@xujatech.com',
      password_hash: passwordHash,
      role: 'admin',
      full_name: 'System Administrator',
      phone: '+998901234567',
      is_active: true
    }
  ]);

  // Insert default categories
  await knex('categories').insert([
    {
      id: 'cat-tv',
      name: 'Television',
      description: 'TV and related products',
      is_active: true
    },
    {
      id: 'cat-fridge',
      name: 'Refrigerator',
      description: 'Refrigerators and freezers',
      is_active: true
    },
    {
      id: 'cat-washer',
      name: 'Washing Machine',
      description: 'Washing machines and dryers',
      is_active: true
    },
    {
      id: 'cat-ac',
      name: 'Air Conditioner',
      description: 'Air conditioning units',
      is_active: true
    }
  ]);

  // Insert default settings
  await knex('settings').insert([
    {
      key: 'store_name',
      value: 'XUJATECh Store',
      description: 'Store name for receipts',
      updated_by: adminId
    },
    {
      key: 'store_address',
      value: 'Tashkent, Uzbekistan',
      description: 'Store address',
      updated_by: adminId
    },
    {
      key: 'store_phone',
      value: '+998901234567',
      description: 'Store phone number',
      updated_by: adminId
    },
    {
      key: 'currency',
      value: 'UZS',
      description: 'Default currency',
      updated_by: adminId
    },
    {
      key: 'tax_rate',
      value: '0',
      description: 'Tax rate percentage',
      updated_by: adminId
    },
    {
      key: 'receipt_footer',
      value: 'Thank you for your business!',
      description: 'Receipt footer text',
      updated_by: adminId
    },
    {
      key: 'low_stock_threshold',
      value: '5',
      description: 'Low stock alert threshold',
      updated_by: adminId
    }
  ]);
};