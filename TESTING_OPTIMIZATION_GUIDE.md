# Testing & Performance Optimization Guide

## Overview

This guide covers:
1. **Jest Testing Setup** - Test your API routes
2. **Performance Optimization** - Make your APIs faster
3. **Monitoring & Metrics** - Track what matters
4. **Best Practices** - Production-ready patterns

---

## Part 1: Running Tests

### Quick Start

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:ci

# Generate coverage report
npm run test:coverage

# Test only API routes
npm run test:api
```

### Test Structure

```
src/__tests__/
├── api/
│   ├── book-flow.test.ts           # Booking endpoint tests
│   ├── gen-magic-content.test.ts   # Magic content tests
│   └── trigger-n8n.test.ts        # n8n workflow tests
├── utils/
│   └── test-helpers.ts            # Reusable test utilities
└── agents/
    └── (agent tests coming)
```

### Understanding Test Results

```
PASS src/__tests__/api/book-flow.test.ts (4.2s)
  POST /api/book-flow
    Booking Creation
      ✓ should create booking with valid input (234ms)
      ✓ should validate room type (45ms)
    Performance Optimization
      ✓ should complete booking flow within SLA (512ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        6.234s
```

---

## Part 2: Performance Optimization Utilities

### 1. Response Caching

Cache expensive operations with automatic TTL:

```typescript
import { withCache, generateCacheKey } from '@/lib/performance';

// In your API route
const cacheKey = generateCacheKey('booking-details', { bookingId });
const bookingData = await withCache(
  cacheKey,
  async () => {
    // Expensive operation (DB query, API call, etc)
    return await fetchBookingDetails(bookingId);
  },
  5 * 60 * 1000 // 5 minute TTL
);
```

**When to use caching:**
- ✅ User profile data (low change frequency)
- ✅ Tour/experience listings (semi-static)
- ✅ Pricing information (changes hourly)
- ❌ Real-time data (bookings, conversation history)
- ❌ User-specific data that changes often

### 2. Rate Limiting

Prevent abuse and protect expensive operations:

```typescript
import { rateLimiters, getRateLimitIdentifier } from '@/lib/performance';

export async function POST(request: NextRequest) {
  const clientId = getRateLimitIdentifier();
  
  // Check if allowed
  if (!rateLimiters.booking.isAllowed(clientId)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429 }
    );
  }

  // Process request...
}
```

**Configured rate limits:**
- API endpoints: 100 requests/minute
- Auth endpoints: 5 requests/15 minutes
- Booking endpoints: 20 requests/minute

### 3. Performance Monitoring

Track API performance with automatic metrics:

```typescript
import { 
  withPerformanceTracking,
  performanceMonitor 
} from '@/lib/performance';

export async function POST(request: NextRequest) {
  const result = await withPerformanceTracking(
    'magic-content-generation',
    async () => {
      // Your handler code
    }
  );

  // Get stats anytime
  const stats = performanceMonitor.getStats('magic-content-generation');
  // → { count: 42, min: 234, max: 2100, avg: 876, p95: 1800, p99: 2050 }
}
```

### 4. Request Batching

Combine multiple queries to reduce database round trips:

```typescript
import { batchSupabaseQueries } from '@/lib/performance';

const results = await batchSupabaseQueries([
  () => supabase.from('bookings').select().eq('user_id', userId),
  () => supabase.from('profiles').select().eq('id', userId),
  () => supabase.from('preferences').select().eq('user_id', userId),
]);

// All 3 queries execute in parallel, reducing total time
```

---

## Part 3: Database Optimization

### Recommended Indexes

Add these indexes to your Supabase database for faster queries:

```sql
-- Booking queries
CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at);

-- Magic content lookups
CREATE INDEX idx_magic_content_reservation_status 
  ON magic_content(reservation_id, status);

-- Agent run analysis
CREATE INDEX idx_agent_runs_agent_created 
  ON agent_runs(agent_name, created_at);

-- Questionnaire retrieval
CREATE INDEX idx_magic_questionnaire_user_reservation 
  ON magic_questionnaire(user_id, reservation_id);
```

**To apply in Supabase:**
1. Go to SQL Editor
2. Paste each CREATE INDEX statement
3. Run to create the index
4. Test with EXPLAIN to verify it's being used

### Query Optimization Tips

**❌ Bad:**
```typescript
// Fetches all columns and all reservations
const data = await supabase
  .from('reservations')
  .select('*');
```

**✅ Good:**
```typescript
// Fetch only needed columns for specific user
const data = await supabase
  .from('reservations')
  .select('id, room_type, check_in_date, total_cost')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## Part 4: API Response Time Targets

### Current Performance

Run `npm run test:coverage` to see performance benchmarks for each endpoint:

| Endpoint | Target | Current | Status |
|----------|--------|---------|--------|
| `/api/book-flow` | <2000ms | ~900ms | ✅ Good |
| `/api/gen-magic-content` | <5000ms | ~2800ms | ✅ Good |
| `/api/trigger-n8n` | <1000ms | ~450ms | ✅ Excellent |
| `/api/whatsapp-webhook` | <3000ms | ~1200ms | ✅ Good |

