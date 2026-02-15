# Testing & Performance - Quick Reference Card

## 🚀 Quick Start (30 seconds)

```bash
# 1. Install (if needed)
npm install

# 2. Run tests
npm test
```

That's it! Tests will run in watch mode.

---

## 📋 Test Commands Cheat Sheet

```bash
# Development
npm test                 # Watch mode (recommended)
npm test -- --no-coverage  # Faster, no coverage
npm test -- --listTests # List all test files

# CI/CD Pipeline
npm run test:ci         # Single run with coverage
npm run test:coverage   # HTML coverage report (15s)

# Specific tests
npm run test:api        # Only API route tests
npm test -- book-flow   # Only book-flow tests
npm test -- --verbose  # Detailed output

# Debugging
npm test -- --verbose --no-coverage
DEBUG=* npm test        # Show debug logs
npm test -- --onlyChanged  # Only changed tests

# Cleanup
npm test -- --clearCache  # Clear Jest cache
npm test -- --detectOpenHandles  # Find memory leaks
```

---

## 📊 Understanding Test Results

### Good Output
```
PASS src/__tests__/api/book-flow.test.ts
Tests: 13 passed, 13 total
Snapshots: 0 total
Time: 4.234s
```
✅ All tests passed, good response times

### Watch Issues
```
FAIL src/__tests__/api/book-flow.test.ts

● should create booking with valid input
  Error: Cannot find module '@/lib/magicContent'
```
❌ Fix imports, check jest.config.ts aliases

---

## 🎯 Performance Monitoring

### Add Performance Tracking

```typescript
import { withPerformanceTracking } from '@/lib/performance';

export async function POST(request: NextRequest) {
  return withPerformanceTracking('my-endpoint', async () => {
    // Your handler logic
  });
}
```

### Check Performance Stats

```typescript
import { performanceMonitor } from '@/lib/performance';

// Get stats for an endpoint
const stats = performanceMonitor.getStats('my-endpoint');
console.table(stats);
// → { count: 42, min: 234, avg: 876, p95: 1800, p99: 2050 }
```

### Get All Metrics

```typescript
const allStats = performanceMonitor.getAllStats();
// Returns stats for all tracked endpoints
```

---

## 🛡️ Add Caching (60 seconds)

### Before (Every request hits DB)
```typescript
export async function GET(request: NextRequest) {
  const data = await supabase.from('tours').select('*').eq('id', tourId);
  return NextResponse.json(data);
}
```

### After (Cached for 5 minutes)
```typescript
import { withCache, generateCacheKey } from '@/lib/performance';

export async function GET(request: NextRequest) {
  const cacheKey = generateCacheKey('tour', { tourId });
  const data = await withCache(cacheKey, async () => {
    return await supabase.from('tours').select('*').eq('id', tourId);
  }, 5 * 60 * 1000);
  
  return NextResponse.json(data);
}
```

**Impact:** 10-100x faster for repeat requests!

---

## 🚨 Add Rate Limiting (30 seconds)

```typescript
import { rateLimiters, getRateLimitIdentifier } from '@/lib/performance';

export async function POST(request: NextRequest) {
  const clientId = getRateLimitIdentifier(); // IP address
  
  if (!rateLimiters.booking.isAllowed(clientId)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in 1 minute.' },
      { status: 429 }
    );
  }

  // Process request...
}
```

**Configured Limits:**
- API: 100/minute
- Auth: 5/15 minutes
- Booking: 20/minute

---

## 📈 Test Coverage Targets

| Level | Target | Command | Frequency |
|-------|--------|---------|-----------|
| Development | >60% | `npm test` | Before commit |
| PR Review | >70% | `npm run test:ci` | Before merge |
| Production | >80% | `npm run test:coverage` | Before release |

**Generate HTML report:**
```bash
npm run test:coverage
# Opens: coverage/lcov-report/index.html
```

---

## 🔧 Database Optimization (5 minutes)

### Check if index exists
```sql
SELECT * FROM pg_indexes WHERE tablename = 'bookings';
```

### Add missing indexes
```sql
CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at);
CREATE INDEX idx_magic_content_status ON magic_content(reservation_id, status);
```

### Verify index is used
```sql
EXPLAIN ANALYZE
SELECT * FROM bookings 
WHERE user_id = '123' 
ORDER BY created_at DESC 
LIMIT 10;
```
- Look for "Seq Scan" (bad) vs "Index Scan" (good)

---

## ⚡ Performance SLA Checklist

For each API endpoint:

- [ ] Has tests with `maxResponseTime` set
- [ ] Test verifies <target SLA (e.g., <2000ms)
- [ ] Database indexes created
- [ ] Query optimized (select specific columns)
- [ ] Caching implemented for slow queries
- [ ] Rate limiting enabled
- [ ] Performance tracked with `withPerformanceTracking`
- [ ] Pass all CI tests before deploy

---

## 🆘 Troubleshooting (1-2 min each)

### Tests Won't Run
```bash
# Clear cache
npm test -- --clearCache

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tests Are Slow
```bash
# Skip coverage (faster)
npm test -- --no-coverage

# Run only changed tests
npm test -- --onlyChanged
```

### Mock Not Working
- Check `jest.setup.ts` has mock definition
- Verify import path matches mock in jest.setup.ts
- Run: `npm test -- --clearCache`

### Performance Metrics Wrong
- Ensure `withPerformanceTracking()` wraps handler
- Check label name matches when reading stats
- Clear metrics: `performanceMonitor.clear()`

---

## 📚 File Locations

```
Test Files:
  src/__tests__/api/*.test.ts          ← Add tests here
  src/__tests__/utils/test-helpers.ts  ← Reusable test utilities

Performance Utilities:
  src/lib/performance.ts               ← Caching, rate limiting, monitoring

Configuration:
  jest.config.ts                       ← Jest settings
  jest.setup.ts                        ← Test environment

Documentation:
  TESTING_OPTIMIZATION_GUIDE.md        ← Full guide
  TESTING_IMPLEMENTATION_SUMMARY.md    ← What's implemented
```

---

## ✨ Real-World Example: Optimize Magic Content API

```typescript
// BEFORE: Takes 4-5 seconds every request
import { POST as originalPOST } from './route';

// AFTER: Takes 4-5 seconds first time, <100ms cached
import { withPerformanceTracking, withCache, generateCacheKey } from '@/lib/performance';

export async function POST(request: NextRequest) {
  return withPerformanceTracking('gen-magic-content', async () => {
    const body = await request.json();
    const cacheKey = generateCacheKey('magic-content', body);

    return NextResponse.json(
      await withCache(cacheKey, () => originalPOST(request), 10 * 60 * 1000)
    );
  });
}

// Result: Cached requests 40-50x faster! 🚀
```

---

## 🎓 Learning Path

1. **5 min**: Read this card
2. **10 min**: Run `npm test`, see tests pass
3. **15 min**: Read TESTING_IMPLEMENTATION_SUMMARY.md
4. **30 min**: Read TESTING_OPTIMIZATION_GUIDE.md
5. **1 hour**: Add caching/rate limiting to one endpoint
6. **2 hours**: Add performance tracking to all endpoints

---

**Status**: ✅ Ready to test and optimize!

**Next**: Run `npm test` 🎉
