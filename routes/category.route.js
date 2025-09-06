const express = require('express');
const router = express.Router();
const { getCategories, getCategoryById, addCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

router.route('/')
    .get(getCategories)
    .post(protect, restrictTo('admin'), addCategory);

router.route('/:id')
    .get(getCategoryById)
    .put(protect, restrictTo('admin'), updateCategory)
    .delete(protect, restrictTo('admin'), deleteCategory);

module.exports = router;