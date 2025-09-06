const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, 'Invalid email'] },
    message: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Complain', 'Normal Question'], required: true },
    isResolved: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);