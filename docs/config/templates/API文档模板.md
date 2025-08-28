# {{API_NAME}} API 文档

## 概述
- **版本**: {{API_VERSION}}
- **基础URL**: {{API_BASE_URL}}
- **认证方式**: {{AUTH_METHOD}}
- **更新日期**: {{LAST_UPDATED}}

## 认证

### {{AUTH_TYPE}}
```http
Authorization: {{AUTH_HEADER}}
```

示例：
```bash
curl -H "Authorization: Bearer {{API_TOKEN}}" \
  {{API_BASE_URL}}/{{ENDPOINT}}
```

## API 端点

### {{ENDPOINT_GROUP_NAME}}

#### {{ENDPOINT_NAME}}
{{ENDPOINT_DESCRIPTION}}

**请求**
- **方法**: `{{HTTP_METHOD}}`
- **路径**: `/{{ENDPOINT_PATH}}`
- **Content-Type**: `application/json`

**请求参数**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|-----|------|
| {{PARAM_NAME}} | {{PARAM_TYPE}} | {{REQUIRED}} | {{PARAM_DESCRIPTION}} |

**请求示例**
```{{REQUEST_LANGUAGE}}
{{REQUEST_EXAMPLE}}
```

**响应**

成功响应 ({{SUCCESS_CODE}}):
```json
{{SUCCESS_RESPONSE}}
```

错误响应 ({{ERROR_CODE}}):
```json
{{ERROR_RESPONSE}}
```

**响应字段说明**

| 字段名 | 类型 | 描述 |
|-------|------|------|
| {{FIELD_NAME}} | {{FIELD_TYPE}} | {{FIELD_DESCRIPTION}} |

## 错误码说明

| 错误码 | 描述 | 处理建议 |
|-------|------|---------|
| {{ERROR_CODE}} | {{ERROR_DESCRIPTION}} | {{ERROR_SOLUTION}} |

## 限流说明

- **请求限制**: {{RATE_LIMIT}} 请求/{{TIME_WINDOW}}
- **并发限制**: {{CONCURRENT_LIMIT}}
- **超限响应**: HTTP {{RATE_LIMIT_CODE}}

## SDK 使用示例

### JavaScript/TypeScript
```javascript
{{JS_SDK_EXAMPLE}}
```

### Python
```python
{{PYTHON_SDK_EXAMPLE}}
```

### cURL
```bash
{{CURL_EXAMPLE}}
```

## Webhook 配置

### 事件类型
- `{{EVENT_TYPE_1}}`: {{EVENT_DESCRIPTION_1}}
- `{{EVENT_TYPE_2}}`: {{EVENT_DESCRIPTION_2}}

### Webhook 请求格式
```json
{{WEBHOOK_PAYLOAD}}
```

### 验证签名
```{{LANGUAGE}}
{{SIGNATURE_VERIFICATION_CODE}}
```

## 测试环境

- **测试URL**: {{TEST_API_URL}}
- **测试凭证**: {{TEST_CREDENTIALS_INFO}}
- **Mock数据**: {{MOCK_DATA_URL}}

## 迁移指南

### 从 v{{OLD_VERSION}} 迁移到 v{{NEW_VERSION}}

**Breaking Changes**:
1. {{BREAKING_CHANGE_1}}
2. {{BREAKING_CHANGE_2}}

**迁移步骤**:
1. {{MIGRATION_STEP_1}}
2. {{MIGRATION_STEP_2}}

## 最佳实践

1. **错误处理**: {{ERROR_HANDLING_PRACTICE}}
2. **重试策略**: {{RETRY_STRATEGY}}
3. **缓存策略**: {{CACHING_STRATEGY}}
4. **安全建议**: {{SECURITY_RECOMMENDATION}}

## 支持与反馈

- **技术支持**: {{SUPPORT_EMAIL}}
- **问题追踪**: {{ISSUE_TRACKER_URL}}
- **API状态**: {{STATUS_PAGE_URL}}
- **开发者社区**: {{COMMUNITY_URL}}

---

*API文档版本: {{DOC_VERSION}}*  
*维护团队: {{TEAM_NAME}}*  
*更新时间: {{LAST_UPDATED}}*