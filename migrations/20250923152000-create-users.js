"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("(uuid())"),
        primaryKey: true,
        allowNull: false,
      },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM("admin", "user"), allowNull: false, defaultValue: "user" },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      lastLogin: { type: Sequelize.DATE, allowNull: true },
      sessionId: { type: Sequelize.STRING, allowNull: true },
      sessionExpiry: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
