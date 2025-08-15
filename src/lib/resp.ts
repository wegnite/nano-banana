/**
 * 统一的 API 响应工具函数
 * 
 * 问题背景：
 * 1. 前端测试页面（test-page.html）从文件系统打开时遇到 CORS 跨域错误
 * 2. API 返回错误时状态码始终是 200，导致前端无法正确识别错误
 * 
 * 解决方案：
 * - 为所有响应添加 CORS 头，允许跨域访问
 * - 错误响应返回正确的 HTTP 状态码（400）而不是 200
 */

/**
 * 返回成功的数据响应
 * 
 * 修改原因：添加 CORS 头解决跨域访问问题
 * - 允许任何来源访问（开发环境）
 * - 支持 POST 和 OPTIONS 方法（OPTIONS 用于 CORS 预检）
 * 
 * @param data 要返回的数据
 * @returns 带有 CORS 头的成功响应
 */
export function respData(data: any) {
  const response = respJson(0, "ok", data || []);
  // 添加 CORS 头以支持跨域请求（如从本地 HTML 文件访问）
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

/**
 * 返回简单的成功响应（无数据）
 */
export function respOk() {
  return respJson(0, "ok");
}

/**
 * 返回错误响应
 * 
 * 修改原因：
 * 1. 添加正确的 HTTP 状态码（之前总是返回 200）
 * 2. 添加 CORS 头支持跨域错误处理
 * 3. 同时返回 error 字段，方便前端统一处理
 * 
 * @param message 错误消息
 * @param status HTTP 状态码，默认 400
 * @returns 带有正确状态码和 CORS 头的错误响应
 */
export function respErr(message: string, status: number = 400) {
  return Response.json({
    code: -1,
    message: message,
    error: message  // 同时提供 error 字段，兼容不同的前端处理方式
  }, { 
    status,  // 使用正确的 HTTP 状态码（如 400、500）
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

/**
 * 基础的 JSON 响应函数
 * 
 * 注意：这个函数不包含 CORS 头，也不设置 HTTP 状态码
 * 建议使用 respData 或 respErr 而不是直接使用这个函数
 * 
 * @param code 业务状态码（0 成功，-1 失败）
 * @param message 消息
 * @param data 可选的数据
 */
export function respJson(code: number, message: string, data?: any) {
  let json = {
    code: code,
    message: message,
    data: data,
  };
  if (data) {
    json["data"] = data;
  }

  return Response.json(json);
}
