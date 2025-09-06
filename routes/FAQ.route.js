const express = require('express')
const router = express.Router()
const {getFAQs,addFAQ,updateFAQ,deleteFAQ} = require('../controllers/FAQ.controller')
router.route('/').get(getFAQs)
router.route('/').post(addFAQ)
router.route('/:id').put(updateFAQ)
router.route('/:id').delete(deleteFAQ)
module.exports=router