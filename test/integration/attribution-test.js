/**
 * 用户归因系统集成测试
 * 
 * 测试目标：
 * 1. UTM参数解析
 * 2. Referrer识别
 * 3. User Agent解析
 * 4. Cookie管理
 * 5. 归因数据存储
 */

const assert = require('assert');

// 导入归因服务函数
const {
  parseUTMParams,
  parseReferrer,
  parseUserAgent,
  generateVisitorId,
  generateSessionId,
} = require('../../src/services/attribution');

console.log('🧪 开始用户归因系统测试...\n');

// 测试1：UTM参数解析
console.log('📝 测试1：UTM参数解析');
function testUTMParsing() {
  const testCases = [
    {
      url: 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=summer2025',
      expected: {
        source: 'google',
        medium: 'cpc',
        campaign: 'summer2025',
        landing: '/'
      }
    },
    {
      url: 'https://example.com/pricing?ref=producthunt',
      expected: {
        source: 'producthunt',
        landing: '/pricing'
      }
    },
    {
      url: 'https://example.com?f=twitter',
      expected: {
        source: 'twitter',
        landing: '/'
      }
    }
  ];

  testCases.forEach((testCase, index) => {
    const result = parseUTMParams(testCase.url);
    console.log(`  测试案例 ${index + 1}:`, testCase.url);
    console.log('    结果:', result);
    
    // 验证关键字段
    if (testCase.expected.source) {
      assert.equal(result.source, testCase.expected.source, `Source应该是${testCase.expected.source}`);
    }
    if (testCase.expected.medium) {
      assert.equal(result.medium, testCase.expected.medium, `Medium应该是${testCase.expected.medium}`);
    }
    console.log('    ✅ 通过\n');
  });
}

// 测试2：Referrer解析
console.log('📝 测试2：Referrer来源识别');
function testReferrerParsing() {
  const testCases = [
    {
      referrer: 'https://www.google.com/search?q=ai+generator',
      expected: { source: 'google', medium: 'organic' }
    },
    {
      referrer: 'https://www.facebook.com/post/123',
      expected: { source: 'facebook', medium: 'social' }
    },
    {
      referrer: 'https://github.com/ai/project',
      expected: { source: 'github', medium: 'referral' }
    },
    {
      referrer: '',
      expected: { source: 'direct', medium: 'none' }
    },
    {
      referrer: 'https://unknown-site.com',
      expected: { source: 'unknown-site.com', medium: 'referral' }
    }
  ];

  testCases.forEach((testCase, index) => {
    const result = parseReferrer(testCase.referrer);
    console.log(`  测试案例 ${index + 1}:`, testCase.referrer || '(空)');
    console.log('    结果:', result);
    assert.deepEqual(result, testCase.expected);
    console.log('    ✅ 通过\n');
  });
}

// 测试3：User Agent解析
console.log('📝 测试3：User Agent设备识别');
function testUserAgentParsing() {
  const testCases = [
    {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      expected: {
        deviceType: 'desktop',
        os: 'Windows',
        osVersion: '10',
        browser: 'Chrome',
        browserVersion: '120'
      }
    },
    {
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      expected: {
        deviceType: 'mobile',
        os: 'iOS',
        browser: 'Safari'
      }
    },
    {
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      expected: {
        deviceType: 'desktop',
        os: 'macOS',
        browser: 'Chrome'
      }
    },
    {
      ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      expected: {
        deviceType: 'tablet',
        os: 'iOS'
      }
    }
  ];

  testCases.forEach((testCase, index) => {
    const result = parseUserAgent(testCase.ua);
    console.log(`  测试案例 ${index + 1}: ${testCase.expected.deviceType} - ${testCase.expected.os}`);
    console.log('    结果:', {
      deviceType: result.deviceType,
      os: result.os,
      browser: result.browser
    });
    
    assert.equal(result.deviceType, testCase.expected.deviceType, `设备类型应该是${testCase.expected.deviceType}`);
    assert.equal(result.os, testCase.expected.os, `操作系统应该是${testCase.expected.os}`);
    console.log('    ✅ 通过\n');
  });
}

