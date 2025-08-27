const mongoose = require('mongoose')
const connectDB= async()=>{
    try{
        await mongoose.connect(process.env.DB_URI)
        console.log('Data Base Connected Sucessufly!')
    }
    catch(err){
        console.error('Connection To Data Base Faild')
        process.exit(1)

    }
}
module.exports = connectDB
