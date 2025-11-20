"use strict";

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const userPass = await bcrypt.hash('user123', 10);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: require('crypto').randomUUID(),
        username: 'admin',
        email: 'admin@smarttrolly.com',
        password: passwordHash,
        role: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        phone: '9999999999',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: require('crypto').randomUUID(),
        username: 'user1',
        email: 'user1@example.com',
        password: userPass,
        role: 'user',
        firstName: 'Demo',
        lastName: 'User1',
        phone: '9000000001',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: require('crypto').randomUUID(),
        username: 'user2',
        email: 'user2@example.com',
        password: userPass,
        role: 'user',
        firstName: 'Demo',
        lastName: 'User2',
        phone: '9000000002',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: [
      'admin@smarttrolly.com','user1@example.com','user2@example.com'
    ] });
  },
};
