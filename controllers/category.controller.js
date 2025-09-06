const Category = require('../models/category.model');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');
const cache = require('../utlis/cashe.utlis');
const mongoose = require('mongoose');

exports.getCategories = catchAsync(async (req, res, next) => {
    const { gender, includeInactive = false } = req.query;
    
    const cacheKey = `categories_${gender || 'all'}_${includeInactive}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }
    
    const query = { isDeleted: false };
    if (!includeInactive) query.isActive = true;
    if (gender) query.gender = gender;
    
    // Fetch categories with their parents and children
    const categories = await Category.find(query)
        .populate({
            path: 'parent',
            match: { isDeleted: false, isActive: true }
        })
        .lean();
    
    // Build a tree structure (simplified)
    const categoryMap = {};
    categories.forEach(cat => categoryMap[cat._id] = cat);
    const tree = categories.filter(cat => !cat.parent || !categoryMap[cat.parent._id]);
    
    // Cache the result
    cache.set(cacheKey, tree);
    
    res.status(200).json({ status: 'success', data: tree });
});

exports.getCategoryById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    // ADDED: Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid category ID', 400));
    }
    
    const category = await Category.findById(id)
        .populate({
            path: 'parent',
            match: { isDeleted: false, isActive: true }
        })
        .lean();
        
    if (!category || category.isDeleted || !category.isActive) {
        return next(new AppError('Category not found', 404));
    }
    
    res.status(200).json({ status: 'success', data: category });
});

exports.addCategory = catchAsync(async (req, res, next) => {
    const { name, parent, gender, description } = req.body;
    
    if (!name || !gender) {
        return next(new AppError('Name and gender are required', 400));
    }
    
    // ADDED: Validate parent ObjectId if provided
    if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
        return next(new AppError('Invalid parent category ID', 400));
    }
    
    const category = await Category.create({ name, parent, gender, description });
    
    // Clear cache
    cache.keys().forEach(key => key.startsWith('categories_') && cache.del(key));
    
    res.status(201).json({ status: 'success', data: category });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, parent, gender, description } = req.body;
    
    // ADDED: Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid category ID', 400));
    }
    
    if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
        return next(new AppError('Invalid parent category ID', 400));
    }
    
    const category = await Category.findById(id);
    if (!category || category.isDeleted) {
        return next(new AppError('Category not found or deleted', 404));
    }
    
    if (name) category.name = name;
    if (parent !== undefined) category.parent = parent; // Allow setting to null
    if (gender) category.gender = gender;
    if (description !== undefined) category.description = description;
    
    await category.save();
    
    // Clear cache
    cache.keys().forEach(key => key.startsWith('categories_') && cache.del(key));
    
    res.status(200).json({ status: 'success', data: category });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    // ADDED: Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid category ID', 400));
    }
    
    const category = await Category.findById(id);
    if (!category || category.isDeleted) {
        return next(new AppError('Category not found or deleted', 404));
    }
    
    category.isDeleted = true;
    await category.save();
    
    // Clear cache
    cache.keys().forEach(key => key.startsWith('categories_') && cache.del(key));
    
    res.status(200).json({ status: 'success', message: 'Category deleted successfully' });
});