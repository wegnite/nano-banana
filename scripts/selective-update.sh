#!/bin/bash

# 选择性更新脚本 - 从模板项目复制关键更新
# 此脚本会保留当前项目的独特功能，同时应用模板的重要更新

TEMPLATE_DIR="../ai-shipany-template/ai-shipany-template"
CURRENT_DIR="."

echo "🔄 开始选择性更新..."

# 1. 更新配置文件（保留现有配置，添加新配置）
echo "📋 更新配置文件..."

# 备份现有package.json
cp package.json package.json.backup

# 比较并合并package.json中的依赖
echo "   - 检查新依赖..."
# 这里可以手动检查并添加需要的新依赖

# 2. 复制新的组件（如果不存在）
echo "🎨 检查新组件..."

# 复制新的UI组件（如果不存在）
COMPONENTS_TO_CHECK=(
    "src/components/ui/sonner.tsx"
    "src/components/ui/carousel.tsx"
    "src/components/ui/resizable.tsx"
)

for component in "${COMPONENTS_TO_CHECK[@]}"; do
    if [ ! -f "$component" ] && [ -f "$TEMPLATE_DIR/$component" ]; then
        echo "   - 复制新组件: $component"
        cp "$TEMPLATE_DIR/$component" "$component"
    fi
done

# 3. 更新环境变量示例文件
if [ -f "$TEMPLATE_DIR/.env.example" ]; then
    echo "🔐 创建新的环境变量示例..."
    cp "$TEMPLATE_DIR/.env.example" .env.example.new
    echo "   - 新的环境变量示例已保存到 .env.example.new"
fi

# 4. 更新样式文件（保留自定义样式）
echo "🎨 检查样式更新..."
if [ -f "$TEMPLATE_DIR/src/app/globals.css" ]; then
    # 创建对比文件供手动审查
    cp "$TEMPLATE_DIR/src/app/globals.css" src/app/globals.css.new
    echo "   - 新的全局样式已保存到 src/app/globals.css.new"
fi

# 5. 复制新的API路由（如果不存在）
echo "🔌 检查新API路由..."
NEW_APIS=(
    "src/app/api/demo/send-email"
)

for api in "${NEW_APIS[@]}"; do
    if [ ! -d "$api" ] && [ -d "$TEMPLATE_DIR/$api" ]; then
        echo "   - 复制新API: $api"
        cp -r "$TEMPLATE_DIR/$api" "$api"
    fi
done

# 6. 更新类型定义
echo "📝 检查类型定义更新..."
if [ -d "$TEMPLATE_DIR/src/types" ]; then
    # 复制新的类型定义文件
    find "$TEMPLATE_DIR/src/types" -name "*.d.ts" -o -name "*.ts" | while read file; do
        relative_path=${file#$TEMPLATE_DIR/}
        if [ ! -f "$relative_path" ]; then
            echo "   - 复制类型定义: $relative_path"
            mkdir -p $(dirname "$relative_path")
            cp "$file" "$relative_path"
        fi
    done
fi

# 7. 创建更新报告
echo "📊 创建更新报告..."
cat > update-report.md << EOF
# 选择性更新报告
日期: $(date)

## 已完成的更新
- 备份了 package.json 到 package.json.backup
- 检查并复制了新组件
- 创建了新的环境变量示例文件 (.env.example.new)
- 创建了新的样式文件供审查 (globals.css.new)
- 检查并复制了新的API路由

## 需要手动处理
1. 比较 .env.example.new 和现有配置，合并需要的环境变量
2. 审查 src/app/globals.css.new，合并需要的样式更新
3. 检查 package.json.backup 和模板的 package.json，添加需要的新依赖
4. 运行 npm install 或 pnpm install 安装新依赖

## 保留的功能
- AI生成器组件 (src/components/blocks/ai-generator)
- 归因系统 (AttributionTracker)
- 现有的所有自定义功能和改动

## 下一步
1. 审查所有 .new 文件
2. 手动合并需要的更改
3. 删除不需要的 .new 文件
4. 测试应用功能
EOF

echo "✅ 选择性更新完成！"
echo "📄 请查看 update-report.md 了解详情"
echo "⚠️  请手动审查所有 .new 文件并决定是否合并"