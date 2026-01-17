import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger';

// Create rate limiter instances
const rateLimiterInstance = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

const authRateLimiterInstance = new RateLimiterMemory({
  points: 5, // Number of login attempts
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    await rateLimiterInstance.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    
    logger.warn('Rate limit exceeded', {
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

export const authRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    await authRateLimiterInstance.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    
    logger.warn('Auth rate limit exceeded', {
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

// Export rate limiter middleware
export const rateLimiter = rateLimiterMiddleware;