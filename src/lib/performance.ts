/**
 * Performance optimization utilities for API routes
 * Includes caching, rate limiting, and monitoring
 */

import { headers } from 'next/headers';

/**
 * Simple in-memory cache with TTL support
 * Note: For production, use Redis
 */
class MemoryCache {
  private cache = new Map<
    string,
    { value: unknown; expiry: number }
  >();

  set(key: string, value: unknown, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }
}

export const apiCache = new MemoryCache();

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${prefix}:${sorted}`;
}

/**
 * Retrieve cached response or execute handler
 */
export async function withCache<T>(
  cacheKey: string,
  handler: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  // Try cache first
  const cached = apiCache.get(cacheKey) as T | null;
  if (cached !== null) {
    return cached;
  }

  // Execute handler
  const result = await handler();

  // Cache result
  apiCache.set(cacheKey, result, ttlMs);

  return result;
}

/**
 * Rate limiter interface with in-memory implementation
 */
interface RateLimitConfig {
  windowMs: number; // Time window in ms
  maxRequests: number; // Max requests per window
}

class RateLimiter {
  private requests = new Map<
    string,
    { timestamps: number[]; blocked: boolean }
  >();

  constructor(private config: RateLimitConfig) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, { timestamps: [now], blocked: false });
      return true;
    }

    const entry = this.requests.get(identifier)!;

    // Clean old timestamps
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= this.config.maxRequests) {
      entry.blocked = true;
      return false;
    }

    entry.timestamps.push(now);
    entry.blocked = false;
    return true;
  }

  getRemaining(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry) return this.config.maxRequests;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const recentRequests = entry.timestamps.filter((ts) => ts > windowStart);

    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  clear(): void {
    this.requests.clear();
  }
}

// Create rate limiters for different endpoints
export const rateLimiters = {
  api: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 100 }), // 100 per minute
  auth: new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 }), // 5 per 15 min
  booking: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 20 }), // 20 per minute
};

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(): string {
  try {
    const headersList = headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip =
      forwarded?.split(',')[0].trim() ||
      headersList.get('x-real-ip') ||
      'unknown';
    return ip;
  } catch {
    return 'unknown';
  }
}

/**
 * Query result caching for Supabase
 */
export async function cacheSupabaseQuery<T>(
  key: string,
  query: () => Promise<{ data: T | null; error: any }>,
  ttlMs: number = 5 * 60 * 1000
): Promise<{ data: T | null; error: any }> {
  return withCache(key, query, ttlMs);
}

/**
 * Batch similar requests to reduce database load
 */
class RequestBatcher {
  private pending = new Map<string, Promise<unknown>>();

  async batch<T>(
    key: string,
    handler: () => Promise<T>,
    debounceMs: number = 10
  ): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await handler();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.pending.delete(key);
        }
      }, debounceMs);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pending.clear();
  }
}

export const requestBatcher = new RequestBatcher();

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(name)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware for API route performance tracking
 */
export async function withPerformanceTracking<T>(
  label: string,
  handler: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await handler();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(label, duration);

    // Log slow requests
    if (duration > 2000) {
      console.warn(`⚠️ Slow API: ${label} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(label, duration);
    console.error(
      `❌ API Error: ${label} failed after ${duration.toFixed(2)}ms`,
      error
    );
    throw error;
  }
}

/**
 * Batch database queries to reduce round trips
 */
export async function batchSupabaseQueries<T>(
  queries: Array<() => Promise<{ data: T | null; error: any }>>
): Promise<Array<{ data: T | null; error: any }>> {
  return Promise.all(queries.map((q) => q()));
}

/**
 * Query optimization: add indexes recommendations
 */
export const suggestedIndexes = [
  {
    table: 'bookings',
    columns: ['user_id', 'created_at'],
    description: 'Speeds up user booking history queries',
  },
  {
    table: 'magic_content',
    columns: ['reservation_id', 'status'],
    description: 'Speeds up magic content status lookups',
  },
  {
    table: 'agent_runs',
    columns: ['agent_name', 'created_at'],
    description: 'Speeds up agent performance analysis',
  },
  {
    table: 'magic_questionnaire',
    columns: ['user_id', 'reservation_id'],
    description: 'Speeds up questionnaire retrieval',
  },
];

/**
 * Export metrics for monitoring
 */
export function getMetricsReport() {
  return {
    cache: {
      size: apiCache.size(),
      hitRate: 'track in production',
    },
    performance: performanceMonitor.getAllStats(),
    rateLimiters: {
      api: 'Configured: 100 req/min',
      auth: 'Configured: 5 req/15min',
      booking: 'Configured: 20 req/min',
    },
  };
}
