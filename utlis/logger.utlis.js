const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(
        format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
        format.errors({ stack: true }),
        format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} | ${level.toUpperCase()} | ${message} ${stack ? `\n${stack}` : ''}`;
        }),
    ),
    transports: [
        new transports.Console(),
        new transports.File({filename:'logs/error.log',level:'error'}),
        new transports.File({filename:'logs/combine.log'})
    ]
});

module.exports = logger;
