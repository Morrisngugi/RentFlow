import { Request, Response, NextFunction } from 'express';

function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, path, ip } = req;

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logLevel = statusCode >= 400 ? '⚠️ ' : '📝';
    console.log(
      `${logLevel} [${method}] ${path} - ${statusCode} (${duration}ms) - ${ip}`
    );
  });

  next();
}

export default requestLogger;
