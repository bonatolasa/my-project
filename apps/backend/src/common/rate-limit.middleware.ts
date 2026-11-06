import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<
    string,
    { count: number; resetAt: number }
  >();

  use(request: Request, response: Response, next: NextFunction) {
    const now = Date.now();
    const address = request.ip ?? request.socket.remoteAddress ?? "unknown";
    const current = this.buckets.get(address);
    if (!current || current.resetAt <= now) {
      this.buckets.set(address, { count: 1, resetAt: now + 60_000 });
      next();
      return;
    }
    current.count += 1;
    if (current.count > 120) {
      response
        .status(429)
        .json({ statusCode: 429, message: "Too many requests" });
      return;
    }
    next();
  }
}
