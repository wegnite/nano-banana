# Claude Code Project Configuration

## ⚠️ CRITICAL RULES - MUST FOLLOW

### File Creation Rules - EXTREMELY IMPORTANT
1. **NEVER** create test files in the project root directory (NO test-*.js, test-*.html in root!)
2. **ALWAYS** place ALL test files in the `/test` directory and its subdirectories
3. **ALWAYS** place documentation files in the `/docs` directory
4. **NEVER** create README.md in the root (it already exists)
5. **NEVER** create example or demo files in the source code directories
6. **REMEMBER**: Every time you create a test file, it MUST go in `/test/` directory!

### Directory Structure for New Files
```
✅ CORRECT:
- /test/         → All test files go here
- /docs/         → All documentation files go here (使用中文命名)
- /test/unit/    → Unit tests
- /test/integration/ → Integration tests

❌ WRONG:
- /README.md     → Don't create another one
- /test.js       → Should be in /test/
- /test-api.js   → Should be in /test/integration/
- /test-*.html   → Should be in /test/ or /public/ for served pages
- /src/test.js   → Should be in /test/
- /api-docs.md   → Should be in /docs/
```

### Documentation Naming Rules - 文档命名规范
**CRITICAL: All documentation files MUST use Chinese naming!**

```
✅ CORRECT Chinese naming:
- /docs/系统架构设计.md
- /docs/API接口文档.md
- /docs/用户使用手册.md
- /docs/开发指南.md

❌ WRONG English naming:
- /docs/SYSTEM_DESIGN.md
- /docs/API_DOCS.md
- /docs/USER_GUIDE.md
- /docs/README.md
```

## 🚨 REMINDER FOR CLAUDE CODE 🚨
**EVERY SINGLE TEST FILE YOU CREATE MUST GO IN THE `/test/` DIRECTORY!**
- Not in root directory
- Not in src directory  
- ONLY in `/test/` and its subdirectories
- This includes: test-*.js, test-*.html, *.test.js, *.spec.js, etc.

## Project Overview
This is an AI Universal Generator project built with Next.js, TypeScript, and various AI provider integrations.

## Important Testing Requirements

### Before Any Code Changes
When making changes to the codebase, Claude Code should:

1. **Run Linting**
   ```bash
   npm run lint
   ```

2. **Run Type Checking**
   ```bash
   npx tsc --noEmit
   ```

3. **Run Integration Tests** (if AI-related changes)
   ```bash
   npm run test:integration
   ```

### After Code Changes
After completing any code modifications:

1. **Verify Build**
   ```bash
   npm run build
   ```

2. **Test in Development Mode**
   ```bash
   npm run dev
   # Then test the feature manually at http://localhost:3000
   ```

## Git Workflow Rules

### NEVER Auto-Commit
- **DO NOT** automatically commit changes
- **DO NOT** automatically push to remote
- **ALWAYS** wait for explicit user request to commit/push
- **ALWAYS** show git status before committing

### Commit Process
When user explicitly asks to commit:
1. Show current git status
2. Ask user to confirm files to commit
3. Create descriptive commit message
4. Only push when explicitly requested

## Code Quality Standards

### Code Comments - MANDATORY
**ALL non-test code modifications MUST include comments explaining:**
1. **WHY** the code was added/modified (problem it solves)
2. **WHAT** the code does (functionality)
3. **HOW** it works (if complex logic)

Example format:
```typescript
/**
 * Function/File purpose
 * 
 * Problem: What issue this solves
 * Solution: How it solves it
 * 
 * @param x Description
 * @returns Description
 */
```

### TypeScript
- Ensure all new code is properly typed
- Avoid using `any` type
- Use interfaces for object shapes
- Properly type API responses

### React/Next.js
- Use functional components with hooks
- Implement proper error boundaries
- Follow Next.js 14+ best practices
- Use server components where appropriate

### Security
- NEVER commit .env files
- NEVER expose API keys in code
- Always use environment variables
- Validate and sanitize user inputs

## Testing Checklist

Before considering any task complete:
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Integration tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Build succeeds

## AI Provider Configuration

### Available Providers
- OpenAI (primary)
- DeepSeek
- OpenRouter
- SiliconFlow
- Replicate
- Kling

### Testing AI Features
When modifying AI-related code:
1. Test with at least 2 different providers
2. Verify error handling for API failures
3. Check rate limiting behavior
4. Test with invalid API keys

## Development Environment

### Required Environment Variables
See `.env.example` for required configuration.

### Local Development
- Default port: 3000 (dev), 3002 (local)
- Database: Supabase PostgreSQL
- Auth: NextAuth with Google/GitHub providers
- Storage: Cloudflare R2

## Common Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run lint            # Run ESLint
npx tsc --noEmit       # Type check

# Testing
npm run test            # Run all tests
npm run test:integration # Run integration tests

# Database
npm run db:generate     # Generate migrations
npm run db:migrate      # Run migrations
npm run db:studio       # Open Drizzle Studio
npm run db:push        # Push schema changes

# Docker
npm run docker:build    # Build Docker image
```

## Notes for Claude Code

1. This project uses AI generation features - always test them after changes
2. Multiple AI providers are configured - ensure compatibility
3. Authentication is required for most features - test both authenticated and unauthenticated states
4. The project supports internationalization (i18n) - test with different locales
5. Payment integration with Creem/Stripe - be careful with payment-related code

---

*Last Updated: 2025-08-15*
*This file helps Claude Code understand project-specific requirements and testing procedures.*