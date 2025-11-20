const { DataTypes } = require('sequelize');

const Invoice = (sequelize) => {
  const InvoiceModel = sequelize.define('Invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // Generate invoice number before validation to satisfy notNull
      defaultValue: () => `INV-${Date.now()}`,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalGst: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'cheque', 'credit'),
      allowNull: false,
      defaultValue: 'cash',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'partial', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    adminVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sessionStartTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    sessionEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isSessionExpired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    printCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastPrintedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'invoices',
    timestamps: true,
    hooks: {
      beforeValidate: (invoice) => {
        // Ensure invoiceNumber exists before validation as a fallback
        if (!invoice.invoiceNumber) {
          invoice.invoiceNumber = `INV-${Date.now()}`;
        }
      },
      beforeCreate: (invoice) => {
        // Set session end time (20 minutes from start)
        if (!invoice.sessionEndTime) {
          invoice.sessionEndTime = new Date(invoice.sessionStartTime.getTime() + 20 * 60 * 1000);
        }
      },
    },
  });

  // Instance methods
  InvoiceModel.prototype.isSessionActive = function() {
    const now = new Date();
    return now < this.sessionEndTime && !this.isSessionExpired;
  };

  InvoiceModel.prototype.expireSession = function() {
    this.isSessionExpired = true;
    this.sessionEndTime = new Date();
  };

  InvoiceModel.prototype.calculateTotals = function() {
    // This will be called after invoice items are loaded
    // The actual calculation will be done in the controller
    return {
      subtotal: parseFloat(this.subtotal),
      totalGst: parseFloat(this.totalGst),
      discount: parseFloat(this.discount),
      totalAmount: parseFloat(this.totalAmount),
    };
  };

  InvoiceModel.prototype.canAddItems = function() {
    return this.isSessionActive() && this.status === 'draft';
  };

  return InvoiceModel;
};

module.exports = Invoice;
