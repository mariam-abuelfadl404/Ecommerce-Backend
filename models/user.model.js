const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    name:{type:String, required:true, trim:true},
    phone:{type:String, required:true, match: [/^(?:\+20|0020)?(10|11|12|15)[0-9]{8}$/,'Please enter a valid Egyptian phone number']},
    email:{type:String, required:true, unique:true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,"Please enter a valid email address"]},
    address:{type:String, required:true, min:5, max:200,trim:true},
    password:{type:String, required:true},
    role:{type:String, enum:['user','admin'], default:'user'}
})
module.exports = mongoose.model('user',userSchema)