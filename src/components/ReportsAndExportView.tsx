import React, { useState } from 'react';
import {
  StudentScoreSummary,
  TeamScoreSummary,
  DailyScore,
  AppConfig,
  User,
} from '../types';
import { exportWeeklyExcelReport } from '../utils/exportExcel';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  Printer,
  Sparkles,
  Users,
  Trophy,
} from 'lucide-react';
import { ClassRoleBadge } from './ClassRoleBadge';

interface ReportsAndExportViewProps {
  studentSummaries: StudentScoreSummary[];
  teamSummaries: TeamScoreSummary[];
  dailyScores: DailyScore[];
  config: AppConfig;
  currentUser: User | null;
}

export const ReportsAndExportView: React.FC<ReportsAndExportViewProps> = ({
  studentSummaries,
  teamSummaries,
  dailyScores,
  config,
  currentUser,
}) => {
  const [reportType, setReportType] = useState<'week' | 'month'>('week');
  const [weekNumber, setWeekNumber] = useState<number>(config.WeekCurrent || 24);
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-03');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const periodLabel =
        reportType === 'week' ? `Tuần ${weekNumber}` : `Tháng ${selectedMonth}`;

      exportWeeklyExcelReport({
        periodType: reportType,
        periodLabel,
        config,
        studentSummaries,
        teamSummaries,
        dailyScores,
      });

      setExportNotice(
        `Đã xuất thành công file Excel "So_Thi_Dua_Lop_4A3_${periodLabel.replace(/[\/\s]/g, '_')}.xlsx"!`
      );
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      alert('Lỗi xuất file Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {exportNotice && (
        <div className="fixed top-18 right-4 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-5 h-5 text-white" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center space-x-2">
            <span className="text-blue-600">📊</span>
            <span>Báo Cáo Thi Đua & Xuất Excel</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Tổng hợp thi đua phục vụ Tiết Sinh Hoạt Lớp Thứ Sáu hàng tuần và báo cáo Ban Giám Hiệu
          </p>
        </div>

        {/* Export and Print actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Đang xuất Excel...' : 'XUẤT BÁO CÁO EXCEL (.XLSX)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Select Period Options */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setReportType('week')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              reportType === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Báo Cáo Tuần (Sinh Hoạt Lớp)
          </button>
          <button
            onClick={() => setReportType('month')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              reportType === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Báo Cáo Tháng
          </button>
        </div>

        {reportType === 'week' ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Chọn Tuần Học:</span>
            <select
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none"
            >
              {[...Array(35)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tuần {i + 1}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Chọn Tháng:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* REPORT PREVIEW (IN THE EXACT FORMAT OF THE SỔ THI ĐUA) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Document Header */}
        <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
          <div className="text-xs uppercase tracking-widest font-black text-slate-500">
            {config.SchoolName.toUpperCase()}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            SỔ TỔNG KẾT THI ĐUA {config.ClassName.toUpperCase()}
          </h2>
          <div className="text-xs font-bold text-slate-600">
            Kỳ tổng kết: <span className="text-blue-700 underline">{reportType === 'week' ? `Tuần ${weekNumber}` : `Tháng ${selectedMonth}`}</span> | Năm học: {config.AcademicYear}
          </div>
          <div className="text-xs text-slate-500">
            Giáo viên chủ nhiệm: <strong>{config.TeacherInCharge}</strong> • Lớp trưởng: <strong>{config.ClassPresident || 'Thiều An'}</strong>
          </div>
        </div>

        {/* Section 1: Xếp Hạng 5 Tổ */}
        <div>
          <h3 className="text-sm font-black uppercase text-slate-700 mb-3 flex items-center space-x-2">
            <span className="text-base">🚩</span>
            <span>I. Tổng Hợp Thi Đua 5 Tổ</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border border-slate-200">
              <thead className="bg-blue-50 text-blue-950 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200">Xếp Hạng</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Tổ</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Tổ Trưởng</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">Sĩ Số</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">Điểm Cộng (+)</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">Điểm Trừ (-)</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center">Điểm Trung Bình</th>
                  <th className="py-2.5 px-3 text-center">Danh Hiệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamSummaries.map((t) => (
                  <tr key={t.team.TeamID} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border-r border-slate-200 font-black">
                      Hạng {t.rank}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-extrabold text-slate-800">
                      {t.team.TeamName}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                      {t.team.TeamLeaderName}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">
                      {t.memberCount} em
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center text-emerald-600 font-bold">
                      +{t.totalPlus}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center text-rose-600 font-bold">
                      -{t.totalMinus}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-black text-blue-700">
                      {t.averageScore}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-amber-800">
                      {t.rank === 1 ? '🏆 Xuất Sắc Nhất' : t.rank === 2 ? '🥈 Giải Nhì' : 'Đạt Yêu Cầu'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Toàn bộ danh sách học sinh */}
        <div>
          <h3 className="text-sm font-black uppercase text-slate-700 mb-3 flex items-center space-x-2">
            <span className="text-base">👨‍🎓</span>
            <span>II. Bảng Điểm Thi Đua Từng Học Sinh (35 Em)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5 border-r border-slate-200">STT</th>
                  <th className="py-2 px-3 border-r border-slate-200">Mã HS</th>
                  <th className="py-2 px-3 border-r border-slate-200">Họ và Tên</th>
                  <th className="py-2 px-3 border-r border-slate-200">Tổ</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 text-center">Khởi Tạo</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 text-center">Điểm (+)</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 text-center">Điểm (-)</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-center">Tổng Điểm</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 text-center">Hạng</th>
                  <th className="py-2 px-3">Nhận Xét Của GVCN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentSummaries.map((item, idx) => (
                  <tr key={item.student.StudentID} className="hover:bg-slate-50">
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-500">
                      {item.student.StudentCode}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                        <span className="font-extrabold text-slate-900">{item.student.FullName}</span>
                        <ClassRoleBadge role={item.student.ClassRole} size="xs" />
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                      {item.student.TeamName}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center text-slate-500">
                      {item.initialScore}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center text-emerald-600 font-bold">
                      +{item.totalPlus}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center text-rose-600 font-bold">
                      -{item.totalMinus}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-black text-blue-700">
                      {item.netScore}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center font-extrabold text-slate-700">
                      {item.rank}
                    </td>
                    <td className="py-2 px-3 text-xs italic text-slate-600">
                      {item.todayComment?.Comment || item.badges.join(', ') || 'Ngoan, chấp hành tốt nề nếp'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signatures for Official School Document */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
          <div>
            <div className="font-bold uppercase text-slate-500">ĐẠI DIỆN BAN CÁN SỰ LỚP</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Lớp Trưởng</div>
            <div className="h-16 flex items-end justify-center font-bold text-slate-800">
              {config.ClassPresident || 'Thiều An'}
            </div>
          </div>
          <div>
            <div className="font-bold uppercase text-slate-500">GIÁO VIÊN CHỦ NHIỆM</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Phê duyệt thi đua</div>
            <div className="h-16 flex items-end justify-center font-bold text-slate-800">
              {config.TeacherInCharge || 'Cô Phạm Ngọc Lê'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
