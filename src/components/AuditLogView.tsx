import React, { useState } from 'react';
import { AuditLog, User } from '../types';
import { History, Shield, Search, CheckCircle, AlertOctagon } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
  currentUser: User | null;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, currentUser }) => {
  const [search, setSearch] = useState('');

  const filtered = logs.filter((l) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.Action.toLowerCase().includes(q) ||
        l.Username.toLowerCase().includes(q) ||
        l.Description.toLowerCase().includes(q) ||
        l.Module.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center space-x-2">
            <span className="text-blue-600">📜</span>
            <span>Nhật Ký Hệ Thống (AUDIT_LOG)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Ghi vết bảo mật và kiểm toán mọi thao tác chấm điểm, chỉnh sửa học sinh, phân quyền trên Google Sheets
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Lọc nhật ký thao tác..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Mã Log</th>
                <th className="py-3 px-3.5">Thời Gian</th>
                <th className="py-3 px-3.5">Người Thao Tác</th>
                <th className="py-3 px-3.5">Hành Động</th>
                <th className="py-3 px-3.5">Phân Hệ</th>
                <th className="py-3 px-3.5">Mô Tả Chi Tiết</th>
                <th className="py-3 px-3.5 text-center">Kết Quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((l) => (
                <tr key={l.LogID} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 text-slate-400">{l.LogID}</td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-600 whitespace-nowrap">
                    {new Date(l.Timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3.5 font-sans font-bold text-slate-800">
                    {l.Username}
                  </td>
                  <td className="py-2.5 px-3.5 font-extrabold text-blue-700">
                    {l.Action}
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-500">
                    {l.Module}
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-700 max-w-xs truncate">
                    {l.Description}
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-sans">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        l.Result === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {l.Result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
