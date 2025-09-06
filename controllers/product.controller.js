const Product = require('../models/product.model');
const Category = require('../models/category.model');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');
const cache = require('../utlis/cashe.utlis');
const mongoose = require('mongoose');

exports.getProducts = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 10, sort = 'name', search, category, gender, minPrice, maxPrice, inStock = 'true' } = req.query;
    
    const cacheKey = `products_${JSON.stringify({ page, limit, sort, search, category, gender, minPrice, maxPrice, inStock })}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }
    
    try {
        const query = { isActive: true, isDeleted: false };
        
        // Search by name
        if (search) {
            query.name = { $regex: search.trim(), $options: 'i' };
        }
        
        // Filter by category or subcategory
        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return next(new AppError('Invalid category ID', 400));
            }
            
            // Find all subcategories recursively
            const getSubcategories = async (catId) => {
                try {
                    const subcats = await Category.find({ 
                        parent: catId, 
                        isActive: true, 
                        isDeleted: false 
                    }).select('_id').lean();
                    
                    let ids = [catId];
                    for (const sub of subcats) {
                        const subIds = await getSubcategories(sub._id);
                        ids = [...ids, ...subIds];
                    }
                    return ids;
                } catch (error) {
                    console.error('Error getting subcategories:', error);
                    return [catId]; // Return just the original category if error
                }
            };
            
            const catIds = await getSubcategories(category);
            query.category = { $in: catIds };
        }
        
        // Filter by gender (via category)
        if (gender && !category) { // Only apply if no specific category filter
            try {
                const genderCats = await Category.find({ 
                    gender, 
                    isActive: true, 
                    isDeleted: false 
                }).select('_id').lean();
                
                if (genderCats.length > 0) {
                    query.category = { $in: genderCats.map(c => c._id) };
                }
            } catch (error) {
                console.error('Error filtering by gender:', error);
                // Continue without gender filter if error
            }
        }
        
        // Filter by price range
        if (minPrice) {
            const min = parseFloat(minPrice);
            if (!isNaN(min) && min >= 0) {
                query.price = { ...query.price, $gte: min };
            }
        }
        if (maxPrice) {
            const max = parseFloat(maxPrice);
            if (!isNaN(max) && max >= 0) {
                query.price = { ...query.price, $lte: max };
            }
        }
        
        // Filter by stock
        if (inStock === 'true') {
            query.stock = { $gt: 0 };
        } else if (inStock === 'false') {
            query.stock = 0;
        }
        
        // Sorting
        let sortBy = {};
        if (sort === 'price_asc') sortBy.price = 1;
        else if (sort === 'price_desc') sortBy.price = -1;
        else if (sort === 'name') sortBy.name = 1;
        else if (sort === 'newest') sortBy.createdAt = -1;
        else if (sort === 'oldest') sortBy.createdAt = 1;
        else sortBy.name = 1; // Default sort
        
        console.log('Final query:', JSON.stringify(query, null, 2));
        console.log('Sort by:', sortBy);
        
        // CRITICAL FIX: Add .lean() to prevent caching issues
        const products = await Product.find(query)
            .sort(sortBy)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate({
                path: 'category',
                select: 'name gender parent',
                match: { isDeleted: false, isActive: true }
            })
            .lean(); // IMPORTANT: This prevents the caching error
        
        const total = await Product.countDocuments(query);
        
        const data = {
            products,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        };
        
        // Cache the plain object data
        cache.set(cacheKey, data, 300); // Cache for 5 minutes
        
        res.status(200).json({ status: 'success', data });
        
    } catch (error) {
        console.error('Error in getProducts:', error);
        return next(new AppError(`Database error: ${error.message}`, 500));
    }
});

exports.getProductById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid product ID', 400));
    }
    
    // Cache individual product
    const cacheKey = `product_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }
    
    try {
        const product = await Product.findById(id)
            .populate({
                path: 'category',
                match: { isDeleted: false, isActive: true },
                select: 'name gender parent'
            })
            .lean(); // Use .lean() for caching
        
        if (!product || product.isDeleted || !product.isActive) {
            return next(new AppError('Product not found', 404));
        }
        
        // Cache the individual product
        cache.set(cacheKey, product, 300); // Cache for 5 minutes
        
        res.status(200).json({ status: 'success', data: product });
        
    } catch (error) {
        console.error('Error in getProductById:', error);
        return next(new AppError(`Database error: ${error.message}`, 500));
    }
});

exports.addProduct = catchAsync(async (req, res, next) => {
    const { name, description, price, category, stock } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category) {
        return next(new AppError('Name, description, price, and category are required', 400));
    }
    
    // Validate price
    if (price < 0) {
        return next(new AppError('Price must be a positive number', 400));
    }
    
    // Validate category ObjectId
    if (!mongoose.Types.ObjectId.isValid(category)) {
        return next(new AppError('Invalid category ID', 400));
    }
    
    try {
        // Check if category exists and is active
        const categoryExists = await Category.findById(category);
        if (!categoryExists || categoryExists.isDeleted || !categoryExists.isActive) {
            return next(new AppError('Category not found or inactive', 400));
        }
        
        const photos = req.files ? req.files.map(file => file.path) : [];
        const product = await Product.create({ 
            name: name.trim(), 
            description: description.trim(), 
            price: parseFloat(price), 
            photos, 
            category, 
            stock: stock ? parseInt(stock) : 0 
        });
        
        // Populate the category for response
        await product.populate('category', 'name gender parent');
        
        // Clear relevant caches
        clearProductCaches();
        
        res.status(201).json({ status: 'success', data: product });
        
    } catch (error) {
        console.error('Error in addProduct:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return next(new AppError(`Validation Error: ${messages.join(', ')}`, 400));
        }
        return next(new AppError('Error creating product', 500));
    }
});

