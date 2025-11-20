const { Product, User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { validationResult } = require('express-validator');
const QRCode = require('qrcode');

const productController = {
  // Create new product (Admin only)
  createProduct: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const {
        name,
        description,
        barcode,
        qrCodeText,
        mrp,
        salesPrice,
        costPrice,
        gstRate,
        hsnCode,
        category,
        brand,
        unit,
        stockQuantity,
        minStockLevel,
      } = req.body;

      // Check if barcode already exists
      if (barcode) {
        const existingProduct = await Product.findOne({ where: { barcode } });
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Product with this barcode already exists',
          });
        }
      }

      // Generate QR code text if not provided
      let finalQrCodeText = qrCodeText;
      if (!finalQrCodeText) {
        finalQrCodeText = JSON.stringify({
          id: `temp_${Date.now()}`,
          name,
          barcode,
          mrp,
          salesPrice,
          gstRate,
        });
      }

      // Create product
      const product = await Product.create({
        name,
        description,
        barcode,
        qrCodeText: finalQrCodeText,
        mrp,
        salesPrice,
        costPrice,
        gstRate,
        hsnCode,
        category,
        brand,
        unit: unit || 'pcs',
        stockQuantity: stockQuantity || 0,
        minStockLevel: minStockLevel || 0,
        createdBy: req.user.userId,
      });

      // Update QR code text with actual product ID
      const updatedQrCodeText = JSON.stringify({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        mrp: product.mrp,
        salesPrice: product.salesPrice,
        gstRate: product.gstRate,
      });

      await product.update({
        qrCodeText: updatedQrCodeText,
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: {
          product,
        },
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get all products with pagination and search
  getProducts: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        category = '',
        isActive = true,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { barcode: { [Op.like]: `%${search}%` } },
          { category: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } },
        ];
      }

      // Add category filter
      if (category) {
        whereClause.category = category;
      }

      // Add active filter
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get product by ID
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
          {
            model: User,
            as: 'updater',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: {
          product,
        },
      });
    } catch (error) {
      console.error('Get product by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get product by barcode or QR code
  getProductByCode: async (req, res) => {
    try {
      const { code } = req.params;

      let product = await Product.findOne({
        where: {
          [Op.or]: [
            { barcode: code },
            { qrCodeText: { [Op.like]: `%${code}%` } },
          ],
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
      });

      // If not found by direct match, try to parse as JSON
      if (!product) {
        try {
          const parsedCode = JSON.parse(code);
          if (parsedCode.id) {
            product = await Product.findByPk(parsedCode.id, {
              include: [
                {
                  model: User,
                  as: 'creator',
                  attributes: ['id', 'username', 'firstName', 'lastName'],
                },
              ],
            });
          }
        } catch (parseError) {
          // Code is not JSON, continue with not found
        }
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: {
          product,
        },
      });
    } catch (error) {
      console.error('Get product by code error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Update product (Admin only)
  updateProduct: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Check if barcode is being changed and if it already exists
      if (updateData.barcode && updateData.barcode !== product.barcode) {
        const existingProduct = await Product.findOne({
          where: { barcode: updateData.barcode },
        });
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Product with this barcode already exists',
          });
        }
      }

      // Update QR code text if product details changed
      if (updateData.name || updateData.mrp || updateData.salesPrice || updateData.gstRate) {
        const updatedQrCodeText = JSON.stringify({
          id: product.id,
          name: updateData.name || product.name,
          barcode: updateData.barcode || product.barcode,
          mrp: updateData.mrp || product.mrp,
          salesPrice: updateData.salesPrice || product.salesPrice,
          gstRate: updateData.gstRate || product.gstRate,
        });
        updateData.qrCodeText = updatedQrCodeText;
      }

      // Add updatedBy field
      updateData.updatedBy = req.user.userId;

      await product.update(updateData);

      const updatedProduct = await Product.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
          {
            model: User,
            as: 'updater',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
      });

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: {
          product: updatedProduct,
        },
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Delete product (Admin only)
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Soft delete by setting isActive to false
      await product.update({ isActive: false, updatedBy: req.user.userId });

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get product categories
  getCategories: async (req, res) => {
    try {
      const categories = await Product.findAll({
        attributes: ['category'],
        where: {
          category: { [Op.ne]: null },
          isActive: true,
        },
        group: ['category'],
        raw: true,
      });

      const categoryList = categories.map(item => item.category).filter(Boolean);

      res.json({
        success: true,
        data: {
          categories: categoryList,
        },
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get low stock products
  getLowStockProducts: async (req, res) => {
    try {
      const products = await Product.findAll({
        where: {
          isActive: true,
          [Op.and]: [
            Sequelize.where(Sequelize.col('stockQuantity'), '<=', Sequelize.col('minStockLevel')),
          ],
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
        order: [['stockQuantity', 'ASC']],
      });

      res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error) {
      console.error('Get low stock products error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Generate QR code for product
  generateQRCode: async (req, res) => {
    try {
      const { id } = req.params;
      const { size = 200 } = req.query;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(product.qrCodeText, {
        width: parseInt(size),
        margin: 2,
      });

      res.json({
        success: true,
        data: {
          qrCode: qrCodeDataURL,
          qrCodeText: product.qrCodeText,
        },
      });
    } catch (error) {
      console.error('Generate QR code error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },
};

module.exports = productController;
