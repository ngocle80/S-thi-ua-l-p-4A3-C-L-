import React from 'react';
import { User, AppConfig } from '../types';
import {
  GraduationCap,
  Shield,
  LogOut,
  Database,
  UserCheck,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ClassLogo } from './ClassLogo';

interface HeaderProps {
  currentUser: User | null;
  config: AppConfig;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenSheetsModal: () => void;
  onRefreshData: () => void;
  onUploadLogo?: (fileDataUrl: string) => Promise<{ success: boolean; message?: string }>;
  gasUrl: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  config,
  onLogout,
  onOpenLogin,
  onOpenSheetsModal,
  onRefreshData,
  onUploadLogo,
  gasUrl,
}) => {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN_GVCN':
        return { label: 'GVCN (Quản trị)', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'LOP_TRUONG':
        return { label: 'Lớp Trưởng', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'PHO_TRAT_TU':
        return { label: 'Phó Trật Tự', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'PHO_LAO_DONG':
        return { label: 'Phó Lao Động', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'TO_TRUONG':
        return { label: 'Tổ Trưởng', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
      case 'GIAO_VIEN_BO_MON':
        return { label: 'GV Bộ Môn', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: 'Người Xem', bg: 'bg-gray-100 text-gray-700 border-gray-300' };
    }
  };

  const badge = getRoleBadge(currentUser?.Role);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School/Class title */}
          <div className="flex items-center space-x-3">
            <ClassLogo
              logoUrl={config.LogoURL}
              size="sm"
              editable={currentUser?.Role === 'ADMIN_GVCN'}
              onUploadLogo={onUploadLogo}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg text-blue-950 tracking-tight">
                  {config.AppName}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {config.AcademicYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {config.SchoolName} • GVCN: {config.TeacherInCharge}
              </p>
            </div>
          </div>

          {/* Right Actions & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Google Sheets Status Button */}
            <button
              onClick={onOpenSheetsModal}
              title="Xem Cơ sở dữ liệu Google Sheets & mã Google Apps Script"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Google Sheets DB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefreshData}
              title="Làm mới dữ liệu từ Google Sheets"
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div
                  onClick={onOpenLogin}
                  className="hidden lg:flex flex-col items-end text-right cursor-pointer hover:opacity-85 transition-opacity"
                  title="Bấm để đổi tài khoản hoặc phân vai"
                >
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    {currentUser.FullName}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                    {badge.label} {currentUser.Team ? `(${currentUser.Team})` : ''} {currentUser.Subject ? `(${currentUser.Subject})` : ''}
                  </span>
                </div>

                <button
                  onClick={onOpenLogin}
                  title="Chuyển đổi tài khoản (Admin, GV Tiếng Anh: Cô Phương, Khách...)"
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đổi TK</span>
                </button>

                <button
                  onClick={onLogout}
                  title="Đăng xuất khỏi tài khoản"
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
