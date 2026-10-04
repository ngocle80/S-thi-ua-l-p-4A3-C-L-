import {
  AppConfig,
  User,
  Student,
  Team,
  Criterion,
  DailyScore,
  DailyComment,
  WeeklySummary,
  MonthlySummary,
  Award,
  AuditLog,
  StudentScoreSummary,
  TeamScoreSummary,
  ApiResponse,
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_TEAMS,
  INITIAL_CRITERIA,
  INITIAL_DAILY_SCORES,
  INITIAL_DAILY_COMMENTS,
  INITIAL_AUDIT_LOGS,
  DEFAULT_PASSWORD_HASH,
} from '../data/initialData';

const STORAGE_KEY = 'so_thi_dua_4a3_google_sheets_db_v1';
const GAS_URL_KEY = 'so_thi_dua_4a3_gas_endpoint_url';

export interface GoogleSheetsDatabase {
  CONFIG: AppConfig;
  USERS: User[];
  STUDENTS: Student[];
  TEAMS: Team[];
  CRITERIA: Criterion[];
  DAILY_SCORES: DailyScore[];
  DAILY_COMMENTS: DailyComment[];
  WEEKLY_SUMMARY: WeeklySummary[];
  MONTHLY_SUMMARY: MonthlySummary[];
  AWARDS: Award[];
  AUDIT_LOG: AuditLog[];
}

class GoogleSheetsEngine {
  private db: GoogleSheetsDatabase;
  private gasUrl: string = '';

  constructor() {
    this.gasUrl = localStorage.getItem(GAS_URL_KEY) || '';
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): GoogleSheetsDatabase {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.STUDENTS && parsed.USERS && parsed.CRITERIA) {
          // Sync updated teacher in charge, school name and academic year
          if (parsed.CONFIG) {
            parsed.CONFIG.SchoolName = 'Trường Tiểu học Thị Trấn Rạch Gòi A';
            parsed.CONFIG.TeacherInCharge = parsed.CONFIG.TeacherInCharge || 'Cô Phạm Ngọc Lê';
            parsed.CONFIG.ClassPresident = parsed.CONFIG.ClassPresident || 'Thiều An';
            parsed.CONFIG.AcademicYear = '2026 - 2027';
            parsed.CONFIG.InitialScore = 0;
          }
          if (Array.isArray(parsed.USERS)) {
            const gvcnUser = parsed.USERS.find((u: any) => u.Username === 'gvcn');
            if (gvcnUser && (!gvcnUser.FullName || gvcnUser.FullName === 'Phạm Ngọc Lê')) {
              gvcnUser.FullName = 'Cô Phạm Ngọc Lê';
            }
            // Ensure subject teachers exist
            const teacherDefaults = [
              { username: 'gv_amnhac', name: 'Cô Thảo', subject: 'Âm nhạc' },
              { username: 'gv_theduc', name: 'Thầy Thanh', subject: 'Thể dục' },
              { username: 'gv_tinhoc', name: 'Cô Diễm', subject: 'Tin học và công nghệ' },
              { username: 'gv_mithuat', name: 'Cô Huỳnh Anh', subject: 'Mĩ thuật' },
              { username: 'gv_tienganh', name: 'Cô Phương', subject: 'Tiếng Anh' },
            ];
            teacherDefaults.forEach(t => {
              const existing = parsed.USERS.find((u: any) => u.Username === t.username);
              if (!existing) {
                parsed.USERS.push({
                  UserID: 'USR_' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                  Username: t.username,
                  PasswordHash: DEFAULT_PASSWORD_HASH,
                  FullName: t.name,
                  Role: 'GIAO_VIEN_BO_MON',
                  Subject: t.subject,
                  Status: 'ACTIVE',
                  CreatedAt: '2026-09-01T08:00:00Z',
                  UpdatedAt: new Date().toISOString()
                });
              }
            });
          }
          // Sync official 35 students from PDF roster if not yet applied
          if (Array.isArray(parsed.STUDENTS)) {
            const first = parsed.STUDENTS[0];
            if (!first || first.FullName !== 'Nguyễn Mai Bình An') {
              parsed.STUDENTS = INITIAL_STUDENTS;
              parsed.TEAMS = INITIAL_TEAMS;
              parsed.USERS = INITIAL_USERS;
            } else {
              parsed.STUDENTS.forEach((st: any) => {
                if (st.InitialScore === 100 || st.InitialScore === undefined) {
                  st.InitialScore = 0;
                }
              });
            }
          }
          this.saveToStorage(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored Google Sheets database:', e);
    }

    // Default initialization
    const initialDb: GoogleSheetsDatabase = {
      CONFIG: { ...INITIAL_CONFIG },
      USERS: [...INITIAL_USERS],
      STUDENTS: [...INITIAL_STUDENTS],
      TEAMS: [...INITIAL_TEAMS],
      CRITERIA: [...INITIAL_CRITERIA],
      DAILY_SCORES: [...INITIAL_DAILY_SCORES],
      DAILY_COMMENTS: [...INITIAL_DAILY_COMMENTS],
      WEEKLY_SUMMARY: [],
      MONTHLY_SUMMARY: [],
      AWARDS: [],
      AUDIT_LOG: [...INITIAL_AUDIT_LOGS],
    };

    this.saveToStorage(initialDb);
    return initialDb;
  }

  private saveToStorage(database: GoogleSheetsDatabase = this.db): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public getGasUrl(): string {
    return this.gasUrl;
  }

  public setGasUrl(url: string): void {
    this.gasUrl = url.trim();
    if (this.gasUrl) {
      localStorage.setItem(GAS_URL_KEY, this.gasUrl);
    } else {
      localStorage.removeItem(GAS_URL_KEY);
    }
  }

