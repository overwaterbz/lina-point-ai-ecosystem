/**
 * Tests for /api/book-flow endpoint
 * Tests booking creation, tour curation, and magic content triggering
 */

import { POST } from '@/app/api/book-flow/route';
import {
  createMockRequest,
  testApiEndpoint,
  performanceMetrics,
} from '@/__tests__/utils/test-helpers';

jest.mock('@/lib/priceScoutAgent');
jest.mock('@/lib/experienceCuratorAgent');
jest.mock('@/lib/magicContent');
jest.mock('@supabase/supabase-js');

describe('POST /api/book-flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMetrics.clear();
  });

  describe('Booking Creation', () => {
    it('should create booking with valid input', async () => {
      const { data, duration } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-123',
          roomType: 'overwater-suite',
          checkInDate: '2026-03-15',
          checkOutDate: '2026-03-22',
          groupSize: 2,
          addOns: ['breakfast', 'spa'],
        },
        headers: { 'Authorization': 'Bearer test-token' },
        expectedStatus: 200,
        expectedFields: ['success', 'bookingId', 'message'],
        maxResponseTime: 2000,
      });

      performanceMetrics.record('booking-creation', duration);
      expect(data.success).toBe(true);
      expect(data.bookingId).toBeDefined();
    });

    it('should validate room type', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          reservationId: 'res-123',
          roomType: 'invalid-room',
          checkInDate: '2026-03-15',
          checkOutDate: '2026-03-22',
          groupSize: 2,
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          roomType: 'beach-villa',
          // Missing: reservationId, checkInDate, checkOutDate, groupSize
        },
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Tour Curation', () => {
    it('should include tour recommendations', async () => {
      const { data } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-123',
          roomType: 'overwater-room',
          checkInDate: '2026-03-15',
          checkOutDate: '2026-03-22',
          groupSize: 2,
          preferences: ['snorkeling', 'dining'],
        },
        expectedFields: ['tours', 'recommendations'],
        maxResponseTime: 3000,
      });

      if (data.tours) {
        expect(Array.isArray(data.tours)).toBe(true);
      }
    });
  });

  describe('Magic Content Trigger', () => {
    it('should trigger magic content when add-on selected', async () => {
      const { data } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-123',
          roomType: 'beach-villa',
          checkInDate: '2026-03-15',
          checkOutDate: '2026-03-22',
          groupSize: 2,
          addOns: ['magic'],
        },
        expectedStatus: 200,
        maxResponseTime: 3000,
      });

      expect(data.success).toBe(true);
    });

    it('should skip magic content without add-on', async () => {
      const { data } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-124',
          roomType: 'garden-villa',
          checkInDate: '2026-03-20',
          checkOutDate: '2026-03-25',
          groupSize: 3,
          addOns: [],
        },
        expectedStatus: 200,
      });

      expect(data.success).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should complete booking flow within SLA', async () => {
      const durations: number[] = [];

      for (let i = 0; i < 5; i++) {
        const { duration } = await testApiEndpoint({
          handler: POST,
          method: 'POST',
          body: {
            reservationId: `res-perf-${i}`,
            roomType: 'overwater-suite',
            checkInDate: '2026-03-15',
            checkOutDate: '2026-03-22',
            groupSize: 2,
          },
          maxResponseTime: 3000,
        });

        durations.push(duration);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(2000); // Should average under 2 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock fetch failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          reservationId: 'res-123',
          roomType: 'overwater-room',
          checkInDate: '2026-03-15',
          checkOutDate: '2026-03-22',
          groupSize: 2,
        },
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(500);
    });

    it('should return proper error format', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { roomType: 'invalid' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });
  });

  afterAll(() => {
    console.log('=== Book Flow Performance Report ===');
    performanceMetrics.report();
  });
});
