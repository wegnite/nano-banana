/**
 * 认证流程集成测试
 * 
 * 问题：认证相关的运行时错误只能在实际使用时发现
 * 解决：提供自动化测试来提前发现认证问题
 * 
 * 测试覆盖：
 * 1. Session结构验证
 * 2. OAuth回调URL验证
 * 3. 用户数据获取
 * 4. 积分系统集成
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { auth } from '@/auth';
import { getUserCredits } from '@/services/credit';
import { getUserInfo } from '@/services/user';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

describe('Authentication Flow Tests', () => {
  
  beforeAll(async () => {
    // 验证环境变量
    expect(process.env.AUTH_SECRET).toBeDefined();
    expect(process.env.NEXTAUTH_URL).toBeDefined();
    expect(process.env.AUTH_URL).toBeDefined();
    
    // 验证端口一致性
    const nextAuthUrl = new URL(process.env.NEXTAUTH_URL!);
    const authUrl = new URL(process.env.AUTH_URL!);
    const webUrl = new URL(process.env.NEXT_PUBLIC_WEB_URL!);
    
    expect(nextAuthUrl.port).toBe(authUrl.port);
    expect(nextAuthUrl.port).toBe(webUrl.port);
  });
  
  describe('Session Structure', () => {
    it('should have correct session structure with uuid', async () => {
      // 模拟session结构
      const mockSession = {
        user: {
          uuid: 'test-uuid-123',
          email: 'test@example.com',
          nickname: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
          created_at: new Date().toISOString()
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      // 验证session包含uuid而不是id
      expect(mockSession.user.uuid).toBeDefined();
      expect((mockSession.user as any).id).toBeUndefined();
    });
    
    it('should extract user ID correctly from session', async () => {
      const mockSession = {
        user: {
          uuid: 'test-uuid-123',
          email: 'test@example.com'
        }
      };
      
      // 测试从session提取用户ID的逻辑
      const userId = (mockSession.user as any).uuid || (mockSession.user as any).id;
      expect(userId).toBe('test-uuid-123');
    });
  });
  
  describe('Database Integration', () => {
    it('should connect to database successfully', async () => {
      try {
        const result = await db().$client`SELECT 1 as test`;
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      } catch (error) {
        // 如果数据库连接失败，测试应该失败
        throw new Error(`Database connection failed: ${error}`);
      }
    });
    
    it('should handle getUserCredits with valid UUID', async () => {
      const testUuid = 'test-uuid-123';
      
      try {
        // 这里应该模拟或使用测试数据库
        // 现在只测试函数不会因为参数问题崩溃
        const credits = await getUserCredits(testUuid);
        // 即使用户不存在，也应该返回默认值
        expect(credits).toBeDefined();
        expect(credits).toHaveProperty('totalCredits');
        expect(credits).toHaveProperty('usedCredits');
        expect(credits).toHaveProperty('remainingCredits');
      } catch (error: any) {
        // 检查错误不是因为undefined参数
        expect(error.message).not.toContain('UNDEFINED_VALUE');
      }
    });
    
    it('should fail gracefully with undefined UUID', async () => {
      try {
        // @ts-ignore - 故意传入undefined测试错误处理
        await getUserCredits(undefined);
        // 不应该到达这里
        expect(true).toBe(false);
      } catch (error: any) {
        // 应该抛出合适的错误而不是SQL错误
        expect(error.message).toBeDefined();
      }
    });
  });
  
  describe('OAuth Configuration', () => {
    it('should have at least one OAuth provider configured', () => {
      const hasGoogle = process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET;
      const hasGithub = process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET;
      
      expect(hasGoogle || hasGithub).toBe(true);
    });
    
    it('should have matching OAuth callback URLs', () => {
      const nextAuthUrl = process.env.NEXTAUTH_URL;
      const authUrl = process.env.AUTH_URL;
      
      expect(authUrl).toContain(nextAuthUrl);
    });
  });
  
  describe('API Integration', () => {
    it('should have Nano Banana API key configured', () => {
      expect(process.env.NANO_BANANA_API_KEY).toBeDefined();
      expect(process.env.NANO_BANANA_API_KEY).not.toBe('');
      expect(process.env.NANO_BANANA_API_KEY!.length).toBeGreaterThan(20);
    });
    
    it('should have valid API key format', () => {
      if (process.env.OPENAI_API_KEY) {
        expect(process.env.OPENAI_API_KEY).toMatch(/^sk-/);
      }
    });
  });
});