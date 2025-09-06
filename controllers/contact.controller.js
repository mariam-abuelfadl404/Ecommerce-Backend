const Contact = require('../models/contact.model');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');

exports.submitContact = catchAsync(async (req, res, next) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return next(new AppError('All fields are required', 400));

    const contact = await Contact.create({ name, email, message });
    res.status(201).json({ status: 'success', data: contact });
});

exports.getContacts = catchAsync(async (req, res, next) => {
    const contacts = await Contact.find({ isDeleted: false })
        .lean();
    res.status(200).json({ status: 'success', data: contacts });
});

exports.resolveContact = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(new AppError('Invalid contact ID', 400));

    const contact = await Contact.findByIdAndUpdate(id, { isResolved: true }, { new: true });
    if (!contact) return next(new AppError('Contact not found', 404));
    res.status(200).json({ status: 'success', data: contact });
});