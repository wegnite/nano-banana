/**
 * Character Figure Generation API Tests
 * 
 * Tests the core generation functionality including:
 * - Valid generation requests
 * - Credit validation
 * - Rate limiting
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock nano-banana service
jest.mock('../../src/services/nano-banana', () => ({
  NanoBananaService: jest.fn().mockImplementation(() => ({
    generateImage: jest.fn().mockResolvedValue({
      success: true,
      images: ['https://example.com/generated.jpg'],
      credits_used: 15
    })
  }))
}));

describe('Character Figure Generation API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Setup test user and get auth token
    authToken = 'test-auth-token';
  });
  
  describe('POST /api/character-figure/generate', () => {
    it('should generate character figure with valid request', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          prompt: 'A brave warrior in anime style',
          style: 'anime',
          quality: 'standard',
          num_images: '1'
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.images).toHaveLength(1);
      expect(data.generation_id).toBeDefined();
    });
    
    it('should reject request with insufficient credits', async () => {
      // Mock user with 0 credits
      const response = await fetch('http://localhost:3000/api/character-figure/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer low-credit-user'
        },
        body: JSON.stringify({
          prompt: 'Test generation',
          style: 'figure'
        })
      });
      
      expect(response.status).toBe(402);
      const data = await response.json();
      expect(data.error).toContain('Insufficient credits');
    });
    
    it('should enforce rate limiting', async () => {
      const requests = [];
      
      // Send 6 requests (limit is 5 for free tier)
      for (let i = 0; i < 6; i++) {
        requests.push(
          fetch('http://localhost:3000/api/character-figure/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              prompt: `Test ${i}`,
              style: 'anime'
            })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const lastResponse = responses[5];
      
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(lastResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
    
    it('should validate required parameters', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          // Missing prompt
          style: 'anime'
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('prompt is required');
    });
    
    it('should enhance prompt based on style', async () => {
      const styles = ['anime', 'figure', 'ghibli', 'cyberpunk', 'chibi'];
      
      for (const style of styles) {
        const response = await fetch('http://localhost:3000/api/character-figure/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            prompt: 'Simple character',
            style: style,
            return_enhanced_prompt: true // Test flag
          })
        });
        
        const data = await response.json();
        expect(data.enhanced_prompt).toContain(style);
        expect(data.enhanced_prompt.length).toBeGreaterThan('Simple character'.length);
      }
    });
  });
  
  describe('GET /api/character-figure/generate', () => {
    it('should return configuration and limits', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/generate', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.styles).toBeDefined();
      expect(data.styles.length).toBeGreaterThan(5);
      expect(data.limits).toBeDefined();
      expect(data.limits.max_images).toBe(4);
      expect(data.user_credits).toBeDefined();
    });
  });
});

describe('Character Figure Gallery API', () => {
  describe('GET /api/character-figure/gallery', () => {
    it('should fetch gallery items with pagination', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/gallery?page=1&limit=10');
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.items).toBeDefined();
      expect(data.items.length).toBeLessThanOrEqual(10);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBeDefined();
    });
    
    it('should filter gallery by style', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/gallery?style=anime');
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      data.items.forEach(item => {
        expect(item.style).toBe('anime');
      });
    });
    
    it('should sort gallery by popularity', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/gallery?sort=popular');
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Check if sorted by likes descending
      for (let i = 1; i < data.items.length; i++) {
        expect(data.items[i-1].likes_count).toBeGreaterThanOrEqual(data.items[i].likes_count);
      }
    });
  });
  
  describe('POST /api/character-figure/gallery/:id/action', () => {
    it('should handle like action', async () => {
      const galleryId = 'test-gallery-id';
      const response = await fetch(`http://localhost:3000/api/character-figure/gallery/${galleryId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          action: 'like'
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.likes_count).toBeDefined();
    });
    
    it('should handle bookmark action', async () => {
      const galleryId = 'test-gallery-id';
      const response = await fetch(`http://localhost:3000/api/character-figure/gallery/${galleryId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          action: 'bookmark'
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.bookmarked).toBeDefined();
    });
  });
});

describe('Character Figure History API', () => {
  describe('GET /api/character-figure/history', () => {
    it('should fetch user generation history', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/history', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.pagination).toBeDefined();
    });
    
    it('should filter history by favorites', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/history?favorites=true', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      data.items.forEach(item => {
        expect(item.is_favorite).toBe(true);
      });
    });
  });
});

describe('Character Figure Templates API', () => {
  describe('GET /api/character-figure/templates', () => {
    it('should fetch available templates', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/templates');
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.templates).toBeDefined();
      expect(data.templates.length).toBeGreaterThan(0);
      
      data.templates.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.prompt).toBeDefined();
        expect(template.style).toBeDefined();
      });
    });
  });
  
  describe('POST /api/character-figure/templates/:id/generate', () => {
    it('should generate using template', async () => {
      const templateId = 'warrior-template';
      const response = await fetch(`http://localhost:3000/api/character-figure/templates/${templateId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          customizations: {
            hair_color: 'blue',
            armor_style: 'futuristic'
          }
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.images).toBeDefined();
      expect(data.template_used).toBe(templateId);
    });
  });
});

describe('Character Figure Stats API', () => {
  describe('GET /api/character-figure/stats', () => {
    it('should fetch user statistics', async () => {
      const response = await fetch('http://localhost:3000/api/character-figure/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.user_stats).toBeDefined();
      expect(data.user_stats.total_generations).toBeDefined();
      expect(data.user_stats.favorite_style).toBeDefined();
      expect(data.user_stats.credits_used).toBeDefined();
      
      expect(data.public_stats).toBeDefined();
      expect(data.public_stats.trending_styles).toBeDefined();
      expect(data.public_stats.popular_prompts).toBeDefined();
    });
  });
});

// Export for other test files to use
export { authToken };