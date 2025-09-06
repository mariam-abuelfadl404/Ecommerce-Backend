const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utlis/catchAsync.utlis');
const AppError = require('../utlis/appError.utlis');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.signup = catchAsync(async (req, res, next) => {
    const { name, phone, email, address, password } = req.body;
    if (!name || !phone || !email || !address || !password) {
        return next(new AppError('All fields are required', 400));
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
        name,
        phone,
        email,
        address,
        password: hashedPassword,
        role: 'user'  // Default to user as per requirements
    });
    const token = signToken(newUser._id);
    res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        token,
        data: { user: newUser }
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        token
    });
});