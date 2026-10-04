import React, { useState } from 'react';
import {
  StudentScoreSummary,
  TeamScoreSummary,
  DailyScore,
  User,
  AppConfig,
} from '../types';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Flame,
  CheckCircle2,
  Trash2,
  Shield,
  Crown,
  Eye,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { ClassRoleBadge } from './ClassRoleBadge';

interface DashboardViewProps {
  studentSummaries: StudentScoreSummary[];
  teamSummaries: TeamScoreSummary[];
  recentScores: DailyScore[];
  currentUser: User | null;
  config: AppConfig;
  onGoToScoring: () => void;
  onGoToRankings: () => void;
  onGoToStudents?: () => void;
  onDeleteScore?: (recordId: string) => void;
  onUploadBackground?: (fileDataUrl: string) => Promise<any>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  studentSummaries,
  teamSummaries,
  recentScores,
  currentUser,
  config,
  onGoToScoring,
  onGoToRankings,
  onGoToStudents,
  onDeleteScore,
  onUploadBackground,
}) => {
  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';
  const isViewer = currentUser?.Role === 'VIEWER';
  const bgInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const handleBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadBackground) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh nhẹ hơn 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setUploadingBg(true);
      try {
        await onUploadBackground(reader.result as string);
      } finally {
        setUploadingBg(false);
      }
    };
    reader.readAsDataURL(file);
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  // Thống kê tổng quan
  const totalStudents = studentSummaries.length;
  const activeStudents = studentSummaries.filter((s) => s.student.Status === 'ACTIVE').length;

  const totalScoreSum = studentSummaries.reduce((acc, curr) => acc + curr.netScore, 0);
  const avgClassScore = totalStudents > 0 ? (totalScoreSum / totalStudents).toFixed(1) : '100';

  const totalPlusPoints = studentSummaries.reduce((acc, curr) => acc + curr.totalPlus, 0);
  const totalMinusPoints = studentSummaries.reduce((acc, curr) => acc + curr.totalMinus, 0);

  // Top 3 học sinh xuất sắc
  const top3 = studentSummaries.slice(0, 3);

  // Học sinh cần nhắc nhở / hỗ trợ (điểm thấp nhất hoặc có điểm trừ)
  const warningStudents = [...studentSummaries]
    .filter((s) => s.totalMinus > 0 || s.netScore < 98)
    .sort((a, b) => a.netScore - b.netScore)
    .slice(0, 4);

  // Top Tổ
  const topTeams = [...teamSummaries].sort((a, b) => b.averageScore - a.averageScore);

  // Danh sách Ban cán sự lớp 4A3 (Đồng bộ theo thời gian thực từ thông tin học sinh)
  const officerList = studentSummaries.filter(
    (s) => s.student.ClassRole && s.student.ClassRole !== 'Thành viên' && s.student.ClassRole !== 'Thành viên (Không giữ chức vụ)'
  );

  return (
    <div className="space-y-6 pb-16 lg:pb-6">
      {/* Hidden file input for background wallpaper upload */}
      <input
        ref={bgInputRef}
        type="file"
        accept="image/*"
        onChange={handleBgFileChange}
        className="hidden"
      />

      {/* Thông báo chế độ Khách (Chỉ xem) */}
      {isViewer && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs sm:text-sm font-semibold flex items-center space-x-3 shadow-2xs">
          <div className="p-1.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-amber-900">Chế độ Khách (Chỉ xem):</span> Bạn đang theo dõi dữ liệu Lớp 4A3 ở chế độ xem an toàn. Không thể chấm điểm hoặc chỉnh sửa ảnh và thông tin của lớp.
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 p-5 sm:p-7 text-white shadow-xl shadow-blue-700/15"
        style={
          config.BackgroundImageURL
            ? {
                backgroundImage: `linear-gradient(to right, rgba(29, 78, 216, 0.88), rgba(67, 56, 202, 0.84), rgba(2, 132, 199, 0.85)), url(${config.BackgroundImageURL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-200 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chủ đề tuần: &ldquo;Thi đua nghìn việc tốt – Tiến bước lên Đoàn&rdquo;</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bảng Vàng Thi Đua {config.ClassName}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Hệ thống theo dõi nề nếp, điểm cộng việc tốt và tổng kết thi đua {config.ClassName} – {config.SchoolName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && onUploadBackground && (
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                disabled={uploadingBg}
                title="Tải lên ảnh bìa / hình nền tùy chỉnh cho lớp học (Chỉ Admin)"
                className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold text-xs border border-white/30 backdrop-blur-md flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
              >
                {uploadingBg ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{uploadingBg ? 'Đang lưu...' : 'Đổi hình nền'}</span>
              </button>
            )}
            <button
              onClick={onGoToScoring}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold text-sm shadow-lg shadow-amber-400/30 flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
            >
              <Award className="w-4 h-4 text-blue-950" />
              <span>Chấm Thi Đua Ngay</span>
            </button>
            <button
              onClick={onGoToRankings}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 backdrop-blur-md flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Xem Xếp Hạng</span>
            </button>
            {onGoToStudents && (
              <button
                onClick={onGoToStudents}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 backdrop-blur-md flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 text-sky-200" />
                <span>{isAdmin ? 'Học Sinh (Đổi ảnh & Tên)' : 'Danh Sách Học Sinh'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Sĩ số */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3 sm:space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Sĩ Số Học Sinh</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800">
              {activeStudents} <span className="text-xs font-medium text-slate-400">/ {totalStudents} em</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% Đang tham gia</div>
          </div>
        </div>

        {/* Điểm TB Lớp */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3 sm:space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Điểm TB Lớp 4A3</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800">
              {avgClassScore} <span className="text-xs font-medium text-slate-400">điểm</span>
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Xuất sắc & Ổn định</div>
          </div>
        </div>

        {/* Điểm cộng */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center space-x-3 sm:space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng Điểm Cộng (+)</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600">
              +{totalPlusPoints} <span className="text-xs font-medium text-slate-400">điểm</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Việc tốt & Khen thưởng</div>
          </div>
        </div>

        {/* Điểm trừ */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center space-x-3 sm:space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tổng Điểm Trừ (-)</div>
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              -{totalMinusPoints} <span className="text-xs font-medium text-slate-400">điểm</span>
            </div>
            <div className="text-[11px] text-rose-700 font-semibold mt-0.5">Cần nhắc nhở rèn luyện</div>
          </div>
        </div>
      </div>

      {/* PODIUM TOP 3 HỌC SINH DẪN ĐẦU */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                Top 3 Thi Đua Dẫn Đầu Lớp 4A3
              </h2>
              <p className="text-xs text-slate-500">Các học sinh có điểm thi đua và việc tốt cao nhất</p>
            </div>
          </div>

          <button
            onClick={onGoToRankings}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Toàn bộ bảng xếp hạng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Podium visualization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {top3.map((item, idx) => {
            const medalColors = [
              { border: 'border-amber-400 bg-amber-50/60', text: 'text-amber-800', medal: '🥇 Hạng 1 (Thủ Khoa)', badge: 'bg-amber-500 text-white' },
              { border: 'border-slate-300 bg-slate-50/60', text: 'text-slate-800', medal: '🥈 Hạng 2 (Á Khoa 1)', badge: 'bg-slate-400 text-white' },
              { border: 'border-amber-600 bg-orange-50/60', text: 'text-orange-900', medal: '🥉 Hạng 3 (Á Khoa 2)', badge: 'bg-amber-700 text-white' },
            ][idx];

            return (
              <div
                key={item.student.StudentID}
                className={`relative rounded-2xl p-4 border-2 ${medalColors.border} flex flex-col items-center text-center shadow-xs transition-transform hover:-translate-y-1`}
              >
                {/* Rank Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-black mb-3 shadow-xs ${medalColors.badge}`}>
                  {medalColors.medal}
                </div>

                {/* Avatar with ring */}
                <div className="relative mb-3">
                  <img
                    src={item.student.AvatarURL}
                    alt={item.student.FullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
                    ✓
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center space-x-1.5 flex-wrap justify-center">
                    <h3 className="font-extrabold text-slate-800 text-base">{item.student.FullName}</h3>
                    <ClassRoleBadge role={item.student.ClassRole} size="xs" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-3 mt-0.5">{item.student.TeamName} • Mã {item.student.StudentCode}</p>
                </div>

                {/* Score Pills */}
                <div className="w-full bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-around mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng Điểm</span>
                    <span className="text-lg font-black text-blue-700">{item.netScore}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Điểm Cộng</span>
                    <span className="text-sm font-bold text-emerald-600">+{item.totalPlus}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Điểm Trừ</span>
                    <span className="text-sm font-bold text-rose-600">-{item.totalMinus}</span>
                  </div>
                </div>

                {/* Badges preview */}
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {item.badges.slice(0, 2).map((b, bIdx) => (
                    <span key={bIdx} className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200/60">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BAN CÁN SỰ LỚP 4A3 (Tự động đồng bộ từ Sửa thông tin học sinh) */}
      {officerList.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200/80 shadow-xs bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                    Ban Cán Sự & Phụ Trách Lớp 4A3
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    {officerList.length} Cán sự
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Được đồng bộ tự động từ mục Quản lý học sinh và lưu trữ vĩnh viễn trên máy chủ
                </p>
              </div>
            </div>
            {isAdmin && onGoToStudents && (
              <button
                onClick={onGoToStudents}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
              >
                <span>Chỉnh sửa chức vụ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {officerList.map((item) => (
              <div
                key={item.student.StudentID}
                className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3 hover:border-blue-400 hover:shadow-xs transition-all"
              >
                <img
                  src={item.student.AvatarURL}
                  alt={item.student.FullName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {item.student.FullName}
                    </h4>
                  </div>
                  <div className="mt-1">
                    <ClassRoleBadge role={item.student.ClassRole} size="xs" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-medium">
                    {item.student.TeamName} • <span className="text-blue-600 font-bold">{item.netScore} đ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TWO COLUMNS: TOP TỔ & HỌC SINH CẦN NHẮC NHỞ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* XẾP HẠNG 5 TỔ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center space-x-2">
              <span className="text-lg">🚩</span>
              <span>Bảng Điểm 5 Tổ Thi Đua</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Tính điểm trung bình tổ</span>
          </div>

          <div className="space-y-3">
            {topTeams.map((t, idx) => (
              <div key={t.team.TeamID} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-400 text-blue-950 font-black' :
                    idx === 1 ? 'bg-slate-300 text-slate-800' :
                    idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">{t.team.TeamName}</div>
                    <div className="text-xs text-slate-500">Tổ trưởng: {t.team.TeamLeaderName} • {t.memberCount} thành viên</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-blue-700">{t.averageScore} <span className="text-xs text-slate-400 font-normal">đ/HS</span></div>
                  <div className="text-[11px] text-emerald-600 font-medium">+{t.totalPlus} | -{t.totalMinus}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HỌC SINH CẦN NHẮC NHỞ / CỐ GẮNG HƠN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Học Sinh Cần Giáo Viên / Cán Bộ Nhắc Nhở</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Cố gắng tiến bộ</span>
          </div>

          <div className="space-y-2.5">
            {warningStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                🎉 Cả lớp 4A3 đều duy trì nề nếp rất tốt, không có bạn nào bị trừ điểm!
              </div>
            ) : (
              warningStudents.map((item) => (
                <div key={item.student.StudentID} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.student.AvatarURL}
                      alt={item.student.FullName}
                      className="w-10 h-10 rounded-full object-cover border border-rose-300"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{item.student.FullName}</div>
                      <div className="text-xs text-slate-500">{item.student.TeamName} • Mã {item.student.StudentCode}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-800">
                      Điểm: <span className={item.netScore < 98 ? 'text-rose-600' : 'text-blue-700'}>{item.netScore}</span>
                    </div>
                    <div className="text-xs font-semibold text-rose-600">
                      -{item.totalMinus} điểm trừ
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* NHẬT KÝ CHẤM ĐIỂM GẦN NHẤT TRONG NGÀY */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                Nhật Ký Thi Đua Mới Nhất
              </h3>
              <p className="text-xs text-slate-500">Bản ghi điểm cộng và điểm trừ gần nhất ghi vào Google Sheets</p>
            </div>
          </div>

          <button
            onClick={onGoToScoring}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Chấm thêm điểm</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentScores.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Chưa có lượt chấm điểm nào trong hôm nay.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentScores.slice(0, 6).map((rec) => (
              <div key={rec.RecordID} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      rec.Point > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {rec.Point > 0 ? `+${rec.Point}` : `${rec.Point}`}
                  </div>

                  <div>
                    <div className="font-bold text-sm text-slate-800">
                      {rec.StudentName} <span className="text-xs font-medium text-slate-400">({rec.TeamID})</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {rec.CriterionName} {rec.Reason ? `– "${rec.Reason}"` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div className="hidden sm:block text-[11px] text-slate-400">
                    <div>{rec.RecordedBy}</div>
                    <div>{rec.Date}</div>
                  </div>

                  {/* Nút hủy bản ghi nếu là GVCN (Admin) */}
                  {onDeleteScore && isAdmin && (
                    <button
                      onClick={() => onDeleteScore(rec.RecordID)}
                      title="Hủy bản ghi điểm này (Chỉ Admin)"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
