"use client";

/**
 * Icon Component
 * 
 * Problem: Migrating from react-icons to lucide-react for better performance
 * Solution: Create a mapping system to convert icon names to lucide-react components
 * 
 * This component provides backward compatibility while using lightweight lucide-react icons
 */

import {
  // Common UI icons
  Home, Settings, User, Users, Mail, Phone, Search, Plus, Edit, 
  Trash2, Copy, Check, X, ChevronDown, ChevronRight, ChevronLeft, 
  ChevronUp, ExternalLink, Download, Upload, Eye, EyeOff,
  
  // Navigation icons  
  Menu, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, 
  
  // Business icons
  DollarSign, CreditCard, ShoppingCart, Package, Building2,
  
  // Media & Content icons
  Image, Video, FileText, File, Folder, BookOpen, 
  
  // Social & Communication icons
  MessageCircle, Share, Heart, Star, Flag,
  
  // Tech icons
  Code, Monitor, Smartphone, Tablet, Globe, Wifi, Database,
  
  // Status icons
  CheckCircle, XCircle, AlertCircle, Info, HelpCircle,
  
  // Weather & Time
  Clock, Calendar, Sun, Moon, Cloud, CloudRain,
  
  // Tools & Actions
  Play, Pause, Square, SkipForward, SkipBack, Volume2, VolumeX,
  Maximize, Minimize, Filter, ArrowUpNarrowWide as SortAsc, ArrowDownWideNarrow as SortDesc, RotateCw,
  
  // Specialty icons
  Zap, Activity, BarChart3, PieChart, TrendingUp, Target,
} from "lucide-react";

import { ReactNode } from "react";
import { GitHubIcon, DiscordIcon } from "@/components/ui/brand-icons";

// Mapping from react-icons names to lucide-react components
const iconMap: { [key: string]: React.ElementType } = {
  // Remix Icons (Ri) to Lucide mapping
  "RiHomeLine": Home,
  "RiDashboardLine": BarChart3,
  "RiUserLine": User,
  "RiOrderPlayLine": Play,
  "RiArticleLine": FileText,
  "RiFileTextLine": FileText,
  "RiAppsLine": Menu,
  "RiGithubLine": GitHubIcon,
  "RiGithubFill": GitHubIcon,
  "RiDiscordLine": DiscordIcon,
  "RiDiscordFill": DiscordIcon,
  "RiTwitterLine": MessageCircle, // Using MessageCircle as Twitter alternative
  "RiTwitterXFill": MessageCircle,
  "RiMoneyDollarBoxLine": DollarSign,
  "RiMoneyDollarCircleLine": DollarSign,
  "RiMoneyCnyCircleFill": DollarSign,
  "RiAddLine": Plus,
  "RiEditLine": Edit,
  "RiEyeLine": Eye,
  "RiBookLine": BookOpen,
  "RiBankCardLine": CreditCard,
  "RiCheckLine": Check,
  "RiCopy2Line": Copy,
  "RiFlashlightFill": Zap,
  "RiBookOpenLine": BookOpen,
  "RiNextjsFill": Code, // Using Code for technical icons
  "RiCloudyFill": Cloud,
  "RiClapperboardAiLine": Video,
  "RiCodeFill": Code,
  "RiMailLine": Mail,
};

// Additional icon packages can be added here if needed

export default function Icon({
  name,
  className,
  onClick,
}: {
  name: string;
  className?: string;
  onClick?: () => void;
}) {
  // Get the corresponding lucide-react icon from the mapping
  const IconComponent = iconMap[name];

  // Return null if no icon is found
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap. Please add it to the mapping.`);
    return null;
  }

  // Render the lucide-react icon component
  return (
    <IconComponent
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
}
