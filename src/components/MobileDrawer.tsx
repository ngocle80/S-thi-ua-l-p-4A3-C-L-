import React from 'react';
import { ActiveTab } from './Sidebar';
import { User } from '../types';
import {
  CheckSquare,
  ShieldCheck,
  History,
  TableProperties,
  Wrench,
  X,
  Database,
  GraduationCap,
} from 'lucide-react';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  onOpenSheetsModal: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenSheetsModal,
}) => {
  if (!open) return null;

  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';

  const extraItems = [
    { id: 'utilities' as ActiveTab, label: 'Tiện ích hỗ trợ lớp học', icon: Wrench },
    { id: 'criteria' as ActiveTab, label: 'Tiêu chí thi đua', icon: CheckSquare },
    { id: 'users' as ActiveTab, label: 'Tài khoản & Phân quyền', icon: ShieldCheck, adminOnly: true },
    { id: 'audit' as ActiveTab, label: 'Nhật ký Audit Log', icon: History, adminOnly: true },
    { id: 'sheets' as ActiveTab, label: 'Bảng tính Sheets Live', icon: TableProperties },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="w-4/5 max-w-sm h-full bg-slate-900 text-white p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            <span className="font-black text-sm">Menu Mở Rộng 4A3</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 mt-4">
          {extraItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-blue-400" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                onOpenSheetsModal();
              }}
              className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Cơ sở dữ liệu Sheets & Code</span>
            </button>
          </div>
        </nav>

        <div className="pt-4 text-xs text-slate-500 text-center">
          Sổ Thi Đua Lớp 4A3 • TH Thạnh Xuân
        </div>
      </div>
    </div>
  );
};
