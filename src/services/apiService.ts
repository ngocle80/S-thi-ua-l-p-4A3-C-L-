import {
  User,
  Student,
  Team,
  Criterion,
  DailyScore,
  DailyComment,
  AuditLog,
  AppConfig,
  StudentScoreSummary,
  TeamScoreSummary,
  ApiResponse,
} from '../types';
import { sheetsEngine, GoogleSheetsDatabase } from './sheetsEngine';

const SESSION_TOKEN_KEY = 'so_thi_dua_4a3_session_token';
const SESSION_USER_KEY = 'so_thi_dua_4a3_session_user';

class ApiService {
  private sessionToken: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const userStr = localStorage.getItem(SESSION_USER_KEY);
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        if (this.currentUser && this.currentUser.Username === 'gvcn') {
          this.currentUser.FullName = 'Phạm Ngọc Lê';
          localStorage.setItem(SESSION_USER_KEY, JSON.stringify(this.currentUser));
        }
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getSessionToken(): string | null {
    return this.sessionToken;
  }

  public isAuthenticated(): boolean {
    return !!this.sessionToken && !!this.currentUser;
  }

  // --- SERVER DATABASE SYNC ---
  public async syncWithServer(): Promise<boolean> {
    try {
      const response = await fetch('/api/database');
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          sheetsEngine.syncFromDatabase(resJson.data);
          return true;
        }
      }
    } catch (e) {
      console.warn('Could not sync database from server:', e);
    }
    return false;
  }

  // --- AUTH ---
  public async login(username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    // SHA-256 hash
    const passwordHash = await this.hashPassword(password);
    const gasUrl = sheetsEngine.getGasUrl();

    // If external GAS URL configured, try hitting it
    if (gasUrl) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            username,
            password,
          }),
        });
        if (response.ok) {
          const resJson: ApiResponse<{ user: User; token: string }> = await response.json();
          if (resJson.success && resJson.data) {
            this.setSession(resJson.data.token, resJson.data.user);
            return resJson;
          }
        }
      } catch (gasErr) {
        console.warn('Direct GAS Web App ping failed, falling back to local Google Sheets Engine:', gasErr);
      }
    }

    // Google Sheets Engine fallback / native
    const res = sheetsEngine.login(username, passwordHash);
    if (res.success && res.data) {
      this.setSession(res.data.token, res.data.user);
    }
    return res;
  }

  public logout(): void {
    if (this.currentUser) {
      sheetsEngine.logAudit(
        this.currentUser.UserID,
        this.currentUser.Username,
        'LOGOUT',
        'AUTH',
        this.currentUser.UserID,
        'Đăng xuất hệ thống',
        'SUCCESS'
      );
    }
    this.sessionToken = null;
    this.currentUser = null;
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
  }

  private setSession(token: string, user: User) {
    this.sessionToken = token;
    this.currentUser = user;
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  }

  // --- CONFIG ---
  public getConfig(): AppConfig {
    return sheetsEngine.getConfig();
  }

  public updateConfig(config: Partial<AppConfig>): ApiResponse<AppConfig> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.updateConfig(this.currentUser, config);
  }

  public async updateLogo(logoDataUrl: string): Promise<ApiResponse<string>> {
    if (this.currentUser?.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi logo trường/lớp!' };
    }

    // 1. Gửi lên máy chủ backend để lưu vĩnh viễn vào file trên ổ đĩa và cập nhật database.json
    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: logoDataUrl }),
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          const permanentUrl = resJson.data.url;
          sheetsEngine.updateLogo(this.currentUser, permanentUrl);
          return { success: true, message: 'Đã lưu vĩnh viễn logo lớp lên máy chủ!', data: permanentUrl };
        }
      }
    } catch (e) {
      console.warn('Failed to upload logo to backend server, saving locally:', e);
    }

    // 2. Đồng thời gửi tới GAS Web App nếu có cấu hình
    const gasUrl = sheetsEngine.getGasUrl();
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateLogo',
            logoUrl: logoDataUrl,
            sessionToken: this.sessionToken,
          }),
        });
      } catch (e) {
        console.warn('Failed to send logo to GAS Web App endpoint, updating local sheets engine:', e);
      }
    }
    return sheetsEngine.updateLogo(this.currentUser, logoDataUrl);
  }

  public async updateBackground(backgroundDataUrl: string): Promise<ApiResponse<string>> {
    if (this.currentUser?.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi hình nền lớp!' };
    }
    try {
      const response = await fetch('/api/upload/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: backgroundDataUrl }),
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          const permanentUrl = resJson.data.url;
          sheetsEngine.updateBackground(this.currentUser, permanentUrl);
          return { success: true, message: 'Đã lưu vĩnh viễn hình nền lớp lên máy chủ!', data: permanentUrl };
        }
      }
    } catch (e) {
      console.warn('Failed to upload background to backend server, saving locally:', e);
    }
    return sheetsEngine.updateBackground(this.currentUser, backgroundDataUrl);
  }

  // --- STUDENTS & TEAMS ---
  public getStudents(): Student[] {
    return sheetsEngine.getStudents();
  }

  public getTeams(): Team[] {
    return sheetsEngine.getTeams();
  }

  public addStudent(studentData: Omit<Student, 'StudentID' | 'CreatedAt' | 'UpdatedAt'>): ApiResponse<Student> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    if (this.currentUser.Role !== 'ADMIN_GVCN') {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thêm học sinh!' };
    }
    return sheetsEngine.addStudent(this.currentUser, studentData);
  }

  public async updateStudent(studentData: Partial<Student> & { StudentID: string }): Promise<ApiResponse<Student>> {
    if (this.currentUser?.Role === 'VIEWER') {
      return { success: false, message: 'Tài khoản Khách chỉ có quyền xem, không được chỉnh sửa thông tin!' };
    }

    const finalStudentData = { ...studentData };

    // 1. Kiểm tra quyền đổi ảnh đại diện học sinh (Chỉ Admin)
    if (studentData.AvatarURL !== undefined) {
      if (this.currentUser?.Role !== 'ADMIN_GVCN') {
        return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi ảnh đại diện học sinh!' };
      }

      // Nếu có ảnh avatar mới tải lên (dạng Base64 data URL), đẩy lên server
      if (studentData.AvatarURL.startsWith('data:image/')) {
        try {
          const response = await fetch('/api/upload/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: studentData.StudentID,
              imageBase64: studentData.AvatarURL,
            }),
          });
          if (response.ok) {
            const resJson = await response.json();
            if (resJson.success && resJson.data?.url) {
              finalStudentData.AvatarURL = resJson.data.url;
            }
          }
        } catch (err) {
          console.warn('Server avatar upload failed, falling back to local storage:', err);
        }
      }
    }

    // 2. Cập nhật sheetsEngine nội bộ (bảo đảm localStorage và state cập nhật ngay lập tức)
    const localRes = sheetsEngine.updateStudent(this.currentUser, finalStudentData);

    // 3. Gửi cập nhật thông tin học sinh lên máy chủ để ghi vào data/database.json VĨNH VIỄN
    try {
      await fetch('/api/students/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalStudentData),
      });

      // Đồng bộ snapshot database mới nhất lên máy chủ
      const rawDb = sheetsEngine.getRawDatabase();
      await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawDb),
      });
    } catch (err) {
      console.warn('Server student update failed:', err);
    }

    return localRes;
  }

  public deleteStudent(studentId: string): ApiResponse<void> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.deleteStudent(this.currentUser, studentId);
  }

  public resetAllStudentsScoresToZero(clearHistory: boolean = false): ApiResponse<{ updatedCount: number }> {
    return sheetsEngine.resetAllStudentsScoresToZero(clearHistory);
  }

  // --- CRITERIA ---
  public getCriteria(): Criterion[] {
    return sheetsEngine.getCriteria();
  }

  public addCriteria(critData: Omit<Criterion, 'CriterionID' | 'CreatedAt' | 'UpdatedAt'>): ApiResponse<Criterion> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.addCriteria(this.currentUser, critData);
  }

  public updateCriteria(critData: Partial<Criterion> & { CriterionID: string }): ApiResponse<Criterion> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.updateCriteria(this.currentUser, critData);
  }

  public deleteCriteria(criterionId: string): ApiResponse<void> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.deleteCriteria(this.currentUser, criterionId);
  }

  // --- SCORING ---
  public addScore(data: { studentId: string; criterionId: string; date?: string; customReason?: string }): ApiResponse<DailyScore> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.addScore(this.currentUser, data);
  }

  public deleteScore(recordId: string): ApiResponse<void> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.deleteScore(this.currentUser, recordId);
  }

  public getDailyScores(date?: string): DailyScore[] {
    return sheetsEngine.getDailyScores(date);
  }

  // --- COMMENTS ---
  public saveComment(data: { studentId: string; comment: string; date?: string }): ApiResponse<DailyComment> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.saveComment(this.currentUser, data);
  }

  public deleteComment(commentId: string): ApiResponse<void> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.deleteComment(this.currentUser, commentId);
  }

  public getDailyComments(date?: string): DailyComment[] {
    return sheetsEngine.getDailyComments(date);
  }

  // --- SUMMARIES & RANKINGS ---
  public getStudentSummaries(period: 'all' | 'today' | 'week' | 'month' = 'all', targetDate?: string): StudentScoreSummary[] {
    return sheetsEngine.calculateStudentSummaries(period, targetDate);
  }

  public getTeamSummaries(period: 'all' | 'today' | 'week' | 'month' = 'all', targetDate?: string): TeamScoreSummary[] {
    return sheetsEngine.calculateTeamSummaries(period, targetDate);
  }

  // --- USER MANAGEMENT ---
  public getUsers(): ApiResponse<User[]> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.getUsers(this.currentUser);
  }

  public addUser(userData: { Username: string; FullName: string; Role: User['Role']; Team?: string; Subject?: string; Password?: string }): ApiResponse<User> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.addUser(this.currentUser, userData);
  }

  public disableUser(targetUserId: string): ApiResponse<void> {
    if (!this.currentUser) return { success: false, message: 'Chưa đăng nhập' };
    return sheetsEngine.disableUser(this.currentUser, targetUserId);
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    if (!this.currentUser) return [];
    return sheetsEngine.getAuditLogs(this.currentUser);
  }

  // --- SHEETS DATABASE VIEW & UTILS ---
  public getRawDatabase(): GoogleSheetsDatabase {
    return sheetsEngine.getRawDatabase();
  }

  public resetDatabase(): void {
    sheetsEngine.resetDatabase();
  }

  public getGasUrl(): string {
    return sheetsEngine.getGasUrl();
  }

  public setGasUrl(url: string): void {
    sheetsEngine.setGasUrl(url);
  }

  public async testGasConnection(url: string): Promise<ApiResponse<any>> {
    try {
      const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
      const res = await fetch(pingUrl, { method: 'GET' });
      if (!res.ok) {
        return { success: false, message: `Lỗi HTTP ${res.status}: Không thể kết nối tới Web App.` };
      }
      const data = await res.json();
      return { success: true, message: 'Kết nối thành công tới Google Apps Script!', data };
    } catch (err: any) {
      return {
        success: false,
        message: 'Không thể kết nối. Hãy đảm bảo bạn đã triển khai dưới dạng Web App với quyền truy cập "Bất kỳ ai" (Anyone). ' + err.message,
      };
    }
  }

  public async updateOfficersAndTeachers(data: {
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
  }): Promise<ApiResponse<any>> {
    try {
      // 1. Update in-memory and localStorage
      sheetsEngine.updateOfficersAndTeachers(data);

      // 2. Persist directly to backend server
      const rawDb = sheetsEngine.getRawDatabase();
      await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawDb),
      });

      return {
        success: true,
        message: 'Đã cập nhật và lưu vĩnh viễn phân công Ban cán sự & Giáo viên chuyên trách!',
      };
    } catch (e: any) {
      console.error('Error updating personnel:', e);
      return {
        success: false,
        message: 'Lỗi khi lưu phân công: ' + (e.message || 'Lỗi không xác định'),
      };
    }
  }

  // Tiện ích băm mật khẩu Web Crypto API
  private async hashPassword(plainText: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plainText);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('Web Crypto SHA-256 failed, using fallback:', e);
    }
    // Fallback hash if crypto not available
    let hash = 0;
    for (let i = 0; i < plainText.length; i++) {
      const char = plainText.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export const apiService = new ApiService();
