import React from 'react';
import {
  LayoutDashboard,
  Award,
  Users,
  Trophy,
  FileSpreadsheet,
  CheckSquare,
  ShieldCheck,
  History,
  TableProperties,
  Wrench,
} from 'lucide-react';
import { User } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'scoring'
  | 'students'
  | 'rankings'
  | 'reports'
  | 'utilities'
  | 'criteria'
  | 'users'
  | 'audit'
  | 'sheets';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
}) => {
  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';

  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'scoring' as ActiveTab,
      label: 'Chấm thi đua',
      icon: Award,
      highlight: true,
    },
    {
      id: 'students' as ActiveTab,
      label: 'Học sinh & Tổ',
      icon: Users,
    },
    {
      id: 'rankings' as ActiveTab,
      label: 'Bảng xếp hạng',
      icon: Trophy,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Báo cáo & Excel',
      icon: FileSpreadsheet,
    },
    {
      id: 'utilities' as ActiveTab,
      label: 'Tiện ích lớp học',
      icon: Wrench,
      badge: 'Mới',
    },
    {
      id: 'criteria' as ActiveTab,
      label: 'Tiêu chí thi đua',
      icon: CheckSquare,
    },
    {
      id: 'users' as ActiveTab,
      label: 'Tài khoản & Quyền',
      icon: ShieldCheck,
      adminOnly: true,
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Nhật ký Audit Log',
      icon: History,
      adminOnly: true,
    },
    {
      id: 'sheets' as ActiveTab,
      label: 'Bảng tính Sheets Live',
      icon: TableProperties,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white min-h-[calc(100vh-4rem)] p-4 shadow-xl select-none">
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        Menu Điều Hướng Lớp 4A3
      </div>

      <nav className="flex-1 space-y-1.5 mt-2">
        {menuItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              } ${item.highlight && !isActive ? 'border border-blue-500/30 bg-blue-950/40 text-blue-300' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Class 4A3 Quick Badge Footer */}
      <div className="mt-auto p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
        <div className="flex items-center justify-between font-bold text-slate-300 mb-1">
          <span>Lớp 4A3 Thạnh Xuân</span>
          <span className="text-emerald-400 font-extrabold">35 HS</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Chủ đề: <span className="text-amber-300 font-semibold">Thi Đua - Chinh Phục - Tiến Bộ</span>
        </p>
      </div>
    </aside>
  );
};
