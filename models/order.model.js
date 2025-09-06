const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 },
    priceAtPurchase: { type: Number, required: true }
});

const StatusHistorySchema = new mongoose.Schema({
    status: { 
        type: String, 
        enum: ['Pending', 'Preparing', 'Ready for Shipping', 'Shipped', 'Received', 'Rejected', 'Cancelled', 'Returned'], 
        default: 'Pending' 
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    reason: { type: String }
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true, min: 0 },
    status: { 
        type: String, 
        enum: ['Pending', 'Preparing', 'Ready for Shipping', 'Shipped', 'Received', 'Rejected', 'Cancelled', 'Returned'], 
        default: 'Pending' 
    },
    statusHistory: [StatusHistorySchema],
    shippingAddress: { type: String, required: true },
    paymentMethod: { type: String, default: 'on_receive' },
    isRefundEligible: { type: Boolean, default: true },
    refundDeadline: { type: Date, default: () => Date.now() + 14 * 24 * 60 * 60 * 1000 } // 14 days
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);