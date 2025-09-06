const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    isApproved: { type: Boolean, default: false },
    isSeen: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);