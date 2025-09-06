const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');
const crypto = require('crypto');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.signup = catchAsync(async (req, res, next) => {
    // ... existing signup code ...
});

exports.login = catchAsync(async (req, res, next) => {
    // ... existing login code ...
});

exports.updateProfile = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { name, phone, email, address } = req.body;

    const updateData = { name, phone, email, address };
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });

    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ status: 'success', data: user });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new AppError('No user found with that email', 404));

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ status: 'success', message: 'Token sent to email' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ 
        resetPasswordToken: hashedToken, 
        resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) return next(new AppError('Token is invalid or has expired', 400));
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const newToken = signToken(user._id);
    res.status(200).json({ status: 'success', token: newToken });
});