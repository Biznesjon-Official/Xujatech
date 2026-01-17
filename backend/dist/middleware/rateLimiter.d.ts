import { Request, Response, NextFunction } from 'express';
export declare const rateLimiterMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authRateLimiterMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rateLimiter.d.ts.map