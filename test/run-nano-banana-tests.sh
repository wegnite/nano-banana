#!/bin/bash

# Nano Banana API 测试执行脚本
#
# 功能说明：
# 自动化执行 nano-banana API 的所有测试套件
# 包括环境检查、测试执行、结果报告生成
#
# 使用方法：
# chmod +x test/run-nano-banana-tests.sh
# ./test/run-nano-banana-tests.sh
#
# 环境要求：
# - Node.js 18+
# - npm 或 pnpm
# - 配置好的 .env.local 文件
#
# @author Claude Code Assistant
# @date 2025-08-28

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查测试环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_success "Node.js 版本: $NODE_VERSION"
    
    # 检查包管理器
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
    else
        log_error "未找到 npm 或 pnpm"
        exit 1
    fi
    
    log_success "包管理器: $PKG_MANAGER"
    
    # 检查环境变量文件
    if [ ! -f ".env.local" ]; then
        log_warning ".env.local 文件不存在"
        log_info "将创建示例环境变量文件..."
        
        cat > .env.local << EOF
# Nano Banana API 测试环境变量
NANO_BANANA_API_KEY=""
NANO_BANANA_API_URL="https://api.kie.ai/nano-banana"

# Next.js 配置
NEXT_PUBLIC_WEB_URL="http://localhost:3000"

# 数据库配置（测试时需要）
DATABASE_URL=""

# 认证配置（测试时需要）
AUTH_SECRET="test-secret-key"
AUTH_URL="http://localhost:3000/api/auth"
EOF
        log_warning "请配置 .env.local 中的必要变量后再运行测试"
    fi
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装依赖..."
        $PKG_MANAGER install
    fi
}

# 启动开发服务器
start_dev_server() {
    log_info "启动开发服务器..."
    
    # 检查端口是否被占用
    if lsof -i :3000 > /dev/null 2>&1; then
        log_warning "端口 3000 已被占用，跳过服务器启动"
        return
    fi
    
    # 在后台启动服务器
    $PKG_MANAGER run dev > dev-server.log 2>&1 &
    DEV_SERVER_PID=$!
    
    log_info "开发服务器 PID: $DEV_SERVER_PID"
    
    # 等待服务器启动
    log_info "等待服务器启动..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            log_success "服务器启动成功"
            return
        fi
        sleep 2
        echo -n "."
    done
    
    log_error "服务器启动失败"
    exit 1
}

# 运行测试
run_tests() {
    log_info "开始执行测试..."
    
    TEST_START_TIME=$(date +%s)
    
    # 创建测试结果目录
    mkdir -p test-results
    
    # 1. 运行主要API测试
    log_info "执行 Nano Banana API 测试..."
    if $PKG_MANAGER run test:nano-banana > test-results/api-test.log 2>&1; then
        log_success "API 测试完成"
    else
        log_warning "API 测试出现问题，请查看 test-results/api-test.log"
    fi
    
    # 2. 运行积分系统测试
    log_info "执行积分系统测试..."
    if $PKG_MANAGER run test:nano-banana-credits > test-results/credits-test.log 2>&1; then
        log_success "积分系统测试完成"
    else
        log_warning "积分系统测试出现问题，请查看 test-results/credits-test.log"
    fi
    
    # 3. 运行类型检查
    log_info "执行 TypeScript 类型检查..."
    if npx tsc --noEmit > test-results/type-check.log 2>&1; then
        log_success "类型检查通过"
    else
        log_warning "类型检查发现问题，请查看 test-results/type-check.log"
    fi
    
    # 4. 运行代码检查
    log_info "执行代码质量检查..."
    if $PKG_MANAGER run lint > test-results/lint.log 2>&1; then
        log_success "代码质量检查通过"
    else
        log_warning "代码质量检查发现问题，请查看 test-results/lint.log"
    fi
    
    TEST_END_TIME=$(date +%s)
    TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))
    
    log_success "测试执行完成，耗时: ${TEST_DURATION}秒"
}

