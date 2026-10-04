import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from './services/apiService';
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
} from './types';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { DashboardView } from './components/DashboardView';
import { DailyScoringView } from './components/DailyScoringView';
import { StudentManagementView } from './components/StudentManagementView';
import { CriteriaManagementView } from './components/CriteriaManagementView';
import { RankingAndAwardsView } from './components/RankingAndAwardsView';
import { ReportsAndExportView } from './components/ReportsAndExportView';
import { UserManagementView } from './components/UserManagementView';
import { AuditLogView } from './components/AuditLogView';
import { SheetsDatabaseModal } from './components/SheetsDatabaseModal';
import { LoginModal } from './components/LoginModal';
import { ClassroomUtilitiesView } from './components/ClassroomUtilitiesView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(apiService.getCurrentUser());
  const [config, setConfig] = useState<AppConfig>(apiService.getConfig());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [dailyScores, setDailyScores] = useState<DailyScore[]>([]);
  const [dailyComments, setDailyComments] = useState<DailyComment[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentScoreSummary[]>([]);
  const [teamSummaries, setTeamSummaries] = useState<TeamScoreSummary[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sync data from Google Sheets engine
  const refreshAllData = useCallback(() => {
    const stds = apiService.getStudents();
    const tms = apiService.getTeams();
    const crits = apiService.getCriteria();
    const scs = apiService.getDailyScores();
    const cmts = apiService.getDailyComments();
    const sSums = apiService.getStudentSummaries('week');
    const tSums = apiService.getTeamSummaries('week');
    const cfg = apiService.getConfig();
    const curU = apiService.getCurrentUser();

    setStudents(stds);
    setTeams(tms);
    setCriteria(crits);
    setDailyScores(scs);
    setDailyComments(cmts);
    setStudentSummaries(sSums);
    setTeamSummaries(tSums);
    setConfig(cfg);
    setCurrentUser(curU);

    if (curU && curU.Role === 'ADMIN_GVCN') {
      const uRes = apiService.getUsers();
      if (uRes.success && uRes.data) {
        setUsersList(uRes.data);
      }
      setAuditLogs(apiService.getAuditLogs());
    }
  }, []);

  // Initial load: Fetch master persistent database from server, then init session
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      // 1. Sync persistent database from backend server (loads permanent logo & student avatars)
      await apiService.syncWithServer();

      // 2. Default login as GVCN if no existing session
      if (!apiService.getCurrentUser()) {
        await apiService.login('gvcn', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');
      }

      if (isMounted) {
        refreshAllData();
      }
    };

    initApp();

    return () => {
      isMounted = false;
    };
  }, [refreshAllData]);

  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';
  const isViewer = currentUser?.Role === 'VIEWER';

  // Scoring
  const handleAddScore = async (data: any) => {
    if (isViewer) {
      return { success: false, message: 'Tài khoản Khách chỉ có quyền xem, không được chấm điểm thi đua!' };
    }
    const res = apiService.addScore(data);
    refreshAllData();
    return res;
  };

  const handleDeleteScore = (recordId: string) => {
    if (!isAdmin) {
      alert('Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền xóa lượt chấm điểm!');
      return;
    }
    const res = apiService.deleteScore(recordId);
    refreshAllData();
    return res;
  };

  // Comments
  const handleSaveComment = async (data: any) => {
    if (isViewer) {
      return { success: false, message: 'Tài khoản Khách chỉ có quyền xem, không được gửi nhận xét!' };
    }
    const res = apiService.saveComment(data);
    refreshAllData();
    return res;
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền xóa nhận xét!' };
    }
    const res = apiService.deleteComment(commentId);
    refreshAllData();
    return res;
  };

  // Student CRUD
  const handleAddStudent = async (studentData: any) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thêm học sinh!' };
    }
    const res = apiService.addStudent(studentData);
    refreshAllData();
    return res;
  };

  const handleUpdateStudent = async (studentData: any) => {
    if (isViewer) {
      return { success: false, message: 'Tài khoản Khách chỉ có quyền xem, không được chỉnh sửa học sinh!' };
    }
    if (studentData.AvatarURL !== undefined && !isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi ảnh đại diện học sinh!' };
    }
    const res = await apiService.updateStudent(studentData);
    refreshAllData();
    return res;
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền xóa học sinh!' };
    }
    const res = apiService.deleteStudent(studentId);
    refreshAllData();
    return res;
  };

  const handleResetAllScoresToZero = async (clearHistory: boolean) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền đặt lại điểm thi đua!' };
    }
    const res = apiService.resetAllStudentsScoresToZero(clearHistory);
    refreshAllData();
    return res;
  };

  // Criteria CRUD
  const handleAddCriteria = async (critData: any) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thêm tiêu chí!' };
    }
    const res = apiService.addCriteria(critData);
    refreshAllData();
    return res;
  };

  const handleUpdateCriteria = async (critData: any) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền sửa tiêu chí!' };
    }
    const res = apiService.updateCriteria(critData);
    refreshAllData();
    return res;
  };

  const handleDeleteCriteria = async (criterionId: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền xóa tiêu chí!' };
    }
    const res = apiService.deleteCriteria(criterionId);
    refreshAllData();
    return res;
  };

  // User Management
  const handleAddUser = async (userData: any) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền cấp tài khoản!' };
    }
    const res = apiService.addUser(userData);
    refreshAllData();
    return res;
  };

  const handleDisableUser = async (userId: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền vô hiệu hóa tài khoản!' };
    }
    const res = apiService.disableUser(userId);
    refreshAllData();
    return res;
  };

  // Auth
  const handleLogin = async (username: string, password: string) => {
    // Ensure we have the latest server state (avatars, logo, students)
    await apiService.syncWithServer();
    const res = await apiService.login(username, password);
    if (res.success && res.data) {
      setCurrentUser(res.data.user);
      refreshAllData();
    }
    return res;
  };

  const handleLogout = () => {
    apiService.logout();
    setCurrentUser(null);
    refreshAllData();
  };

  // Logo upload & persistence
  const handleUploadLogo = async (fileDataUrl: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi ảnh logo trường/lớp!' };
    }
    const res = await apiService.updateLogo(fileDataUrl);
    refreshAllData();
    return res;
  };

  // Background wallpaper upload & persistence
  const handleUploadBackground = async (fileDataUrl: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi hình nền lớp học!' };
    }
    const res = await apiService.updateBackground(fileDataUrl);
    refreshAllData();
    return res;
  };

  // Personnel (BCS & GV chuyên trách) update & persistence
  const handleSavePersonnel = async (data: any) => {
    if (!isAdmin) {
      return { success: false, message: 'Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền phân công Ban cán sự và GV bộ môn!' };
    }
    const res = await apiService.updateOfficersAndTeachers(data);
    if (res.success) {
      refreshAllData();
    }
    return res;
  };

  // Google Apps Script endpoint configuration
  const handleSaveGasUrl = (url: string) => {
    apiService.setGasUrl(url);
  };

  const handleTestGasConnection = async (url: string) => {
    return apiService.testGasConnection(url);
  };

  const handleResetDatabase = () => {
    if (!isAdmin) {
      alert('Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền khôi phục cơ sở dữ liệu!');
      return;
    }
    apiService.resetDatabase();
    refreshAllData();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        config={config}
        onLogout={handleLogout}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenSheetsModal={() => setSheetsModalOpen(true)}
        onRefreshData={refreshAllData}
        onUploadLogo={handleUploadLogo}
        gasUrl={apiService.getGasUrl()}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden pb-24 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              studentSummaries={studentSummaries}
              teamSummaries={teamSummaries}
              recentScores={dailyScores}
              currentUser={currentUser}
              config={config}
              onGoToScoring={() => setActiveTab('scoring')}
              onGoToRankings={() => setActiveTab('rankings')}
              onGoToStudents={() => setActiveTab('students')}
              onDeleteScore={handleDeleteScore}
              onUploadBackground={handleUploadBackground}
            />
          )}

          {activeTab === 'scoring' && (
            <DailyScoringView
              students={students}
              teams={teams}
              criteria={criteria}
              summaries={studentSummaries}
              dailyComments={dailyComments}
              currentUser={currentUser}
              onAddScore={handleAddScore}
              onSaveComment={handleSaveComment}
              onDeleteComment={handleDeleteComment}
              onOpenLogin={() => setLoginModalOpen(true)}
              onUpdateStudent={handleUpdateStudent}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagementView
              students={students}
              teams={teams}
              summaries={studentSummaries}
              dailyScores={dailyScores}
              dailyComments={dailyComments}
              currentUser={currentUser}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onResetAllScoresToZero={handleResetAllScoresToZero}
              onOpenLogin={() => setLoginModalOpen(true)}
            />
          )}

          {activeTab === 'rankings' && (
            <RankingAndAwardsView
              studentSummaries={studentSummaries}
              teamSummaries={teamSummaries}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsAndExportView
              studentSummaries={studentSummaries}
              teamSummaries={teamSummaries}
              dailyScores={dailyScores}
              config={config}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'utilities' && (
            <ClassroomUtilitiesView
              students={students}
              config={config}
            />
          )}

          {activeTab === 'criteria' && (
            <CriteriaManagementView
              criteria={criteria}
              currentUser={currentUser}
              onAddCriteria={handleAddCriteria}
              onUpdateCriteria={handleUpdateCriteria}
              onDeleteCriteria={handleDeleteCriteria}
              onOpenLogin={() => setLoginModalOpen(true)}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementView
              users={usersList}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onDisableUser={handleDisableUser}
              onOpenLogin={() => setLoginModalOpen(true)}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView logs={auditLogs} currentUser={currentUser} />
          )}

          {activeTab === 'sheets' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center space-x-2">
                    <span>📊</span>
                    <span>Cơ Sở Dữ Liệu Google Sheets Trực Tiếp</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Toàn bộ 11 Sheet của Google Spreadsheet trung tâm
                  </p>
                </div>

                <button
                  onClick={() => setSheetsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
                >
                  Mở Trung Tâm Apps Script
                </button>
              </div>

              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs">
                ✅ Hệ thống đang vận hành trực tiếp theo kiến trúc Google Sheets Database và Google Apps Script API. Dữ liệu được tính toán và lưu vết bảo mật tự động.
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileMenu={() => setMobileDrawerOpen(true)}
      />

      {/* Mobile Extra Drawer */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenSheetsModal={() => setSheetsModalOpen(true)}
      />

      {/* Google Sheets & Apps Script Modal */}
      <SheetsDatabaseModal
        open={sheetsModalOpen}
        onClose={() => setSheetsModalOpen(false)}
        rawDb={apiService.getRawDatabase()}
        gasUrl={apiService.getGasUrl()}
        onSaveGasUrl={handleSaveGasUrl}
        onTestGasConnection={handleTestGasConnection}
        onResetDatabase={handleResetDatabase}
        isAdmin={isAdmin}
      />

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        config={config}
        students={students}
        teams={teams}
        usersList={usersList}
        onLogin={handleLogin}
        onUploadLogo={handleUploadLogo}
        onSavePersonnel={handleSavePersonnel}
      />
    </div>
  );
}
