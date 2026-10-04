import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  UserCheck,
  X,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Settings2,
  Check,
  Save,
  Users,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  Crown,
  BookOpen,
  Music,
  Activity,
  Laptop,
  Palette,
  Globe,
} from 'lucide-react';
import { AppConfig, Student, Team, User } from '../types';
import { ClassLogo } from './ClassLogo';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  config: AppConfig;
  currentUser?: User | null;
  students?: Student[];
  teams?: Team[];
  usersList?: User[];
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onUploadLogo?: (fileDataUrl: string) => Promise<{ success: boolean; message?: string }>;
  onSavePersonnel?: (data: {
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
  }) => Promise<{ success: boolean; message?: string }>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onClose,
  config,
  currentUser,
  students = [],
  teams = [],
  usersList = [],
  onLogin,
  onUploadLogo,
  onSavePersonnel,
}) => {
  const [username, setUsername] = useState('gvcn');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';

  // Personnel Editing State
  const [isEditingPersonnel, setIsEditingPersonnel] = useState(false);
  const [personnelTab, setPersonnelTab] = useState<'bcs' | 'gv'>('bcs');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSavingPersonnel, setIsSavingPersonnel] = useState(false);

  // Personnel Form State
  const [personnelForm, setPersonnelForm] = useState({
    loptruongName: 'Thiều An',
    phoTratTuName: 'Nguyễn Mai Bình An',
    phoLaoDongName: 'Trần Huỳnh Như',
    to1Leader: 'Nguyễn Khánh Băng',
    to2Leader: 'Huỳnh Duy Cường',
    to3Leader: 'Trần Nguyễn Tấn Lộc',
    to4Leader: 'Nguyễn Ngọc Nhi',
    to5Leader: 'Đặng Lương Gia Quí',
    gvcnName: 'Cô Phạm Ngọc Lê',
    gvAmNhacName: 'Cô Thảo',
    gvTheDucName: 'Thầy Thanh',
    gvTinHocName: 'Cô Diễm',
    gvMiThuatName: 'Cô Huỳnh Anh',
    gvTiengAnhName: 'Cô Phương',
  });

  // Load latest personnel on open or usersList change
  useEffect(() => {
    if (!open) return;

    const findStudentByRole = (roleKeyword: string) => {
      const s = students.find((st) => st.ClassRole && st.ClassRole.toLowerCase().includes(roleKeyword.toLowerCase()));
      return s ? s.FullName : null;
    };

    const findTeamLeaderStudent = (teamId: string) => {
      const s = students.find((st) => st.TeamID === teamId && st.ClassRole && st.ClassRole.includes('Tổ trưởng'));
      return s ? s.FullName : null;
    };

    const findUserName = (uName: string, fallback: string) => {
      const u = usersList.find((x) => x.Username === uName);
      return u && u.FullName ? u.FullName : fallback;
    };

    const findTeamLeader = (teamId: string, fallback: string) => {
      const tm = teams.find((t) => t.TeamID === teamId);
      return tm && tm.TeamLeaderName ? tm.TeamLeaderName : fallback;
    };

    setPersonnelForm({
      loptruongName: findStudentByRole('Lớp trưởng') || findUserName('loptruong', config.ClassPresident || 'Thiều An'),
      phoTratTuName: findStudentByRole('trật tự') || findUserName('photrattu', 'Nguyễn Mai Bình An'),
      phoLaoDongName: findStudentByRole('lao động') || findUserName('pholaodong', 'Trần Huỳnh Như'),
      to1Leader: findTeamLeaderStudent('TO_1') || findTeamLeader('TO_1', findUserName('totruong1', 'Nguyễn Khánh Băng')),
      to2Leader: findTeamLeaderStudent('TO_2') || findTeamLeader('TO_2', findUserName('totruong2', 'Huỳnh Duy Cường')),
      to3Leader: findTeamLeaderStudent('TO_3') || findTeamLeader('TO_3', findUserName('totruong3', 'Trần Nguyễn Tấn Lộc')),
      to4Leader: findTeamLeaderStudent('TO_4') || findTeamLeader('TO_4', findUserName('totruong4', 'Nguyễn Ngọc Nhi')),
      to5Leader: findTeamLeaderStudent('TO_5') || findTeamLeader('TO_5', findUserName('totruong5', 'Đặng Lương Gia Quí')),
      gvcnName: findUserName('gvcn', config.TeacherInCharge || 'Cô Phạm Ngọc Lê'),
      gvAmNhacName: findUserName('gv_amnhac', 'Cô Thảo'),
      gvTheDucName: findUserName('gv_theduc', 'Thầy Thanh'),
      gvTinHocName: findUserName('gv_tinhoc', 'Cô Diễm'),
      gvMiThuatName: findUserName('gv_mithuat', 'Cô Huỳnh Anh'),
      gvTiengAnhName: findUserName('gv_tienganh', 'Cô Phương'),
    });
  }, [open, usersList, teams, config, students]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await onLogin(username.trim(), password);
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Đăng nhập không thành công.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaultLogo = async () => {
    if (onUploadLogo && confirm('Bạn có muốn khôi phục biểu tượng logo mặc định của ứng dụng?')) {
      await onUploadLogo('');
    }
  };

  const handleSavePersonnelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSavePersonnel) return;

    setIsSavingPersonnel(true);
    setSaveSuccessMsg(null);
    try {
      const res = await onSavePersonnel(personnelForm);
      if (res.success) {
        setSaveSuccessMsg('✅ Đã lưu phân công Ban cán sự & GV chuyên trách vĩnh viễn!');
        setTimeout(() => {
          setSaveSuccessMsg(null);
          setIsEditingPersonnel(false);
        }, 1500);
      } else {
        alert(res.message || 'Lỗi khi lưu phân công.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu.');
    } finally {
      setIsSavingPersonnel(false);
    }
  };

  // Helper to extract short display name
  const getShortName = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length <= 2) return fullName;
    return parts.slice(-2).join(' ');
  };

  // Dynamic quick accounts based on current personnel form
  const quickAccounts = [
    // Ban cán sự & GVCN
    {
      label: 'Cô Lê (GVCN)',
      user: 'gvcn',
      role: 'ADMIN_GVCN',
      color: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
    },
    {
      label: `${getShortName(personnelForm.loptruongName)} (Lớp Trưởng)`,
      user: 'loptruong',
      role: 'LOP_TRUONG',
      color: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
    },
    {
      label: `${getShortName(personnelForm.phoTratTuName)} (Phó Trật Tự)`,
      user: 'photrattu',
      role: 'PHO_TRAT_TU',
      color: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
    },
    {
      label: `${getShortName(personnelForm.phoLaoDongName)} (Phó Lao Động)`,
      user: 'pholaodong',
      role: 'PHO_LAO_DONG',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    },
    // 5 Tổ trưởng
    {
      label: `${getShortName(personnelForm.to1Leader)} (Tổ Trưởng 1)`,
      user: 'totruong1',
      role: 'TO_TRUONG',
      color: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
    },
    {
      label: `${getShortName(personnelForm.to2Leader)} (Tổ Trưởng 2)`,
      user: 'totruong2',
      role: 'TO_TRUONG',
      color: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
    },
    {
      label: `${getShortName(personnelForm.to3Leader)} (Tổ Trưởng 3)`,
      user: 'totruong3',
      role: 'TO_TRUONG',
      color: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
    },
    {
      label: `${getShortName(personnelForm.to4Leader)} (Tổ Trưởng 4)`,
      user: 'totruong4',
      role: 'TO_TRUONG',
      color: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
    },
    {
      label: `${getShortName(personnelForm.to5Leader)} (Tổ Trưởng 5)`,
      user: 'totruong5',
      role: 'TO_TRUONG',
      color: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
    },
    // GV chuyên trách
    {
      label: `${personnelForm.gvTiengAnhName || 'Cô Phương'} (GV Tiếng Anh)`,
      user: 'gv_tienganh',
      role: 'GIAO_VIEN_BO_MON',
      color: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold ring-1 ring-rose-400 shadow-2xs',
    },
    {
      label: `${personnelForm.gvAmNhacName} (GV Nhạc)`,
      user: 'gv_amnhac',
      role: 'GIAO_VIEN_BO_MON',
      color: 'bg-pink-100 text-pink-900 border-pink-300 font-bold',
    },
    {
      label: `${personnelForm.gvTheDucName} (GV Thể Dục)`,
      user: 'gv_theduc',
      role: 'GIAO_VIEN_BO_MON',
      color: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
    },
    {
      label: `${personnelForm.gvTinHocName} (GV Tin Học)`,
      user: 'gv_tinhoc',
      role: 'GIAO_VIEN_BO_MON',
      color: 'bg-teal-100 text-teal-900 border-teal-300 font-bold',
    },
    {
      label: `${personnelForm.gvMiThuatName} (GV Mĩ Thuật)`,
      user: 'gv_mithuat',
      role: 'GIAO_VIEN_BO_MON',
      color: 'bg-violet-100 text-violet-900 border-violet-300 font-bold',
    },
    {
      label: 'Ban Phụ Huynh (Khách - Chỉ Xem)',
      user: 'khach',
      role: 'VIEWER',
      color: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className={`bg-white rounded-3xl w-full ${isEditingPersonnel ? 'max-w-2xl' : 'max-w-md'} max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150 my-auto transition-all`}>
        {/* Top Class Logo Banner with Custom Background Image */}
        <div
          className="shrink-0 relative text-white text-center rounded-t-3xl overflow-hidden"
          style={{
            backgroundImage: "url('https://i.postimg.cc/vZg1NmVx/Tong-ket-lop1.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Semi-transparent overlay to ensure text and logo remain crisp and legible */}
          <div className="p-5 sm:p-6 bg-gradient-to-b from-black/45 via-slate-950/50 to-black/65 backdrop-blur-[0.5px]">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Interactive Logo with Camera Upload Button (Chỉ dành cho Admin) */}
            <div className="flex flex-col items-center">
              <ClassLogo
                logoUrl={config.LogoURL}
                size={isEditingPersonnel ? 'md' : 'lg'}
                editable={isAdmin}
                onUploadLogo={onUploadLogo}
                className="mb-2 sm:mb-3"
              />

              <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200 drop-shadow-sm">
                {config.SchoolName}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 drop-shadow-md">
                {config.AppName}
              </h2>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 mt-1 rounded-full bg-black/40 backdrop-blur-xs text-[11px] font-bold text-amber-200 border border-white/20">
                <span>Niên khóa: {config.AcademicYear}</span>
              </div>

              {!isEditingPersonnel && isAdmin && (
                <p className="text-[11px] text-blue-100 mt-2 max-w-xs leading-tight drop-shadow-xs">
                  📸 <em>Bấm vào biểu tượng máy ảnh trên logo để tải ảnh mới từ máy tính (.png, .jpg) và lưu vĩnh viễn.</em>
                </p>
              )}

              {config.LogoURL && !isEditingPersonnel && isAdmin && (
                <button
                  type="button"
                  onClick={handleResetDefaultLogo}
                  className="mt-2 text-[11px] text-amber-300 hover:text-white underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục logo mặc định</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: FORM CHỈNH SỬA PHÂN CÔNG BAN CÁN SỰ & GV CHUYÊN TRÁCH */}
        {/* ======================================================== */}
        {isEditingPersonnel ? (
          <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPersonnel(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-1.5">
                    <Settings2 className="w-4 h-4 text-blue-600" />
                    <span>Cập Nhật Ban Cán Sự & GV Chuyên Trách</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Phân công 1 Lớp trưởng, 2 Lớp phó, 5 Tổ trưởng và tên GV các môn
                  </p>
                </div>
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPersonnelTab('bcs')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    personnelTab === 'bcs' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👑 Ban Cán Sự
                </button>
                <button
                  type="button"
                  onClick={() => setPersonnelTab('gv')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    personnelTab === 'gv' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👩‍🏫 GV Chuyên Trách
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePersonnelSubmit} className="space-y-4">
              {/* TAB 1: BAN CÁN SỰ LỚP (1 Lớp trưởng, 2 Lớp phó, 5 Tổ trưởng) */}
              {personnelTab === 'bcs' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Bạn có thể chọn nhanh từ danh sách 35 học sinh Lớp 4A3 đã được phân theo từng Tổ, hoặc gõ nhập trực tiếp họ tên.
                    </span>
                  </div>

                  {/* Lớp trưởng & 2 Lớp phó */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200">
                      <label className="block text-xs font-black text-amber-900 mb-1 flex items-center space-x-1">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>1. Lớp Trưởng</span>
                      </label>
                      <input
                        list="students-list"
                        type="text"
                        required
                        value={personnelForm.loptruongName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, loptruongName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        placeholder="Chọn hoặc nhập tên..."
                      />
                      <span className="text-[10px] text-amber-700 mt-1 block">Tài khoản: loptruong</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-200">
                      <label className="block text-xs font-black text-purple-900 mb-1 flex items-center space-x-1">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>2. Lớp Phó Trật Tự</span>
                      </label>
                      <input
                        list="students-list"
                        type="text"
                        required
                        value={personnelForm.phoTratTuName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, phoTratTuName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-purple-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        placeholder="Chọn hoặc nhập tên..."
                      />
                      <span className="text-[10px] text-purple-700 mt-1 block">Tài khoản: photrattu</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                      <label className="block text-xs font-black text-emerald-900 mb-1 flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>3. Lớp Phó Lao Động</span>
                      </label>
                      <input
                        list="students-list"
                        type="text"
                        required
                        value={personnelForm.phoLaoDongName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, phoLaoDongName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Chọn hoặc nhập tên..."
                      />
                      <span className="text-[10px] text-emerald-700 mt-1 block">Tài khoản: pholaodong</span>
                    </div>
                  </div>

                  {/* 5 Tổ trưởng */}
                  <div className="pt-2">
                    <h4 className="text-xs font-black uppercase text-slate-700 mb-2 flex items-center space-x-1">
                      <span>🚩 Danh sách 5 Tổ Trưởng</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tổ trưởng Tổ 1 (Sơn Ca)
                        </label>
                        <input
                          list="students-list-to1"
                          type="text"
                          required
                          value={personnelForm.to1Leader}
                          onChange={(e) => setPersonnelForm((p) => ({ ...p, to1Leader: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">TK: totruong1</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tổ trưởng Tổ 2 (Họa Mi)
                        </label>
                        <input
                          list="students-list-to2"
                          type="text"
                          required
                          value={personnelForm.to2Leader}
                          onChange={(e) => setPersonnelForm((p) => ({ ...p, to2Leader: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">TK: totruong2</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tổ trưởng Tổ 3 (Đại Bàng)
                        </label>
                        <input
                          list="students-list-to3"
                          type="text"
                          required
                          value={personnelForm.to3Leader}
                          onChange={(e) => setPersonnelForm((p) => ({ ...p, to3Leader: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">TK: totruong3</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tổ trưởng Tổ 4 (Kim Đồng)
                        </label>
                        <input
                          list="students-list-to4"
                          type="text"
                          required
                          value={personnelForm.to4Leader}
                          onChange={(e) => setPersonnelForm((p) => ({ ...p, to4Leader: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">TK: totruong4</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tổ trưởng Tổ 5 (Măng Non)
                        </label>
                        <input
                          list="students-list-to5"
                          type="text"
                          required
                          value={personnelForm.to5Leader}
                          onChange={(e) => setPersonnelForm((p) => ({ ...p, to5Leader: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5 block">TK: totruong5</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GIÁO VIÊN CHỦ NHIỆM & GIÁO VIÊN CÁC MÔN CHUYÊN TRÁCH */}
              {personnelTab === 'gv' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                    <GraduationCap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Thông tin giáo viên phụ trách các môn chuyên biệt theo phân công nhà trường. Giáo viên có thể đăng nhập để chấm điểm thi đua môn của mình.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                      <label className="block text-xs font-black text-amber-900 mb-1 flex items-center space-x-1.5">
                        <GraduationCap className="w-4 h-4 text-amber-700" />
                        <span>Giáo Viên Chủ Nhiệm (GVCN)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={personnelForm.gvcnName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, gvcnName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-800"
                      />
                      <span className="text-[10px] text-amber-700 mt-1 block">Tài khoản: gvcn (Phê duyệt sổ)</span>
                    </div>

                    <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-200">
                      <label className="block text-xs font-black text-pink-900 mb-1 flex items-center space-x-1.5">
                        <Music className="w-4 h-4 text-pink-600" />
                        <span>Giáo Viên Âm Nhạc</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={personnelForm.gvAmNhacName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, gvAmNhacName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-pink-300 text-xs font-bold text-slate-800"
                        placeholder="Ví dụ: Cô Thảo"
                      />
                      <span className="text-[10px] text-pink-700 mt-1 block">Tài khoản: gv_amnhac</span>
                    </div>

                    <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-200">
                      <label className="block text-xs font-black text-orange-900 mb-1 flex items-center space-x-1.5">
                        <Activity className="w-4 h-4 text-orange-600" />
                        <span>Giáo Viên Thể Dục</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={personnelForm.gvTheDucName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, gvTheDucName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-orange-300 text-xs font-bold text-slate-800"
                        placeholder="Ví dụ: Thầy Thanh"
                      />
                      <span className="text-[10px] text-orange-700 mt-1 block">Tài khoản: gv_theduc</span>
                    </div>

                    <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-200">
                      <label className="block text-xs font-black text-teal-900 mb-1 flex items-center space-x-1.5">
                        <Laptop className="w-4 h-4 text-teal-600" />
                        <span>Giáo Viên Tin Học & Công Nghệ</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={personnelForm.gvTinHocName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, gvTinHocName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-teal-300 text-xs font-bold text-slate-800"
                        placeholder="Ví dụ: Cô Diễm"
                      />
                      <span className="text-[10px] text-teal-700 mt-1 block">Tài khoản: gv_tinhoc</span>
                    </div>

                    <div className="p-3 bg-violet-50/50 rounded-2xl border border-violet-200">
                      <label className="block text-xs font-black text-violet-900 mb-1 flex items-center space-x-1.5">
                        <Palette className="w-4 h-4 text-violet-600" />
                        <span>Giáo Viên Mĩ Thuật</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={personnelForm.gvMiThuatName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, gvMiThuatName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-violet-300 text-xs font-bold text-slate-800"
                        placeholder="Ví dụ: Cô Huỳnh Anh"
                      />
                      <span className="text-[10px] text-violet-700 mt-1 block">Tài khoản: gv_mithuat</span>
                    </div>

                    <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-200">
                      <label className="block text-xs font-black text-rose-900 mb-1 flex items-center space-x-1.5">
                        <Globe className="w-4 h-4 text-rose-600" />
                        <span>Giáo Viên Tiếng Anh</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={personnelForm.gvTiengAnhName}
                        onChange={(e) => setPersonnelForm((p) => ({ ...p, gvTiengAnhName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-rose-300 text-xs font-bold text-slate-800"
                        placeholder="Ví dụ: Cô Phương"
                      />
                      <span className="text-[10px] text-rose-700 mt-1 block">Tài khoản: gv_tienganh (Mật khẩu: 123456)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Datalists for autocompletion */}
              <datalist id="students-list">
                {students.map((s) => (
                  <option key={s.StudentID} value={s.FullName}>
                    {s.StudentCode} - {s.TeamName}
                  </option>
                ))}
              </datalist>
              <datalist id="students-list-to1">
                {students.filter((s) => s.TeamID === 'TO_1').map((s) => (
                  <option key={s.StudentID} value={s.FullName} />
                ))}
              </datalist>
              <datalist id="students-list-to2">
                {students.filter((s) => s.TeamID === 'TO_2').map((s) => (
                  <option key={s.StudentID} value={s.FullName} />
                ))}
              </datalist>
              <datalist id="students-list-to3">
                {students.filter((s) => s.TeamID === 'TO_3').map((s) => (
                  <option key={s.StudentID} value={s.FullName} />
                ))}
              </datalist>
              <datalist id="students-list-to4">
                {students.filter((s) => s.TeamID === 'TO_4').map((s) => (
                  <option key={s.StudentID} value={s.FullName} />
                ))}
              </datalist>
              <datalist id="students-list-to5">
                {students.filter((s) => s.TeamID === 'TO_5').map((s) => (
                  <option key={s.StudentID} value={s.FullName} />
                ))}
              </datalist>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditingPersonnel(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Quay Lại Đăng Nhập
                </button>

                <button
                  type="submit"
                  disabled={isSavingPersonnel}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/30 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPersonnel ? 'Đang lưu vào máy chủ...' : 'Lưu Phân Công Vĩnh Viễn'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: GIAO DIỆN ĐĂNG NHẬP CHÍNH */
          /* ======================================================== */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Login Section with Prominent Edit Personnel Button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">
                  Đăng Nhập Nhanh 1-Chạm (Kiểm Thử Đa Vai Trò):
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonnel(true)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] border border-blue-200 transition-all cursor-pointer shadow-2xs"
                    title="Chỉnh sửa danh sách Ban cán sự (1 Lớp trưởng, 2 Lớp phó, 5 Tổ trưởng) và GV chuyên trách"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chỉnh sửa BCS & GV</span>
                  </button>
                )}
              </div>

              {/* Grouped Chips */}
              <div className="space-y-2">
                {/* 1. Ban Cán Sự & GVCN */}
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-700/80 mb-1 block">
                    ★ Ban Cán Sự Lớp & GVCN:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickAccounts.slice(0, 4).map((acc) => (
                      <button
                        key={acc.user}
                        type="button"
                        onClick={() => {
                          setUsername(acc.user);
                          setPassword('123456');
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${acc.color} ${
                          username === acc.user ? 'ring-2 ring-blue-600 ring-offset-1 font-black shadow-xs' : 'hover:opacity-85'
                        }`}
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. 5 Tổ Trưởng */}
                <div>
                  <span className="text-[10px] font-black uppercase text-cyan-700/80 mb-1 block">
                    🚩 5 Tổ Trưởng:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickAccounts.slice(4, 9).map((acc) => (
                      <button
                        key={acc.user}
                        type="button"
                        onClick={() => {
                          setUsername(acc.user);
                          setPassword('123456');
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${acc.color} ${
                          username === acc.user ? 'ring-2 ring-blue-600 ring-offset-1 font-black shadow-xs' : 'hover:opacity-85'
                        }`}
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Giáo Viên Chuyên Trách / Bộ Môn */}
                <div>
                  <span className="text-[10px] font-black uppercase text-rose-700/80 mb-1 flex items-center justify-between">
                    <span>👩‍🏫 Giáo Viên Bộ Môn (Chấm Điểm Môn Phụ Trách):</span>
                    <span className="text-[9px] text-rose-500 font-bold">Mới thêm: Cô Phương (Tiếng Anh)</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickAccounts.slice(9, 14).map((acc) => (
                      <button
                        key={acc.user}
                        type="button"
                        onClick={() => {
                          setUsername(acc.user);
                          setPassword('123456');
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${acc.color} ${
                          username === acc.user ? 'ring-2 ring-blue-600 ring-offset-1 font-black shadow-xs' : 'hover:opacity-85'
                        }`}
                      >
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Thành Viên Khách (Chỉ Xem) */}
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 mb-1 block">
                    👁️ Thành Viên Khách (Chỉ Xem Dữ Liệu):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {quickAccounts.slice(14).map((acc) => (
                      <button
                        key={acc.user}
                        type="button"
                        onClick={() => {
                          setUsername(acc.user);
                          setPassword('123456');
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${acc.color} ${
                          username === acc.user ? 'ring-2 ring-blue-600 ring-offset-1 font-black shadow-xs' : 'hover:opacity-85'
                        }`}
                      >
                        {acc.label}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-500 italic">
                      (Chỉ xem bảng điểm, xếp hạng & báo cáo; không được thao tác bất kỳ dữ liệu nào)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Đăng nhập */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên Đăng Nhập</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username (ví dụ: gvcn, loptruong, gv_tienganh, cophuong, khach)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mật Khẩu</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu mặc định: 123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP HỆ THỐNG'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quy định phân quyền */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
              <div className="font-extrabold flex items-center space-x-1.5 text-amber-950">
                <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Quy định bảo mật & Phân quyền hệ thống:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[10.5px]">
                <li><strong className="text-amber-900">Quản trị viên (Admin - GVCN):</strong> Toàn quyền quản trị, là thành viên duy nhất được đổi ảnh logo, hình nền lớp và avatar học sinh.</li>
                <li><strong className="text-rose-900">GV Bộ môn (Cô Phương - Tiếng Anh...):</strong> Chấm điểm thi đua môn phụ trách.</li>
                <li><strong className="text-slate-900">Thành viên Khách:</strong> Chỉ được xem dữ liệu, không được thao tác bất kỳ thông tin nào.</li>
              </ul>
            </div>

            <p className="text-[11px] text-center text-slate-400 pt-0.5">
              Dữ liệu tài khoản và logo được lưu trữ trong Google Spreadsheet. Mật khẩu được mã hóa bảo mật SHA-256.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
