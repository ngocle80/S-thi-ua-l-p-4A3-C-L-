import React from 'react';
import {
  LayoutDashboard,
  Award,
  Users,
  Trophy,
  FileSpreadsheet,
  Menu,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
}) => {
  const items = [
    { id: 'dashboard' as ActiveTab, label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'scoring' as ActiveTab, label: 'Chấm điểm', icon: Award, highlight: true },
    { id: 'rankings' as ActiveTab, label: 'Xếp hạng', icon: Trophy },
    { id: 'students' as ActiveTab, label: 'Học sinh', icon: Users },
    { id: 'reports' as ActiveTab, label: 'Báo cáo', icon: FileSpreadsheet },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative -top-4 flex flex-col items-center focus:outline-none"
              >
                <div className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                  isActive ? 'bg-blue-700 ring-4 ring-blue-100' : 'bg-blue-600 shadow-blue-500/40'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-blue-700 mt-1">Chấm Điểm</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center py-1 px-2 text-slate-500 hover:text-slate-800 rounded-lg"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Thêm...</span>
        </button>
      </div>
    </div>
  );
};
