import React from 'react';
import { Shield, Crown, Star, Award } from 'lucide-react';

export const getClassRoleBadgeConfig = (role?: string) => {
  if (!role || role === 'Thành viên' || role === 'Thành viên (Không giữ chức vụ)' || role === 'None' || role === '') {
    return null;
  }

  const trimmed = role.trim();

  if (trimmed.includes('Lớp trưởng')) {
    return {
      label: '👑 Lớp trưởng',
      shortLabel: '👑 Lớp trưởng',
      bg: 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs',
      badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs',
      color: 'amber',
      icon: Crown,
    };
  }
  if (trimmed.includes('Lớp phó học tập')) {
    return {
      label: '⭐ Lớp phó học tập',
      shortLabel: '⭐ LP Học tập',
      bg: 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-2xs',
      badgeClass: 'bg-indigo-600 text-white shadow-xs',
      color: 'indigo',
      icon: Star,
    };
  }
  if (trimmed.includes('Lớp phó trật tự')) {
    return {
      label: '👮 Lớp phó trật tự',
      shortLabel: '👮 LP Trật tự',
      bg: 'bg-rose-100 text-rose-900 border-rose-300 shadow-2xs',
      badgeClass: 'bg-rose-600 text-white shadow-xs',
      color: 'rose',
      icon: Shield,
    };
  }
  if (trimmed.includes('Lớp phó lao động')) {
    return {
      label: '🧹 Lớp phó lao động',
      shortLabel: '🧹 LP Lao động',
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs',
      badgeClass: 'bg-emerald-600 text-white shadow-xs',
      color: 'emerald',
      icon: Award,
    };
  }
  if (trimmed.includes('Lớp phó văn thể mỹ')) {
    return {
      label: '🎨 Lớp phó văn thể mỹ',
      shortLabel: '🎨 LP Văn thể',
      bg: 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs',
      badgeClass: 'bg-purple-600 text-white shadow-xs',
      color: 'purple',
      icon: Award,
    };
  }
  if (trimmed.includes('Tổ trưởng')) {
    return {
      label: `🚩 ${trimmed}`,
      shortLabel: '🚩 Tổ trưởng',
      bg: 'bg-blue-100 text-blue-900 border-blue-300 shadow-2xs',
      badgeClass: 'bg-blue-600 text-white shadow-xs',
      color: 'blue',
      icon: Shield,
    };
  }
  if (trimmed.includes('Tổ phó')) {
    return {
      label: `🔰 ${trimmed}`,
      shortLabel: '🔰 Tổ phó',
      bg: 'bg-teal-100 text-teal-900 border-teal-300 shadow-2xs',
      badgeClass: 'bg-teal-600 text-white shadow-xs',
      color: 'teal',
      icon: Shield,
    };
  }
  if (trimmed.includes('Thủ quỹ')) {
    return {
      label: '💰 Thủ quỹ',
      shortLabel: '💰 Thủ quỹ',
      bg: 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs',
      badgeClass: 'bg-amber-600 text-white shadow-xs',
      color: 'amber',
      icon: Award,
    };
  }

  return {
    label: `✨ ${trimmed}`,
    shortLabel: trimmed,
    bg: 'bg-slate-100 text-slate-800 border-slate-300 shadow-2xs',
    badgeClass: 'bg-slate-700 text-white shadow-xs',
    color: 'slate',
    icon: Shield,
  };
};

export const ClassRoleBadge: React.FC<{
  role?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'badge' | 'solid';
  className?: string;
}> = ({ role, size = 'xs', variant = 'badge', className = '' }) => {
  const conf = getClassRoleBadgeConfig(role);
  if (!conf) return null;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 font-bold',
    sm: 'text-xs px-2 py-0.5 font-extrabold',
    md: 'text-xs px-2.5 py-1 font-black',
  }[size];

  const styleClass = variant === 'solid' ? conf.badgeClass : `${conf.bg} border`;

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full tracking-wide shrink-0 transition-all ${sizeClasses} ${styleClass} ${className}`}
      title={`Chức vụ ban cán sự: ${conf.label}`}
    >
      <span>{conf.label}</span>
    </span>
  );
};
