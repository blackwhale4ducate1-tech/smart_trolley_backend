"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [admins] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE username='admin' LIMIT 1;"
    );
    const adminId = admins && admins[0] ? admins[0].id : null;
    const now = new Date();

    if (!adminId) {
      throw new Error("Admin user not found. Seed users before products.");
    }

    await queryInterface.bulkInsert('products', [
      {
        id: require('crypto').randomUUID(),
        name: 'Sample Product A',
        description: 'Demo product A',
        barcode: '8901234567890',
        qrCode: null,
        qrCodeText: JSON.stringify({ name: 'Sample Product A', barcode: '8901234567890' }),
        mrp: 199.00,
        salesPrice: 149.00,
        costPrice: 120.00,
        gstRate: 18.00,
        hsnCode: '1001',
        category: 'General',
        brand: 'BrandX',
        unit: 'pcs',
        stockQuantity: 50,
        minStockLevel: 5,
        isActive: true,
        createdBy: adminId,
        updatedBy: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: require('crypto').randomUUID(),
        name: 'Sample Product B',
        description: 'Demo product B',
        barcode: '8909876543210',
        qrCode: null,
        qrCodeText: JSON.stringify({ name: 'Sample Product B', barcode: '8909876543210' }),
        mrp: 299.00,
        salesPrice: 249.00,
        costPrice: 200.00,
        gstRate: 12.00,
        hsnCode: '1002',
        category: 'General',
        brand: 'BrandY',
        unit: 'pcs',
        stockQuantity: 30,
        minStockLevel: 3,
        isActive: true,
        createdBy: adminId,
        updatedBy: null,
        createdAt: now,
        updatedAt: now,
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', {
      barcode: ['8901234567890','8909876543210']
    });
  },
};
