const mongoose = require('mongoose')
const testimonialSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    product:{type:mongoose.Schema.Types.ObjectId,ref:'Product', required:false}, 
    rating:{type:Number,min:1,max:5,required: false},
    isApproved:{type:Boolean,default:false},
    dateSeen:{type:Date,default:null}
},{timestamps:true})
module.exports = mongoose.model('testimonial',testimonialSchema)
