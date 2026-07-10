import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  makeCounterProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { HttpMetricsMiddleware } from './http-metrics.middleware';

/**
 * Exposes application metrics for Prometheus.
 *
 * - `GET /metrics` (registered by PrometheusModule) serves the exposition
 *   format Prometheus scrapes, including default Node.js process metrics
 *   (event loop lag, heap, GC, CPU).
 * - `HttpMetricsMiddleware` adds custom request throughput/latency series for
 *   every request.
 */
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests handled by the backend.',
      labelNames: ['method', 'route', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds.',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    }),
    HttpMetricsMiddleware,
  ],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
