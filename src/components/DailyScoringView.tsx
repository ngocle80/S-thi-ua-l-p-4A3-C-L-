import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Student,
  Team,
  Criterion,
  DailyScore,
  DailyComment,
  User,
  StudentScoreSummary,
} from '../types';
import {
  PlusCircle,
  MinusCircle,
  MessageSquare,
  Search,
  Filter,
  Calendar,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Send,
  Camera,
  Pencil,
  Loader2,
  Eye,
  Lock,
} from 'lucide-react';
import { AvatarCropModal } from './AvatarCropModal';
import { ClassRoleBadge } from './ClassRoleBadge';

interface DailyScoringViewProps {
  students: Student[];
  teams: Team[];
  criteria: Criterion[];
  summaries: StudentScoreSummary[];
  dailyComments: DailyComment[];
  currentUser: User | null;
  onAddScore: (data: { studentId: string; criterionId: string; date: string; customReason?: string }) => Promise<any>;
  onSaveComment: (data: { studentId: string; comment: string; date: string }) => Promise<any>;
  onDeleteComment: (commentId: string) => Promise<any>;
  onOpenLogin: () => void;
  onUpdateStudent?: (data: any) => Promise<any>;
}

export const DailyScoringView: React.FC<DailyScoringViewProps> = ({
  students,
  teams,
  criteria,
  summaries,
  dailyComments,
  currentUser,
  onAddScore,
  onSaveComment,
  onDeleteComment,
  onOpenLogin,
  onUpdateStudent,
}) => {
  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';
  const isViewer = currentUser?.Role === 'VIEWER';

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline edit name state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');

  // Avatar upload state & refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const targetAvatarStudentRef = useRef<Student | null>(null);
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);

  // Avatar crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [croppingStudent, setCroppingStudent] = useState<Student | null>(null);

  const handleTriggerAvatarUpload = (st: Student) => {
    if (!isAdmin) {
      showToast('Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền thay đổi ảnh học sinh!', 'error');
      return;
    }
    targetAvatarStudentRef.current = st;
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetStudent = targetAvatarStudentRef.current;
    if (!file || !targetStudent) return;

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
    if (!croppingStudent || !onUpdateStudent) return;
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
      showToast('Chỉ Giáo viên chủ nhiệm (Admin) mới có quyền sửa tên học sinh!', 'error');
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

    if (onUpdateStudent) {
      const res = await onUpdateStudent({
        StudentID: st.StudentID,
        FullName: trimmed,
      });
      showToast(res?.message || `Đã đổi tên học sinh thành "${trimmed}"!`);
    }
    setEditingStudentId(null);
  };

  // Modal State for scoring
  const [scoringModal, setScoringModal] = useState<{
    open: boolean;
    student: Student | null;
    type: 'PLUS' | 'MINUS';
    selectedCriterion: Criterion | null;
    customReason: string;
    isSubmitting: boolean;
  }>({
    open: false,
    student: null,
    type: 'PLUS',
    selectedCriterion: null,
    customReason: '',
    isSubmitting: false,
  });

  // Modal State for Commenting
  const [commentModal, setCommentModal] = useState<{
    open: boolean;
    student: Student | null;
    commentText: string;
    existingCommentId?: string;
    isSubmitting: boolean;
  }>({
    open: false,
    student: null,
    commentText: '',
    isSubmitting: false,
  });

  // Feedback banner
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filter students
  const filteredStudents = students
    .filter((s) => s.Status === 'ACTIVE')
    .filter((s) => {
      if (selectedTeam !== 'ALL' && s.TeamID !== selectedTeam) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.FullName.toLowerCase().includes(q) ||
          s.StudentCode.toLowerCase().includes(q)
        );
      }
      return true;
    });

  // Open Score Modal
  const handleOpenScoreModal = (student: Student, type: 'PLUS' | 'MINUS') => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (currentUser.Role === 'VIEWER') {
      showToast('Tài khoản người xem không có quyền chấm thi đua!', 'error');
      return;
    }

    // Role check for TO_TRUONG
    if (currentUser.Role === 'TO_TRUONG' && currentUser.Team && currentUser.Team !== student.TeamID) {
      showToast(`Bạn là Tổ trưởng của ${currentUser.Team}, chỉ được chấm điểm cho học sinh trong tổ của mình!`, 'error');
      return;
    }

    const availableCriteria = criteria.filter((c) => c.Status === 'ACTIVE' && c.Type === type);
    const defaultCrit = availableCriteria.length > 0 ? availableCriteria[0] : null;

    setScoringModal({
      open: true,
      student,
      type,
      selectedCriterion: defaultCrit,
      customReason: '',
      isSubmitting: false,
    });
  };

  // Submit Score
  const handleConfirmScore = async () => {
    if (!scoringModal.student || !scoringModal.selectedCriterion) return;

    setScoringModal((prev) => ({ ...prev, isSubmitting: true }));

    const res = await onAddScore({
      studentId: scoringModal.student.StudentID,
      criterionId: scoringModal.selectedCriterion.CriterionID,
      date: selectedDate,
      customReason: scoringModal.customReason,
    });

    setScoringModal((prev) => ({ ...prev, isSubmitting: false, open: false }));

    if (res.success) {
      showToast(res.message, 'success');
      if (scoringModal.type === 'PLUS' && scoringModal.selectedCriterion.Point >= 2) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } else {
      showToast(res.message, 'error');
    }
  };

  // Open Comment Modal
  const handleOpenCommentModal = (student: Student) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (currentUser.Role === 'VIEWER') {
      showToast('Tài khoản người xem không có quyền nhập nhận xét!', 'error');
      return;
    }

    const existing = dailyComments.find(
      (c) => c.StudentID === student.StudentID && c.Date === selectedDate
    );

    setCommentModal({
      open: true,
      student,
      commentText: existing ? existing.Comment : '',
      existingCommentId: existing?.CommentID,
      isSubmitting: false,
    });
  };

  // Save Comment
  const handleConfirmComment = async () => {
    if (!commentModal.student || !commentModal.commentText.trim()) {
      showToast('Vui lòng nhập nội dung nhận xét', 'error');
      return;
    }

    setCommentModal((prev) => ({ ...prev, isSubmitting: true }));

    const res = await onSaveComment({
      studentId: commentModal.student.StudentID,
      comment: commentModal.commentText.trim(),
      date: selectedDate,
    });

    setCommentModal((prev) => ({ ...prev, isSubmitting: false, open: false }));

    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Filter criteria for modal
  const modalCriteria = criteria.filter(
    (c) => c.Status === 'ACTIVE' && c.Type === scoringModal.type
  );

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-18 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-bold text-white transition-all transform animate-bounce ${
            feedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Thông báo chế độ Khách (Chỉ xem) */}
      {isViewer && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs sm:text-sm font-semibold flex items-center space-x-3 shadow-2xs">
          <div className="p-1.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-amber-900">Chế độ Khách (Chỉ xem):</span> Bạn có thể theo dõi đầy đủ bảng điểm thi đua và nhận xét nề nếp của lớp 4A3. Tính năng chấm điểm, nhận xét và đổi ảnh đã được khóa an toàn.
          </div>
        </div>
      )}

      {/* Header & Date / Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center space-x-2">
              <span className="text-blue-600">✍️</span>
              <span>Chấm Thi Đua Hằng Ngày</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Ghi nhận điểm cộng việc tốt, điểm trừ vi phạm và nhận xét hằng ngày
            </p>
          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-blue-900 shrink-0">Ngày chấm:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-extrabold text-blue-950 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Filter by Team & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1 border-t border-slate-100">
          {/* Team Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTeam('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedTeam === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất Cả Lớp 4A3 ({students.length})
            </button>
            {teams.map((t) => (
              <button
                key={t.TeamID}
                onClick={() => setSelectedTeam(t.TeamID)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedTeam === t.TeamID
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.TeamName}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:max-w-xs ml-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
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

      {/* Thông báo chế độ Khách (Chỉ xem) */}
      {isViewer && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-semibold flex items-center space-x-3 shadow-2xs">
          <div className="p-1.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-amber-900">Chế độ Khách (Chỉ xem):</span> Bạn có quyền theo dõi chi tiết điểm số, vi phạm, việc tốt và nhận xét thi đua hàng ngày của Lớp 4A3. Mọi thao tác chấm điểm, gửi nhận xét và đổi ảnh đã được khóa.
          </div>
        </div>
      )}

      {/* STUDENT CARDS LIST (Mobile-First Touch targets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredStudents.map((st) => {
          const sum = summaries.find((s) => s.student.StudentID === st.StudentID);
          const currentScore = sum ? sum.netScore : st.InitialScore;
          const todayStudentComment = dailyComments.find(
            (c) => c.StudentID === st.StudentID && c.Date === selectedDate
          );

          // Điểm hôm nay của học sinh
          const todayPoints = sum ? sum.todayScores.reduce((a, b) => a + b.Point, 0) : 0;

          return (
            <div
              key={st.StudentID}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header card: Avatar + Info + Score Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    {/* Interactive Avatar with Camera Upload */}
                    <div className="relative group shrink-0">
                      <img
                        src={st.AvatarURL || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                        alt={st.FullName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                      />
                      {/* Interactive Avatar with Camera Upload (Chỉ dành cho Admin) */}
                      {isAdmin ? (
                        <>
                          {/* Hover camera overlay */}
                          <button
                            type="button"
                            onClick={() => handleTriggerAvatarUpload(st)}
                            title="Chỉ Admin/GVCN mới có quyền thay đổi ảnh học sinh"
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
                      ) : null}
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
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                            {st.FullName}
                          </h3>
                          <ClassRoleBadge role={st.ClassRole} size="xs" />
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => startEditName(st)}
                              title="Chỉ Admin/GVCN mới có quyền sửa tên học sinh"
                              className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 active:scale-95 border border-blue-200 shadow-2xs transition-all cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-slate-500 font-medium">
                        {st.TeamName} • Mã {st.StudentCode}
                      </div>
                      <div className="text-[11px] font-semibold text-blue-600 mt-0.5">
                        Điểm khởi tạo: {st.InitialScore}đ
                      </div>
                    </div>
                  </div>

                  {/* Net Score Pill */}
                  <div className="text-right shrink-0">
                    <div className="text-xs uppercase font-extrabold text-slate-400">Tổng điểm</div>
                    <div className={`text-xl font-black leading-none ${currentScore > 0 ? 'text-blue-700' : currentScore < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {currentScore > 0 ? `+${currentScore}` : currentScore}
                    </div>
                    {todayPoints !== 0 && (
                      <div className={`text-[11px] font-bold mt-1 ${todayPoints > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Hôm nay: {todayPoints > 0 ? `+${todayPoints}` : todayPoints}
                      </div>
                    )}
                  </div>
                </div>

                {/* Today's Comment Box */}
                {todayStudentComment && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                    <div className="font-bold flex items-center gap-1 text-[11px] text-amber-700 mb-0.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Nhận xét ngày {selectedDate}:</span>
                    </div>
                    <p className="italic">&ldquo;{todayStudentComment.Comment}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS: Touch-friendly large targets (>= 44px) */}
              <div className="pt-2 border-t border-slate-100">
                {isViewer ? (
                  <div className="h-11 px-3 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs flex items-center justify-center space-x-2 border border-slate-200 select-none">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span>Tài khoản Khách: Chỉ xem (Đã khóa mọi thao tác)</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {/* Nút cộng điểm việc tốt */}
                    <button
                      onClick={() => handleOpenScoreModal(st, 'PLUS')}
                      className="h-11 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <ThumbsUp className="w-4 h-4 shrink-0" />
                      <span>+ Việc tốt</span>
                    </button>

                    {/* Nút trừ điểm vi phạm */}
                    <button
                      onClick={() => handleOpenScoreModal(st, 'MINUS')}
                      className="h-11 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-sm shadow-rose-600/30 transition-all cursor-pointer"
                    >
                      <ThumbsDown className="w-4 h-4 shrink-0" />
                      <span>- Vi phạm</span>
                    </button>

                    {/* Nút nhận xét */}
                    <button
                      onClick={() => handleOpenCommentModal(st)}
                      className="h-11 px-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 border border-slate-200/80 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-blue-600" />
                      <span className="hidden sm:inline">Nhận xét</span>
                      <span className="sm:hidden">Ghi lời</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* MODAL CHẤM ĐIỂM CỘNG / TRỪ (Mobile-Optimized) */}
      {/* ======================================================== */}
      {scoringModal.open && scoringModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div
              className={`p-4 sm:p-5 text-white flex items-center justify-between ${
                scoringModal.type === 'PLUS'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-r from-rose-600 to-red-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-white/20">
                  {scoringModal.type === 'PLUS' ? (
                    <ThumbsUp className="w-6 h-6 text-white" />
                  ) : (
                    <ThumbsDown className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {scoringModal.type === 'PLUS' ? 'Ghi Nhận Việc Tốt (+)' : 'Nhắc Nhở Vi Phạm (-)'}
                  </h3>
                  <div className="flex items-center space-x-2 flex-wrap text-xs text-white/95 mt-0.5">
                    <span>Học sinh: <strong className="underline">{scoringModal.student.FullName}</strong></span>
                    <ClassRoleBadge role={scoringModal.student.ClassRole} size="xs" variant="solid" />
                    <span>({scoringModal.student.TeamName})</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setScoringModal((p) => ({ ...p, open: false }))}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Bước 1: Chọn Tiêu Chí Thi Đua ({scoringModal.type === 'PLUS' ? 'Điểm Cộng' : 'Điểm Trừ'})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {modalCriteria.map((c) => {
                    const isSelected = scoringModal.selectedCriterion?.CriterionID === c.CriterionID;
                    return (
                      <div
                        key={c.CriterionID}
                        onClick={() => setScoringModal((prev) => ({ ...prev, selectedCriterion: c }))}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? scoringModal.type === 'PLUS'
                              ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                              : 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-800">{c.CriterionName}</div>
                          <div className="text-[11px] text-slate-500">{c.Category} • {c.Description}</div>
                        </div>

                        <div
                          className={`font-black text-sm px-2.5 py-1 rounded-lg shrink-0 ml-2 ${
                            c.Point > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.Point > 0 ? `+${c.Point}` : c.Point}đ
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú chi tiết */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Bước 2: Ghi Chú Cụ Thể (Nếu có)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giơ tay phát biểu 3 lần môn Toán; Quên mang vở bài tập..."
                  value={scoringModal.customReason}
                  onChange={(e) =>
                    setScoringModal((prev) => ({ ...prev, customReason: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Thông tin xác nhận */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mức điểm áp dụng:</span>
                  <span
                    className={`font-black ${
                      scoringModal.selectedCriterion && scoringModal.selectedCriterion.Point > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {scoringModal.selectedCriterion
                      ? `${scoringModal.selectedCriterion.Point > 0 ? '+' : ''}${scoringModal.selectedCriterion.Point} điểm`
                      : '0 điểm'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Người ghi nhận:</span>
                  <span className="font-bold text-slate-700">
                    {currentUser?.FullName} ({currentUser?.Role})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày ghi:</span>
                  <span className="font-bold text-slate-700">{selectedDate}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setScoringModal((p) => ({ ...p, open: false }))}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={!scoringModal.selectedCriterion || scoringModal.isSubmitting}
                onClick={handleConfirmScore}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white shadow-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  scoringModal.type === 'PLUS'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                } disabled:opacity-50`}
              >
                {scoringModal.isSubmitting ? (
                  <span>Đang ghi vào Sheets...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>XÁC NHẬN {scoringModal.type === 'PLUS' ? 'CỘNG ĐIỂM' : 'TRỪ ĐIỂM'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL NHẬP NHẬN XÉT HỌC SINH */}
      {/* ======================================================== */}
      {commentModal.open && commentModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] sm:max-h-[88vh] my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
            <div className="shrink-0 p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  Nhận Xét Ngày {selectedDate}
                </h3>
              </div>
              <button
                onClick={() => setCommentModal((p) => ({ ...p, open: false }))}
                className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <img
                  src={commentModal.student.AvatarURL}
                  alt={commentModal.student.FullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <div className="font-bold text-sm text-slate-800">{commentModal.student.FullName}</div>
                    <ClassRoleBadge role={commentModal.student.ClassRole} size="xs" />
                  </div>
                  <div className="text-xs text-slate-500">{commentModal.student.TeamName}</div>
                </div>
              </div>

              {isViewer ? (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-center space-x-2 font-medium">
                  <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tài khoản Khách chỉ có quyền xem nhận xét, không thể gửi nhận xét mới.</span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Nội dung nhận xét của Thầy/Cô / Cán bộ lớp:
                  </label>
                  <textarea
                    rows={4}
                    value={commentModal.commentText}
                    onChange={(e) =>
                      setCommentModal((prev) => ({ ...prev, commentText: e.target.value }))
                    }
                    placeholder="Ví dụ: Em rất tiến bộ trong giờ học Toán, có tinh thần tương trợ bạn bè tốt..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setCommentModal((p) => ({ ...p, open: false }))}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {!isViewer && (
                <button
                  type="button"
                  disabled={commentModal.isSubmitting || !commentModal.commentText.trim()}
                  onClick={handleConfirmComment}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{commentModal.existingCommentId ? 'Cập Nhật Nhận Xét' : 'Lưu Nhận Xét'}</span>
                </button>
              )}
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
    </div>
  );
};
