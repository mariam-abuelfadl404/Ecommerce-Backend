const mongoose = require('mongoose')
const contactSchema =  new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User',required:false,},
    email:{type:String , required: true , match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,"Please enter a valid email address"], trim:true},   
    category:{type:String,enum:['complain','normal_question'],required:true},
    message:{type:String , required:true, trim:true},
    isResolved:{type:Boolean, default:false},
}, {timestamps:true})
module.exports = mongoose.model('contact',contactSchema )
