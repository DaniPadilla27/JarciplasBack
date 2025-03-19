const winston = require("winston");
const path = require("path");

// Configuración del logger
const logger = winston.createLogger({
    level: "info", // Niveles: error, warn, info, http, verbose, debug, silly
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(__dirname, "../logs/error.log"), 
            level: "error" 
        }),
        new winston.transports.File({ 
            filename: path.join(__dirname, "../logs/combined.log") 
        })
    ]
});

// Si estás en desarrollo, también imprime en la consola
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

module.exports = logger;