  public resetDatabase(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.db = this.loadFromStorage();
    this.logAudit('USR_001', 'gvcn', 'RESET_DATABASE', 'SYSTEM', 'ALL', 'Khôi phục dữ liệu gốc Lớp 4A3', 'SUCCESS');
  }

  public syncFromDatabase(serverDb: GoogleSheetsDatabase): void {
    if (serverDb && serverDb.STUDENTS && serverDb.CONFIG) {
      this.db = serverDb;
      this.saveToStorage(serverDb);
    }
  }

  public getRawDatabase(): GoogleSheetsDatabase {
    return JSON.parse(JSON.stringify(this.db));
  }

  // Cập nhật phân công Ban cán sự (1 Lớp trưởng, 2 Lớp phó, 5 Tổ trưởng) và GV chuyên trách
  public updateOfficersAndTeachers(data: {
    loptruongName: string;
    phoTratTuName: string;
    phoLaoDongName: string;
    to1Leader: string;
    to2Leader: string;
    to3Leader: string;
    to4Leader: string;
    to5Leader: string;
    gvcnName: string;
    gvAmNhacName: string;
    gvTheDucName: string;
    gvTinHocName: string;
    gvMiThuatName: string;
    gvTiengAnhName: string;
  }): void {
    // 1. CONFIG
    if (this.db.CONFIG) {
      if (data.gvcnName) this.db.CONFIG.TeacherInCharge = data.gvcnName;
      if (data.loptruongName) this.db.CONFIG.ClassPresident = data.loptruongName;
    }

    // 2. USERS
    if (Array.isArray(this.db.USERS)) {
      const userUpdates: Record<string, string> = {
        gvcn: data.gvcnName,
        loptruong: data.loptruongName,
        photrattu: data.phoTratTuName,
        pholaodong: data.phoLaoDongName,
        totruong1: data.to1Leader,
        totruong2: data.to2Leader,
        totruong3: data.to3Leader,
        totruong4: data.to4Leader,
        totruong5: data.to5Leader,
        gv_amnhac: data.gvAmNhacName,
        gv_theduc: data.gvTheDucName,
        gv_tinhoc: data.gvTinHocName,
        gv_mithuat: data.gvMiThuatName,
        gv_tienganh: data.gvTiengAnhName,
        cophuong: data.gvTiengAnhName,
      };

      Object.entries(userUpdates).forEach(([uname, fullname]) => {
        if (!fullname) return;
        const u = this.db.USERS.find((x) => x.Username === uname);
        if (u) {
          u.FullName = fullname;
          u.UpdatedAt = new Date().toISOString();
        } else {
          const defaultRoles: Record<string, { role: any; subject?: string }> = {
            gvcn: { role: 'ADMIN_GVCN' },
            loptruong: { role: 'LOP_TRUONG' },
            photrattu: { role: 'PHO_TRAT_TU' },
            pholaodong: { role: 'PHO_LAO_DONG' },
            totruong1: { role: 'TO_TRUONG' },
            totruong2: { role: 'TO_TRUONG' },
            totruong3: { role: 'TO_TRUONG' },
            totruong4: { role: 'TO_TRUONG' },
            totruong5: { role: 'TO_TRUONG' },
            gv_amnhac: { role: 'GIAO_VIEN_BO_MON', subject: 'Âm nhạc' },
            gv_theduc: { role: 'GIAO_VIEN_BO_MON', subject: 'Thể dục' },
            gv_tinhoc: { role: 'GIAO_VIEN_BO_MON', subject: 'Tin học và công nghệ' },
            gv_mithuat: { role: 'GIAO_VIEN_BO_MON', subject: 'Mĩ thuật' },
            gv_tienganh: { role: 'GIAO_VIEN_BO_MON', subject: 'Tiếng Anh' },
          };
          const def = defaultRoles[uname];
          if (def) {
            this.db.USERS.push({
              UserID: 'USR_' + Math.random().toString(36).substring(2, 7).toUpperCase(),
              Username: uname,
              PasswordHash: DEFAULT_PASSWORD_HASH,
              FullName: fullname,
              Role: def.role,
              Subject: def.subject,
              Status: 'ACTIVE',
              CreatedAt: new Date().toISOString(),
              UpdatedAt: new Date().toISOString(),
            });
          }
        }
      });
    }

    // 3. TEAMS
    if (Array.isArray(this.db.TEAMS)) {
      const leaderMap: Record<string, string> = {
        TO_1: data.to1Leader,
        TO_2: data.to2Leader,
        TO_3: data.to3Leader,
        TO_4: data.to4Leader,
        TO_5: data.to5Leader,
      };
      this.db.TEAMS.forEach((tm) => {
        if (leaderMap[tm.TeamID]) {
          tm.TeamLeaderName = leaderMap[tm.TeamID];
          tm.UpdatedAt = new Date().toISOString();
        }
      });
    }

    // 4. STUDENTS: Update ClassRole
    if (Array.isArray(this.db.STUDENTS)) {
      this.db.STUDENTS.forEach((st) => {
        if (st.FullName === data.loptruongName) {
          st.ClassRole = 'Lớp trưởng';
        } else if (st.FullName === data.phoTratTuName) {
          st.ClassRole = 'Lớp phó trật tự';
        } else if (st.FullName === data.phoLaoDongName) {
          st.ClassRole = 'Lớp phó lao động';
        } else if (
          st.FullName === data.to1Leader ||
          st.FullName === data.to2Leader ||
          st.FullName === data.to3Leader ||
          st.FullName === data.to4Leader ||
          st.FullName === data.to5Leader
        ) {
          st.ClassRole = 'Tổ trưởng';
        } else if (
          st.ClassRole === 'Lớp trưởng' ||
          st.ClassRole === 'Lớp phó trật tự' ||
          st.ClassRole === 'Lớp phó lao động' ||
          st.ClassRole === 'Tổ trưởng'
        ) {
          st.ClassRole = 'Thành viên';
        }
      });
    }

    this.saveToStorage(this.db);
    this.logAudit(
      'USR_001',
      'gvcn',
      'UPDATE_PERSONNEL',
      'USERS',
      'ALL',
      'Cập nhật phân công Ban cán sự (1 Lớp trưởng, 2 Lớp phó, 5 Tổ trưởng) và GV chuyên trách',
      'SUCCESS'
    );
  }

