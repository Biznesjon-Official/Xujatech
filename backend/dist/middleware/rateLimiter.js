"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.authRateLimiterMiddleware = exports.rateLimiterMiddleware = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const logger_1 = require("../utils/logger");
const rateLimiterInstance = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 100,
    duration: 60,
});
const authRateLimiterInstance = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 5,
    duration: 900,
    blockDuration: 900,
});
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        await rateLimiterInstance.consume(key);
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        logger_1.logger.warn('Rate limit exceeded', {
            ip: req.ip,
            url: req.url,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        });
    }
};
exports.rateLimiterMiddleware = rateLimiterMiddleware;
const authRateLimiterMiddleware = async (req, res, next) => {
    try {
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        await authRateLimiterInstance.consume(key);
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        logger_1.logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            url: req.url,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            success: false,
            message: 'Too many login attempts, please try again later.'
        });
    }
};
exports.authRateLimiterMiddleware = authRateLimiterMiddleware;
exports.rateLimiter = exports.rateLimiterMiddleware;
//# sourceMappingURL=rateLimiter.js.map