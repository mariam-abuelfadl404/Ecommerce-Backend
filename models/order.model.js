const mongoose = require('mongoose')
const orderItem = new mongoose.Schema({
    product:{type:mongoose.Schema.Types.ObjectId,ref:'product',required:true},
    quantity:{type:Number,required:true,default:1},
    priceAtPurchase:{type:Number,required:true}
})
const StatusHistorySchema = new mongoose.Schema({
    status:{type:String,enum:['Pending','Preparing','Ready for Shipping','Shipped','Recieved','Rejected','Cancelled','Returned'],default:'Pending'},
    changedBy:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    date:{type:Date},
    reason:{type:String}
    
})
const orderSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    items:[orderItem],
    total:{type:Number , required:true,min:0},
    status:{type:String, enum:['Pending','Preparing','Ready for Shipping','Shipped','Recieved','Rejected','Cancelled','Returned'],default:'Pending'},
    StatusHistory:[StatusHistorySchema],
    shippingAddress:{type:String,required:true},
    paymentMethod:{type:String, default:'on_receive'},
    isRefundEligible:{type:Boolean , default:true}



})
module.exports = mongoose.model('order',orderSchema)