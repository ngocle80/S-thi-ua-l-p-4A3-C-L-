export type UserRole =
  | 'ADMIN_GVCN'
  | 'LOP_TRUONG'
  | 'PHO_TRAT_TU'
  | 'PHO_LAO_DONG'
  | 'TO_TRUONG'
  | 'GIAO_VIEN_BO_MON'
  | 'VIEWER';

export interface User {
  UserID: string;
  Username: string;
  PasswordHash: string;
  FullName: string;
  Role: UserRole;
  Team?: string; // e.g. "Tổ 1"
  Subject?: string; // e.g. "Tiếng Anh", "Tin học"
  Status: 'ACTIVE' | 'INACTIVE';
  CreatedAt: string;
  UpdatedAt: string;
  LastLogin?: string;
}

export interface Student {
  StudentID: string;
  StudentCode: string;
  FullName: string;
  Gender: 'Nam' | 'Nữ';
  DateOfBirth: string;
  TeamID: string;
  TeamName: string;
  ClassRole?: string; // Chức vụ Ban cán sự lớp: 'Lớp trưởng', 'Lớp phó học tập', 'Lớp phó trật tự', 'Lớp phó lao động', 'Tổ trưởng', 'Tổ phó'...
  Status: 'ACTIVE' | 'INACTIVE';
  AvatarURL: string;
  InitialScore: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Team {
  TeamID: string;
  TeamName: string;
  TeamLeaderID: string;
  TeamLeaderName: string;
  Status: 'ACTIVE' | 'INACTIVE';
  CreatedAt: string;
  UpdatedAt: string;
}

export type CriterionType = 'PLUS' | 'MINUS';

export type CriterionCategory =
  | 'Học tập'
  | 'Nề nếp & Đạo đức'
  | 'Vệ sinh & Lao động'
  | 'Phong trào & Hoạt động'
  | 'Môn chuyên biệt';

export interface Criterion {
  CriterionID: string;
  CriterionCode: string;
  CriterionName: string;
  Category: CriterionCategory;
  Type: CriterionType;
  Point: number;
  Description: string;
  ApplicableRole: string; // 'ALL' | specific roles comma separated
  Status: 'ACTIVE' | 'INACTIVE';
  CreatedAt: string;
  UpdatedAt: string;
}

export interface DailyScore {
  RecordID: string;
  Date: string; // YYYY-MM-DD
  StudentID: string;
  StudentName: string;
  TeamID: string;
  CriterionID: string;
  CriterionName: string;
  Point: number; // positive or negative
  Reason: string;
  RecordedBy: string; // User FullName & Role
  RecordedAt: string;
  Status: 'ACTIVE' | 'DELETED';
}

export interface DailyComment {
  CommentID: string;
  Date: string; // YYYY-MM-DD
  StudentID: string;
  StudentName: string;
  Comment: string;
  RecordedBy: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface WeeklySummary {
  SummaryID: string;
  WeekNumber: number;
  StartDate: string;
  EndDate: string;
  StudentID: string;
  StudentName: string;
  TeamID: string;
  TeamName: string;
  InitialScore: number;
  TotalPlus: number;
  TotalMinus: number;
  NetScore: number;
  Rank: number;
  Status: string;
  GeneratedAt: string;
}

export interface MonthlySummary {
  SummaryID: string;
  Month: string; // YYYY-MM
  StudentID: string;
  StudentName: string;
  TeamID: string;
  TeamName: string;
  TotalPlus: number;
  TotalMinus: number;
  NetScore: number;
  Rank: number;
  Status: string;
  GeneratedAt: string;
}

export interface Award {
  AwardID: string;
  Period: string; // e.g. "Tuần 24" or "Tháng 03/2025"
  AwardType: string;
  StudentID: string;
  StudentName: string;
  TeamID: string;
  Score: number;
  Reason: string;
  CreatedAt: string;
}

export interface AuditLog {
  LogID: string;
  Timestamp: string;
  UserID: string;
  Username: string;
  Action: string;
  Module: string;
  TargetID: string;
  Description: string;
  Result: 'SUCCESS' | 'FAILED';
  IPAddressOrSession: string;
  Device: string;
}

export interface AppConfig {
  AppName: string;
  SchoolName: string;
  ClassName: string;
  AcademicYear: string;
  TeacherInCharge: string;
  ClassPresident?: string;
  InitialScore: number;
  StartDate: string;
  WeekCurrent: number;
  LogoURL?: string;
  BackgroundImageURL?: string;
}

export interface StudentScoreSummary {
  student: Student;
  initialScore: number;
  totalPlus: number;
  totalMinus: number;
  netScore: number;
  rank: number;
  badges: string[];
  todayScores: DailyScore[];
  todayComment?: DailyComment;
}

export interface TeamScoreSummary {
  team: Team;
  memberCount: number;
  totalPlus: number;
  totalMinus: number;
  averageScore: number;
  totalScore: number;
  rank: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}
