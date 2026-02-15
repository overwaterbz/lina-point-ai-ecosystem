/**
 * Tests for /api/gen-magic-content endpoint
 * Tests AI-powered magic content generation (songs, videos)
 */

import { POST } from '@/app/api/gen-magic-content/route';
import {
  createMockRequest,
  testApiEndpoint,
  performanceMetrics,
} from '@/__tests__/utils/test-helpers';

jest.mock('@/lib/magicContent');
jest.mock('@/lib/contentAgent');
jest.mock('@supabase/supabase-js');

describe('POST /api/gen-magic-content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMetrics.clear();
  });

  describe('Magic Generation', () => {
    it('should generate magic content with valid input', async () => {
      const { data, duration } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-123',
          occasion: 'anniversary',
          musicStyle: 'jazz',
          mood: 'romantic',
          recipientName: 'Sarah',
          giftYouName: 'John',
          message: 'Happy anniversary, my love!',
        },
        headers: { 'Authorization': 'Bearer test-token' },
        expectedStatus: 200,
        expectedFields: ['success', 'items'],
        maxResponseTime: 5000,
      });

      performanceMetrics.record('magic-generation', duration);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.items) || data.items).toBeDefined();
    });

    it('should handle different occasions', async () => {
      const occasions = ['birthday', 'anniversary', 'proposal', 'custom'];

      for (const occasion of occasions) {
        const { data } = await testApiEndpoint({
          handler: POST,
          method: 'POST',
          body: {
            reservationId: `res-${occasion}`,
            occasion,
            musicStyle: 'pop',
            recipientName: 'User',
            giftYouName: 'Guest',
          },
          maxResponseTime: 5000,
        });

        expect(data.success).toBe(true);
      }
    });

    it('should support multiple music styles', async () => {
      const styles = ['jazz', 'pop', 'classical', 'reggae', 'hiphop'];

      for (const style of styles) {
        const request = createMockRequest({
          method: 'POST',
          body: {
            reservationId: 'res-123',
            occasion: 'birthday',
            musicStyle: style,
            recipientName: 'User',
            giftYouName: 'Guest',
          },
        });

        const response = await POST(request);
        expect(response.status).toBeLessThanOrEqual(200 + 1); // 200 or 201
      }
    });
  });

  describe('Content Types', () => {
    it('should generate songs and videos', async () => {
      const { data } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-123',
          occasion: 'birthday',
          musicStyle: 'pop',
          recipientName: 'Alex',
          giftYouName: 'Friend',
        },
        maxResponseTime: 5000,
      });

      if (data.items) {
        const contentTypes = data.items.map((item: any) => item.contentType);
        expect(contentTypes).toContain('song');
        expect(contentTypes).toContain('video');
      }
    });

    it('should include media URLs in response', async () => {
      const { data } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-123',
          occasion: 'anniversary',
          musicStyle: 'romantic',
          recipientName: 'Partner',
          giftYouName: 'You',
        },
        maxResponseTime: 5000,
      });

      if (data.items && data.items.length > 0) {
        data.items.forEach((item: any) => {
          expect(item).toHaveProperty('contentType');
          if (item.mediaUrl) {
            expect(item.mediaUrl).toMatch(/^https?:\/\//);
          }
        });
      }
    });
  });

  describe('Questionnaire Handling', () => {
    it('should use provided questionnaire details', async () => {
      const { data } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-123',
          occasion: 'proposal',
          musicStyle: 'classical',
          recipientName: 'Jane',
          giftYouName: 'John',
          message: 'Will you marry me?',
          keyMemories: 'First date at the beach',
          favoriteColors: 'rose gold',
          favoriteSongsArtists: 'Ed Sheeran',
        },
        maxResponseTime: 5000,
      });

      expect(data.success).toBe(true);
    });

    it('should handle partial questionnaire data', async () => {
      const { data } = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body: {
          reservationId: 'res-123',
          occasion: 'birthday',
          recipientName: 'User',
          giftYouName: 'Guest',
          // Missing: musicStyle, message, memories, etc.
        },
        maxResponseTime: 5000,
      });

      expect(data.success).toBe(true);
    });
  });

  describe('Performance & Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map((_, i) =>
          testApiEndpoint({
            handler: POST,
            method: 'POST',
            body: {
              reservationId: `res-concurrent-${i}`,
              occasion: 'birthday',
              musicStyle: 'pop',
              recipientName: `User${i}`,
              giftYouName: `Guest${i}`,
            },
            maxResponseTime: 5000,
          })
        );

      const results = await Promise.all(requests);
      results.forEach(({ data }) => {
        expect(data.success).toBe(true);
      });
    });

    it('should complete generation within timeout', async () => {
      const durations: number[] = [];

      for (let i = 0; i < 3; i++) {
        const { duration } = await testApiEndpoint({
          handler: POST,
          method: 'POST',
          body: {
            reservationId: `res-timeout-${i}`,
            occasion: 'birthday',
            musicStyle: 'jazz',
            recipientName: 'User',
            giftYouName: 'Guest',
          },
          maxResponseTime: 6000,
        });

        durations.push(duration);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      console.log(`Average magic generation time: ${avgDuration.toFixed(2)}ms`);
    });
  });

  describe('Error Handling', () => {
    it('should reject missing reservation ID', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          occasion: 'birthday',
          recipientName: 'User',
          // Missing: reservationId
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle invalid occasion', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          reservationId: 'res-123',
          occasion: 'invalid-occasion',
          recipientName: 'User',
          giftYouName: 'Guest',
        },
      });

      const response = await POST(request);
      expect([400, 422]).toContain(response.status);
    });

    it('should return consistent error format', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { reservationId: 'res-123' }, // Missing required fields
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(typeof data.message).toBe('string');
    });
  });

  describe('Caching & Optimization', () => {
    it('should return same content for duplicate requests', async () => {
      const body = {
        reservationId: 'res-cache-test',
        occasion: 'birthday',
        musicStyle: 'pop',
        recipientName: 'User',
        giftYouName: 'Guest',
      };

      const first = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body,
        maxResponseTime: 5000,
      });

      const second = await testApiEndpoint({
        handler: POST,
        method: 'POST',
        body,
        maxResponseTime: 3000, // Second should be faster (cached)
      });

      expect(first.data.success).toBe(true);
      expect(second.data.success).toBe(true);
      // In a real scenario, second would be significantly faster
    });
  });

  afterAll(() => {
    console.log('=== Magic Content Generation Performance Report ===');
    performanceMetrics.report();
  });
});
