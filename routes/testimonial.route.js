const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { getTestimonials, addTestimonial, approveTestimonial ,getUnseenTestimonials, deleteTestimonial} = require('../controllers/testimonial.controller');

router.route('/')
    .get(getTestimonials)
    .post(protect, addTestimonial);

router.route('/:id/approve')
    .put(protect, restrictTo('admin'), approveTestimonial);

router.route('/unseen')
    .get(protect, restrictTo('admin'), getUnseenTestimonials);

router.route('/:id/delete')
    .put(protect, restrictTo('admin'), deleteTestimonial);    

module.exports = router;