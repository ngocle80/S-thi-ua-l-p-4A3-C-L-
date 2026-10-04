import React, { useState } from 'react';
import { Criterion, CriterionCategory, CriterionType, User } from '../types';
import {
  CheckSquare,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  X,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface CriteriaManagementViewProps {
  criteria: Criterion[];
  currentUser: User | null;
  onAddCriteria: (data: any) => Promise<any>;
  onUpdateCriteria: (data: any) => Promise<any>;
  onDeleteCriteria: (criterionId: string) => Promise<any>;
  onOpenLogin: () => void;
}

export const CriteriaManagementView: React.FC<CriteriaManagementViewProps> = ({
  criteria,
  currentUser,
  onAddCriteria,
  onUpdateCriteria,
  onDeleteCriteria,
  onOpenLogin,
}) => {
  const isAdmin = currentUser?.Role === 'ADMIN_GVCN';

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PLUS' | 'MINUS'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [modal, setModal] = useState<{
    open: boolean;
    isEditing: boolean;
    criterionId?: string;
    criterionCode: string;
    criterionName: string;
    category: CriterionCategory;
    type: CriterionType;
    point: number;
    description: string;
    applicableRole: string;
    isSubmitting: boolean;
  }>({
    open: false,
    isEditing: false,
    criterionCode: '',
    criterionName: '',
    category: 'Học tập',
    type: 'PLUS',
    point: 1,
    description: '',
    applicableRole: 'ALL',
    isSubmitting: false,
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = criteria.filter((c) => {
    if (typeFilter !== 'ALL' && c.Type !== typeFilter) return false;
    if (categoryFilter !== 'ALL' && c.Category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.CriterionName.toLowerCase().includes(q) ||
        c.CriterionCode.toLowerCase().includes(q) ||
        c.Description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    if (!isAdmin) {
      if (!currentUser) onOpenLogin();
      else showToast('Chỉ Giáo viên chủ nhiệm mới có quyền thêm tiêu chí!');
      return;
    }
    setModal({
      open: true,
      isEditing: false,
      criterionCode: `TC_${criteria.length + 1 < 10 ? '0' + (criteria.length + 1) : criteria.length + 1}`,
      criterionName: '',
      category: 'Học tập',
      type: 'PLUS',
      point: 1,
      description: '',
      applicableRole: 'ALL',
      isSubmitting: false,
    });
  };

  const handleOpenEdit = (c: Criterion) => {
    if (!isAdmin) {
      if (!currentUser) onOpenLogin();
      else showToast('Chỉ Giáo viên chủ nhiệm mới có quyền chỉnh sửa tiêu chí!');
      return;
    }
    setModal({
      open: true,
      isEditing: true,
      criterionId: c.CriterionID,
      criterionCode: c.CriterionCode,
      criterionName: c.CriterionName,
      category: c.Category,
      type: c.Type,
      point: c.Point,
      description: c.Description,
      applicableRole: c.ApplicableRole,
      isSubmitting: false,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal.criterionName.trim()) {
      showToast('Vui lòng nhập tên tiêu chí!');
      return;
    }

    setModal((p) => ({ ...p, isSubmitting: true }));

    // Make sure minus criteria point is negative, plus criteria point is positive
    let finalPoint = Math.abs(Number(modal.point));
    if (modal.type === 'MINUS') finalPoint = -finalPoint;

    if (modal.isEditing && modal.criterionId) {
      const res = await onUpdateCriteria({
        CriterionID: modal.criterionId,
        CriterionCode: modal.criterionCode,
        CriterionName: modal.criterionName.trim(),
        Category: modal.category,
        Type: modal.type,
        Point: finalPoint,
        Description: modal.description.trim(),
        ApplicableRole: modal.applicableRole,
      });
      setModal((p) => ({ ...p, isSubmitting: false, open: false }));
      showToast(res.message);
    } else {
      const res = await onAddCriteria({
        CriterionCode: modal.criterionCode,
        CriterionName: modal.criterionName.trim(),
        Category: modal.category,
        Type: modal.type,
        Point: finalPoint,
        Description: modal.description.trim(),
        ApplicableRole: modal.applicableRole,
        Status: 'ACTIVE',
      });
      setModal((p) => ({ ...p, isSubmitting: false, open: false }));
      showToast(res.message);
    }
  };

  const handleDelete = async (c: Criterion) => {
    if (!isAdmin) {
      showToast('Chỉ GVCN mới có quyền vô hiệu hóa tiêu chí!');
      return;
    }
    if (confirm(`Bạn có chắc muốn ngừng sử dụng tiêu chí "${c.CriterionName}"? Lịch sử chấm điểm trước đây vẫn được bảo toàn nguyên vẹn.`)) {
      const res = await onDeleteCriteria(c.CriterionID);
      showToast(res.message);
    }
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
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
            <span className="text-blue-600">📋</span>
            <span>Tiêu Chí Thi Đua Lớp 4A3</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Danh mục quy chuẩn điểm cộng việc tốt và điểm trừ vi phạm nề nếp
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/30 flex items-center space-x-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm Tiêu Chí Mới</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Tất Cả ({criteria.length})
            </button>
            <button
              onClick={() => setTypeFilter('PLUS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${typeFilter === 'PLUS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Điểm Cộng (+)</span>
            </button>
            <button
              onClick={() => setTypeFilter('MINUS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${typeFilter === 'MINUS' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Điểm Trừ (-)</span>
            </button>
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Mọi danh mục</option>
            <option value="Học tập">Học tập</option>
            <option value="Nề nếp & Đạo đức">Nề nếp & Đạo đức</option>
            <option value="Vệ sinh & Lao động">Vệ sinh & Lao động</option>
            <option value="Phong trào & Hoạt động">Phong trào & Hoạt động</option>
            <option value="Môn chuyên biệt">Môn chuyên biệt</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên tiêu chí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* List criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {filtered.map((c) => (
          <div
            key={c.CriterionID}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
              c.Status === 'INACTIVE' ? 'opacity-60 bg-slate-50' : 'hover:border-blue-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {c.CriterionCode}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {c.Category}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1.5">
                    {c.CriterionName}
                  </h3>
                </div>

                <div
                  className={`font-black text-base px-3 py-1 rounded-xl shrink-0 ${
                    c.Point > 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {c.Point > 0 ? `+${c.Point}` : c.Point} điểm
                </div>
              </div>

              <p className="text-xs text-slate-600">{c.Description}</p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">
                Áp dụng: <strong>{c.ApplicableRole === 'ALL' ? 'Tất cả các bộ phận' : c.ApplicableRole}</strong>
              </span>

              {isAdmin && (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {c.Status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDelete(c)}
                      title="Vô hiệu hóa tiêu chí"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL THÊM / SỬA TIÊU CHÍ */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
            <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base sm:text-lg">
                {modal.isEditing ? 'Chỉnh Sửa Tiêu Chí Thi Đua' : 'Thêm Tiêu Chí Thi Đua Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModal((p) => ({ ...p, open: false }))}
                className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mã Tiêu Chí</label>
                <input
                  type="text"
                  required
                  value={modal.criterionCode}
                  onChange={(e) => setModal((p) => ({ ...p, criterionCode: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên Tiêu Chí Thi Đua</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giữ gìn vở sạch chữ đẹp"
                  value={modal.criterionName}
                  onChange={(e) => setModal((p) => ({ ...p, criterionName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phân Loại</label>
                  <select
                    value={modal.type}
                    onChange={(e) => setModal((p) => ({ ...p, type: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="PLUS">Cộng Điểm (+)</option>
                    <option value="MINUS">Trừ Điểm (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mức Điểm</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={Math.abs(modal.point)}
                    onChange={(e) => setModal((p) => ({ ...p, point: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Danh Mục Lĩnh Vực</label>
                <select
                  value={modal.category}
                  onChange={(e) => setModal((p) => ({ ...p, category: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Học tập">Học tập</option>
                  <option value="Nề nếp & Đạo đức">Nề nếp & Đạo đức</option>
                  <option value="Vệ sinh & Lao động">Vệ sinh & Lao động</option>
                  <option value="Phong trào & Hoạt động">Phong trào & Hoạt động</option>
                  <option value="Môn chuyên biệt">Môn chuyên biệt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mô Tả Tiêu Chuẩn</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể hành vi được cộng hoặc bị trừ điểm..."
                  value={modal.description}
                  onChange={(e) => setModal((p) => ({ ...p, description: e.target.value }))}
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
                  {modal.isSubmitting ? 'Đang lưu...' : modal.isEditing ? 'Cập Nhật' : 'Lưu Tiêu Chí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
