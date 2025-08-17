/**
 * 归因数据验证脚本
 * 用于检查数据库中的归因数据是否正确保存
 */

require('dotenv').config({ path: '.env.local' });
const { sql } = require('drizzle-orm');
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');

console.log('🔍 归因数据验证脚本\n');

// 数据库连接
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ 错误：未找到 DATABASE_URL 环境变量');
  console.log('请确保 .env.local 文件包含数据库连接字符串');
  process.exit(1);
}

async function verifyAttribution() {
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    console.log('📊 开始验证数据库中的归因数据...\n');
    
    // 1. 检查visitor_logs表
    console.log('1️⃣ 检查 visitor_logs 表:');
    const visitorLogsCount = await db.execute(
      sql`SELECT COUNT(*) as count FROM visitor_logs`
    );
    console.log(`   记录总数: ${visitorLogsCount[0].count}`);
    
    if (visitorLogsCount[0].count > 0) {
      // 获取最近的访问记录
      const recentLogs = await db.execute(
        sql`SELECT 
          visitor_id,
          utm_source,
          utm_medium,
          utm_campaign,
          device_type,
          country,
          city,
          visited_at
        FROM visitor_logs 
        ORDER BY visited_at DESC 
        LIMIT 5`
      );
      
      console.log('\n   最近5条访问记录:');
      recentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. 访客: ${log.visitor_id}`);
        console.log(`      来源: ${log.utm_source || '直接访问'} / ${log.utm_medium || 'none'}`);
        console.log(`      活动: ${log.utm_campaign || '无'}`);
        console.log(`      设备: ${log.device_type || '未知'}`);
        console.log(`      位置: ${log.country || '未知'} - ${log.city || '未知'}`);
        console.log(`      时间: ${new Date(log.visited_at).toLocaleString()}\n`);
      });
      
      // 统计来源分布
      const sourceStats = await db.execute(
        sql`SELECT 
          utm_source,
          COUNT(*) as count
        FROM visitor_logs 
        WHERE utm_source IS NOT NULL
        GROUP BY utm_source
        ORDER BY count DESC`
      );
      
      if (sourceStats.length > 0) {
        console.log('   📈 来源分布:');
        sourceStats.forEach(stat => {
          console.log(`      ${stat.utm_source}: ${stat.count} 次访问`);
        });
      }
    } else {
      console.log('   ⚠️  暂无访问记录');
      console.log('   提示: 访问网站后数据会自动记录到此表');
    }
    
    // 2. 检查users表的归因字段
    console.log('\n2️⃣ 检查 users 表归因数据:');
    const usersWithAttribution = await db.execute(
      sql`SELECT COUNT(*) as count 
        FROM users 
        WHERE attribution_source IS NOT NULL`
    );
    console.log(`   有归因数据的用户: ${usersWithAttribution[0].count}`);
    
    if (usersWithAttribution[0].count > 0) {
      const recentUsers = await db.execute(
        sql`SELECT 
          email,
          attribution_source,
          attribution_medium,
          attribution_campaign,
          first_device_type,
          first_country,
          first_city,
          created_at
        FROM users 
        WHERE attribution_source IS NOT NULL
        ORDER BY created_at DESC 
        LIMIT 5`
      );
      
      console.log('\n   最近注册的用户归因:');
      recentUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. 用户: ${user.email}`);
        console.log(`      来源: ${user.attribution_source} / ${user.attribution_medium || 'none'}`);
        console.log(`      活动: ${user.attribution_campaign || '无'}`);
        console.log(`      首次设备: ${user.first_device_type || '未知'}`);
        console.log(`      首次位置: ${user.first_country || '未知'} - ${user.first_city || '未知'}`);
        console.log(`      注册时间: ${new Date(user.created_at).toLocaleString()}\n`);
      });
    } else {
      console.log('   ⚠️  暂无用户归因数据');
      console.log('   提示: 新用户注册时会自动记录归因信息');
    }
    
    // 3. 检查orders表的归因字段
    console.log('\n3️⃣ 检查 orders 表归因数据:');
    const ordersWithAttribution = await db.execute(
      sql`SELECT COUNT(*) as count 
        FROM orders 
        WHERE order_source IS NOT NULL`
    );
    console.log(`   有归因数据的订单: ${ordersWithAttribution[0].count}`);
    
    if (ordersWithAttribution[0].count > 0) {
      const recentOrders = await db.execute(
        sql`SELECT 
          order_no,
          order_source,
          order_medium,
          order_device_type,
          order_country,
          amount,
          created_at
        FROM orders 
        WHERE order_source IS NOT NULL
        ORDER BY created_at DESC 
        LIMIT 5`
      );
      
      console.log('\n   最近的订单归因:');
      recentOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. 订单: ${order.order_no}`);
        console.log(`      来源: ${order.order_source} / ${order.order_medium || 'none'}`);
        console.log(`      设备: ${order.order_device_type || '未知'}`);
        console.log(`      国家: ${order.order_country || '未知'}`);
        console.log(`      金额: ${order.amount}`);
        console.log(`      时间: ${new Date(order.created_at).toLocaleString()}\n`);
      });
    } else {
      console.log('   ⚠️  暂无订单归因数据');
      console.log('   提示: 用户下单时会自动记录归因信息');
    }
    
    // 4. 总结
    console.log('\n📊 验证总结:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ visitor_logs 表: ${visitorLogsCount[0].count} 条记录`);
    console.log(`✅ users 表归因: ${usersWithAttribution[0].count} 个用户`);
    console.log(`✅ orders 表归因: ${ordersWithAttribution[0].count} 个订单`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (visitorLogsCount[0].count === 0) {
      console.log('\n💡 下一步操作:');
      console.log('1. 启动开发服务器: npm run dev');
      console.log('2. 访问带UTM参数的URL:');
      console.log('   http://localhost:3000?utm_source=test&utm_medium=demo');
      console.log('3. 再次运行此脚本验证数据');
    }
    
  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
    console.log('\n可能的原因:');
    console.log('1. 数据库连接失败 - 检查DATABASE_URL');
    console.log('2. 表不存在 - 运行 npm run db:migrate');
    console.log('3. 权限问题 - 检查数据库用户权限');
  } finally {
    await client.end();
  }
}

// 运行验证
verifyAttribution().catch(console.error);