const Testimonial = require('../models/testimonial.model');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');

exports.getTestimonials = catchAsync(async (req, res, next) => {
    const testimonials = await Testimonial.find({ isApproved: true, isDeleted: false })
        .populate('user', 'name')
        .lean();
    res.status(200).json({ status: 'success', data: testimonials });
});

exports.addTestimonial = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { content, rating } = req.body;

    if (!content || !rating) return next(new AppError('Content and rating are required', 400));
    if (rating < 1 || rating > 5) return next(new AppError('Rating must be between 1 and 5', 400));

    const testimonial = await Testimonial.create({ user: userId, content, rating });
    res.status(201).json({ status: 'success', data: testimonial });
});

exports.approveTestimonial = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(new AppError('Invalid testimonial ID', 400));

    const testimonial = await Testimonial.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    if (!testimonial) return next(new AppError('Testimonial not found', 404));
    res.status(200).json({ status: 'success', data: testimonial });
});
exports.getUnseenTestimonials = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'admin') return next(new AppError('Access denied', 403));
    const testimonials = await Testimonial.find({ isSeen: false, isDeleted: false })
        .populate('user', 'name')
        .lean();
    res.status(200).json({ status: 'success', data: testimonials });
});

exports.deleteTestimonial = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(new AppError('Invalid testimonial ID', 400));

    const testimonial = await Testimonial.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!testimonial) return next(new AppError('Testimonial not found', 404));
    res.status(200).json({ status: 'success', message: 'Testimonial deleted' });
});