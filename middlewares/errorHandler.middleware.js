const logger = require('../utlis/logger.utlis');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error
    logger.error(
        `Error occurred [${req.method} ${req.originalUrl} | ${err.message} | stack: ${err.stack} | user: ${req.user?.id || 'guest'}]`
    );

    // Development mode
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // Production mode
    if (err.name === 'ValidationError') {
        err.message = Object.values(err.errors).map(e => e.message).join(', ');
        err.statusCode = 400;
    } else if (err.name === 'CastError') {
        err.message = 'Invalid ID format';
        err.statusCode = 400;
    } else if (err.name === 'JsonWebTokenError') {
        err.message = 'Invalid token. Please log in again';
        err.statusCode = 401;
    } else if (err.name === 'TokenExpiredError') {
        err.message = 'Your token has expired. Please log in again';
        err.statusCode = 401;
    }

    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};