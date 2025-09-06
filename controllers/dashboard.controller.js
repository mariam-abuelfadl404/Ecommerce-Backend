const Product = require('../models/product.model');
const Order = require('../models/order.model');
const Category = require('../models/category.model');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');
const cache = require('../utlis/cashe.utlis');

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'admin') return next(new AppError('Access denied', 403));

    const cacheKey = 'dashboard_stats';
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ status: 'success', data: cached });

    const { from, to } = req.query;
    const match = { status: { $in: ['Shipped', 'Received'] } };
    if (from && to) match.createdAt = { $gte: new Date(from), $lte: new Date(to) };

    const [totalProducts, totalOrders, totalCategories, totalSales] = await Promise.all([
        Product.countDocuments({ isActive: true, isDeleted: false }),
        Order.countDocuments(),
        Category.countDocuments({ isActive: true, isDeleted: false }),
        Order.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ])
    ]);

    const stats = {
        totalProducts,
        totalOrders,
        totalCategories,
        totalSales: totalSales.length > 0 ? totalSales[0].total : 0
    };

    cache.set(cacheKey, stats, 3600);
    res.status(200).json({ status: 'success', data: stats });
});

exports.getProductsSoldReport = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'admin') return next(new AppError('Access denied', 403));

    const { from, to } = req.query;
    const match = { status: { $in: ['Shipped', 'Received'] } };
    if (from && to) match.createdAt = { $gte: new Date(from), $lte: new Date(to) };

    const report = await Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        {
            $group: {
                _id: '$items.product',
                productName: { $first: '$productDetails.name' },
                totalSold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] } }
            }
        },
        { $sort: { totalSold: -1 } }
    ]);

    res.status(200).json({ status: 'success', data: report });
});
