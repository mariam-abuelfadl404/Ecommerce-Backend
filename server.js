const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/Db.config');
const AppError = require('./utlis/appError.utlis.js')
const globalErrorHandler = require('./middlewares/errorHandler.middleware.js')
// end of imports
// server config and runs
dotenv.config();
const app = express();
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
app.use(express.json());
app.use(cors())
connectDB();
// end of server config and runs
// the apis
app.use('/api/auth', require('./routes/auth.route.js'))
app.use('/api/faq',require('./routes/FAQ.route.js'))
app.use('/api/categories',require('./routes/category.route.js'))
app.use('/api/products',require('./routes/product.route.js'))
app.use('/api/cart',require('./routes/cart.route.js'))
app.use('/api/orders',require('./routes/order.route.js'))
app.use('/api/dashboard',require('./routes/dashboard.route.js'))
app.use('/api/testimonials',require('./routes/testimonial.route.js'))
app.use('/api/contact',require('./routes/contact.route.js'))


// end of the apis
// Gloabal Error Handling
app.use((req, res,next)=>{
    next((new AppError(`Can not find ${req.originalUrl}  on this server `)))
})
app.use(globalErrorHandler)
app.listen(process.env.PORT, ()=>{console.log(`Server is running on port ${process.env.PORT}`)})

