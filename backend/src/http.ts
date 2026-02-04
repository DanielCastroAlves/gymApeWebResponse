import type { NextFunction, Request, Response } from 'express';

export function asyncHandler<
  Req extends Request,
  Res extends Response,
  Next extends NextFunction,
>(fn: (req: Req, res: Res, next: Next) => Promise<void>) {
  return (req: Req, res: Res, next: Next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

