const FAQ = require('../models/FAQ.model')
const catchAsync = require('../utlis/catchAsync.utlis')
const AppError =require('../utlis/appError.utlis')
// get
exports.getFAQs = catchAsync(async (req, res,next)=>{
    const faq = await FAQ.find({isActive:true,isDeleted:false})
    res.status(200).json({message:'FAQ was got sucessufly',data:faq})    
})
// post
exports.addFAQ = catchAsync(async(req, res,next)=>{
    const{question , answer} = req.body
    if(!question||!answer){
        return next(new AppError('Question and answer are required',400))
    }   1``````````````````````````
    const faq = await FAQ.create({question , answer,isActive:true,isDeleted:false})
    res.status(201).json({message:'FAQ was added sucessufly',data:faq})
})
// put
exports.updateFAQ = catchAsync(async(req, res,next)=>{
    const {id} = req.params;
    const {question , answer} = req.body;
    const faq = await FAQ.findById(id)
    if(!faq||faq.isDeleted){
        return next(new AppError('FAQ not found or deleted'),400)
    }
    if(question){
        faq.question = question
    }
    if(answer){
        faq.answer=answer
    }
    await faq.save()
    res.status(200).json({message:'FAQ updated sucessflly',data:faq})  
})
// delete
exports.deleteFAQ = catchAsync(async(req, res)=>{
    const {id} = req.params
    const faq = await FAQ.findById(id)
    if(!faq||faq.isDeleted){
        return next(new AppError('FAQ not found or already deleted',400))
    }
    faq.isDeleted= true
    await faq.save()
    res.status(200).json({message:'FAQ deleted sucessfully'})

})