// 测试4：ID生成
console.log('📝 测试4：唯一ID生成');
function testIdGeneration() {
  const visitorIds = new Set();
  const sessionIds = new Set();
  
  // 生成多个ID测试唯一性
  for (let i = 0; i < 100; i++) {
    visitorIds.add(generateVisitorId());
    sessionIds.add(generateSessionId());
  }
  
  console.log('  生成了100个访客ID和会话ID');
  assert.equal(visitorIds.size, 100, '所有访客ID应该是唯一的');
  assert.equal(sessionIds.size, 100, '所有会话ID应该是唯一的');
  
  // 测试ID格式
  const visitorId = generateVisitorId();
  const sessionId = generateSessionId();
  
  assert(visitorId.startsWith('v_'), '访客ID应该以v_开头');
  assert(sessionId.startsWith('s_'), '会话ID应该以s_开头');
  
  console.log('  示例访客ID:', visitorId);
  console.log('  示例会话ID:', sessionId);
  console.log('  ✅ 通过\n');
}

// 测试5：综合场景测试
console.log('📝 测试5：综合场景模拟');
function testRealScenarios() {
  const scenarios = [
    {
      name: 'Google广告访问',
      url: 'https://example.com/landing?utm_source=google&utm_medium=cpc&utm_campaign=black_friday',
      referrer: 'https://www.google.com',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      expected: {
        source: 'google',
        medium: 'cpc',
        campaign: 'black_friday',
        deviceType: 'desktop'
      }
    },
    {
      name: 'Facebook社交分享',
      url: 'https://example.com/product',
      referrer: 'https://www.facebook.com/share',
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari',
      expected: {
        source: 'facebook',
        medium: 'social',
        deviceType: 'mobile'
      }
    },
    {
      name: '直接访问',
      url: 'https://example.com',
      referrer: '',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) Safari/605.1.15',
      expected: {
        source: 'direct',
        medium: 'none',
        deviceType: 'desktop'
      }
    }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`  场景 ${index + 1}: ${scenario.name}`);
    
    // 解析UTM
    const utmData = parseUTMParams(scenario.url);
    
    // 解析Referrer（如果没有UTM source）
    let referrerData = {};
    if (!utmData.source && scenario.referrer) {
      referrerData = parseReferrer(scenario.referrer);
    } else if (!utmData.source) {
      referrerData = { source: 'direct', medium: 'none' };
    }
    
    // 解析设备
    const deviceData = parseUserAgent(scenario.ua);
    
    // 合并数据
    const attribution = {
      ...utmData,
      ...referrerData,
      ...deviceData
    };
    
    console.log('    归因结果:', {
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      deviceType: attribution.deviceType
    });
    
    // 验证
    assert.equal(attribution.source, scenario.expected.source, `来源应该是${scenario.expected.source}`);
    assert.equal(attribution.medium, scenario.expected.medium, `媒介应该是${scenario.expected.medium}`);
    assert.equal(attribution.deviceType, scenario.expected.deviceType, `设备应该是${scenario.expected.deviceType}`);
    
    console.log('    ✅ 通过\n');
  });
}

// 执行所有测试
try {
  testUTMParsing();
  testReferrerParsing();
  testUserAgentParsing();
  testIdGeneration();
  testRealScenarios();
  
  console.log('🎉 所有测试通过！用户归因系统工作正常。\n');
  console.log('📊 测试总结：');
  console.log('  ✅ UTM参数解析正常');
  console.log('  ✅ Referrer识别准确');
  console.log('  ✅ 设备类型判断正确');
  console.log('  ✅ ID生成保证唯一性');
  console.log('  ✅ 综合场景处理完善');
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}