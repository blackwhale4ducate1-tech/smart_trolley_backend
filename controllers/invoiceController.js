const { Invoice, InvoiceItem, Product, User } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const moment = require('moment');

const invoiceController = {
  // Create new invoice or get active invoice
  createOrGetInvoice: async (req, res) => {
    try {
      const userId = req.user.userId;
      let sessionId = req.user.sessionId;

      // Ensure we have a valid sessionId (admin tokens may not carry sessionId)
      const dbUser = await User.findByPk(userId);
      if (!sessionId) {
        sessionId = dbUser?.sessionId;
      }
      if (!sessionId) {
        // For admins or in rare cases, generate a session on the fly
        if (dbUser && dbUser.role === 'admin') {
          const newSessionId = dbUser.generateSessionId();
          await dbUser.update({
            sessionId: newSessionId,
            sessionExpiry: dbUser.sessionExpiry,
          });
          sessionId = newSessionId;
        } else {
          // For users, session should have been validated by middleware
          return res.status(401).json({
            success: false,
            message: 'Session expired. Please login again.',
            sessionExpired: true,
          });
        }
      }

      // Check if user has an active invoice within 20 minutes
      const activeInvoice = await Invoice.findOne({
        where: {
          userId,
          sessionId,
          status: 'draft',
          isSessionExpired: false,
        },
        include: [
          {
            model: InvoiceItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'barcode', 'qrCodeText'],
              },
            ],
          },
        ],
      });

      if (activeInvoice) {
        
        if (activeInvoice.isSessionActive()) {
          return res.json({
            success: true,
            message: 'Active invoice found',
            data: {
              invoice: activeInvoice,
              timeRemaining: activeInvoice.sessionEndTime - new Date(),
            },
          });
        } else {
          // Expire the session
          await activeInvoice.update({ isSessionExpired: true });
        }
      }

      // Create new invoice
      const newInvoice = await Invoice.create({
        userId,
        sessionId,
        sessionStartTime: new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'New invoice created',
        data: {
          invoice: newInvoice,
          timeRemaining: 20 * 60 * 1000, // 20 minutes in milliseconds
        },
      });
    } catch (error) {
      console.error('Create or get invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Add item to invoice
  addItemToInvoice: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { invoiceId } = req.params;
      const { productId, quantity, discount = 0, discountType = 'amount' } = req.body;
      const userId = req.user.userId;

      // Get invoice and check if it belongs to user and is active
      const invoice = await Invoice.findOne({
        where: {
          id: invoiceId,
          userId,
          status: 'draft',
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found or not accessible',
        });
      }

      // Check if session is active
      if (!invoice.canAddItems()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add items. Session expired or invoice is not in draft status',
          sessionExpired: true,
        });
      }

      // Get product details
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Product is not active',
        });
      }

      // Check stock availability
      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available',
          availableStock: product.stockQuantity,
        });
      }

      // Check if item already exists in invoice
      let invoiceItem = await InvoiceItem.findOne({
        where: {
          invoiceId,
          productId,
        },
      });

      if (invoiceItem) {
        // Update existing item
        const newQuantity = parseFloat(invoiceItem.quantity) + parseFloat(quantity);
        
        // Check stock for updated quantity
        if (product.stockQuantity < newQuantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock for updated quantity',
            availableStock: product.stockQuantity,
            currentQuantity: invoiceItem.quantity,
          });
        }

        await invoiceItem.update({
          quantity: newQuantity,
          discount,
          discountType,
        });
      } else {
        // Create new item
        invoiceItem = await InvoiceItem.create({
          invoiceId,
          productId,
          productName: product.name,
          productCode: product.barcode,
          hsnCode: product.hsnCode,
          quantity,
          unit: product.unit,
          unitPrice: product.salesPrice,
          mrp: product.mrp,
          discount,
          discountType,
          gstRate: product.gstRate,
        });
      }

      // Update product stock
      await product.update({
        stockQuantity: product.stockQuantity - quantity,
      });

      // Recalculate invoice totals
      await invoiceController.recalculateInvoiceTotals(invoiceId);

      // Get updated invoice with items
      const updatedInvoice = await Invoice.findByPk(invoiceId, {
        include: [
          {
            model: InvoiceItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'barcode', 'qrCodeText'],
              },
            ],
          },
        ],
      });

      res.json({
        success: true,
        message: 'Item added to invoice successfully',
        data: {
          invoice: updatedInvoice,
          addedItem: invoiceItem,
        },
      });
    } catch (error) {
      console.error('Add item to invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Remove item from invoice
  removeItemFromInvoice: async (req, res) => {
    try {
      const { invoiceId, itemId } = req.params;
      const userId = req.user.userId;

      // Get invoice and check if it belongs to user and is active
      const invoice = await Invoice.findOne({
        where: {
          id: invoiceId,
          userId,
          status: 'draft',
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found or not accessible',
        });
      }

      if (!invoice.canAddItems()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify items. Session expired or invoice is not in draft status',
          sessionExpired: true,
        });
      }

      // Get invoice item
      const invoiceItem = await InvoiceItem.findOne({
        where: {
          id: itemId,
          invoiceId,
        },
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      });

      if (!invoiceItem) {
        return res.status(404).json({
          success: false,
          message: 'Invoice item not found',
        });
      }

      // Restore product stock
      await invoiceItem.product.update({
        stockQuantity: invoiceItem.product.stockQuantity + invoiceItem.quantity,
      });

      // Delete invoice item
      await invoiceItem.destroy();

      // Recalculate invoice totals
      await invoiceController.recalculateInvoiceTotals(invoiceId);

      res.json({
        success: true,
        message: 'Item removed from invoice successfully',
      });
    } catch (error) {
      console.error('Remove item from invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Complete invoice
  completeInvoice: async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const { customerName, customerPhone, customerEmail, customerAddress, paymentMethod, notes } = req.body;
      const userId = req.user.userId;

      // Get invoice
      const invoice = await Invoice.findOne({
        where: {
          id: invoiceId,
          userId,
          status: 'draft',
        },
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found or not accessible',
        });
      }

      if (invoice.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot complete invoice without items',
        });
      }

      // Update invoice
      await invoice.update({
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        paymentMethod,
        notes,
        status: 'pending', // Pending admin verification
        paymentStatus: 'paid',
        sessionEndTime: new Date(),
        isSessionExpired: true,
      });

      // Get updated invoice with all details
      const completedInvoice = await Invoice.findByPk(invoiceId, {
        include: [
          {
            model: InvoiceItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
              },
            ],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
      });

      res.json({
        success: true,
        message: 'Invoice completed successfully. Awaiting admin verification.',
        data: {
          invoice: completedInvoice,
        },
      });
    } catch (error) {
      console.error('Complete invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get user invoices
  getUserInvoices: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, status = '', startDate = '', endDate = '', includeCompleted = 'false' } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { userId };

      if (status) {
        whereClause.status = status;
      }

      // By default, hide admin-verified/completed invoices for user list unless explicitly requested
      if (!status && includeCompleted !== 'true') {
        const { Op } = require('sequelize');
        whereClause[Op.and] = [
          { adminVerified: false },
          { status: { [Op.not]: 'completed' } },
        ];
      }

      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const { count, rows: invoices } = await Invoice.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: InvoiceItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'barcode'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error('Get user invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get all invoices (Admin only)
  getAllInvoices: async (req, res) => {
    try {
      const { page = 1, limit = 10, status = '', userId = '', startDate = '', endDate = '' } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const { count, rows: invoices } = await Invoice.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: InvoiceItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'barcode'],
              },
            ],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
          {
            model: User,
            as: 'verifier',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error('Get all invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Verify invoice (Admin only)
  verifyInvoice: async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const { approved, notes } = req.body;
      const adminId = req.user.userId;

      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      const updateData = {
        adminVerified: approved,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        status: approved ? 'completed' : 'cancelled',
      };

      if (notes) {
        updateData.notes = notes;
      }

      await invoice.update(updateData);

      const fullInvoice = await Invoice.findByPk(invoiceId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
          {
            model: User,
            as: 'verifier',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
          {
            model: InvoiceItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'barcode', 'qrCodeText', 'gstRate'],
              },
            ],
          },
        ],
      });

      res.json({
        success: true,
        message: `Invoice ${approved ? 'approved' : 'rejected'} successfully`,
        data: {
          invoice: fullInvoice,
        },
      });
    } catch (error) {
      console.error('Verify invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Generate invoice PDF
  generateInvoicePDF: async (req, res) => {
    try {
      const { invoiceId } = req.params;

      const invoice = await Invoice.findByPk(invoiceId, {
        include: [
          {
            model: InvoiceItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
              },
            ],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // Update print count
      await invoice.update({
        printCount: invoice.printCount + 1,
        lastPrintedAt: new Date(),
      });

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers (allow inline viewing with ?inline=true)
      const inline = (req.query.inline === 'true');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename=invoice-${invoice.invoiceNumber}.pdf`);
      
      // Pipe PDF to response
      doc.pipe(res);

      // Add content to PDF
      invoiceController.generatePDFContent(doc, invoice);

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('Generate invoice PDF error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Helper method to recalculate invoice totals
  recalculateInvoiceTotals: async (invoiceId) => {
    const items = await InvoiceItem.findAll({
      where: { invoiceId },
    });

    let subtotal = 0;
    let totalGst = 0;

    items.forEach(item => {
      subtotal += parseFloat(item.lineTotal);
      totalGst += parseFloat(item.gstAmount);
    });

    const totalAmount = subtotal + totalGst;

    await Invoice.update(
      {
        subtotal: subtotal.toFixed(2),
        totalGst: totalGst.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      },
      {
        where: { id: invoiceId },
      }
    );
  },

  // Helper method to generate PDF content
  generatePDFContent: (doc, invoice) => {
    // Header
    doc.fontSize(20).text('INVOICE', 50, 50);
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 80);
    doc.text(`Date: ${moment(invoice.createdAt).format('DD/MM/YYYY')}`, 50, 100);
    doc.text(`Time: ${moment(invoice.createdAt).format('HH:mm:ss')}`, 50, 120);

    // Customer details
    if (invoice.customerName) {
      doc.text('Bill To:', 50, 160);
      doc.text(invoice.customerName, 50, 180);
      if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 50, 200);
      if (invoice.customerEmail) doc.text(`Email: ${invoice.customerEmail}`, 50, 220);
      if (invoice.customerAddress) doc.text(`Address: ${invoice.customerAddress}`, 50, 240);
    }

    // Items table
    const tableTop = 300;
    doc.text('Item', 50, tableTop);
    doc.text('Qty', 200, tableTop);
    doc.text('Rate', 250, tableTop);
    doc.text('GST%', 300, tableTop);
    doc.text('Amount', 400, tableTop);

    let yPosition = tableTop + 30;
    invoice.items.forEach(item => {
      doc.text(item.productName, 50, yPosition);
      doc.text(item.quantity.toString(), 200, yPosition);
      doc.text(`₹${item.unitPrice}`, 250, yPosition);
      doc.text(`${item.gstRate}%`, 300, yPosition);
      doc.text(`₹${item.totalAmount}`, 400, yPosition);
      yPosition += 20;
    });

    // Totals
    yPosition += 20;
    doc.text(`Subtotal: ₹${invoice.subtotal}`, 300, yPosition);
    doc.text(`GST: ₹${invoice.totalGst}`, 300, yPosition + 20);
    doc.text(`Total: ₹${invoice.totalAmount}`, 300, yPosition + 40);

    // Footer
    doc.text('Thank you for your business!', 50, yPosition + 80);
  },
};

module.exports = invoiceController;
