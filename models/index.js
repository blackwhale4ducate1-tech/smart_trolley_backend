const { superAdminDB } = require('../config/database');
const UserModel = require('./User');
const ProductModel = require('./Product');
const InvoiceModel = require('./Invoice');
const InvoiceItemModel = require('./InvoiceItem');

// Initialize models
const User = UserModel(superAdminDB);
const Product = ProductModel(superAdminDB);
const Invoice = InvoiceModel(superAdminDB);
const InvoiceItem = InvoiceItemModel(superAdminDB);

// Define associations
// User associations
User.hasMany(Product, { foreignKey: 'createdBy', as: 'createdProducts' });
User.hasMany(Invoice, { foreignKey: 'userId', as: 'invoices' });
User.hasMany(Invoice, { foreignKey: 'verifiedBy', as: 'verifiedInvoices' });

// Product associations
Product.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Product.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
Product.hasMany(InvoiceItem, { foreignKey: 'productId', as: 'invoiceItems' });

// Invoice associations
Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Invoice.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'items' });

// InvoiceItem associations
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
InvoiceItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Sync database
const syncDatabase = async () => {
  try {
    await superAdminDB.sync({ alter: true });
    console.log('Database synchronized successfully');
    
    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@smarttrolly.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        phone: '9999999999',
      });
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

module.exports = {
  User,
  Product,
  Invoice,
  InvoiceItem,
  syncDatabase,
  sequelize: superAdminDB,
};
