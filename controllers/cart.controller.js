const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');
const cache = require('../utlis/cashe.utlis');

exports.getCart = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    const cacheKey = `cart_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ status: 'success', data: cached });

    const cart = await Cart.findOne({ user: userId })
        .populate({
            path: 'items.product',
            select: 'name price stock',
            match: { isActive: true, isDeleted: false }
        })
        .lean();

    if (!cart) return res.status(200).json({ status: 'success', data: { items: [], total: 0 } });

    let total = 0;
    const priceChangedItems = [];
    cart.items = cart.items.filter(item => {
        if (item.product && item.product.stock >= item.quantity) {
            const currentPrice = item.product.price;
            if (currentPrice !== item.priceAtAdd) {
                priceChangedItems.push({ ...item, currentPrice, originalPrice: item.priceAtAdd });
            }
            total += currentPrice * item.quantity;
            return true;
        }
        return false;
    });

    const data = { ...cart, total, priceChangedItems };
    cache.set(cacheKey, data, 300);
    res.status(200).json({ status: 'success', data });
});
exports.addToCart = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new AppError('Invalid product ID', 400));
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted || !product.isActive || product.stock < quantity) {
        return next(new AppError('Product not available or insufficient stock', 400));
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
    } else {
        cart.items.push({ product: productId, quantity, priceAtAdd: product.price });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    clearCartCaches(userId);
    res.status(200).json({ status: 'success', message: 'Item added to cart' });
});

exports.updateCartItem = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId) || quantity < 1) {
        return next(new AppError('Invalid product ID or quantity', 400));
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted || !product.isActive || product.stock < quantity) {
        return next(new AppError('Product not available or insufficient stock', 400));
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return next(new AppError('Cart not found', 404));

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) return next(new AppError('Item not in cart', 400));

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = Date.now();
    await cart.save();

    clearCartCaches(userId);
    res.status(200).json({ status: 'success', message: 'Cart item updated' });
});

exports.removeFromCart = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new AppError('Invalid product ID', 400));
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return next(new AppError('Cart not found', 404));

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    cart.updatedAt = Date.now();
    await cart.save();

    clearCartCaches(userId);
    res.status(200).json({ status: 'success', message: 'Item removed from cart' });
});

exports.checkout = catchAsync(async (req, res, next) => {
    if (!req.user) return next(new AppError('Please sign in to place an order', 401));
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) return next(new AppError('Cart is empty', 400));

    for (const item of cart.items) {
        const product = item.product;
        if (product.stock < item.quantity) {
            return next(new AppError(`Insufficient stock for ${product.name}`, 400));
        }
        product.stock -= item.quantity;
        await product.save();
    }

    // Clear cart after successful checkout
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    clearCartCaches(userId);
    res.status(200).json({ status: 'success', message: 'Checkout successful' });
});
exports.addToCartGuest = catchAsync(async (req, res, next) => {
    const { productId, quantity = 1, guestToken } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) return next(new AppError('Invalid product ID', 400));
    if (!guestToken) return next(new AppError('Guest token required', 400));

    const product = await Product.findById(productId);
    if (!product || product.isDeleted || !product.isActive || product.stock < quantity) {
        return next(new AppError('Product not available or insufficient stock', 400));
    }

    let cart = await Cart.findOne({ user: guestToken });
    if (!cart) cart = await Cart.create({ user: guestToken, items: [] });

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) cart.items[itemIndex].quantity += quantity;
    else cart.items.push({ product: productId, quantity, priceAtAdd: product.price });

    cart.updatedAt = Date.now();
    await cart.save();

    clearCartCaches(guestToken);
    res.status(200).json({ status: 'success', message: 'Item added to cart' });
});

// Helper function to clear cart-related caches
function clearCartCaches(userId) {
    cache.del(`cart_${userId}`);
    cache.keys().forEach(key => key.startsWith('products_') && cache.del(key)); // Invalidate product caches
}