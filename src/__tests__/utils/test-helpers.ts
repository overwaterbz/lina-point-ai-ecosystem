/**
 * Test utilities for API route testing
 * Provides helpers for common testing tasks
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock NextRequest for testing API routes
 */
export function createMockRequest(
  config: {
    method?: string;
    url?: string;
    body?: unknown;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const {
    method = 'POST',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    cookies = {},
  } = config;

  const mockHeaders = new Headers(headers);
  
  // Add cookies to headers if provided
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    mockHeaders.set('Cookie', cookieString);
  }

  const request = new NextRequest(new URL(url), {
    method,
    headers: mockHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

/**
 * Measure API response time
 */
export async function measureResponseTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Assert response time is under threshold
 */
export function expectResponseTimeLessThan(
  duration: number,
  threshold: number,
  description: string
): void {
  if (duration > threshold) {
    throw new Error(
      `${description} took ${duration.toFixed(2)}ms, expected < ${threshold}ms`
    );
  }
}

/**
 * Test API endpoint response structure
 */
export async function testApiEndpoint(config: {
  handler: (req: NextRequest) => Promise<NextResponse>;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  expectedStatus?: number;
  expectedFields?: string[];
  maxResponseTime?: number;
}) {
  const {
    handler,
    method = 'POST',
    body,
    headers = {},
    expectedStatus = 200,
    expectedFields = [],
    maxResponseTime = 1000,
  } = config;

  const request = createMockRequest({ method, body, headers });

  const { result, duration } = await measureResponseTime(() =>
    handler(request)
  );

  // Check status
  expect(result.status).toBe(expectedStatus);

  // Check response time
  if (maxResponseTime) {
    expectResponseTimeLessThan(
      duration,
      maxResponseTime,
      `API response (${config.handler.name})`
    );
  }

  // Parse and check response
  const data = await result.json();

  if (expectedFields.length > 0) {
    expectedFields.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  return { data, duration, status: result.status };
}

/**
 * Create mock Supabase client for tests
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
}

/**
 * Mock Supabase response
 */
export function mockSupabaseResponse<T>(data: T, error: string | null = null) {
  return {
    data,
    error: error ? new Error(error) : null,
  };
}

/**
 * Performance testing utilities
 */
export const performanceMetrics = {
  measurements: new Map<string, number[]>(),

  record(label: string, duration: number) {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
  },

  getStats(label: string) {
    const values = this.measurements.get(label) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[values.length - 1],
      avg,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  },

  clear() {
    this.measurements.clear();
  },

  report() {
    console.table(
      Array.from(this.measurements.entries()).map(([label, values]) => ({
        'Test Name': label,
        'Count': values.length,
        'Min (ms)': values.reduce((a, b) => Math.min(a, b), Infinity).toFixed(2),
        'Avg (ms)': (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
        'Max (ms)': values.reduce((a, b) => Math.max(a, b), 0).toFixed(2),
      }))
    );
  },
};

/**
 * Batch test helper for running multiple assertions
 */
export async function runBatchTests(
  tests: Array<{
    name: string;
    fn: () => Promise<void> | void;
  }>
) {
  const results = [];
  
  for (const test of tests) {
    const start = performance.now();
    try {
      await test.fn();
      results.push({
        name: test.name,
        status: 'passed',
        duration: performance.now() - start,
      });
    } catch (error) {
      results.push({
        name: test.name,
        status: 'failed',
        error: String(error),
        duration: performance.now() - start,
      });
    }
  }

  return results;
}