exports.updateProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid product ID', 400));
    }
    
    try {
        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct || existingProduct.isDeleted) {
            return next(new AppError('Product not found', 404));
        }
        
        const updates = { ...req.body };
        
        // Validate category if being updated
        if (updates.category) {
            if (!mongoose.Types.ObjectId.isValid(updates.category)) {
                return next(new AppError('Invalid category ID', 400));
            }
            
            const categoryExists = await Category.findById(updates.category);
            if (!categoryExists || categoryExists.isDeleted || !categoryExists.isActive) {
                return next(new AppError('Category not found or inactive', 400));
            }
        }
        
        // Validate price if being updated
        if (updates.price !== undefined) {
            const price = parseFloat(updates.price);
            if (isNaN(price) || price < 0) {
                return next(new AppError('Price must be a positive number', 400));
            }
            updates.price = price;
        }
        
        // Validate stock if being updated
        if (updates.stock !== undefined) {
            const stock = parseInt(updates.stock);
            if (isNaN(stock) || stock < 0) {
                return next(new AppError('Stock must be a non-negative number', 400));
            }
            updates.stock = stock;
        }
        
        // Handle file uploads
        if (req.files && req.files.length > 0) {
            updates.photos = req.files.map(file => file.path);
        }
        
        // Trim string fields
        if (updates.name) updates.name = updates.name.trim();
        if (updates.description) updates.description = updates.description.trim();
        
        const product = await Product.findByIdAndUpdate(id, updates, { 
            new: true, 
            runValidators: true 
        }).populate('category', 'name gender parent');
        
        // Clear relevant caches
        clearProductCaches();
        cache.del(`product_${id}`); // Clear individual product cache
        
        res.status(200).json({ status: 'success', data: product });
        
    } catch (error) {
        console.error('Error in updateProduct:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return next(new AppError(`Validation Error: ${messages.join(', ')}`, 400));
        }
        if (error.name === 'CastError') {
            return next(new AppError('Invalid data format', 400));
        }
        return next(new AppError('Error updating product', 500));
    }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid product ID', 400));
    }
    
    try {
        const product = await Product.findById(id);
        if (!product || product.isDeleted) {
            return next(new AppError('Product not found', 404));
        }
        
        // Soft delete
        product.isDeleted = true;
        product.isActive = false; // Also set to inactive
        await product.save();
        
        // Clear relevant caches
        clearProductCaches();
        cache.del(`product_${id}`); // Clear individual product cache
        
        res.status(200).json({ 
            status: 'success', 
            message: 'Product deleted successfully' 
        });
        
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        return next(new AppError('Error deleting product', 500));
    }
});

// Additional useful endpoints

exports.getProductsByCategory = catchAsync(async (req, res, next) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, sort = 'name' } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(new AppError('Invalid category ID', 400));
    }
    
    const cacheKey = `products_category_${categoryId}_${page}_${limit}_${sort}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }
    
    try {
        const query = { 
            category: categoryId, 
            isActive: true, 
            isDeleted: false 
        };
        
        let sortBy = {};
        if (sort === 'price_asc') sortBy.price = 1;
        else if (sort === 'price_desc') sortBy.price = -1;
        else if (sort === 'newest') sortBy.createdAt = -1;
        else sortBy.name = 1;
        
        const products = await Product.find(query)
            .sort(sortBy)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('category', 'name gender parent')
            .lean();
            
        const total = await Product.countDocuments(query);
        
        const data = { products, total, page: parseInt(page), limit: parseInt(limit) };
        cache.set(cacheKey, data, 300);
        
        res.status(200).json({ status: 'success', data });
        
    } catch (error) {
        console.error('Error in getProductsByCategory:', error);
        return next(new AppError('Error fetching products by category', 500));
    }
});

exports.searchProducts = catchAsync(async (req, res, next) => {
    const { q, page = 1, limit = 10, minPrice, maxPrice, category } = req.query;
    
    if (!q || q.trim().length < 2) {
        return next(new AppError('Search query must be at least 2 characters', 400));
    }
    
    const cacheKey = `search_${JSON.stringify({ q, page, limit, minPrice, maxPrice, category })}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }
    
    try {
        const query = {
            isActive: true,
            isDeleted: false,
            $or: [
                { name: { $regex: q.trim(), $options: 'i' } },
                { description: { $regex: q.trim(), $options: 'i' } }
            ]
        };
        
        if (minPrice) query.price = { $gte: parseFloat(minPrice) };
        if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
        if (category && mongoose.Types.ObjectId.isValid(category)) {
            query.category = category;
        }
        
        const products = await Product.find(query)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('category', 'name gender parent')
            .lean();
            
        const total = await Product.countDocuments(query);
        
        const data = { products, total, page: parseInt(page), limit: parseInt(limit) };
        cache.set(cacheKey, data, 180); // Cache search results for 3 minutes
        
        res.status(200).json({ status: 'success', data });
        
    } catch (error) {
        console.error('Error in searchProducts:', error);
        return next(new AppError('Error searching products', 500));
    }
});

// Helper function to clear product-related caches
function clearProductCaches() {
    const cacheKeys = cache.keys();
    cacheKeys.forEach(key => {
        if (key.startsWith('products_') || key.startsWith('search_')) {
            cache.del(key);
        }
    });
}