  // Ghi nhật ký vào Sheet AUDIT_LOG
  public logAudit(
    userId: string,
    username: string,
    action: string,
    module: string,
    targetId: string,
    description: string,
    result: 'SUCCESS' | 'FAILED'
  ): void {
    const log: AuditLog = {
      LogID: 'LOG_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      Timestamp: new Date().toISOString(),
      UserID: userId || 'ANONYMOUS',
      Username: username || 'ANONYMOUS',
      Action: action,
      Module: module,
      TargetID: targetId,
      Description: description,
      Result: result,
      IPAddressOrSession: 'GAS_CLIENT_SESSION',
      Device: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 45) : 'Web App',
    };
    this.db.AUDIT_LOG.unshift(log);
    // Giữ tối đa 500 logs
    if (this.db.AUDIT_LOG.length > 500) {
      this.db.AUDIT_LOG = this.db.AUDIT_LOG.slice(0, 500);
    }
    this.saveToStorage();
  }

  // --- AUTHENTICATION ---
  public login(username: string, passwordHash: string): ApiResponse<{ token: string; user: User }> {
    const cleanUsername = username.trim().toLowerCase();
    let user = this.db.USERS.find(
      (u) => u.Username.toLowerCase() === cleanUsername
    );

    // Alias cho GV Tiếng Anh: Cô Phương
    if (!user && (cleanUsername === 'cophuong' || cleanUsername === 'tienganh' || cleanUsername === 'gvtienganh')) {
      user = this.db.USERS.find((u) => u.Username.toLowerCase() === 'gv_tienganh' || u.Username.toLowerCase() === 'cophuong');
    }

    if (!user) {
      this.logAudit('ANONYMOUS', username, 'LOGIN_FAILED', 'AUTH', '', 'Tên đăng nhập không tồn tại', 'FAILED');
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.', errorCode: 'INVALID_CREDENTIALS' };
    }

    if (user.Status !== 'ACTIVE') {
      this.logAudit(user.UserID, user.Username, 'LOGIN_BLOCKED', 'AUTH', user.UserID, 'Tài khoản đã bị vô hiệu hóa', 'FAILED');
      return { success: false, message: 'Tài khoản này đã bị khóa. Vui lòng liên hệ GVCN.', errorCode: 'ACCOUNT_INACTIVE' };
    }

    if (user.PasswordHash !== passwordHash && user.PasswordHash !== passwordHash.trim()) {
      this.logAudit(user.UserID, user.Username, 'LOGIN_FAILED', 'AUTH', user.UserID, 'Sai mật khẩu', 'FAILED');
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.', errorCode: 'INVALID_CREDENTIALS' };
    }

    user.LastLogin = new Date().toISOString();
    this.saveToStorage();

    const token = 'GAS_TOKEN_' + user.UserID + '_' + Date.now();
    this.logAudit(user.UserID, user.Username, 'LOGIN_SUCCESS', 'AUTH', user.UserID, `Đăng nhập thành công với vai trò ${user.Role}`, 'SUCCESS');

    // Remove password hash from returned user object for security
    const safeUser = { ...user };
    delete (safeUser as any).PasswordHash;

    return {
      success: true,
      message: `Đăng nhập thành công! Chào mừng ${user.FullName}`,
      data: { token, user: safeUser },
    };
  }

  // Người dùng tự đổi mật khẩu
  public changePassword(user: User, currentPasswordHash: string, newPasswordHash: string): ApiResponse<void> {
    const target = this.db.USERS.find((u) => u.UserID === user.UserID);
    if (!target) {
      return { success: false, message: 'Tài khoản không tồn tại.', errorCode: 'USER_NOT_FOUND' };
    }
    if (target.PasswordHash !== currentPasswordHash && target.PasswordHash !== currentPasswordHash.trim()) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác.', errorCode: 'INVALID_CURRENT_PASSWORD' };
    }

    target.PasswordHash = newPasswordHash;
    target.UpdatedAt = new Date().toISOString();

    // Đồng bộ alias nếu là Cô Phương
    if (target.Username === 'gv_tienganh') {
      const alias = this.db.USERS.find((u) => u.Username === 'cophuong');
      if (alias) alias.PasswordHash = newPasswordHash;
    } else if (target.Username === 'cophuong') {
      const mainU = this.db.USERS.find((u) => u.Username === 'gv_tienganh');
      if (mainU) mainU.PasswordHash = newPasswordHash;
    }

    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'CHANGE_PASSWORD', 'USERS', user.UserID, 'Tự đổi mật khẩu tài khoản thành công', 'SUCCESS');
    return { success: true, message: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.' };
  }

  // Chỉ GVCN (Admin) mới có quyền cấp lại mật khẩu cho các thành viên
  public resetUserPassword(adminUser: User, targetUserId: string, newPasswordHash: string): ApiResponse<void> {
    if (adminUser.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền cấp lại mật khẩu cho các thành viên!', errorCode: 'PERMISSION_DENIED' };
    }
    const target = this.db.USERS.find((u) => u.UserID === targetUserId);
    if (!target) {
      return { success: false, message: 'Không tìm thấy tài khoản cần cấp lại mật khẩu.', errorCode: 'USER_NOT_FOUND' };
    }

    target.PasswordHash = newPasswordHash;
    target.UpdatedAt = new Date().toISOString();

    // Đồng bộ alias nếu là Cô Phương
    if (target.Username === 'gv_tienganh') {
      const alias = this.db.USERS.find((u) => u.Username === 'cophuong');
      if (alias) alias.PasswordHash = newPasswordHash;
    } else if (target.Username === 'cophuong') {
      const mainU = this.db.USERS.find((u) => u.Username === 'gv_tienganh');
      if (mainU) mainU.PasswordHash = newPasswordHash;
    }

    this.saveToStorage();
    this.logAudit(adminUser.UserID, adminUser.Username, 'RESET_USER_PASSWORD', 'USERS', target.UserID, `Cấp lại mật khẩu cho tài khoản ${target.Username} (${target.FullName})`, 'SUCCESS');
    return { success: true, message: `Đã cấp lại mật khẩu thành công cho tài khoản ${target.FullName} (${target.Username})!` };
  }

  // --- CONFIG ---
  public getConfig(): AppConfig {
    return { ...this.db.CONFIG };
  }

  public updateConfig(user: User, config: Partial<AppConfig>): ApiResponse<AppConfig> {
    if (user.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm mới có quyền thay đổi cấu hình.', errorCode: 'PERMISSION_DENIED' };
    }
    this.db.CONFIG = { ...this.db.CONFIG, ...config };
    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'UPDATE_CONFIG', 'CONFIG', 'CONFIG', 'Cập nhật cấu hình hệ thống', 'SUCCESS');
    return { success: true, message: 'Cập nhật cấu hình thành công.', data: this.db.CONFIG };
  }

  public updateLogo(user: User | null, logoUrl: string): ApiResponse<string> {
    if (user?.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi logo!', errorCode: 'PERMISSION_DENIED' };
    }
    this.db.CONFIG.LogoURL = logoUrl;
    this.saveToStorage();
    this.logAudit(
      user?.UserID || 'USR_001',
      user?.Username || 'gvcn',
      'UPDATE_LOGO',
      'CONFIG',
      'LOGO',
      logoUrl ? 'Thay đổi biểu tượng logo lớp mới' : 'Khôi phục logo mặc định',
      'SUCCESS'
    );
    return { success: true, message: 'Cập nhật logo lớp thành công!', data: logoUrl };
  }

  public updateBackground(user: User | null, backgroundUrl: string): ApiResponse<string> {
    if (user?.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi hình nền lớp!', errorCode: 'PERMISSION_DENIED' };
    }
    this.db.CONFIG.BackgroundImageURL = backgroundUrl;
    this.saveToStorage();
    this.logAudit(
      user?.UserID || 'USR_001',
      user?.Username || 'gvcn',
      'UPDATE_BACKGROUND',
      'CONFIG',
      'BACKGROUND',
      backgroundUrl ? 'Thay đổi hình nền lớp học mới' : 'Khôi phục hình nền mặc định',
      'SUCCESS'
    );
    return { success: true, message: 'Cập nhật hình nền lớp thành công!', data: backgroundUrl };
  }

  // --- TEAMS ---
  public getTeams(): Team[] {
    return this.db.TEAMS.filter((t) => t.Status === 'ACTIVE');
  }

  // --- STUDENTS ---
  public getStudents(): Student[] {
    return this.db.STUDENTS;
  }

  public addStudent(user: User, studentData: Omit<Student, 'StudentID' | 'CreatedAt' | 'UpdatedAt'>): ApiResponse<Student> {
    if (user.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm mới có quyền thêm học sinh.', errorCode: 'PERMISSION_DENIED' };
    }

    if (!studentData.FullName || !studentData.TeamID) {
      return { success: false, message: 'Vui lòng nhập họ tên và phân tổ cho học sinh.', errorCode: 'VALIDATION_ERROR' };
    }

    const team = this.db.TEAMS.find((t) => t.TeamID === studentData.TeamID);
    const count = this.db.STUDENTS.length + 1;
    const newStudent: Student = {
      ...studentData,
      StudentID: 'HS_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      StudentCode: studentData.StudentCode || `4A3-${count < 10 ? '0' + count : count}`,
      TeamName: team ? team.TeamName : studentData.TeamID,
      Status: 'ACTIVE',
      InitialScore: typeof studentData.InitialScore === 'number' ? studentData.InitialScore : 0,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    this.db.STUDENTS.push(newStudent);
    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'ADD_STUDENT', 'STUDENTS', newStudent.StudentID, `Thêm học sinh ${newStudent.FullName} vào ${newStudent.TeamName}`, 'SUCCESS');

    return { success: true, message: `Thêm học sinh ${newStudent.FullName} thành công.`, data: newStudent };
  }

  public updateStudent(user: User | null, studentData: Partial<Student> & { StudentID: string }): ApiResponse<Student> {
    if (user?.Role === 'VIEWER') {
      return { success: false, message: 'Tài khoản Khách chỉ có quyền xem, không được chỉnh sửa học sinh.', errorCode: 'PERMISSION_DENIED' };
    }

    const index = this.db.STUDENTS.findIndex((s) => s.StudentID === studentData.StudentID);
    if (index === -1) {
      return { success: false, message: 'Không tìm thấy học sinh cần cập nhật.', errorCode: 'NOT_FOUND' };
    }

    const current = this.db.STUDENTS[index];

    // Chỉ Admin/GVCN mới được thay đổi Avatar học sinh
    if (studentData.AvatarURL && studentData.AvatarURL !== current.AvatarURL) {
      if (user?.Role !== 'ADMIN_GVCN') {
        return {
          success: false,
          message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi ảnh đại diện học sinh!',
          errorCode: 'PERMISSION_DENIED',
        };
      }
    }
    let teamName = current.TeamName;
    if (studentData.TeamID && studentData.TeamID !== current.TeamID) {
      const team = this.db.TEAMS.find((t) => t.TeamID === studentData.TeamID);
      if (team) teamName = team.TeamName;
    }

    const updated: Student = {
      ...current,
      ...studentData,
      TeamName: teamName,
      UpdatedAt: new Date().toISOString(),
    };

    if (studentData.FullName && studentData.FullName !== current.FullName) {
      this.db.DAILY_SCORES.forEach((s) => {
        if (s.StudentID === updated.StudentID) s.StudentName = updated.FullName;
      });
      this.db.DAILY_COMMENTS.forEach((c) => {
        if (c.StudentID === updated.StudentID) c.StudentName = updated.FullName;
      });
    }

    this.db.STUDENTS[index] = updated;

    // Tự động đồng bộ vai trò vào CONFIG, USERS và TEAMS
    const newRole = updated.ClassRole;
    if (newRole && newRole !== 'Thành viên' && newRole !== 'Thành viên (Không giữ chức vụ)') {
      if (newRole.includes('Lớp trưởng')) {
        if (this.db.CONFIG) this.db.CONFIG.ClassPresident = updated.FullName;
        const u = this.db.USERS.find((x) => x.Username === 'loptruong');
        if (u) u.FullName = updated.FullName;
      } else if (newRole.includes('Lớp phó trật tự')) {
        const u = this.db.USERS.find((x) => x.Username === 'photrattu');
        if (u) u.FullName = updated.FullName;
      } else if (newRole.includes('Lớp phó lao động')) {
        const u = this.db.USERS.find((x) => x.Username === 'pholaodong');
        if (u) u.FullName = updated.FullName;
      } else if (newRole.includes('Tổ trưởng')) {
        const teamNum = (updated.TeamID || '').replace(/\D/g, '') || '1';
        const team = this.db.TEAMS.find((t) => t.TeamID === updated.TeamID);
        if (team) team.TeamLeaderName = updated.FullName;
        const u = this.db.USERS.find((x) => x.Username === 'totruong' + teamNum);
        if (u) u.FullName = updated.FullName;
      }
    }

    this.saveToStorage();
    this.logAudit(
      user?.UserID || 'USR_001',
      user?.Username || 'gvcn',
      'UPDATE_STUDENT',
      'STUDENTS',
      updated.StudentID,
      `Cập nhật thông tin học sinh ${updated.FullName}`,
      'SUCCESS'
    );

    const roleNotice = updated.ClassRole && updated.ClassRole !== 'Thành viên' ? ` (${updated.ClassRole})` : '';
    return {
      success: true,
      message: `Đã cập nhật ${updated.FullName}${roleNotice} và đồng bộ vĩnh viễn trên toàn hệ thống!`,
      data: updated,
    };
  }

  // Soft Delete: Chuyển Status = INACTIVE (bảo toàn lịch sử thi đua)
  public deleteStudent(user: User, studentId: string): ApiResponse<void> {
    if (user.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm mới có quyền ngừng theo dõi học sinh.', errorCode: 'PERMISSION_DENIED' };
    }

    const student = this.db.STUDENTS.find((s) => s.StudentID === studentId);
    if (!student) {
      return { success: false, message: 'Không tìm thấy học sinh.', errorCode: 'NOT_FOUND' };
    }

    student.Status = 'INACTIVE';
    student.UpdatedAt = new Date().toISOString();
    this.saveToStorage();

    this.logAudit(user.UserID, user.Username, 'DEACTIVATE_STUDENT', 'STUDENTS', studentId, `Vô hiệu hóa (Soft Delete) học sinh ${student.FullName}`, 'SUCCESS');
    return { success: true, message: `Đã chuyển học sinh ${student.FullName} sang trạng thái ngừng hoạt động.` };
  }

  // Đặt lại điểm gốc của tất cả học sinh về 0 điểm
  public resetAllStudentsScoresToZero(clearHistory: boolean = false): ApiResponse<{ updatedCount: number }> {
    let count = 0;
    this.db.STUDENTS.forEach((s) => {
      s.InitialScore = 0;
      s.UpdatedAt = new Date().toISOString();
      count++;
    });

    if (clearHistory) {
      this.db.DAILY_SCORES = [];
      this.db.DAILY_COMMENTS = [];
    }

    if (this.db.CONFIG) {
      this.db.CONFIG.InitialScore = 0;
    }

    this.saveToStorage();
    this.logAudit(
      'USR_001',
      'gvcn',
      'RESET_SCORES',
      'STUDENTS',
      'ALL',
      `Đặt lại điểm gốc của toàn bộ ${count} học sinh về 0 điểm${clearHistory ? ' (đã xóa lịch sử chấm)' : ''}`,
      'SUCCESS'
    );

    return {
      success: true,
      message: `Đã cập nhật toàn bộ ${count} học sinh về điểm gốc 0 điểm thành công!`,
      data: { updatedCount: count },
    };
  }

  // --- CRITERIA ---
  public getCriteria(): Criterion[] {
    return this.db.CRITERIA;
  }

  public addCriteria(user: User, critData: Omit<Criterion, 'CriterionID' | 'CreatedAt' | 'UpdatedAt'>): ApiResponse<Criterion> {
    if (user.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm mới có quyền thêm tiêu chí.', errorCode: 'PERMISSION_DENIED' };
    }

    if (!critData.CriterionName || critData.Point === undefined) {
      return { success: false, message: 'Vui lòng nhập tên tiêu chí và số điểm quy định.', errorCode: 'VALIDATION_ERROR' };
    }

    const count = this.db.CRITERIA.length + 1;
    const newCrit: Criterion = {
      ...critData,
      CriterionID: 'CRIT_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      CriterionCode: critData.CriterionCode || `TC_${count < 10 ? '0' + count : count}`,
      Status: 'ACTIVE',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    this.db.CRITERIA.push(newCrit);
    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'ADD_CRITERIA', 'CRITERIA', newCrit.CriterionID, `Thêm tiêu chí: ${newCrit.CriterionName} (${newCrit.Point > 0 ? '+' : ''}${newCrit.Point}đ)`, 'SUCCESS');

    return { success: true, message: `Thêm tiêu chí thi đua thành công.`, data: newCrit };
  }

  public updateCriteria(user: User, critData: Partial<Criterion> & { CriterionID: string }): ApiResponse<Criterion> {
    if (user.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm mới có quyền cập nhật tiêu chí.', errorCode: 'PERMISSION_DENIED' };
    }

    const index = this.db.CRITERIA.findIndex((c) => c.CriterionID === critData.CriterionID);
    if (index === -1) {
      return { success: false, message: 'Không tìm thấy tiêu chí cần sửa.', errorCode: 'NOT_FOUND' };
    }

    const updated = {
      ...this.db.CRITERIA[index],
      ...critData,
      UpdatedAt: new Date().toISOString(),
    };

    this.db.CRITERIA[index] = updated;
    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'UPDATE_CRITERIA', 'CRITERIA', updated.CriterionID, `Cập nhật tiêu chí: ${updated.CriterionName}`, 'SUCCESS');

    return { success: true, message: 'Cập nhật tiêu chí thành công.', data: updated };
  }

  public deleteCriteria(user: User, criterionId: string): ApiResponse<void> {
    if (user.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm mới có quyền vô hiệu hóa tiêu chí.', errorCode: 'PERMISSION_DENIED' };
    }

    const crit = this.db.CRITERIA.find((c) => c.CriterionID === criterionId);
    if (!crit) {
      return { success: false, message: 'Không tìm thấy tiêu chí.', errorCode: 'NOT_FOUND' };
    }

    crit.Status = 'INACTIVE';
    crit.UpdatedAt = new Date().toISOString();
    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'DEACTIVATE_CRITERIA', 'CRITERIA', criterionId, `Ngừng áp dụng tiêu chí: ${crit.CriterionName}`, 'SUCCESS');

    return { success: true, message: `Đã ngừng áp dụng tiêu chí ${crit.CriterionName}.` };
  }

  // --- SCORING (CHẤM ĐIỂM THI ĐUA) ---
  public addScore(
    user: User,
    data: {
      studentId: string;
      criterionId: string;
      date?: string;
      customReason?: string;
    }
  ): ApiResponse<DailyScore> {
    // 1. Kiểm tra quyền
    if (user.Role === 'VIEWER') {
      return { success: false, message: 'Tài khoản người xem không có quyền ghi nhận điểm thi đua.', errorCode: 'PERMISSION_DENIED' };
    }

    const student = this.db.STUDENTS.find((s) => s.StudentID === data.studentId);
    if (!student || student.Status !== 'ACTIVE') {
      return { success: false, message: 'Học sinh không tồn tại hoặc đã ngừng hoạt động.', errorCode: 'STUDENT_NOT_FOUND' };
    }

    // Tổ trưởng chỉ chấm học sinh thuộc tổ của mình
    if (user.Role === 'TO_TRUONG' && user.Team && user.Team !== student.TeamID) {
      return {
        success: false,
        message: `Bạn là Tổ trưởng của ${user.Team}, chỉ có quyền chấm điểm cho các bạn trong tổ của mình.`,
        errorCode: 'TEAM_RESTRICTED',
      };
    }

    const criterion = this.db.CRITERIA.find((c) => c.CriterionID === data.criterionId);
    if (!criterion || criterion.Status !== 'ACTIVE') {
      return { success: false, message: 'Tiêu chí thi đua không tồn tại hoặc đã ngừng áp dụng.', errorCode: 'CRITERION_NOT_FOUND' };
    }

    const recordDate = data.date || new Date().toISOString().substring(0, 10);
    const scoreVal = criterion.Point;

    const newRecord: DailyScore = {
      RecordID: 'REC_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      Date: recordDate,
      StudentID: student.StudentID,
      StudentName: student.FullName,
      TeamID: student.TeamID,
      CriterionID: criterion.CriterionID,
      CriterionName: criterion.CriterionName,
      Point: scoreVal,
      Reason: data.customReason ? data.customReason.trim() : criterion.Description,
      RecordedBy: `${user.FullName} (${user.Role})`,
      RecordedAt: new Date().toISOString(),
      Status: 'ACTIVE',
    };

    this.db.DAILY_SCORES.unshift(newRecord);
    this.saveToStorage();

    const sign = scoreVal > 0 ? '+' : '';
    this.logAudit(
      user.UserID,
      user.Username,
      scoreVal > 0 ? 'ADD_PLUS_SCORE' : 'ADD_MINUS_SCORE',
      'DAILY_SCORES',
      newRecord.RecordID,
      `${sign}${scoreVal}đ cho ${student.FullName} (${criterion.CriterionName})`,
      'SUCCESS'
    );

    return {
      success: true,
      message: `Đã ${scoreVal > 0 ? 'cộng' : 'trừ'} ${Math.abs(scoreVal)} điểm cho em ${student.FullName}!`,
      data: newRecord,
    };
  }

  public deleteScore(user: User, recordId: string): ApiResponse<void> {
    if (user.Role !== 'ADMIN_GVCN' && user.Role !== 'LOP_TRUONG') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm hoặc Lớp trưởng mới có quyền hủy bản ghi điểm.', errorCode: 'PERMISSION_DENIED' };
    }

    const record = this.db.DAILY_SCORES.find((r) => r.RecordID === recordId);
    if (!record || record.Status === 'DELETED') {
      return { success: false, message: 'Không tìm thấy bản ghi cần hủy.', errorCode: 'NOT_FOUND' };
    }

    record.Status = 'DELETED';
    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'DELETE_SCORE', 'DAILY_SCORES', recordId, `Hủy bản ghi điểm ${record.Point}đ của ${record.StudentName}`, 'SUCCESS');

    return { success: true, message: `Đã hủy bản ghi điểm của học sinh ${record.StudentName}.` };
  }

  public getDailyScores(date?: string): DailyScore[] {
    return this.db.DAILY_SCORES.filter((s) => {
      if (s.Status === 'DELETED') return false;
      if (date && s.Date !== date) return false;
      return true;
    });
  }

  // --- COMMENTS (NHẬN XÉT HẰNG NGÀY) ---
  public saveComment(
    user: User,
    data: {
      studentId: string;
      comment: string;
      date?: string;
    }
  ): ApiResponse<DailyComment> {
    if (user.Role === 'VIEWER') {
      return { success: false, message: 'Tài khoản người xem không có quyền nhập nhận xét.', errorCode: 'PERMISSION_DENIED' };
    }

    const student = this.db.STUDENTS.find((s) => s.StudentID === data.studentId);
    if (!student) {
      return { success: false, message: 'Học sinh không tồn tại.', errorCode: 'NOT_FOUND' };
    }

    if (!data.comment || !data.comment.trim()) {
      return { success: false, message: 'Nội dung nhận xét không được để trống.', errorCode: 'VALIDATION_ERROR' };
    }

    const recordDate = data.date || new Date().toISOString().substring(0, 10);
    const existing = this.db.DAILY_COMMENTS.find(
      (c) => c.Date === recordDate && c.StudentID === data.studentId
    );

    if (existing) {
      existing.Comment = data.comment.trim();
      existing.RecordedBy = `${user.FullName} (${user.Role})`;
      existing.UpdatedAt = new Date().toISOString();
      this.saveToStorage();
      this.logAudit(user.UserID, user.Username, 'UPDATE_COMMENT', 'DAILY_COMMENTS', existing.CommentID, `Cập nhật nhận xét cho ${student.FullName}`, 'SUCCESS');
      return { success: true, message: `Đã cập nhật nhận xét cho em ${student.FullName}.`, data: existing };
    }

    const newComment: DailyComment = {
      CommentID: 'CMT_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      Date: recordDate,
      StudentID: student.StudentID,
      StudentName: student.FullName,
      Comment: data.comment.trim(),
      RecordedBy: `${user.FullName} (${user.Role})`,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    this.db.DAILY_COMMENTS.unshift(newComment);
    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'ADD_COMMENT', 'DAILY_COMMENTS', newComment.CommentID, `Thêm nhận xét cho ${student.FullName}`, 'SUCCESS');

    return { success: true, message: `Đã lưu nhận xét cho em ${student.FullName}.`, data: newComment };
  }

  public deleteComment(user: User, commentId: string): ApiResponse<void> {
    if (user.Role !== 'ADMIN_GVCN' && user.Role !== 'LOP_TRUONG') {
      return { success: false, message: 'Chỉ GVCN hoặc Lớp trưởng mới có quyền xóa nhận xét.', errorCode: 'PERMISSION_DENIED' };
    }

    const index = this.db.DAILY_COMMENTS.findIndex((c) => c.CommentID === commentId);
    if (index === -1) {
      return { success: false, message: 'Không tìm thấy nhận xét.', errorCode: 'NOT_FOUND' };
    }

    const deleted = this.db.DAILY_COMMENTS.splice(index, 1)[0];
    this.saveToStorage();
    this.logAudit(user.UserID, user.Username, 'DELETE_COMMENT', 'DAILY_COMMENTS', commentId, `Xóa nhận xét của ${deleted.StudentName}`, 'SUCCESS');

    return { success: true, message: 'Đã xóa nhận xét thành công.' };
  }

  public getDailyComments(date?: string): DailyComment[] {
    return this.db.DAILY_COMMENTS.filter((c) => (!date ? true : c.Date === date));
  }

  // --- SCORE COMPUTATION & RANKING ENGINE ---
  public calculateStudentSummaries(period: 'all' | 'today' | 'week' | 'month' = 'all', targetDate?: string): StudentScoreSummary[] {
    const activeStudents = this.db.STUDENTS.filter((s) => s.Status === 'ACTIVE');
    const validScores = this.db.DAILY_SCORES.filter((s) => s.Status === 'ACTIVE');

    const todayStr = targetDate || new Date().toISOString().substring(0, 10);

    const summaries: StudentScoreSummary[] = activeStudents.map((st) => {
      const studentScores = validScores.filter((sc) => {
        if (sc.StudentID !== st.StudentID) return false;
        if (period === 'today') return sc.Date === todayStr;
        // Week filter (giả định 7 ngày gần nhất hoặc tuần hiện tại)
        if (period === 'week') {
          const recDate = new Date(sc.Date).getTime();
          const curr = new Date(todayStr).getTime();
          const diffDays = Math.abs(curr - recDate) / (1000 * 3600 * 24);
          return diffDays <= 7;
        }
        if (period === 'month') {
          return sc.Date.substring(0, 7) === todayStr.substring(0, 7);
        }
        return true;
      });

      let plus = 0;
      let minus = 0;
      studentScores.forEach((item) => {
        if (item.Point > 0) plus += item.Point;
        else minus += Math.abs(item.Point);
      });

      const baseInitialScore = typeof st.InitialScore === 'number' ? st.InitialScore : 0;
      const initialScore = period === 'today' ? 0 : baseInitialScore;
      const netScore = initialScore + plus - minus;

      // Badges
      const badges: string[] = [];
      if (plus >= 10) badges.push('🌟 Ngôi sao việc tốt');
      if (plus >= 5 && minus === 0) badges.push('🛡️ Nề nếp gương mẫu');
      if (studentScores.some((s) => s.CriterionID === 'CRIT_03')) badges.push('🤝 Người bạn tốt');
      if (studentScores.some((s) => s.CriterionID === 'CRIT_04')) badges.push('🧹 Siêu trực nhật');
      if (studentScores.some((s) => s.CriterionID === 'CRIT_06')) badges.push('💎 Tấm gương trung thực');
      if (studentScores.some((s) => s.CriterionID === 'CRIT_01')) badges.push('🙋 Hăng hái phát biểu');

      const todayScores = validScores.filter((sc) => sc.StudentID === st.StudentID && sc.Date === todayStr);
      const todayComment = this.db.DAILY_COMMENTS.find((c) => c.StudentID === st.StudentID && c.Date === todayStr);

      return {
        student: st,
        initialScore: baseInitialScore,
        totalPlus: plus,
        totalMinus: minus,
        netScore: netScore,
        rank: 0,
        badges,
        todayScores,
        todayComment,
      };
    });

    // Sort descending by netScore, then totalPlus
    summaries.sort((a, b) => {
      if (b.netScore !== a.netScore) return b.netScore - a.netScore;
      return b.totalPlus - a.totalPlus;
    });

    // Assign ranking
    summaries.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return summaries;
  }

  public calculateTeamSummaries(period: 'all' | 'today' | 'week' | 'month' = 'all', targetDate?: string): TeamScoreSummary[] {
    const studentSummaries = this.calculateStudentSummaries(period, targetDate);
    const teams = this.getTeams();

    const teamSummaries: TeamScoreSummary[] = teams.map((team) => {
      const members = studentSummaries.filter((s) => s.student.TeamID === team.TeamID);
      const memberCount = members.length;
      let totalPlus = 0;
      let totalMinus = 0;
      let totalScore = 0;

      members.forEach((m) => {
        totalPlus += m.totalPlus;
        totalMinus += m.totalMinus;
        totalScore += m.netScore;
      });

      const avgScore = memberCount > 0 ? parseFloat((totalScore / memberCount).toFixed(1)) : 0;

      return {
        team,
        memberCount,
        totalPlus,
        totalMinus,
        averageScore: avgScore,
        totalScore,
        rank: 0,
      };
    });

    teamSummaries.sort((a, b) => b.averageScore - a.averageScore);
    teamSummaries.forEach((t, i) => {
      t.rank = i + 1;
    });

    return teamSummaries;
  }

  // --- USERS MANAGEMENT ---
  public getUsers(currentUser: User): ApiResponse<User[]> {
    if (currentUser.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm mới có quyền quản lý tài khoản.', errorCode: 'PERMISSION_DENIED' };
    }
    const safeUsers = this.db.USERS.map((u) => {
      const copy = { ...u };
      delete (copy as any).PasswordHash;
      return copy;
    });
    return { success: true, data: safeUsers };
  }

  public addUser(
    currentUser: User,
    userData: {
      Username: string;
      FullName: string;
      Role: User['Role'];
      Team?: string;
      Subject?: string;
      Password?: string;
    }
  ): ApiResponse<User> {
    if (currentUser.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ GVCN mới có quyền cấp tài khoản.', errorCode: 'PERMISSION_DENIED' };
    }

    if (!userData.Username || !userData.FullName) {
      return { success: false, message: 'Vui lòng nhập tên đăng nhập và họ tên người dùng.', errorCode: 'VALIDATION_ERROR' };
    }

    const exists = this.db.USERS.some(
      (u) => u.Username.toLowerCase() === userData.Username.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại trong hệ thống.', errorCode: 'DUPLICATE_USERNAME' };
    }

    const newUser: User = {
      UserID: 'USR_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      Username: userData.Username.trim().toLowerCase(),
      PasswordHash: userData.Password ? DEFAULT_PASSWORD_HASH : DEFAULT_PASSWORD_HASH,
      FullName: userData.FullName.trim(),
      Role: userData.Role,
      Team: userData.Team,
      Subject: userData.Subject,
      Status: 'ACTIVE',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    this.db.USERS.push(newUser);
    this.saveToStorage();
    this.logAudit(currentUser.UserID, currentUser.Username, 'ADD_USER', 'USERS', newUser.UserID, `Cấp tài khoản mới ${newUser.Username} (${newUser.Role})`, 'SUCCESS');

    return { success: true, message: `Tạo tài khoản cho ${newUser.FullName} thành công. Mật khẩu mặc định là 123456.`, data: newUser };
  }

  public disableUser(currentUser: User, targetUserId: string): ApiResponse<void> {
    if (currentUser.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ GVCN mới có quyền khóa tài khoản.', errorCode: 'PERMISSION_DENIED' };
    }

    if (currentUser.UserID === targetUserId) {
      return { success: false, message: 'Không thể vô hiệu hóa chính tài khoản của mình.', errorCode: 'CANNOT_SELF_DISABLE' };
    }

    const user = this.db.USERS.find((u) => u.UserID === targetUserId);
    if (!user) {
      return { success: false, message: 'Không tìm thấy tài khoản.', errorCode: 'NOT_FOUND' };
    }

    user.Status = user.Status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    user.UpdatedAt = new Date().toISOString();
    this.saveToStorage();

    const actionText = user.Status === 'ACTIVE' ? 'mở khóa' : 'khóa';
    this.logAudit(currentUser.UserID, currentUser.Username, 'TOGGLE_USER_STATUS', 'USERS', targetUserId, `Đã ${actionText} tài khoản ${user.Username}`, 'SUCCESS');

    return { success: true, message: `Đã ${actionText} tài khoản ${user.Username}.` };
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(currentUser: User): AuditLog[] {
    return this.db.AUDIT_LOG;
  }
}

// Singleton instance
export const sheetsEngine = new GoogleSheetsEngine();
