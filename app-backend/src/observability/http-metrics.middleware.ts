import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { NextFunction, Request, Response } from 'express';
import { Counter, Histogram } from 'prom-client';

/**
 * Records one sample per HTTP request into Prometheus metrics.
 *
 * Implemented as Express-level middleware (rather than a Nest interceptor) so
 * that *every* request is counted — including 404s on unmatched paths and 401s
 * rejected by guards, which never reach a controller and are exactly the
 * failures the error-rate alerts need to see.
 *
 * We label by the matched route pattern (e.g. `/market/:id`), read on the
 * response's `finish` event once Express has populated `req.route`, to keep
 * metric cardinality bounded and reflect the final status code.
 */
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
