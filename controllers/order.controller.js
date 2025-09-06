const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');
const cache = require('../utlis/cashe.utlis');

exports.createOrder = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress) {
        return next(new AppError('Shipping address is required', 400));
    }
    if (!['on_receive', 'online'].includes(paymentMethod)) {
        return next(new AppError('Invalid payment method', 400));
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
        return next(new AppError('Cart is empty', 400));
    }

    let totalAmount = 0;
    const items = [];

    for (const item of cart.items) {
        const product = item.product;
        if (!product || product.isDeleted || !product.isActive || product.stock < item.quantity) {
            return next(new AppError(`Insufficient stock for ${product?.name || 'product'}`, 400));
        }
        totalAmount += product.price * item.quantity;
        items.push({ product: product._id, quantity: item.quantity, price: product.price });
        product.stock -= item.quantity;
        await product.save();
    }

    const order = await Order.create({
        user: userId,
        items,
        totalAmount,
        paymentMethod,
        shippingAddress,
        status: 'pending'
    });

    // Clear cart after order
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    clearOrderCaches(userId);
    res.status(201).json({ status: 'success', data: order });
});

exports.getOrders = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    const cacheKey = `orders_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return res.status(200).json({ status: 'success', data: cached });
    }

    const orders = await Order.find({ user: userId })
        .populate('items.product', 'name price')
        .lean();

    cache.set(cacheKey, orders, 300); // Cache for 5 minutes
    res.status(200).json({ status: 'success', data: orders });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid order ID', 400));
    }

    const order = await Order.findById(id)
        .populate('items.product', 'name price')
        .lean();

    if (!order || order.user.toString() !== req.user.id) {
        return next(new AppError('Order not found', 404));
    }

    res.status(200).json({ status: 'success', data: order });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !['shipped', 'delivered', 'cancelled'].includes(status)) {
        return next(new AppError('Invalid order ID or status', 400));
    }

    const order = await Order.findById(id);
    if (!order || order.user.toString() !== req.user.id) {
        return next(new AppError('Order not found', 404));
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    clearOrderCaches(order.user);
    res.status(200).json({ status: 'success', data: order });
});
exports.createOrder = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress) return next(new AppError('Shipping address is required', 400));
    if (!['on_receive', 'online'].includes(paymentMethod)) return next(new AppError('Invalid payment method', 400));

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) return next(new AppError('Cart is empty', 400));

    let total = 0;
    const items = [];

    for (const item of cart.items) {
        const product = item.product;
        if (!product || product.isDeleted || !product.isActive || product.stock < item.quantity) {
            return next(new AppError(`Insufficient stock for ${product?.name || 'product'}`, 400));
        }
        total += product.price * item.quantity;
        items.push({ product: product._id, quantity: item.quantity, priceAtPurchase: product.price });
        product.stock -= item.quantity;
        await product.save();
    }

    const order = await Order.create({
        user: userId,
        items,
        total,
        paymentMethod,
        shippingAddress,
        status: 'Pending',
        statusHistory: [{ status: 'Pending', changedBy: userId }]
    });

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    clearOrderCaches(userId);
    res.status(201).json({ status: 'success', data: order });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !['Preparing', 'Ready for Shipping', 'Shipped', 'Received', 'Rejected', 'Cancelled', 'Returned'].includes(status)) {
        return next(new AppError('Invalid order ID or status', 400));
    }

    const order = await Order.findById(id);
    if (!order) return next(new AppError('Order not found', 404));

    order.status = status;
    order.statusHistory.push({ status, changedBy: req.user.id, reason });
    order.updatedAt = Date.now();
    await order.save();

    clearOrderCaches(order.user);
    res.status(200).json({ status: 'success', data: order });
});

exports.requestRefund = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order || order.user.toString() !== req.user.id || !order.isRefundEligible || order.refundDeadline < Date.now()) {
        return next(new AppError('Refund not eligible', 400));
    }
    order.status = 'Returned';
    order.statusHistory.push({ status: 'Returned', changedBy: req.user.id, reason: 'Refund requested' });
    await order.save();
    res.status(200).json({ status: 'success', message: 'Refund requested' });
});

// Helper function to clear order-related caches
function clearOrderCaches(userId) {
    cache.del(`orders_${userId}`);
    cache.keys().forEach(key => key.startsWith('products_') && cache.del(key)); // Invalidate product caches
}