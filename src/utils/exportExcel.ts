import * as XLSX from 'xlsx';
import { StudentScoreSummary, TeamScoreSummary, DailyScore, AppConfig } from '../types';

export interface ExportReportOptions {
  periodType: 'week' | 'month' | 'all';
  periodLabel: string; // e.g. "Tuần 24" or "Tháng 03/2025"
  config: AppConfig;
  studentSummaries: StudentScoreSummary[];
  teamSummaries: TeamScoreSummary[];
  dailyScores: DailyScore[];
}

export function exportWeeklyExcelReport(options: ExportReportOptions): void {
  const { periodLabel, config, studentSummaries, teamSummaries, dailyScores } = options;

  // 1. Tạo Workbook
  const wb = XLSX.utils.book_new();

  // 2. SHEET 1: BẢNG TỔNG HỢP CÁ NHÂN
  const studentRows = [
    [`BÁO CÁO THI ĐUA - ${config.ClassName.toUpperCase()}`],
    [`${config.SchoolName.toUpperCase()} - NĂM HỌC ${config.AcademicYear}`],
    [`Kỳ tổng hợp: ${periodLabel} | Giáo viên chủ nhiệm: ${config.TeacherInCharge}`],
    [`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
    [], // Dòng trống
    [
      'STT',
      'Mã Học Sinh',
      'Họ và Tên',
      'Giới Tính',
      'Tổ',
      'Điểm Khởi Tạo',
      'Tổng Điểm Cộng (+)',
      'Tổng Điểm Trừ (-)',
      'Điểm Thi Đua Cuối Kỳ',
      'Xếp Hạng',
      'Huy Hiệu / Khen Thưởng',
      'Nhận Xét Của GVCN & Cán Bộ Lớp',
    ],
  ];

  studentSummaries.forEach((item, index) => {
    studentRows.push([
      (index + 1).toString(),
      item.student.StudentCode,
      item.student.FullName,
      item.student.Gender,
      item.student.TeamName,
      item.initialScore.toString(),
      `+${item.totalPlus}`,
      `-${item.totalMinus}`,
      item.netScore.toString(),
      `Hạng ${item.rank}`,
      item.badges.join(', ') || 'Đang rèn luyện',
      item.todayComment?.Comment || '',
    ]);
  });

  const wsStudents = XLSX.utils.aoa_to_sheet(studentRows);

  // Set column widths for readability
  wsStudents['!cols'] = [
    { wch: 6 },  // STT
    { wch: 12 }, // Mã HS
    { wch: 24 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 16 }, // Tổ
    { wch: 14 }, // Điểm khởi tạo
    { wch: 18 }, // Điểm cộng
    { wch: 18 }, // Điểm trừ
    { wch: 20 }, // Điểm tổng kết
    { wch: 12 }, // Xếp hạng
    { wch: 30 }, // Huy hiệu
    { wch: 45 }, // Nhận xét
  ];

  XLSX.utils.book_append_sheet(wb, wsStudents, 'Thi Đua Cá Nhân');

  // 3. SHEET 2: BẢNG XẾP HẠNG TỔ
  const teamRows = [
    [`BẢNG XẾP HẠNG THI ĐUA TỔ - ${periodLabel.toUpperCase()}`],
    [`Lớp: ${config.ClassName} | Trường: ${config.SchoolName}`],
    [],
    [
      'Hạng',
      'Tên Tổ',
      'Tổ Trưởng',
      'Sĩ Số Học Sinh',
      'Tổng Điểm Cộng',
      'Tổng Điểm Trừ',
      'Điểm Trung Bình Tổ',
      'Tổng Điểm Toàn Tổ',
      'Đánh Giá / Khen Thưởng',
    ],
  ];

  teamSummaries.forEach((t) => {
    let award = 'Cần cố gắng hơn';
    if (t.rank === 1) award = '🏆 Giải Nhất Tuần';
    else if (t.rank === 2) award = '🥈 Giải Nhì Tuần';
    else if (t.rank === 3) award = '🥉 Giải Ba Tuần';
    else award = '🌟 Đạt yêu cầu';

    teamRows.push([
      `Hạng ${t.rank}`,
      t.team.TeamName,
      t.team.TeamLeaderName,
      t.memberCount.toString(),
      `+${t.totalPlus}`,
      `-${t.totalMinus}`,
      t.averageScore.toString(),
      t.totalScore.toString(),
      award,
    ]);
  });

  const wsTeams = XLSX.utils.aoa_to_sheet(teamRows);
  wsTeams['!cols'] = [
    { wch: 10 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTeams, 'Xếp Hạng Tổ');

  // 4. SHEET 3: NHẬT KÝ CHẤM ĐIỂM CHI TIẾT
  const logRows = [
    [`NHẬT KÝ GHI NHẬN ĐIỂM THI ĐUA - ${periodLabel.toUpperCase()}`],
    [],
    [
      'Mã Bản Ghi',
      'Ngày',
      'Học Sinh',
      'Tổ',
      'Tiêu Chí',
      'Điểm Ghi Nhận',
      'Lý Do / Chi Tiết Việc Tốt & Vi Phạm',
      'Người Chấm Điểm',
      'Thời Điểm Ghi',
    ],
  ];

  dailyScores.forEach((log) => {
    logRows.push([
      log.RecordID,
      log.Date,
      log.StudentName,
      log.TeamID,
      log.CriterionName,
      `${log.Point > 0 ? '+' : ''}${log.Point}`,
      log.Reason,
      log.RecordedBy,
      new Date(log.RecordedAt).toLocaleString('vi-VN'),
    ]);
  });

  const wsLogs = XLSX.utils.aoa_to_sheet(logRows);
  wsLogs['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 },
    { wch: 32 },
    { wch: 14 },
    { wch: 40 },
    { wch: 25 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Chi Tiết Điểm');

  // 5. Tạo và tải file .xlsx
  const safePeriod = periodLabel.replace(/[\/\s]/g, '_');
  const fileName = `So_Thi_Dua_Lop_4A3_${safePeriod}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
