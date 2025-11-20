const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, isAdmin, checkSessionTimeout, logActivity } = require('../middleware/auth');
const validation = require('../middleware/validation');

// All routes require authentication
router.use(verifyToken);

// User routes (require session timeout check for non-admin users)
router.post('/create', 
  checkSessionTimeout, 
  logActivity('CREATE_INVOICE'), 
  invoiceController.createOrGetInvoice
);

router.post('/:invoiceId/items', 
  validation.invoiceIdParam, 
  validation.addItemToInvoice, 
  checkSessionTimeout, 
  logActivity('ADD_INVOICE_ITEM'), 
  invoiceController.addItemToInvoice
);

router.delete('/:invoiceId/items/:itemId', 
  validation.invoiceIdParam, 
  validation.itemIdParam, 
  checkSessionTimeout, 
  logActivity('REMOVE_INVOICE_ITEM'), 
  invoiceController.removeItemFromInvoice
);

router.put('/:invoiceId/complete', 
  validation.invoiceIdParam, 
  validation.completeInvoice, 
  checkSessionTimeout, 
  logActivity('COMPLETE_INVOICE'), 
  invoiceController.completeInvoice
);

router.get('/my-invoices', 
  validation.paginationQuery, 
  validation.invoiceQuery, 
  invoiceController.getUserInvoices
);

router.get('/:invoiceId/pdf', 
  validation.invoiceIdParam, 
  logActivity('PRINT_INVOICE'), 
  invoiceController.generateInvoicePDF
);

// Admin routes
router.get('/all', 
  isAdmin, 
  validation.paginationQuery, 
  validation.invoiceQuery, 
  invoiceController.getAllInvoices
);

router.put('/:invoiceId/verify', 
  isAdmin, 
  validation.invoiceIdParam, 
  validation.verifyInvoice, 
  logActivity('VERIFY_INVOICE'), 
  invoiceController.verifyInvoice
);

module.exports = router;
