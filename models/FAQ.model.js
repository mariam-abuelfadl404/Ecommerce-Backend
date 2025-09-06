const mongoose = require('mongoose')
const FAQschema = new mongoose.Schema({
    question:{type:String , required:true,trim:true},
    answer:{type:String, required:true,trim:true},
    isActive:{type:Boolean, default:true},
    isDeleted:{type:Boolean, default:false},
    updatedBy:{type:mongoose.Schema.Types.ObjectId, ref:'User',required:false}
},{timestamps:true})
module.exports = mongoose.model('FAQ', FAQschema)
