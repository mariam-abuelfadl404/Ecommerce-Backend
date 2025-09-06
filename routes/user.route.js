const express = require('express');
const router = express.Router();
const { signup, login, updateProfile, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;