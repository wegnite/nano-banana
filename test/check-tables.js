/**
 * 简单验证订阅表是否创建成功
 * 
 * 运行：node test/check-tables.js
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未配置');
    process.exit(1);
  }
  
  console.log('🔍 检查订阅系统数据库表...\n');
  console.log('📌 数据库连接:', databaseUrl.substring(0, 50) + '...\n');
  
  const postgres = require('postgres');
  const sql = postgres(databaseUrl);
  
  try {
    console.log('✅ 成功连接到数据库\n');
    
    // 检查表是否存在
    const tables = ['subscriptions', 'subscription_plans', 'subscription_usage'];
    
    for (const tableName of tables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;
      
      const exists = result[0].exists;
      
      if (exists) {
        // 获取记录数
        const countResult = await sql`SELECT COUNT(*) FROM ${sql(tableName)}`;
        const count = countResult[0].count;
        console.log(`✅ ${tableName} 表存在，记录数: ${count}`);
      } else {
        console.log(`❌ ${tableName} 表不存在`);
      }
    }
    
    console.log('\n📝 表结构验证完成！');
    console.log('你可以在 Supabase 控制台的 Table Editor 中查看这些表');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await sql.end();
  }
}

checkTables();