const { body, param, query } = require('express-validator');

const validationRules = {
  // User validation rules
  register: [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters')
      .trim(),
    body('lastName')
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters')
      .trim(),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('role')
      .optional()
      .isIn(['admin', 'user'])
      .withMessage('Role must be either admin or user'),
  ],

  login: [
    body('username')
      .notEmpty()
      .withMessage('Username or email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  updateProfile: [
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be less than 50 characters')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be less than 50 characters')
      .trim(),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],

  // Product validation rules
  createProduct: [
    body('name')
      .isLength({ min: 1, max: 200 })
      .withMessage('Product name is required and must be less than 200 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
      .trim(),
    body('barcode')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Barcode must be less than 50 characters'),
    body('qrCodeText')
      .optional()
      .isLength({ max: 500 })
      .withMessage('QR code text must be less than 500 characters'),
    body('mrp')
      .isFloat({ min: 0 })
      .withMessage('MRP must be a positive number'),
    body('salesPrice')
      .isFloat({ min: 0 })
      .withMessage('Sales price must be a positive number'),
    body('costPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a positive number'),
    body('gstRate')
      .isFloat({ min: 0, max: 100 })
      .withMessage('GST rate must be between 0 and 100'),
    body('hsnCode')
      .optional()
      .isLength({ max: 20 })
      .withMessage('HSN code must be less than 20 characters'),
    body('category')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters')
      .trim(),
    body('brand')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Brand must be less than 100 characters')
      .trim(),
    body('unit')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Unit must be less than 20 characters'),
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    body('minStockLevel')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum stock level must be a non-negative integer'),
  ],

  updateProduct: [
    body('name')
      .optional()
      .isLength({ min: 1, max: 200 })
      .withMessage('Product name must be less than 200 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
      .trim(),
    body('barcode')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Barcode must be less than 50 characters'),
    body('qrCodeText')
      .optional()
      .isLength({ max: 500 })
      .withMessage('QR code text must be less than 500 characters'),
    body('mrp')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('MRP must be a positive number'),
    body('salesPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Sales price must be a positive number'),
    body('costPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a positive number'),
    body('gstRate')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('GST rate must be between 0 and 100'),
    body('hsnCode')
      .optional()
      .isLength({ max: 20 })
      .withMessage('HSN code must be less than 20 characters'),
    body('category')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters')
      .trim(),
    body('brand')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Brand must be less than 100 characters')
      .trim(),
    body('unit')
      .optional()
      .isLength({ max: 20 })
      .withMessage('Unit must be less than 20 characters'),
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    body('minStockLevel')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum stock level must be a non-negative integer'),
  ],

  // Invoice validation rules
  addItemToInvoice: [
    body('productId')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    body('quantity')
      .isFloat({ min: 0.001 })
      .withMessage('Quantity must be greater than 0'),
    body('discount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount must be a non-negative number'),
    body('discountType')
      .optional()
      .isIn(['percentage', 'amount'])
      .withMessage('Discount type must be either percentage or amount'),
  ],

  completeInvoice: [
    body('customerName')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Customer name must be less than 200 characters')
      .trim(),
    body('customerPhone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('customerEmail')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('customerAddress')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Customer address must be less than 500 characters')
      .trim(),
    body('paymentMethod')
      .isIn(['cash', 'card', 'upi', 'cheque', 'credit'])
      .withMessage('Payment method must be one of: cash, card, upi, cheque, credit'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
      .trim(),
  ],

  verifyInvoice: [
    body('approved')
      .isBoolean()
      .withMessage('Approved must be a boolean value'),
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
      .trim(),
  ],

  // Parameter validation rules
  uuidParam: [
    param('id')
      .isUUID()
      .withMessage('ID must be a valid UUID'),
  ],

  invoiceIdParam: [
    param('invoiceId')
      .isUUID()
      .withMessage('Invoice ID must be a valid UUID'),
  ],

  itemIdParam: [
    param('itemId')
      .isUUID()
      .withMessage('Item ID must be a valid UUID'),
  ],

  codeParam: [
    param('code')
      .notEmpty()
      .withMessage('Code parameter is required'),
  ],

  // Query validation rules
  paginationQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  productQuery: [
    query('search')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Search query must be less than 200 characters')
      .trim(),
    query('category')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters')
      .trim(),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
    query('sortBy')
      .optional()
      .isIn(['name', 'createdAt', 'updatedAt', 'mrp', 'salesPrice', 'stockQuantity'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC'),
  ],

  invoiceQuery: [
    query('status')
      .optional()
      .isIn(['draft', 'pending', 'completed', 'cancelled'])
      .withMessage('Invalid status value'),
    query('userId')
      .optional()
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ],

  qrSizeQuery: [
    query('size')
      .optional()
      .isInt({ min: 50, max: 1000 })
      .withMessage('Size must be between 50 and 1000 pixels'),
  ],
};

module.exports = validationRules;
