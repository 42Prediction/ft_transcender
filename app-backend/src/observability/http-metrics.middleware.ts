import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { NextFunction, Request, Response } from 'express';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requests: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly duration: Histogram<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.once('finish', () => {
      const route: string =
        (req.route as { path?: string } | undefined)?.path ??
        req.baseUrl ??
        'unknown';
      const labels = {
        method: req.method,
        route: route || 'unknown',
        status: String(res.statusCode),
      };
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      this.requests.inc(labels);
      this.duration.observe(labels, seconds);
    });

    next();
  }
}
