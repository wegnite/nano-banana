/**
 * 标签选择器组件
 * 
 * 功能：提供生成类型的标签页切换功能
 * 特性：响应式布局、图标支持、性能优化
 */

import React, { memo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image, Video } from "lucide-react";
import type { TabSelectorProps, GenerationType } from "../types";

// 图标映射
const ICON_MAP = {
  FileText,
  Image,
  Video
};

const TabSelector = memo<TabSelectorProps>(({ activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as GenerationType)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="text" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Text
        </TabsTrigger>
        <TabsTrigger value="image" className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          Image
        </TabsTrigger>
        <TabsTrigger value="video" className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          Video
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
});

TabSelector.displayName = "TabSelector";

export default TabSelector;