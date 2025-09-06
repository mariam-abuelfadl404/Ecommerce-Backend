const express = require('express');
const router = express.Router();
const { getProducts, getProductById, addProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.route('/')
    .get(getProducts)
    .post(protect, restrictTo('admin'), upload.array('photos', 5), addProduct);

router.route('/:id')
    .get(getProductById)
    .put(protect, restrictTo('admin'), upload.array('photos', 5), updateProduct)
    .delete(protect, restrictTo('admin'), deleteProduct);

module.exports = router;