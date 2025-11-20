const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.use(verifyToken, isAdmin);

router.get('/users', adminController.listUsers);
router.get('/users/:userId/invoices', adminController.getUserInvoices);
router.get('/invoices/pending', adminController.listPendingInvoices);

module.exports = router;
