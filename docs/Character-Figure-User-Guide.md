# Character Figure AI Generator User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Feature Overview](#feature-overview)
3. [Style Guide](#style-guide)
4. [Prompt Tips](#prompt-tips)
5. [Gallery & Social Features](#gallery--social-features)
6. [FAQ](#frequently-asked-questions)
7. [Troubleshooting](#troubleshooting)
8. [API Documentation](#api-documentation)

---

## Getting Started

### Step 1: Sign Up & Login

1. **Visit the Website**
   - Open your browser and visit Character Figure AI Generator
   - Click the "Login/Sign Up" button in the top right corner

2. **Choose Login Method**
   - Email Registration: Enter email and password
   - Quick Login: Use Google or GitHub account
   - WeChat Login (China users only)

3. **Complete Your Profile**
   - Upload avatar
   - Set username
   - Add bio (optional)

### Step 2: Understanding the Credit System

| User Tier | Daily Free | HD Download | Batch Generation | API Access |
|-----------|------------|-------------|-----------------|------------|
| Free User | 3 | ❌ | ❌ | ❌ |
| Basic Member | 30 | ✅ | ❌ | ❌ |
| Advanced Member | 100 | ✅ | ✅ | ✅ |
| Professional | Unlimited | ✅ | ✅ | ✅ |

**Credit Consumption Rules:**
- Standard Quality: 15 credits/image
- HD Quality: 25 credits/image
- Batch Generation: Credits accumulate by image count

### Step 3: Generate Your First Character

1. **Upload Reference Image** (Optional)
   - Supports JPG, PNG, WebP formats
   - File size up to 10MB
   - Drag & drop supported

2. **Select Style**
   - Choose from 10 preset styles
   - View style examples

3. **Enter Prompt**
   - Describe your desired character
   - Use English or Chinese

4. **Adjust Parameters**
   - Choose aspect ratio
   - Set quality level
   - Select number of images

5. **Click Generate**
   - Wait about 10 seconds
   - View results

---

## Feature Overview

### Core Feature Modules

#### 1. Image Upload Area
- **Drag & Drop**: Drag images directly into the upload area
- **Click to Select**: Choose via file browser
- **Batch Upload**: Pro users can upload multiple images
- **Real-time Preview**: Thumbnails display immediately
- **Progress Display**: Progress bar for large files

#### 2. Style Selector
- **Style Grid**: 10 styles displayed as cards
- **Preview Images**: Each style has example images
- **Quick Switch**: Click to switch styles
- **Style Description**: Hover for detailed info

#### 3. Parameter Panel
- **Basic Parameters**
  - Aspect Ratio (5 preset ratios)
  - Quality Selection (Standard/HD)
  - Quantity Setting (1-4 images)
  - Seed Value (optional, for reproducibility)

- **Advanced Parameters** (Pro Users)
  - Style Strength: 0-100 slider
  - Detail Level: Low/Medium/High
  - Color Saturation: 0-100 slider
  - Contrast Adjustment: 0-100 slider

#### 4. Prompt Input
- **Main Prompt Box**: Describe character features
- **Negative Prompt**: Exclude unwanted elements
- **Prompt Templates**: Quality preset prompts
- **History**: View previous prompts
- **AI Suggestions**: Automatic prompt optimization

#### 5. Generation Display
- **Real-time Progress**: Shows generation percentage
- **Multi-image Display**: Side-by-side results
- **Zoom View**: Click for fullscreen
- **Quick Actions**: Download, share, save

---

## Style Guide

### 10 Preset Styles Explained

#### 1. 🎌 Anime Style
**Features:**
- Japanese anime art style
- Large eyes, refined features
- Vibrant colors
- Clean lines

**Best For:**
- Anime character creation
- Fan art
- Game character design

**Recommended Prompt:**
```
anime girl with long silver hair, blue eyes, school uniform, 
cherry blossom background, soft lighting
```

#### 2. 📸 Realistic Style
**Features:**
- Photo-realistic quality
- Fine texture details
- Natural lighting
- Lifelike skin and materials

**Best For:**
- Real person references
- Movie concept design
- Realistic game characters

**Recommended Prompt:**
```
photorealistic portrait of a warrior, detailed armor, 
dramatic lighting, highly detailed face, sharp focus
```

#### 3. 🎨 Cartoon Style
**Features:**
- Simplified shapes
- Bright colors
- Exaggerated expressions
- Smooth lines

**Best For:**
- Children's illustrations
- Brand mascots
- Emoji design

**Recommended Prompt:**
```
cute cartoon character, big smile, colorful outfit, 
simple background, friendly expression
```

#### 4. 🧙 Fantasy Style
**Features:**
- Magical elements
- Mystical atmosphere
- Fantasy creatures
- Epic scenes

**Best For:**
- Game character design
- Fantasy novel illustrations
- Card game art

**Recommended Prompt:**
```
fantasy wizard casting spell, magical aura, ancient ruins, 
mystical atmosphere, detailed robes
```

#### 5. 🌃 Cyberpunk Style
**Features:**
- Neon lighting
- High-tech gear
- Future city
- Dark tones

**Best For:**
- Sci-fi character design
- Future concept art
- Game concept art

**Recommended Prompt:**
```
cyberpunk character with neon implants, futuristic city, 
rain, neon lights, high-tech gadgets
```

#### 6. ⚙️ Steampunk Style
**Features:**
- Victorian era elements
- Brass and copper decorations
- Gears and machinery
- Retro technology

**Best For:**
- Retro character design
- Alternative history creation
- Unique style illustrations

**Recommended Prompt:**
```
steampunk inventor with goggles, brass gears, 
Victorian clothing, mechanical details
```

#### 7. 🏰 Medieval Style
**Features:**
- Historical accuracy
- Armor and weapons
- Castle backgrounds
- Classical elements

**Best For:**
- Historical themes
- RPG character design
- Educational illustrations

**Recommended Prompt:**
```
medieval knight in full armor, castle background, 
sword and shield, heroic pose
```

#### 8. 🏙️ Modern Style
**Features:**
- Contemporary fashion
- Urban backgrounds
- Clean design
- Fashion elements

**Best For:**
- Fashion design
- Brand imagery
- Social media

**Recommended Prompt:**
```
modern character in streetwear, urban background, 
contemporary fashion, clean design
```

#### 9. 🚀 Sci-Fi Style
**Features:**
- Space elements
- Future technology
- Alien creatures
- Cosmic scenes

**Best For:**
- Sci-fi novel illustrations
- Space game design
- Concept art

**Recommended Prompt:**
```
sci-fi space explorer, alien planet, advanced suit, 
futuristic technology, cosmic background
```

#### 10. 🎪 Chibi Style
**Features:**
- Exaggerated proportions
- Cute expressions
- Simplified details
- Kawaii style

**Best For:**
- Sticker creation
- Merchandise design
- Cute illustrations

**Recommended Prompt:**
```
chibi character with big head, cute expression, 
simple design, kawaii style
```

---

## Prompt Tips

### Basic Tips

#### 1. Structured Description
Organize your prompts in this order:
```
[Style] + [Subject] + [Features] + [Action/Pose] + [Background] + [Lighting]
```

**Example:**
```
anime style, young female warrior, long red hair, blue armor, 
holding sword, mountain background, sunset lighting
```

#### 2. Use Specific Descriptions
- ❌ Bad: `beautiful character`
- ✅ Good: `character with emerald green eyes, flowing golden hair, elegant dress`

#### 3. Weight Control
Use parentheses to increase weight:
- `(important element)` - Slight emphasis
- `((very important))` - Medium emphasis
- `(((critical element)))` - Strong emphasis

### Advanced Tips

#### 1. Using Negative Prompts
Exclude unwanted elements:
```
Negative prompt: blurry, low quality, distorted, ugly, 
duplicate, extra limbs, bad anatomy
```

#### 2. Style Mixing
Combine multiple style elements:
```
anime style with realistic textures, watercolor effects, 
studio ghibli inspired
```

#### 3. Reference Artist Styles
Mention specific art styles:
```
in the style of Makoto Shinkai, detailed backgrounds, 
beautiful lighting
```

#### 4. Emotion and Atmosphere
Add emotional descriptions:
```
melancholic atmosphere, mysterious mood, dramatic tension, 
peaceful serenity
```

### Prompt Template Library

#### Character Type Templates

**Warrior Character:**
```
[Style] warrior, muscular build, battle-worn armor, 
determined expression, weapon of choice, battlefield background
```

**Mage Character:**
```
[Style] mage, flowing robes, magical staff, glowing eyes, 
casting spell, mystical aura, ancient library background
```

**Modern Urban Character:**
```
[Style] modern character, casual streetwear, confident pose, 
city skyline background, golden hour lighting
```

#### Scene Atmosphere Templates

**Epic Scene:**
```
epic scale, dramatic lighting, heroic pose, 
grand landscape, cinematic composition
```

**Cozy Scene:**
```
cozy atmosphere, warm lighting, gentle expression, 
soft colors, peaceful setting
```

**Action Scene:**
```
dynamic action pose, motion blur, intense expression, 
dramatic angle, explosive effects
```

---

## Gallery & Social Features

### Gallery

#### Browse Artwork
1. **Waterfall Layout**: Auto-loads more content
2. **Filter Options**:
   - Filter by style
   - Sort by time (Latest/Hot/Trending)
   - Sort by popularity

3. **Interaction Features**:
   - Like: Double-click or click heart icon
   - Bookmark: Save to personal collection
   - Comment: Share your thoughts

#### Publish Artwork
1. **Select Generated Result**: Choose from history
2. **Add Information**:
   - Artwork title
   - Description
   - Tags (max 5)

3. **Privacy Settings**:
   - Public: Visible to everyone
   - Private: Only visible to you

### Prompt Marketplace

#### Browse Prompts
- **Featured**: Official recommended prompts
- **Popular**: Most used prompts
- **Categories**: Browse by style and purpose

#### Purchase Prompts
1. View prompt effect preview
2. Check user reviews
3. Purchase with credits
4. Auto-added to template library

#### Sell Prompts
1. Create quality prompts
2. Set price (0-100 credits)
3. Add effect showcase images
4. Submit for review
5. Earn sales commission (70%)

### Social Features

#### Follow System
- Follow favorite creators
- Receive work update notifications
- View follow feed

#### Creation Challenges
- Join weekly theme challenges
- Win extra credit rewards
- Display on challenge page

#### Community Interaction
- Join official Discord community
- Participate in discussions
- Get latest news

---

## Frequently Asked Questions

### Account Related

**Q: Forgot password?**
A: Click "Forgot Password" on login page, enter registered email, we'll send a reset link.

**Q: How to change email?**
A: Go to "Account Settings" → "Security" → "Change Email", requires original email verification.

**Q: Can I delete my account?**
A: Yes, but data cannot be recovered. Access in "Account Settings" → "Privacy".

### Credits Related

**Q: How long are credits valid?**
A: Free credits reset daily, paid credits are permanent.

**Q: How to get more credits?**
A: 
- Daily login rewards
- Complete task challenges
- Purchase membership plans
- Direct credit purchase

**Q: Are credits deducted for failed generations?**
A: No, credits are only deducted for successful generations.

### Generation Related

**Q: Why is generation slow?**
A: 
- Peak hours may require queuing
- HD quality needs more processing time
- Check network connection

**Q: How to improve generation quality?**
A:
- Use detailed prompts
- Choose HD quality
- Reference prompt templates
- Use negative prompts

**Q: Who owns the copyright of generated images?**
A: You own usage rights for generated images, can use for personal and commercial purposes.

### Technical Issues

**Q: Which browsers are supported?**
A: We recommend latest versions of Chrome, Firefox, Safari, Edge.

**Q: Mobile support?**
A: Yes, our website is fully responsive, supports all mobile devices.

**Q: Image download failed?**
A: 
- Check browser download settings
- Try right-click save as
- Clear browser cache

---

## Troubleshooting

### Common Errors & Solutions

#### Error: Upload Failed
**Possible Causes:**
- File too large (over 10MB)
- Format not supported
- Network connection issue

**Solutions:**
1. Compress image to under 10MB
2. Convert to JPG/PNG/WebP format
3. Check network connection
4. Refresh page and retry

#### Error: Generation Failed
**Possible Causes:**
- Insufficient credits
- Prompt contains sensitive content
- Server busy

**Solutions:**
1. Check credit balance
2. Modify prompt content
3. Wait a few minutes and retry
4. Contact customer support

#### Error: Cannot Login
**Possible Causes:**
- Wrong password
- Account locked
- Browser cookie issue

**Solutions:**
1. Use forgot password function
2. Wait 24 hours for auto-unlock
3. Clear browser cookies
4. Use incognito mode

#### Error: Image Display Issues
**Possible Causes:**
- Browser cache problem
- Network load timeout
- CDN service issue

**Solutions:**
1. Force refresh page (Ctrl+F5)
2. Clear browser cache
3. Change network environment
4. Wait for service recovery

### Performance Optimization

1. **Use Recommended Browsers**
   - Chrome 90+
   - Firefox 88+
   - Safari 14+

2. **Optimize Network Environment**
   - Use stable network connection
   - Avoid VPN (may affect speed)

3. **Clean Browser**
   - Regularly clear cache
   - Disable unnecessary extensions

4. **Adjust Generation Parameters**
   - Use standard quality during peak hours
   - Reduce simultaneous image generation

---

## API Documentation

### API Overview

Character Figure AI Generator provides RESTful API, allowing developers to integrate character generation into their applications.

### Authentication

All API requests require API key in Header:
```http
Authorization: Bearer YOUR_API_KEY
```

Get API Key:
1. Login to account
2. Go to "Developer Center"
3. Create new API key
4. Save key (displayed only once)

### Basic Information

**Base URL:** `https://api.characterfigure.ai/v1`

**Request Format:** JSON

**Response Format:** JSON

### Core Endpoints

#### 1. Generate Character Image

**Endpoint:** `POST /generate`

**Request Parameters:**
```json
{
  "prompt": "string",           // Required: Main prompt
  "style": "anime",             // Required: Style type
  "negative_prompt": "string",   // Optional: Negative prompt
  "aspect_ratio": "1:1",        // Optional: Aspect ratio
  "quality": "hd",              // Optional: Quality level
  "num_images": 1,              // Optional: Number to generate
  "seed": 12345                 // Optional: Random seed
}
```

**Response Example:**
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

#### 2. Get Generation Status

**Endpoint:** `GET /generate/{generation_id}`

**Response Example:**
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

#### 3. Get User Profile

**Endpoint:** `GET /user/profile`

**Response Example:**
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

#### 4. Get Generation History

**Endpoint:** `GET /user/history`

**Query Parameters:**
- `page`: Page number (default 1)
- `limit`: Items per page (default 20, max 100)
- `style`: Filter by style
- `date_from`: Start date
- `date_to`: End date

**Response Example:**
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

#### 5. Gallery Operations

**Get Gallery List:** `GET /gallery`

**Publish to Gallery:** `POST /gallery`
```json
{
  "generation_id": "gen_abc123",
  "title": "My Character",
  "description": "Description here",
  "tags": ["anime", "warrior"],
  "is_public": true
}
```

**Like Artwork:** `POST /gallery/{item_id}/like`

### Error Handling

API uses standard HTTP status codes:

| Status Code | Meaning |
|------------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Server Error |

**Error Response Format:**
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

### Rate Limiting

| Plan | Request Limit |
|------|--------------|
| Free | 10/hour |
| Basic | 60/hour |
| Advanced | 300/hour |
| Professional | Unlimited |

Rate limit info in response headers:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1693224000
```

### SDK Support

Official SDKs:
- JavaScript/TypeScript
- Python
- PHP
- Java
- Go

**JavaScript Example:**
```javascript
import { CharacterFigureClient } from '@characterfigure/sdk';

const client = new CharacterFigureClient({
  apiKey: 'YOUR_API_KEY'
});

// Generate image
const result = await client.generate({
  prompt: 'anime warrior with sword',
  style: 'anime',
  quality: 'hd'
});

console.log(result.images[0].url);
```

**Python Example:**
```python
from characterfigure import Client

client = Client(api_key="YOUR_API_KEY")

# Generate image
result = client.generate(
    prompt="anime warrior with sword",
    style="anime",
    quality="hd"
)

print(result['images'][0]['url'])
```

### Webhook Support

Configure webhooks to receive generation completion notifications:

1. Configure webhook URL in Developer Center
2. Select event types to receive
3. Verify webhook signature

**Webhook Event Example:**
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

### Best Practices

1. **Error Retry**
   - Implement exponential backoff retry
   - Maximum 3 retries

2. **Cache Strategy**
   - Cache generated result URLs
   - URLs valid for 30 days

3. **Batch Processing**
   - Use batch endpoints for multiple requests
   - Reduce API calls

4. **Security Recommendations**
   - Never expose API keys in frontend
   - Store keys in environment variables
   - Rotate keys regularly

---

## Contact Support

### Get Help

**Online Support:**
- Help Center: [help.characterfigure.ai](https://help.characterfigure.ai)
- Live Chat: Weekdays 9:00-18:00
- Email: support@characterfigure.ai

**Community Support:**
- Discord: [discord.gg/characterfigure](https://discord.gg/characterfigure)
- Twitter: [@CharacterFigureAI](https://twitter.com/CharacterFigureAI)
- Reddit: [r/CharacterFigure](https://reddit.com/r/CharacterFigure)

**Feedback Channels:**
- Product Suggestions: feedback@characterfigure.ai
- Bug Reports: bugs@characterfigure.ai
- Business Cooperation: business@characterfigure.ai

---

## Release Notes

### Version 2.0.0 (2025-08-28)
- Added 10 character styles
- Optimized generation speed to under 10 seconds
- Added batch generation
- Launched prompt marketplace
- Support 4K HD output

### Version 1.5.0 (2025-07-15)
- Added gallery social features
- Optimized mobile experience
- Added API development interface
- Support multi-language interface

### Version 1.0.0 (2025-06-01)
- Official release
- Support basic character generation
- Credit system online
- Membership system established

---

*Document Version: v2.0.0*  
*Last Updated: August 28, 2025*  
*Character Figure AI Generator Team*