# 生成测试报告
generate_report() {
    log_info "生成测试报告..."
    
    REPORT_FILE="test-results/test-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > $REPORT_FILE << EOF
# Nano Banana API 测试报告

**执行时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**测试环境**: 本地开发环境  
**Node.js版本**: $(node --version)  
**包管理器**: $PKG_MANAGER  

## 测试结果摘要

### API功能测试
EOF

    if [ -f "test-results/api-test.log" ]; then
        echo "- 详细日志: [api-test.log](./api-test.log)" >> $REPORT_FILE
        
        # 提取测试结果
        if grep -q "通过" test-results/api-test.log; then
            PASSED=$(grep -o "通过.*" test-results/api-test.log | wc -l)
            echo "- 通过测试: $PASSED 个" >> $REPORT_FILE
        fi
        
        if grep -q "失败" test-results/api-test.log; then
            FAILED=$(grep -o "失败.*" test-results/api-test.log | wc -l)
            echo "- 失败测试: $FAILED 个" >> $REPORT_FILE
        fi
        
        if grep -q "跳过" test-results/api-test.log; then
            SKIPPED=$(grep -o "跳过.*" test-results/api-test.log | wc -l)
            echo "- 跳过测试: $SKIPPED 个" >> $REPORT_FILE
        fi
    fi

    cat >> $REPORT_FILE << EOF

### 积分系统测试
EOF

    if [ -f "test-results/credits-test.log" ]; then
        echo "- 详细日志: [credits-test.log](./credits-test.log)" >> $REPORT_FILE
    fi

    cat >> $REPORT_FILE << EOF

### 代码质量检查
EOF

    if [ -f "test-results/type-check.log" ]; then
        if grep -q "error" test-results/type-check.log; then
            echo "- TypeScript 类型检查: ❌ 发现错误" >> $REPORT_FILE
        else
            echo "- TypeScript 类型检查: ✅ 通过" >> $REPORT_FILE
        fi
    fi

    if [ -f "test-results/lint.log" ]; then
        if grep -q "error" test-results/lint.log || grep -q "warn" test-results/lint.log; then
            echo "- ESLint 代码检查: ⚠️ 发现问题" >> $REPORT_FILE
        else
            echo "- ESLint 代码检查: ✅ 通过" >> $REPORT_FILE
        fi
    fi

    cat >> $REPORT_FILE << EOF

## 测试环境信息

- **操作系统**: $(uname -s)
- **Node.js版本**: $(node --version)
- **npm版本**: $(npm --version)
- **项目目录**: $(pwd)

## 下一步建议

1. 配置完整的认证环境以运行所有功能测试
2. 设置测试数据库以验证数据持久化
3. 配置 Nano Banana API 密钥以测试实际集成
4. 实施 CI/CD 管道自动化测试

EOF

    log_success "测试报告已生成: $REPORT_FILE"
}

# 清理资源
cleanup() {
    log_info "清理测试资源..."
    
    # 停止开发服务器
    if [ ! -z "$DEV_SERVER_PID" ]; then
        log_info "停止开发服务器 (PID: $DEV_SERVER_PID)"
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi
    
    # 清理日志文件
    if [ -f "dev-server.log" ]; then
        mv dev-server.log test-results/ 2>/dev/null || true
    fi
}

# 主执行流程
main() {
    echo "=================================================="
    echo "Nano Banana API 自动化测试执行器"
    echo "=================================================="
    echo
    
    # 设置错误处理
    trap cleanup EXIT
    
    # 执行测试流程
    check_environment
    start_dev_server
    run_tests
    generate_report
    
    echo
    echo "=================================================="
    log_success "测试执行完成！"
    echo "=================================================="
    echo "📊 查看详细结果: test-results/"
    echo "📝 查看测试报告: docs/nano-banana测试报告.md"
    echo
}

# 检查是否为直接执行
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    main "$@"
fi