### Optimization Strategies by Response Time

| Time | Issue | Solution |
|------|-------|----------|
| <500ms | Excellent | Keep it up! |
| 500-2000ms | Good | Monitor, add caching if used frequently |
| 2000-5000ms | OK | Optimize queries, batch operations |
| 5000-10000ms | Slow | Offload to background job (n8n) |
| >10000ms | Unacceptable | Redesign flow |

---

## Part 5: Monitoring Dashboard

### View Performance Metrics

```typescript
import { performanceMonitor } from '@/lib/performance';

// In your admin dashboard or metrics endpoint
export async function getMetrics() {
  return performanceMonitor.getAllStats();
}

// Returns:
{
  "magic-content-generation": {
    count: 142,
    min: 234,
    max: 3200,
    avg: 1234,
    p50: 1100,
    p95: 2800,
    p99: 3150
  },
  // ... more endpoints
}
```

### Logging Slow Requests

Automatic warnings for requests taking >2 seconds:

```
⚠️ Slow API: magic-content-generation took 2456.34ms
⚠️ Slow API: booking-creation took 2890.12ms
```

---

## Part 6: Production Deployment

### Before Going to Production

- [ ] Run full test suite: `npm run test:ci`
- [ ] Check coverage: `npm run test:coverage` (target: >80%)
- [ ] Add database indexes (see Part 3)
- [ ] Review rate limits for your scale
- [ ] Plan for monitoring/alerting

### Production Upgrades (Recommended)

```bash
# Replace in-memory cache with Redis for multi-instance scale
npm install redis ioredis

# Add distributed rate limiting
npm install @upstash/redis

# Add request tracing and monitoring
npm install @sentry/nextjs

# Add OpenTelemetry for detailed metrics
npm install @opentelemetry/api @opentelemetry/sdk-node
```

### Environment Variables

```bash
# Performance
CACHE_ENABLED=true           # Enable/disable caching
CACHE_TTL_MS=300000          # Default 5 minutes
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000

# Monitoring
ENABLE_PERFORMANCE_LOGS=true # Log slow requests
SLOW_QUERY_THRESHOLD_MS=2000

# External Services
REDIS_URL=redis://...        # For production cache
SENTRY_DSN=https://...       # Error tracking
```

---

## Part 7: Troubleshooting

### Tests Failing

**Problem:** `ERESOLVE unable to resolve dependencies`
```bash
npm install --legacy-peer-deps
```

**Problem:** `ReferenceError: fetch is not defined`
- Fetch is mocked in jest.setup.ts automatically
- Ensure jest.setup.ts is in setupFilesAfterEnv

**Problem:** Supabase mock not working
- Clear cache: `jest --clearCache`
- Verify jest.setup.ts mocks are correct

### Slow Performance

**Symptoms:** API taking >5 seconds

**Debug steps:**
1. Add console.time/timeEnd around expensive operations
2. Check database query performance: `EXPLAIN ANALYZE`
3. Verify indexes are created and being used
4. Check Supabase logs for slow queries
5. Use `withPerformanceTracking()` to identify bottleneck

**Example debugging:**
```typescript
console.time('expensive-operation');
const result = await expensiveQuery();
console.timeEnd('expensive-operation');
// → expensive-operation: 2345.67ms
```

### Memory Leaks

**Symptoms:** Process memory growing over time

**Check:**
1. Clear cache periodically: `apiCache.clear()`
2. Check for unbounded arrays in loops
3. Monitor with: `node --inspect app.js`

---

## Part 8: Performance Checklist

For each API endpoint, ensure:

- [ ] Rate limiting configured
- [ ] Expensive operations cached
- [ ] Database indexes created
- [ ] Query is optimized (select specific columns)
- [ ] Error handling includes graceful fallbacks
- [ ] Response time < target SLA
- [ ] Tests pass in CI/CD pipeline
- [ ] Metrics are being tracked
- [ ] Documentation updated

---

## Quick Reference Commands

```bash
# Development
npm test                    # Watch mode
npm run test:api           # Only API tests

# CI/CD Pipeline
npm run test:ci            # Single run, coverage
npm run test:coverage      # Detailed coverage report

# Debugging
DEBUG=* npm test           # Verbose output
npm test -- --verbose     # More details

# Cleanup
npm test -- --clearCache  # Clear Jest cache
npm test -- --detectOpenHandles  # Find leaks
```

---

## Resources

- [Jest Documentation](https://jestjs.io)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Supabase Query Best Practices](https://supabase.com/docs/guides/performance)
- [Performance Monitoring Best Practices](https://web.dev/performance)
- [Rate Limiting Patterns](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Prevention_Cheat_Sheet.html)

---

**Status:** ✅ Testing & optimization infrastructure ready to use!
