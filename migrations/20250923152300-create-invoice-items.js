"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoice_items", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("(uuid())"), primaryKey: true, allowNull: false },
      invoiceId: { type: Sequelize.UUID, allowNull: false, references: { model: 'invoices', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      productId: { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      productName: { type: Sequelize.STRING, allowNull: false },
      productCode: { type: Sequelize.STRING, allowNull: true },
      hsnCode: { type: Sequelize.STRING, allowNull: true },
      quantity: { type: Sequelize.DECIMAL(10,3), allowNull: false },
      unit: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pcs' },
      unitPrice: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      mrp: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      discount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      discountType: { type: Sequelize.ENUM('percentage','amount'), allowNull: false, defaultValue: 'amount' },
      gstRate: { type: Sequelize.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
      gstAmount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      lineTotal: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      totalAmount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("invoice_items");
  },
};
