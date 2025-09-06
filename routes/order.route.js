const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/order.controller');

router.route('/')
    .post(protect, createOrder)
    .get(protect, getOrders);

router.route('/:id')
    .get(protect, getOrderById)
    .put(protect, restrictTo('admin'), updateOrderStatus);

module.exports = router;