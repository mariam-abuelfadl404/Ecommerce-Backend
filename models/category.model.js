const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    gender: { type: String, required: true, enum: ['men', 'women'] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true 
});

module.exports = mongoose.model('Category', categorySchema);