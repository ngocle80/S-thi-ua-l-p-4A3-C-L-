import React, { useState, useRef } from 'react';
import {
  Student,
  Team,
  User,
  DailyScore,
  DailyComment,
  StudentScoreSummary,
} from '../types';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Camera,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  Pencil,
  Loader2,
  RotateCcw,
  Shield,
  Sparkles,
  GraduationCap,
  Image as ImageIcon,
} from 'lucide-react';
import { AvatarCropModal } from './AvatarCropModal';

const GALLERY_AVATARS = Array.from({ length: 35 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return {
    id: i + 1,
    url: `/uploads/avatars/avatar_HS_${num}.png`,
    label: `Ảnh HS ${num}`,
  };
});

interface StudentManagementViewProps {
  students: Student[];
  teams: Team[];
  summaries: StudentScoreSummary[];
  dailyScores: DailyScore[];
  dailyComments: DailyComment[];
  currentUser: User | null;
  onAddStudent: (data: any) => Promise<any>;
  onUpdateStudent: (data: any) => Promise<any>;
  onDeleteStudent: (studentId: string) => Promise<any>;
  onResetAllScoresToZero?: (clearHistory: boolean) => Promise<any>;
  onOpenLogin: () => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  students,
  teams,
  summaries,
  dailyScores,
  dailyComments,
  currentUser,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onResetAllScoresToZero,
  onOpenLogin,
}) => {
  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';
  const isViewer = currentUser?.Role === 'VIEWER';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OFFICERS_ONLY'>('ALL');

  // Edit / Add Modal
  const [studentModal, setStudentModal] = useState<{
    open: boolean;
    isEditing: boolean;
    studentId?: string;
    studentCode: string;
    fullName: string;
    gender: 'Nam' | 'Nữ';
    dateOfBirth: string;
    teamId: string;
    classRole: string;
    customClassRole: string;
    avatarUrl: string;
    initialScore: number;
    isSubmitting: boolean;
  }>({
    open: false,
    isEditing: false,
    studentCode: '',
    fullName: '',
    gender: 'Nam',
    dateOfBirth: '2015-05-15',
    teamId: teams[0]?.TeamID || 'TO_1',
    classRole: '',
    customClassRole: '',
    avatarUrl: '',
    initialScore: 0,
    isSubmitting: false,
  });

  // Reset Scores Confirmation Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [clearHistoryChecked, setClearHistoryChecked] = useState(false);
  const [isResettingScores, setIsResettingScores] = useState(false);

  // Profile Drawer / Modal
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  // Inline name editing state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  // Avatar upload state & refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const targetAvatarStudentRef = useRef<Student | null>(null);
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);

  // Avatar crop & resize modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [croppingStudent, setCroppingStudent] = useState<Student | null>(null);
  const [cropForModalForm, setCropForModalForm] = useState<boolean>(false);

  // Gallery Picker Modal state (from postimg.cc/gallery/3k75NB7)
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [galleryTargetStudent, setGalleryTargetStudent] = useState<Student | null>(null);
  const [galleryForModalForm, setGalleryForModalForm] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectGalleryAvatar = async (url: string) => {
    if (!isAdmin) {
      showToast('Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi ảnh học sinh!');
      return;
    }

    if (galleryForModalForm) {
      setStudentModal((p) => ({ ...p, avatarUrl: url }));
      setGalleryPickerOpen(false);
      showToast('Đã chọn ảnh đại diện từ kho ảnh lớp!');
      return;
    }

    if (galleryTargetStudent) {
      setUploadingAvatarId(galleryTargetStudent.StudentID);
      const res = await onUpdateStudent({
        StudentID: galleryTargetStudent.StudentID,
        AvatarURL: url,
      });
      setUploadingAvatarId(null);
      setGalleryPickerOpen(false);
      showToast(res?.message || `Đã cập nhật ảnh đại diện cho học sinh ${galleryTargetStudent.FullName}!`);
    } else {
      setGalleryPickerOpen(false);
    }
  };

  const handleTriggerAvatarUpload = (st: Student) => {
    if (!isAdmin) {
      showToast('Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi ảnh học sinh!');
      return;
    }
    targetAvatarStudentRef.current = st;
    setCropForModalForm(false);
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetStudent = targetAvatarStudentRef.current;
    if (!file) return;

    // Validate image format (.png, .jpg, .jpeg, .svg, .webp)
    const validExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      showToast('Chỉ chấp nhận file ảnh định dạng .png, .jpg, .svg, .webp!');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa 8MB. Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCropImageSrc(dataUrl);
      setCroppingStudent(targetStudent);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleSaveCroppedAvatar = async (croppedDataUrl: string) => {
    if (cropForModalForm) {
      setStudentModal((p) => ({ ...p, avatarUrl: croppedDataUrl }));
      showToast('Đã áp dụng ảnh đại diện đã căn chỉnh vào form!');
      return;
    }

    if (!croppingStudent) return;
    setUploadingAvatarId(croppingStudent.StudentID);
    const res = await onUpdateStudent({
      StudentID: croppingStudent.StudentID,
      AvatarURL: croppedDataUrl,
    });
    setUploadingAvatarId(null);
    showToast(res?.message || `Đã cập nhật ảnh đại diện rõ nét cho học sinh ${croppingStudent.FullName}!`);
  };

  const startEditName = (st: Student) => {
    if (!isAdmin) {
      showToast('Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền sửa tên học sinh!');
      return;
    }
    setEditingStudentId(st.StudentID);
    setEditingNameValue(st.FullName);
  };

  const handleSaveInlineName = async (st: Student) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed) {
      showToast('Tên học sinh không được để trống!');
      return;
    }
    if (trimmed === st.FullName) {
      setEditingStudentId(null);
      return;
    }

    const res = await onUpdateStudent({
      StudentID: st.StudentID,
      FullName: trimmed,
    });
    setEditingStudentId(null);
    showToast(res.message || `Đã đổi tên học sinh thành "${trimmed}"!`);
  };

  const PRESET_ROLES = [
    'Lớp trưởng',
    'Lớp phó học tập',
    'Lớp phó trật tự',
    'Lớp phó lao động',
    'Lớp phó văn thể mỹ',
    'Tổ trưởng',
    'Tổ phó',
    'Thủ quỹ',
  ];

  const renderClassRoleBadge = (role?: string) => {
    if (!role) return null;
    let badgeStyle = 'bg-blue-100 text-blue-900 border-blue-300';
    let icon = '⭐';
    if (role === 'Lớp trưởng') {
      badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';
      icon = '👑';
    } else if (role.includes('trật tự')) {
      badgeStyle = 'bg-rose-100 text-rose-900 border-rose-300';
      icon = '👮';
    } else if (role.includes('lao động')) {
      badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300';
      icon = '🧹';
    } else if (role.includes('học tập')) {
      badgeStyle = 'bg-sky-100 text-sky-900 border-sky-300';
      icon = '📚';
    } else if (role.includes('văn thể')) {
      badgeStyle = 'bg-purple-100 text-purple-900 border-purple-300';
      icon = '🎨';
    } else if (role === 'Tổ trưởng') {
      badgeStyle = 'bg-teal-100 text-teal-900 border-teal-300';
      icon = '🚩';
    } else if (role === 'Tổ phó') {
      badgeStyle = 'bg-cyan-100 text-cyan-900 border-cyan-300';
      icon = '🔰';
    } else if (role.includes('quỹ')) {
      badgeStyle = 'bg-yellow-100 text-yellow-900 border-yellow-300';
      icon = '💰';
    }

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${badgeStyle}`}>
        <span>{icon}</span>
        <span>{role}</span>
      </span>
    );
  };

  const filtered = students.filter((s) => {
    if (statusFilter !== 'ALL' && s.Status !== statusFilter) return false;
    if (selectedTeam !== 'ALL' && s.TeamID !== selectedTeam) return false;
    if (roleFilter === 'OFFICERS_ONLY' && !s.ClassRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.FullName.toLowerCase().includes(q) ||
        s.StudentCode.toLowerCase().includes(q) ||
        (s.ClassRole && s.ClassRole.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      if (!currentUser) onOpenLogin();
      else showToast('Chỉ Giáo viên chủ nhiệm mới có quyền thêm học sinh!');
      return;
    }

    setStudentModal({
      open: true,
      isEditing: false,
      studentCode: `4A3-${students.length + 1 < 10 ? '0' + (students.length + 1) : students.length + 1}`,
      fullName: '',
      gender: 'Nam',
      dateOfBirth: '2015-05-15',
      teamId: teams[0]?.TeamID || 'TO_1',
      classRole: '',
      customClassRole: '',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      initialScore: 0,
      isSubmitting: false,
    });
  };

  const handleConfirmResetScores = async () => {
    if (!onResetAllScoresToZero) return;
    setIsResettingScores(true);
    const res = await onResetAllScoresToZero(clearHistoryChecked);
    setIsResettingScores(false);
    setResetModalOpen(false);
    showToast(res?.message || 'Đã đặt lại điểm của tất cả học sinh về 0 điểm thành công!');
  };

  const handleOpenEditModal = (st: Student) => {
    if (!isAdmin) {
      if (!currentUser) onOpenLogin();
      else showToast('Chỉ Giáo viên chủ nhiệm mới có quyền chỉnh sửa học sinh!');
      return;
    }

    const curRole = st.ClassRole || '';
    const isPreset = PRESET_ROLES.includes(curRole) || curRole === '';

    setStudentModal({
      open: true,
      isEditing: true,
      studentId: st.StudentID,
      studentCode: st.StudentCode,
      fullName: st.FullName,
      gender: st.Gender,
      dateOfBirth: st.DateOfBirth,
      teamId: st.TeamID,
      classRole: isPreset ? curRole : 'Khác',
      customClassRole: isPreset ? '' : curRole,
      avatarUrl: st.AvatarURL,
      initialScore: typeof st.InitialScore === 'number' ? st.InitialScore : 0,
      isSubmitting: false,
    });
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentModal.fullName.trim()) {
      showToast('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    setStudentModal((p) => ({ ...p, isSubmitting: true }));

    const teamObj = teams.find((t) => t.TeamID === studentModal.teamId);

    const finalRole =
      studentModal.classRole === 'Khác'
        ? studentModal.customClassRole.trim()
        : studentModal.classRole;

    if (studentModal.isEditing && studentModal.studentId) {
      const res = await onUpdateStudent({
        StudentID: studentModal.studentId,
        StudentCode: studentModal.studentCode,
        FullName: studentModal.fullName.trim(),
        Gender: studentModal.gender,
        DateOfBirth: studentModal.dateOfBirth,
        TeamID: studentModal.teamId,
        TeamName: teamObj?.TeamName || studentModal.teamId,
        ClassRole: finalRole,
        AvatarURL: studentModal.avatarUrl,
        InitialScore: typeof studentModal.initialScore === 'number' ? studentModal.initialScore : (Number(studentModal.initialScore) || 0),
      });
      setStudentModal((p) => ({ ...p, isSubmitting: false, open: false }));
      showToast(res.message);
    } else {
      const res = await onAddStudent({
        StudentCode: studentModal.studentCode,
        FullName: studentModal.fullName.trim(),
        Gender: studentModal.gender,
        DateOfBirth: studentModal.dateOfBirth,
        TeamID: studentModal.teamId,
        TeamName: teamObj?.TeamName || studentModal.teamId,
        ClassRole: finalRole,
        AvatarURL:
          studentModal.avatarUrl ||
          'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
        InitialScore: typeof studentModal.initialScore === 'number' ? studentModal.initialScore : (Number(studentModal.initialScore) || 0),
        Status: 'ACTIVE',
      });
      setStudentModal((p) => ({ ...p, isSubmitting: false, open: false }));
      showToast(res.message);
    }
  };

  const handleDelete = async (st: Student) => {
    if (!isAdmin) {
      showToast('Chỉ GVCN mới có quyền vô hiệu hóa học sinh!');
      return;
    }
    if (confirm(`Bạn có chắc muốn vô hiệu hóa học sinh ${st.FullName}? Lịch sử thi đua vẫn được bảo toàn trong Google Sheets.`)) {
      const res = await onDeleteStudent(st.StudentID);
      showToast(res.message);
    }
  };

  // Profile details calculation
  const profileSummary = profileStudent ? summaries.find((s) => s.student.StudentID === profileStudent.StudentID) : null;
  const profileScores = profileStudent ? dailyScores.filter((s) => s.StudentID === profileStudent.StudentID && s.Status === 'ACTIVE') : [];
  const profileComments = profileStudent ? dailyComments.filter((c) => c.StudentID === profileStudent.StudentID) : [];

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-18 right-4 z-50 px-4 py-3 rounded-xl bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center space-x-2">
            <span className="text-blue-600">👨‍🎓</span>
            <span>Học Sinh & 5 Tổ Lớp 4A3</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Danh sách học sinh, phân tổ, cập nhật thông tin và theo dõi tiến độ thi đua
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && onResetAllScoresToZero && (
            <button
              onClick={() => setResetModalOpen(true)}
              title="Đặt lại điểm gốc của tất cả học sinh về 0 điểm"
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>Đặt Lại Điểm Về 0</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setGalleryForModalForm(false);
              setGalleryTargetStudent(null);
              setGalleryPickerOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Kho Ảnh Lớp (35 em)</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/30 flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Học Sinh Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Thông báo chế độ Khách (Chỉ xem) */}
      {isViewer && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs sm:text-sm font-semibold flex items-center space-x-3 shadow-2xs">
          <div className="p-1.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-amber-900">Chế độ Khách (Chỉ xem):</span> Bạn có quyền xem danh sách và hồ sơ thi đua chi tiết của toàn bộ học sinh Lớp 4A3. Thao tác chỉnh sửa thông tin, thêm/xóa học sinh và đổi ảnh đã được khóa an toàn.
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Team filter */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả 5 Tổ ({students.length} em)</option>
            {teams.map((t) => (
              <option key={t.TeamID} value={t.TeamID}>
                {t.TeamName}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ACTIVE">Đang tham gia (Active)</option>
            <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
            <option value="ALL">Tất cả trạng thái</option>
          </select>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Tất cả chức vụ</option>
            <option value="OFFICERS_ONLY">👑 Ban cán sự lớp</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên hoặc mã HS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Hidden file input for uploading student avatar */}
      <input
        ref={avatarInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={handleAvatarFileChange}
        className="hidden"
      />

      {/* Student Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filtered.map((st) => {
          const sum = summaries.find((s) => s.student.StudentID === st.StudentID);
          const score = sum ? sum.netScore : st.InitialScore;

          return (
            <div
              key={st.StudentID}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                st.Status === 'INACTIVE' ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200/80 hover:border-blue-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center space-x-3">
                    {/* Avatar with Camera upload button (Chỉ dành cho Admin) */}
                    <div className="relative group shrink-0">
                      <img
                        src={st.AvatarURL || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                        alt={st.FullName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                      />
                      {isAdmin && (
                        <>
                          {/* Hover camera overlay */}
                          <button
                            type="button"
                            onClick={() => handleTriggerAvatarUpload(st)}
                            title="Bấm để chọn ảnh từ máy tính (.png, .jpg, .svg)"
                            className="absolute inset-0 bg-slate-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                          >
                            {uploadingAvatarId === st.StudentID ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </button>
                          {/* Always-visible camera badge */}
                          <button
                            type="button"
                            onClick={() => handleTriggerAvatarUpload(st)}
                            title="Tải ảnh mới từ máy tính (.png, .jpg, .svg)"
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white border-2 border-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                          >
                            {uploadingAvatarId === st.StudentID ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
                            ) : (
                              <Camera className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Student Name & Inline Edit with Pencil icon */}
                    <div className="min-w-0 flex-1">
                      {editingStudentId === st.StudentID ? (
                        <div className="flex items-center space-x-1.5 my-0.5">
                          <input
                            type="text"
                            autoFocus
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineName(st);
                              if (e.key === 'Escape') setEditingStudentId(null);
                            }}
                            className="px-2 py-0.5 rounded-lg border border-blue-500 font-extrabold text-slate-900 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-36 sm:w-44"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlineName(st)}
                            title="Lưu tên học sinh"
                            className="p-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudentId(null)}
                            title="Hủy"
                            className="p-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">{st.FullName}</span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => startEditName(st)}
                              title="Bấm vào cây bút để sửa tên học sinh (Chỉ Admin)"
                              className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 active:scale-95 border border-blue-200 shadow-2xs transition-all cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${st.Gender === 'Nữ' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                            {st.Gender}
                          </span>
                          {st.ClassRole && renderClassRoleBadge(st.ClassRole)}
                        </div>
                      )}

                      <div className="text-xs text-slate-500 font-medium">
                        {st.TeamName} • Mã: {st.StudentCode}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Sinh ngày: {st.DateOfBirth}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Điểm</span>
                    <span className={`text-lg font-black ${score > 0 ? 'text-blue-700' : score < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {score > 0 ? `+${score}` : score}
                    </span>
                  </div>
                </div>

                {/* Score breakdown mini-pills */}
                {sum && (
                  <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600 mb-3 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    <span className="text-emerald-600">+{sum.totalPlus} cộng</span>
                    <span>•</span>
                    <span className="text-rose-600">-{sum.totalMinus} trừ</span>
                    <span>•</span>
                    <span className="text-amber-700 font-bold">Hạng {sum.rank}</span>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <button
                  onClick={() => setProfileStudent(st)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hồ sơ thi đua</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenEditModal(st)}
                      title="Sửa thông tin học sinh"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {st.Status === 'ACTIVE' && (
                      <button
                        onClick={() => handleDelete(st)}
                        title="Vô hiệu hóa (Soft Delete)"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODAL THÊM / SỬA HỌC SINH (Fully Responsive & Scrollable) */}
      {/* ======================================================== */}
      {studentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-150">
            {/* Header: Cố định trên đầu, không bao giờ bị che khuất */}
            <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-blue-200" />
                <h3 className="font-extrabold text-base sm:text-lg">
                  {studentModal.isEditing ? 'Sửa Thông Tin Học Sinh' : 'Thêm Học Sinh Mới Vào Lớp 4A3'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStudentModal((p) => ({ ...p, open: false }))}
                className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form & Scrollable Body */}
            <form onSubmit={handleSaveStudent} noValidate className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Học Sinh</label>
                  <input
                    type="text"
                    required
                    value={studentModal.studentCode}
                    onChange={(e) => setStudentModal((p) => ({ ...p, studentCode: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên Học Sinh</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={studentModal.fullName}
                    onChange={(e) => setStudentModal((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giới Tính</label>
                    <select
                      value={studentModal.gender}
                      onChange={(e) => setStudentModal((p) => ({ ...p, gender: e.target.value as any }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Sinh</label>
                    <input
                      type="date"
                      value={studentModal.dateOfBirth}
                      onChange={(e) => setStudentModal((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân Tổ Thi Đua</label>
                  <select
                    value={studentModal.teamId}
                    onChange={(e) => setStudentModal((p) => ({ ...p, teamId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    {teams.map((t) => (
                      <option key={t.TeamID} value={t.TeamID}>
                        {t.TeamName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ban Cán Sự Lớp */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 rounded-2xl border border-blue-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-blue-700" />
                      <label className="text-xs font-extrabold text-slate-800">
                        Chức Vụ Ban Cán Sự Lớp
                      </label>
                    </div>
                    {studentModal.classRole && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                        {studentModal.classRole === 'Khác' ? (studentModal.customClassRole || 'Tự nhập') : studentModal.classRole}
                      </span>
                    )}
                  </div>

                  <select
                    value={studentModal.classRole}
                    onChange={(e) => setStudentModal((p) => ({ ...p, classRole: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="">Thành viên (Không giữ chức vụ)</option>
                    <option value="Lớp trưởng">👑 Lớp trưởng</option>
                    <option value="Lớp phó học tập">⭐ Lớp phó học tập</option>
                    <option value="Lớp phó trật tự">👮 Lớp phó trật tự</option>
                    <option value="Lớp phó lao động">🧹 Lớp phó lao động</option>
                    <option value="Lớp phó văn thể mỹ">🎨 Lớp phó văn thể mỹ</option>
                    <option value="Tổ trưởng">🚩 Tổ trưởng</option>
                    <option value="Tổ phó">🔰 Tổ phó</option>
                    <option value="Thủ quỹ">💰 Thủ quỹ</option>
                    <option value="Khác">✨ Khác (Tự nhập chức vụ)</option>
                  </select>

                  {studentModal.classRole === 'Khác' && (
                    <input
                      type="text"
                      placeholder="Nhập tên chức vụ ban cán sự..."
                      value={studentModal.customClassRole}
                      onChange={(e) => setStudentModal((p) => ({ ...p, customClassRole: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    />
                  )}

                  <p className="text-[11px] text-slate-500 leading-tight">
                    💡 Cán sự lớp sẽ có huy hiệu vinh danh đặc biệt trên thẻ học sinh và bảng xếp hạng thi đua.
                  </p>
                </div>

                {/* Ảnh Đại Diện */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Ảnh Đại Diện</label>
                    {isAdmin ? (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryForModalForm(true);
                            setGalleryTargetStudent(studentModal.studentId ? students.find((s) => s.StudentID === studentModal.studentId) || null : null);
                            setGalleryPickerOpen(true);
                          }}
                          className="text-[11px] text-indigo-700 hover:text-indigo-900 font-extrabold flex items-center space-x-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Kho ảnh lớp (35 em)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            targetAvatarStudentRef.current = studentModal.studentId
                              ? students.find((s) => s.StudentID === studentModal.studentId) || null
                              : null;
                            setCropForModalForm(true);
                            avatarInputRef.current?.click();
                          }}
                          className="text-[11px] text-blue-700 hover:text-blue-900 font-extrabold flex items-center space-x-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Tải ảnh từ máy</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        🔒 Chỉ Admin mới được đổi ảnh
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {studentModal.avatarUrl ? (
                      <div className="relative shrink-0">
                        <img
                          src={studentModal.avatarUrl}
                          alt="Avatar"
                          className="w-11 h-11 rounded-xl object-cover border-2 border-blue-500 shrink-0 shadow-xs"
                        />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] shrink-0 font-medium">
                        Chưa có
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Đường dẫn ảnh hoặc bấm nút kho ảnh ở trên..."
                      value={studentModal.avatarUrl}
                      onChange={(e) => setStudentModal((p) => ({ ...p, avatarUrl: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 text-[11px] text-blue-900">
                  💡 Dữ liệu học sinh sẽ được đồng bộ trực tiếp vào cơ sở dữ liệu và lưu vĩnh viễn trên máy chủ.
                </div>
              </div>

              {/* Footer: Cố định dưới chân modal, luôn hiển thị đầy đủ các nút bấm */}
              <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Lớp 4A3 • Trường TH Thị Trấn Rạch Gòi A
                </span>
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setStudentModal((p) => ({ ...p, open: false }))}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={studentModal.isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{studentModal.isSubmitting ? 'Đang lưu...' : studentModal.isEditing ? 'Cập Nhật' : 'Lưu Học Sinh'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL: HỒ SƠ THI ĐUA HỌC SINH CHI TIẾT */}
      {/* ======================================================== */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={profileStudent.AvatarURL}
                  alt={profileStudent.FullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-lg">{profileStudent.FullName}</h3>
                    {profileStudent.ClassRole && renderClassRoleBadge(profileStudent.ClassRole)}
                  </div>
                  <p className="text-xs text-blue-100">
                    {profileStudent.TeamName} • Mã {profileStudent.StudentCode} • Sinh ngày: {profileStudent.DateOfBirth}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setProfileStudent(null)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Score overview cards */}
              <div className="grid grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Khởi tạo</div>
                  <div className="text-base font-black text-slate-700">{profileStudent.InitialScore}đ</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Điểm cộng</div>
                  <div className="text-base font-black text-emerald-700">+{profileSummary?.totalPlus || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Điểm trừ</div>
                  <div className="text-base font-black text-rose-700">-{profileSummary?.totalMinus || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-[10px] uppercase font-bold text-blue-700">Hiện tại</div>
                  <div className="text-base font-black text-blue-700">{profileSummary?.netScore || profileStudent.InitialScore}đ</div>
                </div>
              </div>

              {/* Huy hiệu */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Huy Hiệu & Thành Tích Đạt Được</h4>
                <div className="flex flex-wrap gap-1.5">
                  {profileSummary && profileSummary.badges.length > 0 ? (
                    profileSummary.badges.map((b, idx) => (
                      <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center space-x-1">
                        <span>{b}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Đang phấn đấu rèn luyện để nhận huy hiệu tuần này.</span>
                  )}
                </div>
              </div>

              {/* Lịch sử điểm cộng / trừ */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Lịch Sử Chấm Điểm Gần Nhất</h4>
                {profileScores.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có bản ghi điểm thi đua nào.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {profileScores.map((sc) => (
                      <div key={sc.RecordID} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{sc.CriterionName}</div>
                          <div className="text-[11px] text-slate-500">
                            Ngày {sc.Date} • Do {sc.RecordedBy} ghi nhận {sc.Reason ? `– "${sc.Reason}"` : ''}
                          </div>
                        </div>
                        <span className={`font-black text-xs px-2 py-0.5 rounded-lg ${sc.Point > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {sc.Point > 0 ? `+${sc.Point}` : sc.Point}đ
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lời nhận xét */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Nhận Xét Từ Thầy Cô & Cán Bộ Lớp</h4>
                {profileComments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có nhận xét nào.</p>
                ) : (
                  <div className="space-y-2">
                    {profileComments.map((cm) => (
                      <div key={cm.CommentID} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs">
                        <div className="text-slate-700 italic mb-1">&ldquo;{cm.Comment}&rdquo;</div>
                        <div className="text-[10px] text-amber-800 font-bold">
                          — {cm.RecordedBy} ({cm.Date})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setProfileStudent(null)}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL XÁC NHẬN: ĐẶT LẠI ĐIỂM GỐC VỀ 0 */}
      {/* ======================================================== */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5 font-black text-base sm:text-lg">
                <RotateCcw className="w-5 h-5 text-amber-100" />
                <span>Đặt Lại Điểm Gốc Về 0</span>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-900 leading-relaxed">
                Hệ thống sẽ cập nhật <strong>Điểm khởi tạo (InitialScore)</strong> của toàn bộ <strong>{students.length} học sinh</strong> về <strong>0 điểm</strong> (áp dụng cơ chế thi đua tính từ mốc 0 điểm).
              </div>

              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearHistoryChecked}
                  onChange={(e) => setClearHistoryChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Đồng thời xóa các lượt chấm điểm và nhận xét cũ để bắt đầu kỳ thi đua mới hoàn toàn từ 0.
                </span>
              </label>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isResettingScores}
                  onClick={handleConfirmResetScores}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResettingScores ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Xác Nhận Đặt Về 0</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CĂN CHỈNH KÍCH THƯỚC VÀ PHÓNG TO KHUÔN MẶT AVATAR */}
      <AvatarCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        student={croppingStudent}
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSrc('');
          setCroppingStudent(null);
        }}
        onSave={handleSaveCroppedAvatar}
      />

      {/* MODAL KHO ẢNH HỌC SINH TỪ THƯ VIỆN POSTIMG LỚP 4A3 */}
      {galleryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <h3 className="font-extrabold text-base sm:text-lg">
                    Kho Ảnh Học Sinh Lớp 4A3 (Bộ Sưu Tập 35 Em)
                  </h3>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">
                  Nguồn: Thư viện ảnh học sinh lớp 4A3 (postimg.cc/gallery/zTfGxhN) – Đã lưu trữ vĩnh viễn trên máy chủ
                </p>
                {galleryTargetStudent && (
                  <div className="inline-flex items-center space-x-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold text-white">
                    <span>Đang gán cho học sinh:</span>
                    <span className="text-amber-200 underline">{galleryTargetStudent.FullName}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setGalleryPickerOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                {GALLERY_AVATARS.map((item) => {
                  const isCurrent = galleryForModalForm
                    ? studentModal.avatarUrl === item.url
                    : galleryTargetStudent?.AvatarURL === item.url;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectGalleryAvatar(item.url)}
                      className={`group relative rounded-2xl overflow-hidden border-2 p-1 bg-white transition-all cursor-pointer hover:scale-105 hover:shadow-md flex flex-col items-center ${
                        isCurrent
                          ? 'border-blue-600 ring-2 ring-blue-500/30'
                          : 'border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-full aspect-square rounded-xl object-cover"
                        loading="lazy"
                      />
                      <span className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full text-center">
                        HS {String(item.id).padStart(2, '0')}
                      </span>
                      {isCurrent && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="mt-5 p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Bạn cũng có thể tải ảnh riêng lẻ từ máy tính bất cứ lúc nào.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryPickerOpen(false);
                      avatarInputRef.current?.click();
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    Tải ảnh từ máy
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setGalleryPickerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
