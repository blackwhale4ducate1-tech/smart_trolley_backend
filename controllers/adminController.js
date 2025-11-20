const { User, Invoice, InvoiceItem, Product } = require('../models');

const adminController = {
  // List all users (excluding password)
  listUsers: async (req, res) => {
    try {
      const users = await User.findAll({ attributes: { exclude: ['password'] } });
      res.json({ success: true, data: { users } });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  // Get invoices for a specific user
  getUserInvoices: async (req, res) => {
    try {
      const { userId } = req.params;
      const { status = '' } = req.query;
      const whereClause = { userId };
      if (status) whereClause.status = status;

      const invoices = await Invoice.findAll({
        where: whereClause,
        include: [
          { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({ success: true, data: { invoices } });
    } catch (error) {
      console.error('Get user invoices error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  // List all pending invoices awaiting admin verification
  listPendingInvoices: async (req, res) => {
    try {
      const invoices = await Invoice.findAll({
        where: { status: 'pending', adminVerified: false },
        include: [
          { model: InvoiceItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({ success: true, data: { invoices } });
    } catch (error) {
      console.error('List pending invoices error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },
};

module.exports = adminController;
