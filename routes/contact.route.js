const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { submitContact, getContacts, resolveContact } = require('../controllers/contact.controller');

router.route('/')
    .post(submitContact)
    .get(protect, restrictTo('admin'), getContacts);

router.route('/:id/resolve')
    .put(protect, restrictTo('admin'), resolveContact);

module.exports = router;