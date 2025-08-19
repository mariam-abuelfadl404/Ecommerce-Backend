const mongoose = require('mongoose')
const FAQschema = new mongoose.Schema({
    question:{type:String , required:true,trim:true},
    answer:{type:String, required:true,trim:true}
},{timestamps:true})
module.exports = mongoose.model('FAQ', FAQschema)
