const { DataTypes } = require('sequelize');

const InvoiceItem = (sequelize) => {
  const InvoiceItemModel = sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hsnCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: 0.001,
      },
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pcs',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'amount'),
      allowNull: false,
      defaultValue: 'amount',
    },
    gstRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    gstAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lineTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'invoice_items',
    timestamps: true,
    hooks: {
      beforeSave: (item) => {
        // Calculate amounts
        const baseAmount = item.quantity * item.unitPrice;
        let discountAmount = 0;
        
        if (item.discountType === 'percentage') {
          discountAmount = (baseAmount * item.discount) / 100;
        } else {
          discountAmount = item.discount;
        }
        
        const discountedAmount = baseAmount - discountAmount;
        const gstAmount = (discountedAmount * item.gstRate) / 100;
        const totalAmount = discountedAmount + gstAmount;
        
        item.gstAmount = parseFloat(gstAmount.toFixed(2));
        item.lineTotal = parseFloat(discountedAmount.toFixed(2));
        item.totalAmount = parseFloat(totalAmount.toFixed(2));
      },
    },
  });

  // Instance methods
  InvoiceItemModel.prototype.calculateAmounts = function() {
    const baseAmount = this.quantity * this.unitPrice;
    let discountAmount = 0;
    
    if (this.discountType === 'percentage') {
      discountAmount = (baseAmount * this.discount) / 100;
    } else {
      discountAmount = this.discount;
    }
    
    const discountedAmount = baseAmount - discountAmount;
    const gstAmount = (discountedAmount * this.gstRate) / 100;
    const totalAmount = discountedAmount + gstAmount;
    
    return {
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      discountedAmount: parseFloat(discountedAmount.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  };

  return InvoiceItemModel;
};

module.exports = InvoiceItem;
