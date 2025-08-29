# Character Figure AI Generator 用户使用指南

## 目录

1. [快速开始](#快速开始)
2. [功能概述](#功能概述)
3. [风格指南](#风格指南)
4. [提示词技巧](#提示词技巧)
5. [画廊与社交功能](#画廊与社交功能)
6. [常见问题解答](#常见问题解答)
7. [故障排除](#故障排除)
8. [API开发文档](#api开发文档)

---

## 快速开始

### 第一步：注册与登录

1. **访问网站**
   - 打开浏览器访问 Character Figure AI Generator
   - 点击右上角的"登录/注册"按钮

2. **选择登录方式**
   - 邮箱注册：输入邮箱和密码
   - 快捷登录：使用 Google 或 GitHub 账号
   - 微信登录（中国用户专享）

3. **完善个人资料**
   - 上传头像
   - 设置用户名
   - 添加个人简介（可选）

### 第二步：了解积分系统

| 用户等级 | 每日免费次数 | 高清下载 | 批量生成 | API访问 |
|---------|------------|---------|---------|---------|
| 免费用户 | 3次 | ❌ | ❌ | ❌ |
| 基础会员 | 30次 | ✅ | ❌ | ❌ |
| 高级会员 | 100次 | ✅ | ✅ | ✅ |
| 专业会员 | 无限 | ✅ | ✅ | ✅ |

**积分消耗规则：**
- 标准质量：15积分/张
- 高清质量：25积分/张
- 批量生成：按图片数量累计

### 第三步：生成你的第一个角色

1. **上传参考图片**（可选）
   - 支持 JPG、PNG、WebP 格式
   - 文件大小不超过 10MB
   - 支持拖拽上传

2. **选择风格**
   - 从10种预设风格中选择
   - 查看风格示例图

3. **输入提示词**
   - 描述你想要的角色特征
   - 使用中文或英文均可

4. **调整参数**
   - 选择图片比例
   - 设置质量等级
   - 选择生成数量

5. **点击生成**
   - 等待10秒左右
   - 查看生成结果

---

## 功能概述

### 核心功能模块

#### 1. 图片上传区
- **拖拽上传**：直接将图片拖入上传区
- **点击选择**：通过文件浏览器选择
- **批量上传**：Pro用户可同时上传多张图片
- **实时预览**：上传后立即显示缩略图
- **进度显示**：大文件上传时显示进度条

#### 2. 风格选择器
- **风格网格**：10种风格以卡片形式展示
- **预览图**：每种风格配有示例图片
- **快速切换**：点击即可切换风格
- **风格说明**：悬停显示详细描述

#### 3. 参数调节面板
- **基础参数**
  - 宽高比调节（5种预设比例）
  - 质量选择（标准/高清）
  - 数量设置（1-4张）
  - 种子值（可选，用于复现结果）

- **高级参数**（Pro用户）
  - 风格强度：0-100滑块调节
  - 细节程度：低/中/高三档
  - 色彩饱和度：0-100滑块
  - 对比度调节：0-100滑块

#### 4. 提示词输入
- **主提示词框**：描述角色特征
- **负面提示词**：排除不想要的元素
- **提示词模板**：预设的优质提示词
- **历史记录**：查看之前使用的提示词
- **AI优化建议**：自动优化提示词

#### 5. 生成结果展示
- **实时进度**：显示生成进度百分比
- **多图展示**：并排显示多张结果
- **放大查看**：点击图片全屏查看
- **快捷操作**：下载、分享、收藏

---

## 风格指南

### 10种预设风格详解

#### 1. 🎌 动漫风格 (Anime Style)
**特点：**
- 日系动漫画风
- 大眼睛、精致五官
- 鲜艳的色彩
- 清晰的线条

**最佳用途：**
- 二次元角色创作
- 动漫同人创作
- 游戏角色设计

**推荐提示词：**
```
anime girl with long silver hair, blue eyes, school uniform, 
cherry blossom background, soft lighting
```

#### 2. 📸 写实风格 (Realistic Style)
**特点：**
- 照片级真实感
- 精细的纹理细节
- 自然光照效果
- 逼真的肤色和材质

**最佳用途：**
- 真人角色参考
- 电影概念设计
- 写实游戏角色

**推荐提示词：**
```
photorealistic portrait of a warrior, detailed armor, 
dramatic lighting, highly detailed face, sharp focus
```

#### 3. 🎨 卡通风格 (Cartoon Style)
**特点：**
- 简化的形状
- 明亮的色彩
- 夸张的表情
- 流畅的线条

**最佳用途：**
- 儿童插画
- 品牌吉祥物
- 表情包设计

**推荐提示词：**
```
cute cartoon character, big smile, colorful outfit, 
simple background, friendly expression
```

#### 4. 🧙 奇幻风格 (Fantasy Style)
**特点：**
- 魔法元素
- 神秘氛围
- 奇幻生物
- 史诗场景

**最佳用途：**
- 游戏角色设计
- 奇幻小说插画
- 桌游卡牌

**推荐提示词：**
```
fantasy wizard casting spell, magical aura, ancient ruins, 
mystical atmosphere, detailed robes
```

#### 5. 🌃 赛博朋克 (Cyberpunk Style)
**特点：**
- 霓虹灯光
- 高科技装备
- 未来都市
- 暗黑色调

**最佳用途：**
- 科幻角色设计
- 未来概念艺术
- 游戏原画

**推荐提示词：**
```
cyberpunk character with neon implants, futuristic city, 
rain, neon lights, high-tech gadgets
```

#### 6. ⚙️ 蒸汽朋克 (Steampunk Style)
**特点：**
- 维多利亚时代元素
- 黄铜和铜质装饰
- 齿轮和机械
- 复古科技

**最佳用途：**
- 复古角色设计
- 另类历史创作
- 独特风格插画

**推荐提示词：**
```
steampunk inventor with goggles, brass gears, 
Victorian clothing, mechanical details
```

#### 7. 🏰 中世纪风格 (Medieval Style)
**特点：**
- 历史准确性
- 盔甲和武器
- 城堡背景
- 古典元素

**最佳用途：**
- 历史题材创作
- RPG角色设计
- 教育插画

**推荐提示词：**
```
medieval knight in full armor, castle background, 
sword and shield, heroic pose
```

#### 8. 🏙️ 现代风格 (Modern Style)
**特点：**
- 当代时尚
- 都市背景
- 简洁设计
- 时尚元素

**最佳用途：**
- 时尚设计
- 品牌形象
- 社交媒体

**推荐提示词：**
```
modern character in streetwear, urban background, 
contemporary fashion, clean design
```

#### 9. 🚀 科幻风格 (Sci-Fi Style)
**特点：**
- 太空元素
- 未来科技
- 外星生物
- 宇宙场景

**最佳用途：**
- 科幻小说插画
- 太空游戏设计
- 概念艺术

**推荐提示词：**
```
sci-fi space explorer, alien planet, advanced suit, 
futuristic technology, cosmic background
```

#### 10. 🎪 Q版风格 (Chibi Style)
**特点：**
- 头身比例夸张
- 可爱表情
- 简化细节
- 萌系风格

**最佳用途：**
- 表情包制作
- 周边设计
- 可爱插画

**推荐提示词：**
```
chibi character with big head, cute expression, 
simple design, kawaii style
```

---

## 提示词技巧

### 基础技巧

#### 1. 结构化描述
按照以下顺序组织你的提示词：
```
[风格] + [主体] + [特征] + [动作/姿势] + [背景] + [光照]
```

**示例：**
```
anime style, young female warrior, long red hair, blue armor, 
holding sword, mountain background, sunset lighting
```

#### 2. 使用具体描述
- ❌ 不好的：`beautiful character`
- ✅ 好的：`character with emerald green eyes, flowing golden hair, elegant dress`

#### 3. 权重控制
使用括号增加权重：
- `(important element)` - 轻微增强
- `((very important))` - 中度增强
- `(((critical element)))` - 强烈增强

### 高级技巧

#### 1. 负面提示词的使用
排除不想要的元素：
```
负面提示词：blurry, low quality, distorted, ugly, 
duplicate, extra limbs, bad anatomy
```

#### 2. 风格混合
组合多种风格元素：
```
anime style with realistic textures, watercolor effects, 
studio ghibli inspired
```

#### 3. 参考艺术家风格
提及特定艺术风格：
```
in the style of Makoto Shinkai, detailed backgrounds, 
beautiful lighting
```

#### 4. 情绪和氛围
添加情绪描述：
```
melancholic atmosphere, mysterious mood, dramatic tension, 
peaceful serenity
```

### 提示词模板库

#### 角色类型模板

**战士角色：**
```
[风格] warrior, muscular build, battle-worn armor, 
determined expression, weapon of choice, battlefield background
```

**魔法师角色：**
```
[风格] mage, flowing robes, magical staff, glowing eyes, 
casting spell, mystical aura, ancient library background
```

**现代都市角色：**
```
[风格] modern character, casual streetwear, confident pose, 
city skyline background, golden hour lighting
```

#### 场景氛围模板

**史诗场景：**
```
epic scale, dramatic lighting, heroic pose, 
grand landscape, cinematic composition
```

**温馨场景：**
```
cozy atmosphere, warm lighting, gentle expression, 
soft colors, peaceful setting
```

**动作场景：**
```
dynamic action pose, motion blur, intense expression, 
dramatic angle, explosive effects
```

---

## 画廊与社交功能

### 作品画廊

#### 浏览作品
1. **瀑布流布局**：自动加载更多作品
2. **筛选功能**：
   - 按风格筛选
   - 按时间排序（最新/最热/趋势）
   - 按热度排序

3. **互动功能**：
   - 点赞：双击或点击爱心图标
   - 收藏：保存到个人收藏夹
   - 评论：分享你的想法

#### 发布作品
1. **选择生成结果**：从历史记录中选择
2. **添加信息**：
   - 作品标题
   - 描述说明
   - 标签（最多5个）

3. **隐私设置**：
   - 公开：所有人可见
   - 私密：仅自己可见

### 提示词市场

#### 浏览提示词
- **精品推荐**：官方推荐的优质提示词
- **热门提示词**：使用次数最多的提示词
- **分类浏览**：按风格和用途分类

#### 购买提示词
1. 查看提示词效果预览
2. 查看用户评价
3. 使用积分购买
4. 自动添加到模板库

#### 出售提示词
1. 创建优质提示词
2. 设置价格（0-100积分）
3. 添加效果展示图
4. 提交审核
5. 获得销售分成（70%）

### 社交功能

#### 关注系统
- 关注喜欢的创作者
- 接收作品更新通知
- 查看关注动态

#### 创作挑战
- 参与每周主题挑战
- 赢取额外积分奖励
- 展示在挑战页面

#### 社区互动
- 加入官方 Discord 社区
- 参与讨论和分享
- 获取最新资讯

---

## 常见问题解答

### 账号相关

**Q: 忘记密码怎么办？**
A: 点击登录页面的"忘记密码"，输入注册邮箱，我们会发送重置链接。

**Q: 如何更改绑定邮箱？**
A: 进入"账号设置"→"安全设置"→"更改邮箱"，需要验证原邮箱。

**Q: 可以注销账号吗？**
A: 可以，但注销后数据无法恢复。请在"账号设置"→"隐私"中操作。

### 积分相关

**Q: 积分有效期是多久？**
A: 免费积分每日重置，付费积分永久有效。

**Q: 如何获得更多积分？**
A: 
- 每日登录奖励
- 完成任务挑战
- 购买会员套餐
- 直接充值积分

**Q: 生成失败会扣除积分吗？**
A: 不会，只有成功生成才会扣除积分。

### 生成相关

**Q: 为什么生成速度很慢？**
A: 
- 高峰期可能需要排队
- HD质量需要更多处理时间
- 检查网络连接状态

**Q: 如何提高生成质量？**
A:
- 使用详细的提示词
- 选择HD质量
- 参考提示词模板
- 使用负面提示词

**Q: 生成的图片版权归谁？**
A: 您拥有生成图片的使用权，可用于个人和商业用途。

### 技术问题

**Q: 支持哪些浏览器？**
A: 推荐使用 Chrome、Firefox、Safari、Edge 的最新版本。

**Q: 移动端可以使用吗？**
A: 可以，我们的网站完全响应式，支持所有移动设备。

**Q: 图片下载失败怎么办？**
A: 
- 检查浏览器下载设置
- 尝试右键另存为
- 清除浏览器缓存

---

## 故障排除

### 常见错误及解决方案

#### 错误：上传失败
**可能原因：**
- 文件过大（超过10MB）
- 格式不支持
- 网络连接问题

**解决方案：**
1. 压缩图片到10MB以下
2. 转换为JPG/PNG/WebP格式
3. 检查网络连接
4. 刷新页面重试

#### 错误：生成失败
**可能原因：**
- 积分不足
- 提示词包含敏感内容
- 服务器繁忙

**解决方案：**
1. 检查积分余额
2. 修改提示词内容
3. 等待几分钟重试
4. 联系客服支持

#### 错误：无法登录
**可能原因：**
- 密码错误
- 账号被锁定
- 浏览器Cookie问题

**解决方案：**
1. 使用忘记密码功能
2. 等待24小时自动解锁
3. 清除浏览器Cookie
4. 使用无痕模式

#### 错误：图片显示异常
**可能原因：**
- 浏览器缓存问题
- 网络加载超时
- CDN服务异常

**解决方案：**
1. 强制刷新页面（Ctrl+F5）
2. 清除浏览器缓存
3. 更换网络环境
4. 等待服务恢复

### 性能优化建议

1. **使用推荐浏览器**
   - Chrome 90+
   - Firefox 88+
   - Safari 14+

2. **优化网络环境**
   - 使用稳定的网络连接
   - 避免使用VPN（可能影响速度）

3. **清理浏览器**
   - 定期清理缓存
   - 关闭不必要的扩展

4. **调整生成参数**
   - 高峰期使用标准质量
   - 减少同时生成的图片数量

---

## API开发文档

### API概述

Character Figure AI Generator 提供 RESTful API，允许开发者集成角色生成功能到自己的应用中。

### 认证方式

所有API请求需要在Header中包含API密钥：
```http
Authorization: Bearer YOUR_API_KEY
```

获取API密钥：
1. 登录账号
2. 进入"开发者中心"
3. 创建新的API密钥
4. 保存密钥（仅显示一次）

### 基础信息

**Base URL:** `https://api.characterfigure.ai/v1`

**请求格式:** JSON

**响应格式:** JSON

### 核心端点

#### 1. 生成角色图像

**端点：** `POST /generate`

**请求参数：**
```json
{
  "prompt": "string",           // 必需：主提示词
  "style": "anime",             // 必需：风格类型
  "negative_prompt": "string",   // 可选：负面提示词
  "aspect_ratio": "1:1",        // 可选：宽高比
  "quality": "hd",              // 可选：质量等级
  "num_images": 1,              // 可选：生成数量
  "seed": 12345                 // 可选：随机种子
}
```

**响应示例：**
```json
{
  "success": true,
  "generation_id": "gen_abc123",
  "images": [
    {
      "url": "https://cdn.characterfigure.ai/images/abc123.jpg",
      "width": 1024,
      "height": 1024
    }
  ],
  "credits_used": 25,
  "credits_remaining": 975,
  "generation_time": 8.5
}
```

#### 2. 获取生成状态

**端点：** `GET /generate/{generation_id}`

**响应示例：**
```json
{
  "generation_id": "gen_abc123",
  "status": "completed",  // pending, processing, completed, failed
  "progress": 100,
  "images": [...],
  "created_at": "2025-08-28T10:00:00Z",
  "completed_at": "2025-08-28T10:00:10Z"
}
```

#### 3. 获取用户信息

**端点：** `GET /user/profile`

**响应示例：**
```json
{
  "user_id": "user_123",
  "username": "artist",
  "email": "user@example.com",
  "credits": {
    "free": 3,
    "paid": 1000,
    "total": 1003
  },
  "subscription": {
    "tier": "pro",
    "expires_at": "2025-09-28T00:00:00Z"
  }
}
```

#### 4. 获取生成历史

**端点：** `GET /user/history`

**查询参数：**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20，最大100）
- `style`: 筛选风格
- `date_from`: 开始日期
- `date_to`: 结束日期

**响应示例：**
```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "generation_id": "gen_abc123",
      "prompt": "anime character",
      "style": "anime",
      "images": [...],
      "created_at": "2025-08-28T10:00:00Z"
    }
  ]
}
```

#### 5. 画廊操作

**获取画廊列表：** `GET /gallery`

**发布到画廊：** `POST /gallery`
```json
{
  "generation_id": "gen_abc123",
  "title": "My Character",
  "description": "Description here",
  "tags": ["anime", "warrior"],
  "is_public": true
}
```

**点赞作品：** `POST /gallery/{item_id}/like`

### 错误处理

API使用标准HTTP状态码：

| 状态码 | 含义 |
|-------|-----|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

**错误响应格式：**
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "The prompt parameter is required",
    "details": {
      "field": "prompt",
      "reason": "missing"
    }
  }
}
```

### 速率限制

| 套餐 | 请求限制 |
|-----|---------|
| 免费 | 10次/小时 |
| 基础 | 60次/小时 |
| 高级 | 300次/小时 |
| 专业 | 无限制 |

限制信息在响应Header中返回：
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1693224000
```

### SDK支持

官方SDK：
- JavaScript/TypeScript
- Python
- PHP
- Java
- Go

**JavaScript示例：**
```javascript
import { CharacterFigureClient } from '@characterfigure/sdk';

const client = new CharacterFigureClient({
  apiKey: 'YOUR_API_KEY'
});

// 生成图像
const result = await client.generate({
  prompt: 'anime warrior with sword',
  style: 'anime',
  quality: 'hd'
});

console.log(result.images[0].url);
```

**Python示例：**
```python
from characterfigure import Client

client = Client(api_key="YOUR_API_KEY")

# 生成图像
result = client.generate(
    prompt="anime warrior with sword",
    style="anime",
    quality="hd"
)

print(result['images'][0]['url'])
```

### Webhook支持

配置Webhook接收生成完成通知：

1. 在开发者中心配置Webhook URL
2. 选择要接收的事件类型
3. 验证Webhook签名

**Webhook事件示例：**
```json
{
  "event": "generation.completed",
  "timestamp": "2025-08-28T10:00:00Z",
  "data": {
    "generation_id": "gen_abc123",
    "status": "completed",
    "images": [...],
    "credits_used": 25
  }
}
```

### 最佳实践

1. **错误重试**
   - 实现指数退避重试机制
   - 最多重试3次

2. **缓存策略**
   - 缓存生成结果URL
   - URL有效期为30天

3. **批量处理**
   - 使用批量端点处理多个请求
   - 减少API调用次数

4. **安全建议**
   - 不要在前端暴露API密钥
   - 使用环境变量存储密钥
   - 定期轮换密钥

---

## 联系支持

### 获取帮助

**在线支持：**
- 帮助中心：[help.characterfigure.ai](https://help.characterfigure.ai)
- 在线客服：工作日 9:00-18:00
- Email：support@characterfigure.ai

**社区支持：**
- Discord：[discord.gg/characterfigure](https://discord.gg/characterfigure)
- Twitter：[@CharacterFigureAI](https://twitter.com/CharacterFigureAI)
- Reddit：[r/CharacterFigure](https://reddit.com/r/CharacterFigure)

**反馈渠道：**
- 产品建议：feedback@characterfigure.ai
- Bug报告：bugs@characterfigure.ai
- 商业合作：business@characterfigure.ai

---

## 更新日志

### 版本 2.0.0 (2025-08-28)
- 新增10种角色风格
- 优化生成速度至10秒内
- 添加批量生成功能
- 推出提示词市场
- 支持4K高清输出

### 版本 1.5.0 (2025-07-15)
- 添加画廊社交功能
- 优化移动端体验
- 新增API开发接口
- 支持多语言界面

### 版本 1.0.0 (2025-06-01)
- 正式发布
- 支持基础角色生成
- 积分系统上线
- 会员体系建立

---

*文档版本：v2.0.0*  
*最后更新：2025年8月28日*  
*Character Figure AI Generator Team*