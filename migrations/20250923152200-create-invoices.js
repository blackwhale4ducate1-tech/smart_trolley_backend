"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoices", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal("(uuid())"), primaryKey: true, allowNull: false },
      invoiceNumber: { type: Sequelize.STRING, allowNull: false, unique: true },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      sessionId: { type: Sequelize.STRING, allowNull: false },
      customerName: { type: Sequelize.STRING, allowNull: true },
      customerPhone: { type: Sequelize.STRING, allowNull: true },
      customerEmail: { type: Sequelize.STRING, allowNull: true },
      customerAddress: { type: Sequelize.TEXT, allowNull: true },
      subtotal: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      totalGst: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      discount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      totalAmount: { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      paymentMethod: { type: Sequelize.ENUM('cash','card','upi','cheque','credit'), allowNull: false, defaultValue: 'cash' },
      paymentStatus: { type: Sequelize.ENUM('pending','paid','partial','cancelled'), allowNull: false, defaultValue: 'pending' },
      status: { type: Sequelize.ENUM('draft','pending','completed','cancelled'), allowNull: false, defaultValue: 'draft' },
      adminVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      verifiedBy: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      verifiedAt: { type: Sequelize.DATE, allowNull: true },
      sessionStartTime: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      sessionEndTime: { type: Sequelize.DATE, allowNull: true },
      isSessionExpired: { type: Sequelize.BOOLEAN, defaultValue: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      printCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      lastPrintedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("invoices");
  },
};
