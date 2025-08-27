/**
 * 提示词输入组件
 * 
 * 功能：提供智能的提示词输入体验
 * 特性：自动调整高度、字符计数、防抖输入、键盘快捷键
 */

import React, { memo, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import type { PromptInputProps } from "../types";
import { UI_CONFIG } from "../constants";

const PromptInput = memo<PromptInputProps>(({ 
  value, 
  onChange, 
  placeholder, 
  disabled = false 
}) => {
  const t = useTranslations("ai_generator");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 自动调整文本区域高度
   */
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, []);

  // 监听内容变化并调整高度
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  /**
   * 处理键盘快捷键
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter 或 Cmd+Enter 触发生成（由父组件处理）
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // 可以通过 props 传递 onSubmit 回调
    }
    
    // Tab 键插入缩进而不是跳转焦点
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // 设置光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + 2, start + 2);
        }
      }, 0);
    }
  }, [value, onChange]);

  /**
   * 处理粘贴事件（清理格式）
   */
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text/plain');
    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;
    const newValue = value.substring(0, start) + paste + value.substring(end);
    onChange(newValue);
  }, [value, onChange]);

  // 字符数统计
  const charCount = value.length;
  const maxChars = 4000; // 与工具函数中的限制保持一致
  const isNearLimit = charCount > maxChars * 0.8; // 80% 时显示警告
  const isOverLimit = charCount > maxChars;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-muted-foreground">
          {t("prompt.label")}
        </label>
        <span 
          className={`text-xs transition-colors ${
            isOverLimit 
              ? "text-destructive font-medium" 
              : isNearLimit 
                ? "text-yellow-600 dark:text-yellow-400" 
                : "text-muted-foreground"
          }`}
        >
          {charCount.toLocaleString()}/{maxChars.toLocaleString()}
        </span>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          resize-none bg-background/50 border-border/50 
          focus:border-primary/50 transition-all duration-200
          ${isOverLimit ? "border-destructive focus:border-destructive" : ""}
        `}
        style={{ minHeight: UI_CONFIG.textareaMinHeight }}
        aria-describedby="prompt-help"
      />
      
      {/* 帮助文本 */}
      <p id="prompt-help" className="text-xs text-muted-foreground">
        💡 Tip: Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to generate quickly
      </p>
    </div>
  );
});

PromptInput.displayName = "PromptInput";

export default PromptInput;