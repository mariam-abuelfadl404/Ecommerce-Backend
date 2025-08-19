const mongoose = require('mongoose')
const itemsSchema = new mongoose.Schema({
    product:{type:mongoose.Schema.Types.ObjectId, ref:'Product', required:true},
    quantity:{type:Number, required:true, default:1},
    priceAtAdd:{type:Number, required:true}
})
const cartSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User',required:false,default:null},
    items:[itemsSchema]
})
module.exports = mongoose.model('cart',cartSchema)
