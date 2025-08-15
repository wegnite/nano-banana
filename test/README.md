# Test Directory Structure

## Organization

```
test/
├── integration/          # Integration tests for APIs
│   └── ai-generation.test.js
├── unit/                # Unit tests (future)
└── e2e/                 # End-to-end tests (future)
```

## Running Tests

### Integration Tests

```bash
# Run all integration tests
node test/integration/ai-generation.test.js

# With custom configuration
TEST_BASE_URL=http://localhost:3000 node test/integration/ai-generation.test.js

# With timeout adjustment
TEST_TIMEOUT=60000 node test/integration/ai-generation.test.js
```

### Environment Variables

- `TEST_BASE_URL`: Base URL for API tests (default: `http://localhost:3004`)
- `TEST_TIMEOUT`: Request timeout in milliseconds (default: `30000`)

## Test Coverage

Current test coverage includes:

- ✅ Text Generation API (OpenAI, DeepSeek)
- ✅ Image Generation API (DALL-E, FLUX)
- ✅ Placeholder Image API (multiple sizes)

## Adding New Tests

1. Create test files in appropriate directories
2. Follow naming convention: `*.test.js` or `*.spec.js`
3. Use environment variables for configuration
4. Include proper error handling and timeouts
5. Document test purpose and usage