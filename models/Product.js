const { DataTypes } = require('sequelize');

const Product = (sequelize) => {
  const ProductModel = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    qrCode: {
      type: DataTypes.TEXT, // Base64 encoded QR code image
      allowNull: true,
    },
    qrCodeText: {
      type: DataTypes.STRING, // Text content of QR code
      allowNull: true,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    salesPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
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
    hsnCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pcs',
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'products',
    timestamps: true,
    hooks: {
      beforeCreate: async (product) => {
        // Generate QR code if qrCodeText is provided
        if (product.qrCodeText && !product.qrCode) {
          const QRCode = require('qrcode');
          try {
            product.qrCode = await QRCode.toDataURL(product.qrCodeText);
          } catch (error) {
            console.error('Error generating QR code:', error);
          }
        }
      },
      beforeUpdate: async (product) => {
        // Regenerate QR code if qrCodeText is changed
        if (product.changed('qrCodeText') && product.qrCodeText) {
          const QRCode = require('qrcode');
          try {
            product.qrCode = await QRCode.toDataURL(product.qrCodeText);
          } catch (error) {
            console.error('Error generating QR code:', error);
          }
        }
      },
    },
  });

  // Instance methods
  ProductModel.prototype.calculateGstAmount = function(quantity = 1) {
    const baseAmount = this.salesPrice * quantity;
    const gstAmount = (baseAmount * this.gstRate) / 100;
    return {
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalAmount: parseFloat((baseAmount + gstAmount).toFixed(2)),
    };
  };

  ProductModel.prototype.isLowStock = function() {
    return this.stockQuantity <= this.minStockLevel;
  };

  return ProductModel;
};

module.exports = Product;
