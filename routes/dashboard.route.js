const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { getDashboardStats ,getProductsSoldReport} = require('../controllers/dashboard.controller');

router.route('/stats')
    .get(protect, restrictTo('admin'), getDashboardStats);

router.route('/products-sold')
    .get(protect, restrictTo('admin'), getProductsSoldReport);

module.exports = router;