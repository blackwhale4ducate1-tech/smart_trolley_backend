"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("products", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("(uuid())"), primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      barcode: { type: Sequelize.STRING, allowNull: true, unique: true },
      qrCode: { type: Sequelize.TEXT, allowNull: true },
      qrCodeText: { type: Sequelize.STRING(500), allowNull: true },
      mrp: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      salesPrice: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      costPrice: { type: Sequelize.DECIMAL(10,2), allowNull: true },
      gstRate: { type: Sequelize.DECIMAL(5,2), allowNull: false, defaultValue: 0 },
      hsnCode: { type: Sequelize.STRING, allowNull: true },
      category: { type: Sequelize.STRING, allowNull: true },
      brand: { type: Sequelize.STRING, allowNull: true },
      unit: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pcs' },
      stockQuantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      minStockLevel: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      updatedBy: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("products");
  },
};
