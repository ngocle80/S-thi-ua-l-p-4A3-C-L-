import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  ShieldCheck,
  UserPlus,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';

interface UserManagementViewProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (data: any) => Promise<any>;
  onDisableUser: (userId: string) => Promise<any>;
  onOpenLogin: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onDisableUser,
  onOpenLogin,
}) => {
  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';

  const [modal, setModal] = useState({
    open: false,
    username: '',
    fullName: '',
    role: 'TO_TRUONG' as UserRole,
    team: 'Tổ 1',
    subject: '',
    password: '',
    isSubmitting: false,
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Chỉ GVCN mới có quyền cấp tài khoản!');
      return;
    }

    setModal((p) => ({ ...p, isSubmitting: true }));
    const res = await onAddUser({
      Username: modal.username.trim(),
      FullName: modal.fullName.trim(),
      Role: modal.role,
      Team: modal.team,
      Subject: modal.subject,
      Password: modal.password || '123456',
    });
    setModal((p) => ({ ...p, isSubmitting: false, open: false }));
    showToast(res.message);
  };

  const handleToggleStatus = async (u: User) => {
    if (!isAdmin) {
      showToast('Chỉ GVCN mới có quyền khóa tài khoản!');
      return;
    }
    const res = await onDisableUser(u.UserID);
    showToast(res.message);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {toast && (
        <div className="fixed top-18 right-4 z-50 px-4 py-3 rounded-xl bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center space-x-2">
            <span className="text-blue-600">👥</span>
            <span>Tài Khoản & Phân Quyền Lớp 4A3</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Quản lý tài khoản cán bộ lớp, giáo viên bộ môn và phân quyền theo Role-Based Access Control (RBAC)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModal((p) => ({ ...p, open: true }))}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/30 flex items-center space-x-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cấp Tài Khoản Mới</span>
          </button>
        )}
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-800 mb-3 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>Ma Trận Phân Quyền Chi Tiết (RBAC)</span>
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border border-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200">Vai Trò (Role)</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Người Đảm Nhiệm</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Quyền Chấm Điểm</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Quyền Nhận Xét</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Quản Trị Hệ Thống / Học Sinh</th>
                <th className="py-2.5 px-3">Xuất Excel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-black text-amber-800">ADMIN_GVCN</td>
                <td className="py-2 px-3 border-r border-slate-200">
                  {users.find((u) => u.Role === 'ADMIN_GVCN')?.FullName || 'Cô Phạm Ngọc Lê'}
                </td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Toàn lớp</td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Toàn lớp</td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Toàn quyền (CRUD)</td>
                <td className="py-2 px-3 text-emerald-600 font-bold">Có</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-black text-blue-800">LOP_TRUONG</td>
                <td className="py-2 px-3 border-r border-slate-200">
                  {users.find((u) => u.Role === 'LOP_TRUONG')?.FullName || 'Thiều An'}
                </td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Toàn lớp</td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Toàn lớp</td>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400">Không</td>
                <td className="py-2 px-3 text-emerald-600 font-bold">Có</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-black text-purple-800">PHO_TRAT_TU</td>
                <td className="py-2 px-3 border-r border-slate-200">
                  {users.find((u) => u.Role === 'PHO_TRAT_TU')?.FullName || 'Nguyễn Mai Bình An'}
                </td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Nề nếp, trật tự, truy bài</td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Có</td>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400">Không</td>
                <td className="py-2 px-3 text-emerald-600 font-bold">Có</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-black text-emerald-800">PHO_LAO_DONG</td>
                <td className="py-2 px-3 border-r border-slate-200">
                  {users.find((u) => u.Role === 'PHO_LAO_DONG')?.FullName || 'Trần Huỳnh Như'}
                </td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Vệ sinh, trực nhật, cây cảnh</td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Có</td>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400">Không</td>
                <td className="py-2 px-3 text-emerald-600 font-bold">Có</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-black text-cyan-800">TO_TRUONG</td>
                <td className="py-2 px-3 border-r border-slate-200">5 Tổ trưởng</td>
                <td className="py-2 px-3 border-r border-slate-200 text-cyan-700 font-bold">Chỉ học sinh trong tổ mình</td>
                <td className="py-2 px-3 border-r border-slate-200 text-cyan-700 font-bold">Chỉ trong tổ mình</td>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400">Không</td>
                <td className="py-2 px-3 text-emerald-600 font-bold">Có</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-black text-rose-800">GIAO_VIEN_BO_MON</td>
                <td className="py-2 px-3 border-r border-slate-200">Anh, Tin, Thể dục, Nhạc, Họa</td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Tiết môn chuyên biệt</td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-600 font-bold">Có</td>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400">Không</td>
                <td className="py-2 px-3 text-emerald-600 font-bold">Có</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-slate-200 font-black text-slate-600">VIEWER</td>
                <td className="py-2 px-3 border-r border-slate-200">Ban Phụ Huynh / Học sinh</td>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400">Chỉ xem</td>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400">Chỉ xem</td>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400">Không</td>
                <td className="py-2 px-3 text-slate-400">Chỉ xem</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User Accounts List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
            Danh Sách Tài Khoản Trong Sheet USERS ({users.length} tài khoản)
          </h3>
          <span className="text-xs text-slate-400">Mật khẩu mặc định: 123456</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tên Đăng Nhập</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Vai Trò (Role)</th>
                <th className="py-3 px-4">Tổ / Bộ Môn</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.UserID} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {u.Username}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {u.FullName}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {u.Role}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {u.Team || u.Subject || '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                        u.Status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.Status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isAdmin && u.UserID !== currentUser?.UserID && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          u.Status === 'ACTIVE'
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.Status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {u.Status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CẤP TÀI KHOẢN MỚI */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
            <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base sm:text-lg">Cấp Tài Khoản Mới</h3>
              <button
                type="button"
                onClick={() => setModal((p) => ({ ...p, open: false }))}
                className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên Đăng Nhập</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: totruong_to6"
                  value={modal.username}
                  onChange={(e) => setModal((p) => ({ ...p, username: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Họ và Tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Bình"
                  value={modal.fullName}
                  onChange={(e) => setModal((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Vai Trò (Role)</label>
                <select
                  value={modal.role}
                  onChange={(e) => setModal((p) => ({ ...p, role: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="TO_TRUONG">Tổ Trưởng</option>
                  <option value="LOP_TRUONG">Lớp Trưởng</option>
                  <option value="PHO_TRAT_TU">Phó Trật Tự</option>
                  <option value="PHO_LAO_DONG">Phó Lao Động</option>
                  <option value="GIAO_VIEN_BO_MON">Giáo Viên Bộ Môn</option>
                  <option value="VIEWER">Người Xem (Ban Phụ Huynh)</option>
                  <option value="ADMIN_GVCN">Giáo Viên Chủ Nhiệm (Quản trị)</option>
                </select>
              </div>

              {modal.role === 'TO_TRUONG' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phụ Trách Tổ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TO_1 hoặc Tổ 1"
                    value={modal.team}
                    onChange={(e) => setModal((p) => ({ ...p, team: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}

              {modal.role === 'GIAO_VIEN_BO_MON' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bộ Môn Giảng Dạy</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mĩ thuật, Âm nhạc..."
                    value={modal.subject}
                    onChange={(e) => setModal((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mật Khẩu Ban Đầu</label>
                <input
                  type="text"
                  placeholder="Mặc định: 123456"
                  value={modal.password}
                  onChange={(e) => setModal((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              </div>

              <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModal((p) => ({ ...p, open: false }))}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modal.isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {modal.isSubmitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
