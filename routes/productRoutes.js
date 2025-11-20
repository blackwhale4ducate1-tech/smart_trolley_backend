const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin, logActivity } = require('../middleware/auth');
const validation = require('../middleware/validation');

// All routes require authentication
router.use(verifyToken);

// Public product routes (for users)
router.get('/', 
  validation.paginationQuery, 
  validation.productQuery, 
  productController.getProducts
);

router.get('/categories', productController.getCategories);

router.get('/low-stock', 
  isAdmin, 
  productController.getLowStockProducts
);

router.get('/code/:code', 
  validation.codeParam, 
  productController.getProductByCode
);

router.get('/:id', 
  validation.uuidParam, 
  productController.getProductById
);

router.get('/:id/qrcode', 
  validation.uuidParam, 
  validation.qrSizeQuery, 
  productController.generateQRCode
);

// Admin only routes
router.post('/', 
  isAdmin, 
  validation.createProduct, 
  logActivity('CREATE_PRODUCT'), 
  productController.createProduct
);

router.put('/:id', 
  isAdmin, 
  validation.uuidParam, 
  validation.updateProduct, 
  logActivity('UPDATE_PRODUCT'), 
  productController.updateProduct
);

router.delete('/:id', 
  isAdmin, 
  validation.uuidParam, 
  logActivity('DELETE_PRODUCT'), 
  productController.deleteProduct
);

module.exports = router;
