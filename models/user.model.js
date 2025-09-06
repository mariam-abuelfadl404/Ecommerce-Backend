const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { 
        type: String, 
        required: true, 
        match: [/^(?:\+?201|01)[0125][0-9]{8}$/, 'Please enter a valid Egyptian phone number'] 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, "Please enter a valid email address"] 
    },
    address: { type: String, required: true, min: 5, max: 200, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);