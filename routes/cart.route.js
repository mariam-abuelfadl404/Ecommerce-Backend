const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { getCart, addToCart, updateCartItem, removeFromCart, checkout,addToCartGuest } = require('../controllers/cart.controller');

router.route('/')
    .get(protect, getCart)
    .post(protect, addToCart);

router.route('/item')
    .put(protect, updateCartItem)
    .delete(protect, removeFromCart);

router.route('/checkout')
    .post(protect, checkout);

router.route('/guest')
    .post(addToCartGuest);    

module.exports = router;