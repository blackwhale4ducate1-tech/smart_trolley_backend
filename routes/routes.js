const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const adminRoutes = require('./adminRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Trolly API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/admin', adminRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

module.exports = router;